from __future__ import annotations

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.domain.models import Patient, Study


def list_patients(db: Session, *, search: str | None = None, limit: int = 50, offset: int = 0):
    stmt = (
        select(
            Patient,
            func.count(Study.id).label("study_count"),
            func.max(Study.study_date).label("most_recent_imaging_date"),
        )
        .outerjoin(Study, Study.patient_id == Patient.id)
        .group_by(Patient.id)
        .order_by(Patient.updated_at.desc())
        .limit(limit)
        .offset(offset)
    )
    if search:
        pattern = f"%{search.strip()}%"
        stmt = stmt.where(
            or_(
                Patient.patient_identifier.ilike(pattern),
                Patient.display_name.ilike(pattern),
            )
        )
    return db.execute(stmt).all()


def get_patient(db: Session, patient_id: str) -> Patient | None:
    return db.get(Patient, patient_id)
