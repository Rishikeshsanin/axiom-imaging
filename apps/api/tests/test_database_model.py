from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from app.core.database import Base
from app.domain.models import Patient, Series, Study


def test_patient_study_series_hierarchy_persists() -> None:
    engine = create_engine("sqlite+pysqlite:///:memory:")
    Base.metadata.create_all(engine)
    with Session(engine) as db:
        patient = Patient(patient_identifier="P-10001", display_name="Demo Patient")
        db.add(patient)
        db.flush()
        study = Study(
            patient_id=patient.id,
            study_instance_uid="1.2.826.1",
            modality="CT",
            status="READY",
            validation_status="PASS",
        )
        db.add(study)
        db.flush()
        series = Series(study_id=study.id, series_instance_uid="1.2.826.1.1", modality="CT")
        db.add(series)
        db.commit()

        loaded = db.scalar(select(Study).where(Study.study_instance_uid == "1.2.826.1"))
        assert loaded is not None
        assert loaded.patient.patient_identifier == "P-10001"
        assert loaded.series[0].series_instance_uid == "1.2.826.1.1"
