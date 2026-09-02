from __future__ import annotations

from collections.abc import Iterable

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.errors import AxiomError
from app.core.logging import log_event
from app.domain.models import AuditEvent, Instance, Patient, Series, Study, WorkflowEvent
from app.domain.schemas import UploadInstanceResult
from app.services.dicom_parser import DicomMetadata, parse_dicom_bytes
from app.services.orthanc import OrthancClient
from app.services.quality_gate import run_quality_gate


class IngestionService:
    def __init__(self, orthanc: OrthancClient | None = None) -> None:
        self.orthanc = orthanc or OrthancClient()

    async def ingest(self, db: Session, *, filename: str, data: bytes) -> UploadInstanceResult:
        metadata = parse_dicom_bytes(data)
        duplicate = self._existing_instance(db, metadata.sop_instance_uid)
        quality = run_quality_gate(metadata, duplicate=duplicate is not None)

        if duplicate is not None:
            existing_study = duplicate.series.study
            raise AxiomError(
                code="DUPLICATE_INSTANCE",
                message="This SOP Instance UID already exists in Axiom Imaging.",
                status_code=409,
                details={
                    "sop_instance_uid": metadata.sop_instance_uid,
                    "existing_study_id": existing_study.id,
                    "existing_study_instance_uid": existing_study.study_instance_uid,
                    "quality": quality.model_dump(mode="json"),
                },
            )

        if quality.overall == "FAIL":
            raise AxiomError(
                code=self._quality_error_code(metadata),
                message="The DICOM object failed required ingestion checks.",
                status_code=422,
                details={"quality": quality.model_dump(mode="json")},
            )

        orthanc_result = await self.orthanc.upload_instance(data)
        orthanc_instance_id = str(orthanc_result.get("ID") or "")
        if not orthanc_instance_id:
            raise AxiomError(
                code="ORTHANC_UNAVAILABLE",
                message="Orthanc accepted the request but did not return an instance identifier.",
                status_code=502,
            )

        try:
            patient = self._upsert_patient(db, metadata)
            study = self._upsert_study(db, patient, metadata, orthanc_result, quality.overall)
            series = self._upsert_series(db, study, metadata, orthanc_result)
            instance = Instance(
                series_id=series.id,
                sop_instance_uid=metadata.sop_instance_uid or "",
                orthanc_instance_id=orthanc_instance_id,
                instance_number=metadata.instance_number,
                rows=metadata.rows,
                columns=metadata.columns,
                number_of_frames=metadata.number_of_frames,
            )
            db.add(instance)
            db.flush()

            series.instance_count = db.scalar(
                select(func.count(Instance.id)).where(Instance.series_id == series.id)
            ) or 0
            study.series_count = db.scalar(
                select(func.count(Series.id)).where(Series.study_id == study.id)
            ) or 0
            study.instance_count = db.scalar(
                select(func.count(Instance.id))
                .join(Series, Instance.series_id == Series.id)
                .where(Series.study_id == study.id)
            ) or 0
            study.status = "READY" if quality.overall == "PASS" else "REVIEW"
            study.validation_status = quality.overall

            db.add(
                WorkflowEvent(
                    study_id=study.id,
                    event_type="QUALITY_GATE_COMPLETED",
                    message=f"Axiom Quality Gate completed with {quality.overall}.",
                    event_metadata={
                        "quality": quality.model_dump(mode="json"),
                        "filename": filename,
                        "metadata": self._safe_metadata(metadata),
                    },
                )
            )
            db.add(
                AuditEvent(
                    actor="demo-technician",
                    action="STUDY_UPLOADED",
                    resource_type="study",
                    resource_id=study.id,
                    details={
                        "filename": filename,
                        "sop_instance_uid": metadata.sop_instance_uid,
                        "orthanc_instance_id": orthanc_instance_id,
                    },
                )
            )
            db.commit()
            db.refresh(study)
        except Exception:
            db.rollback()
            # Orthanc may now contain an object that the application DB failed to persist.
            # We deliberately do not delete from PACS automatically; reconciliation is safer
            # than destructive compensation for a research prototype.
            raise

        log_event(
            "dicom_ingested",
            resource_id=study.id,
            patient_id=patient.id,
            sop_instance_uid=metadata.sop_instance_uid,
            quality=quality.overall,
        )
        return UploadInstanceResult(
            filename=filename,
            study_id=study.id,
            study_instance_uid=metadata.study_instance_uid or "",
            series_instance_uid=metadata.series_instance_uid or "",
            sop_instance_uid=metadata.sop_instance_uid or "",
            patient_identifier=metadata.patient_id or "",
            orthanc_instance_id=orthanc_instance_id,
            metadata=self._safe_metadata(metadata),
            quality=quality,
        )

    @staticmethod
    def _existing_instance(db: Session, sop_uid: str | None) -> Instance | None:
        if not sop_uid:
            return None
        return db.scalar(
            select(Instance)
            .where(Instance.sop_instance_uid == sop_uid)
            .join(Series)
            .join(Study)
        )

    @staticmethod
    def _upsert_patient(db: Session, metadata: DicomMetadata) -> Patient:
        assert metadata.patient_id
        patient = db.scalar(select(Patient).where(Patient.patient_identifier == metadata.patient_id))
        if patient is None:
            patient = Patient(
                patient_identifier=metadata.patient_id,
                display_name=(metadata.patient_name or metadata.patient_id).replace("^", " "),
                birth_date=metadata.patient_birth_date,
                sex=metadata.patient_sex,
            )
            db.add(patient)
            db.flush()
        else:
            patient.display_name = (metadata.patient_name or patient.display_name).replace("^", " ")
            patient.birth_date = metadata.patient_birth_date or patient.birth_date
            patient.sex = metadata.patient_sex or patient.sex
        return patient

    @staticmethod
    def _upsert_study(
        db: Session,
        patient: Patient,
        metadata: DicomMetadata,
        orthanc_result: dict,
        quality: str,
    ) -> Study:
        assert metadata.study_instance_uid
        study = db.scalar(
            select(Study).where(Study.study_instance_uid == metadata.study_instance_uid)
        )
        parent_study = orthanc_result.get("ParentStudy")
        if study is None:
            study = Study(
                patient_id=patient.id,
                study_instance_uid=metadata.study_instance_uid,
                orthanc_study_id=str(parent_study) if parent_study else None,
                study_date=metadata.study_date,
                study_description=metadata.study_description,
                modality=metadata.modality,
                body_part_examined=metadata.body_part_examined,
                institution_name=metadata.institution_name,
                manufacturer=metadata.manufacturer,
                status="VALIDATING",
                validation_status=quality,
            )
            db.add(study)
            db.flush()
        else:
            if study.patient_id != patient.id:
                raise AxiomError(
                    code="STUDY_PATIENT_MISMATCH",
                    message="The Study Instance UID is already associated with another patient.",
                    status_code=409,
                )
            study.orthanc_study_id = str(parent_study) if parent_study else study.orthanc_study_id
            study.study_description = metadata.study_description or study.study_description
            study.modality = metadata.modality or study.modality
            study.body_part_examined = metadata.body_part_examined or study.body_part_examined
            study.institution_name = metadata.institution_name or study.institution_name
            study.manufacturer = metadata.manufacturer or study.manufacturer
        return study

    @staticmethod
    def _upsert_series(
        db: Session,
        study: Study,
        metadata: DicomMetadata,
        orthanc_result: dict,
    ) -> Series:
        assert metadata.series_instance_uid
        series = db.scalar(
            select(Series).where(Series.series_instance_uid == metadata.series_instance_uid)
        )
        parent_series = orthanc_result.get("ParentSeries")
        if series is None:
            series = Series(
                study_id=study.id,
                series_instance_uid=metadata.series_instance_uid,
                orthanc_series_id=str(parent_series) if parent_series else None,
                series_number=metadata.series_number,
                description=metadata.series_description,
                modality=metadata.modality,
            )
            db.add(series)
            db.flush()
        elif series.study_id != study.id:
            raise AxiomError(
                code="SERIES_STUDY_MISMATCH",
                message="The Series Instance UID is already associated with another study.",
                status_code=409,
            )
        return series

    @staticmethod
    def _quality_error_code(metadata: DicomMetadata) -> str:
        if not metadata.patient_id:
            return "MISSING_PATIENT_ID"
        if not metadata.study_instance_uid:
            return "MISSING_STUDY_UID"
        return "INVALID_DICOM"

    @staticmethod
    def _safe_metadata(metadata: DicomMetadata) -> dict:
        data = metadata.to_dict()
        for key, value in list(data.items()):
            if hasattr(value, "isoformat"):
                data[key] = value.isoformat()
        return data


async def ingest_many(
    service: IngestionService,
    db: Session,
    files: Iterable[tuple[str, bytes]],
) -> list[UploadInstanceResult]:
    results: list[UploadInstanceResult] = []
    for filename, data in files:
        results.append(await service.ingest(db, filename=filename, data=data))
    return results
