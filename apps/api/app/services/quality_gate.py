from __future__ import annotations

from app.domain.schemas import QualityCheckItem, QualityReport
from app.services.dicom_parser import DicomMetadata


def run_quality_gate(metadata: DicomMetadata, *, duplicate: bool = False) -> QualityReport:
    checks: list[QualityCheckItem] = [
        QualityCheckItem(name="Readable DICOM", status="PASS", message="DICOM parsed successfully."),
        _required("Patient Identifier", metadata.patient_id),
        _required("Study UID", metadata.study_instance_uid),
        _required("Series UID", metadata.series_instance_uid),
        _required("SOP UID", metadata.sop_instance_uid),
        _reviewable("Modality", metadata.modality, "Modality tag is missing."),
        _dimensions(metadata.rows, metadata.columns),
        QualityCheckItem(
            name="Pixel Data",
            status="PASS" if metadata.has_pixel_data else "REVIEW",
            message=(
                "Pixel data is present."
                if metadata.has_pixel_data
                else "No PixelData element was found; this may be valid for non-image DICOM objects."
            ),
        ),
        QualityCheckItem(
            name="Duplicate Detection",
            status="FAIL" if duplicate else "PASS",
            message=(
                "This SOP Instance UID already exists."
                if duplicate
                else "No duplicate SOP Instance UID was found."
            ),
        ),
        _reviewable(
            "Manufacturer",
            metadata.manufacturer,
            "Manufacturer metadata is missing; ingestion can continue.",
        ),
    ]

    critical_fail = any(
        check.status == "FAIL"
        for check in checks
        if check.name in {"Patient Identifier", "Study UID", "Series UID", "SOP UID"}
    )
    if critical_fail:
        overall = "FAIL"
    elif any(check.status in {"REVIEW", "FAIL"} for check in checks):
        overall = "REVIEW"
    else:
        overall = "PASS"

    return QualityReport(overall=overall, checks=checks)


def _required(name: str, value: object) -> QualityCheckItem:
    if value:
        return QualityCheckItem(name=name, status="PASS", message=f"{name} is present.")
    return QualityCheckItem(name=name, status="FAIL", message=f"{name} is required for ingestion.")


def _reviewable(name: str, value: object, missing_message: str) -> QualityCheckItem:
    if value:
        return QualityCheckItem(name=name, status="PASS", message=f"{name} is present.")
    return QualityCheckItem(name=name, status="REVIEW", message=missing_message)


def _dimensions(rows: int | None, columns: int | None) -> QualityCheckItem:
    if rows is None and columns is None:
        return QualityCheckItem(
            name="Image Dimensions",
            status="REVIEW",
            message="Rows/Columns are absent; this may be a non-image DICOM object.",
        )
    if not rows or not columns or rows <= 0 or columns <= 0:
        return QualityCheckItem(
            name="Image Dimensions",
            status="FAIL",
            message="Rows/Columns are invalid.",
        )
    return QualityCheckItem(
        name="Image Dimensions",
        status="PASS",
        message=f"Image dimensions are {rows} x {columns}.",
    )
