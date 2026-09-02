from pathlib import Path

import pytest

pydicom = pytest.importorskip("pydicom")

from app.services.dicom_parser import parse_dicom_bytes  # noqa: E402


def test_parse_generated_sample_dicom() -> None:
    sample = Path(__file__).resolve().parents[3] / "sample-data" / "axiom-demo-ct-study" / "CT_001.dcm"
    metadata = parse_dicom_bytes(sample.read_bytes())
    assert metadata.patient_id == "P-10042"
    assert metadata.patient_name == "DEMO^PATIENT"
    assert metadata.modality == "CT"
    assert metadata.rows == 64
    assert metadata.columns == 64
    assert metadata.has_pixel_data is True
    assert metadata.study_instance_uid
    assert metadata.series_instance_uid
    assert metadata.sop_instance_uid
