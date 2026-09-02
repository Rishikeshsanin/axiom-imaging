from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import date
from io import BytesIO
from typing import Any

from app.core.errors import AxiomError


@dataclass(slots=True)
class DicomMetadata:
    patient_id: str | None = None
    patient_name: str | None = None
    patient_birth_date: date | None = None
    patient_sex: str | None = None
    study_instance_uid: str | None = None
    study_date: date | None = None
    study_time: str | None = None
    study_description: str | None = None
    series_instance_uid: str | None = None
    series_number: int | None = None
    series_description: str | None = None
    sop_instance_uid: str | None = None
    instance_number: int | None = None
    modality: str | None = None
    body_part_examined: str | None = None
    rows: int | None = None
    columns: int | None = None
    number_of_frames: int | None = None
    institution_name: str | None = None
    manufacturer: str | None = None
    manufacturer_model_name: str | None = None
    has_pixel_data: bool = False

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def _clean(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def _int(value: Any) -> int | None:
    try:
        return int(value) if value not in (None, "") else None
    except (TypeError, ValueError):
        return None


def _date(value: Any) -> date | None:
    text = _clean(value)
    if not text or len(text) != 8 or not text.isdigit():
        return None
    try:
        return date(int(text[:4]), int(text[4:6]), int(text[6:8]))
    except ValueError:
        return None


def parse_dicom_bytes(data: bytes) -> DicomMetadata:
    try:
        import pydicom
    except ImportError as exc:
        raise RuntimeError("pydicom is required for DICOM ingestion") from exc

    try:
        dataset = pydicom.dcmread(BytesIO(data), stop_before_pixels=False, force=False)
    except Exception as exc:
        raise AxiomError(
            code="INVALID_DICOM",
            message="The uploaded file could not be read as a valid DICOM object.",
            status_code=422,
            details={"parser_error": str(exc)},
        ) from exc

    return DicomMetadata(
        patient_id=_clean(getattr(dataset, "PatientID", None)),
        patient_name=_clean(getattr(dataset, "PatientName", None)),
        patient_birth_date=_date(getattr(dataset, "PatientBirthDate", None)),
        patient_sex=_clean(getattr(dataset, "PatientSex", None)),
        study_instance_uid=_clean(getattr(dataset, "StudyInstanceUID", None)),
        study_date=_date(getattr(dataset, "StudyDate", None)),
        study_time=_clean(getattr(dataset, "StudyTime", None)),
        study_description=_clean(getattr(dataset, "StudyDescription", None)),
        series_instance_uid=_clean(getattr(dataset, "SeriesInstanceUID", None)),
        series_number=_int(getattr(dataset, "SeriesNumber", None)),
        series_description=_clean(getattr(dataset, "SeriesDescription", None)),
        sop_instance_uid=_clean(getattr(dataset, "SOPInstanceUID", None)),
        instance_number=_int(getattr(dataset, "InstanceNumber", None)),
        modality=_clean(getattr(dataset, "Modality", None)),
        body_part_examined=_clean(getattr(dataset, "BodyPartExamined", None)),
        rows=_int(getattr(dataset, "Rows", None)),
        columns=_int(getattr(dataset, "Columns", None)),
        number_of_frames=_int(getattr(dataset, "NumberOfFrames", None)),
        institution_name=_clean(getattr(dataset, "InstitutionName", None)),
        manufacturer=_clean(getattr(dataset, "Manufacturer", None)),
        manufacturer_model_name=_clean(getattr(dataset, "ManufacturerModelName", None)),
        has_pixel_data="PixelData" in dataset,
    )
