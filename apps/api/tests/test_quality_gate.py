from app.services.dicom_parser import DicomMetadata
from app.services.quality_gate import run_quality_gate


def test_quality_gate_passes_complete_image_metadata() -> None:
    metadata = DicomMetadata(
        patient_id="P-10042",
        study_instance_uid="1.2.3",
        series_instance_uid="1.2.3.4",
        sop_instance_uid="1.2.3.4.5",
        modality="CT",
        rows=512,
        columns=512,
        manufacturer="Axiom Synthetic Lab",
        has_pixel_data=True,
    )
    result = run_quality_gate(metadata)
    assert result.overall == "PASS"
    assert all(item.status == "PASS" for item in result.checks)


def test_quality_gate_fails_missing_required_uid() -> None:
    metadata = DicomMetadata(
        patient_id="P-10042",
        study_instance_uid=None,
        series_instance_uid="1.2.3.4",
        sop_instance_uid="1.2.3.4.5",
        modality="MR",
        rows=256,
        columns=256,
        manufacturer="Demo",
        has_pixel_data=True,
    )
    result = run_quality_gate(metadata)
    assert result.overall == "FAIL"
    assert any(item.name == "Study UID" and item.status == "FAIL" for item in result.checks)


def test_duplicate_is_review_and_not_silent_pass() -> None:
    metadata = DicomMetadata(
        patient_id="P-10042",
        study_instance_uid="1.2.3",
        series_instance_uid="1.2.3.4",
        sop_instance_uid="1.2.3.4.5",
        modality="CT",
        rows=512,
        columns=512,
        manufacturer="Demo",
        has_pixel_data=True,
    )
    result = run_quality_gate(metadata, duplicate=True)
    assert result.overall == "REVIEW"
    assert any(item.name == "Duplicate Detection" and item.status == "FAIL" for item in result.checks)
