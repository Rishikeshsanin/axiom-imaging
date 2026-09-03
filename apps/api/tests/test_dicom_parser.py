from io import BytesIO

import pytest

pydicom = pytest.importorskip("pydicom")
from pydicom.dataset import FileDataset, FileMetaDataset
from pydicom.uid import CTImageStorage, ExplicitVRLittleEndian, generate_uid

from app.services.dicom_parser import parse_dicom_bytes  # noqa: E402


def _synthetic_ct_bytes() -> bytes:
    file_meta = FileMetaDataset()
    file_meta.MediaStorageSOPClassUID = CTImageStorage
    file_meta.MediaStorageSOPInstanceUID = generate_uid()
    file_meta.TransferSyntaxUID = ExplicitVRLittleEndian
    file_meta.ImplementationClassUID = generate_uid()

    dataset = FileDataset(None, {}, file_meta=file_meta, preamble=b"\0" * 128)
    dataset.SOPClassUID = CTImageStorage
    dataset.SOPInstanceUID = file_meta.MediaStorageSOPInstanceUID
    dataset.StudyInstanceUID = generate_uid()
    dataset.SeriesInstanceUID = generate_uid()
    dataset.PatientID = "P-10042"
    dataset.PatientName = "DEMO^PATIENT"
    dataset.Modality = "CT"
    dataset.StudyDate = "20260101"
    dataset.StudyDescription = "Synthetic CT Head Demo"
    dataset.SeriesNumber = 1
    dataset.InstanceNumber = 1
    dataset.InstitutionName = "Axiom Imaging Demo"
    dataset.Manufacturer = "Axiom Imaging"
    dataset.Rows = 64
    dataset.Columns = 64
    dataset.SamplesPerPixel = 1
    dataset.PhotometricInterpretation = "MONOCHROME2"
    dataset.BitsAllocated = 16
    dataset.BitsStored = 12
    dataset.HighBit = 11
    dataset.PixelRepresentation = 0
    dataset.PixelData = b"\0" * (dataset.Rows * dataset.Columns * 2)

    buffer = BytesIO()
    pydicom.dcmwrite(buffer, dataset, write_like_original=False)
    return buffer.getvalue()


def test_parse_generated_sample_dicom() -> None:
    metadata = parse_dicom_bytes(_synthetic_ct_bytes())
    assert metadata.patient_id == "P-10042"
    assert metadata.patient_name == "DEMO^PATIENT"
    assert metadata.modality == "CT"
    assert metadata.rows == 64
    assert metadata.columns == 64
    assert metadata.has_pixel_data is True
    assert metadata.study_instance_uid
    assert metadata.series_instance_uid
    assert metadata.sop_instance_uid
