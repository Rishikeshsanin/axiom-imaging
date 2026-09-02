from __future__ import annotations

import asyncio

import pytest
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import Session

import app.services.ingestion as ingestion_module
from app.core.database import Base
from app.core.errors import AxiomError
from app.domain.models import AuditEvent, Instance, Patient, Series, Study, WorkflowEvent
from app.services.dicom_parser import DicomMetadata
from app.services.ingestion import IngestionService


class FakeOrthanc:
    def __init__(self) -> None:
        self.uploads = 0

    async def upload_instance(self, data: bytes) -> dict:
        self.uploads += 1
        return {
            "ID": f"orthanc-instance-{self.uploads}",
            "ParentSeries": "orthanc-series-1",
            "ParentStudy": "orthanc-study-1",
        }


def _metadata() -> DicomMetadata:
    return DicomMetadata(
        patient_id="P-10042",
        patient_name="DEMO^PATIENT",
        study_instance_uid="1.2.826.0.1.10042",
        study_description="Synthetic CT Head",
        series_instance_uid="1.2.826.0.1.10042.1",
        series_number=1,
        series_description="AXIAL",
        sop_instance_uid="1.2.826.0.1.10042.1.1",
        instance_number=1,
        modality="CT",
        body_part_examined="HEAD",
        rows=64,
        columns=64,
        institution_name="Axiom Synthetic Lab",
        manufacturer="Axiom Synthetic Lab",
        has_pixel_data=True,
    )


def test_ingestion_persists_real_hierarchy_qc_and_audit(monkeypatch: pytest.MonkeyPatch) -> None:
    engine = create_engine("sqlite+pysqlite:///:memory:")
    Base.metadata.create_all(engine)
    metadata = _metadata()
    monkeypatch.setattr(ingestion_module, "parse_dicom_bytes", lambda _: metadata)
    orthanc = FakeOrthanc()

    with Session(engine) as db:
        result = asyncio.run(IngestionService(orthanc=orthanc).ingest(db, filename="demo.dcm", data=b"dicom"))

        assert result.patient_identifier == "P-10042"
        assert result.quality.overall == "PASS"
        assert orthanc.uploads == 1
        assert db.scalar(select(func.count(Patient.id))) == 1
        assert db.scalar(select(func.count(Study.id))) == 1
        assert db.scalar(select(func.count(Series.id))) == 1
        assert db.scalar(select(func.count(Instance.id))) == 1
        study = db.scalar(select(Study))
        assert study is not None
        assert study.status == "READY"
        assert study.validation_status == "PASS"
        assert study.series_count == 1
        assert study.instance_count == 1
        assert study.orthanc_study_id == "orthanc-study-1"
        event = db.scalar(select(WorkflowEvent).where(WorkflowEvent.event_type == "QUALITY_GATE_COMPLETED"))
        assert event is not None
        assert event.event_metadata["metadata"]["patient_id"] == "P-10042"
        assert db.scalar(select(func.count(AuditEvent.id))) == 1


def test_duplicate_sop_uid_is_rejected_before_second_orthanc_upload(monkeypatch: pytest.MonkeyPatch) -> None:
    engine = create_engine("sqlite+pysqlite:///:memory:")
    Base.metadata.create_all(engine)
    metadata = _metadata()
    monkeypatch.setattr(ingestion_module, "parse_dicom_bytes", lambda _: metadata)
    orthanc = FakeOrthanc()

    with Session(engine) as db:
        service = IngestionService(orthanc=orthanc)
        asyncio.run(service.ingest(db, filename="first.dcm", data=b"first"))
        with pytest.raises(AxiomError) as caught:
            asyncio.run(service.ingest(db, filename="duplicate.dcm", data=b"second"))

        assert caught.value.code == "DUPLICATE_INSTANCE"
        assert caught.value.status_code == 409
        assert caught.value.details["existing_study_instance_uid"] == metadata.study_instance_uid
        assert orthanc.uploads == 1
