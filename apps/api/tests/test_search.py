from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.core.database import Base
from app.domain.models import Patient, Study
from app.domain.schemas import StudyRead
from app.repositories.studies import list_studies


def test_study_search_matches_patient_identifier_and_name() -> None:
    engine = create_engine("sqlite+pysqlite:///:memory:")
    Base.metadata.create_all(engine)
    with Session(engine) as db:
        patient = Patient(patient_identifier="P-2048", display_name="Synthetic Example")
        db.add(patient)
        db.flush()
        db.add(
            Study(
                patient_id=patient.id,
                study_instance_uid="1.2.3.2048",
                study_description="CT CHEST",
                modality="CT",
                status="READY",
                validation_status="PASS",
            )
        )
        db.commit()

        by_identifier = list_studies(db, search="P-2048")
        by_name = list_studies(db, search="Synthetic")
        assert len(by_identifier) == 1
        assert len(by_name) == 1
        assert by_name[0].patient_identifier == "P-2048"
        payload = StudyRead.model_validate(by_name[0])
        assert payload.patient_identifier == "P-2048"
        assert payload.patient_display_name == "Synthetic Example"
