from __future__ import annotations

from datetime import date

from sqlalchemy import or_, select
from sqlalchemy.orm import Session, selectinload

from app.domain.models import Patient, Study


def list_studies(
    db: Session,
    *,
    search: str | None = None,
    modality: str | None = None,
    status: str | None = None,
    quality: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    limit: int = 100,
    offset: int = 0,
):
    stmt = (
        select(Study)
        .join(Patient, Study.patient_id == Patient.id)
        .options(selectinload(Study.patient))
        .order_by(Study.uploaded_at.desc())
    )
    if search:
        pattern = f"%{search.strip()}%"
        stmt = stmt.where(
            or_(
                Study.study_instance_uid.ilike(pattern),
                Study.study_description.ilike(pattern),
                Patient.patient_identifier.ilike(pattern),
                Patient.display_name.ilike(pattern),
            )
        )
    if modality:
        stmt = stmt.where(Study.modality == modality.upper())
    if status:
        stmt = stmt.where(Study.status == status.upper())
    if quality:
        stmt = stmt.where(Study.validation_status == quality.upper())
    if date_from:
        stmt = stmt.where(Study.study_date >= date_from)
    if date_to:
        stmt = stmt.where(Study.study_date <= date_to)
    return db.scalars(stmt.limit(limit).offset(offset)).all()


def get_study(db: Session, study_id: str) -> Study | None:
    stmt = (
        select(Study)
        .where(Study.id == study_id)
        .options(
            selectinload(Study.patient),
            selectinload(Study.series),
        )
    )
    return db.scalar(stmt)
