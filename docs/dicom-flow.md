# DICOM ingestion flow

Axiom accepts only synthetic or properly de-identified medical imaging data.

```text
Upload .dcm/.dicom
  -> upload size and extension check
  -> pydicom reads the actual object
  -> required metadata extracted safely
  -> SOP Instance UID duplicate lookup
  -> Axiom Quality Gate
  -> Orthanc POST /instances
  -> patient upsert
  -> study upsert
  -> series upsert
  -> instance insert
  -> study/series counts recalculated
  -> workflow + audit events persisted
  -> READY or REVIEW returned to the UI
```

## Metadata extracted

The parser handles missing attributes rather than assuming every DICOM object has a complete tag set. P0 reads PatientID, PatientName, PatientBirthDate, PatientSex, StudyInstanceUID, StudyDate, StudyTime, StudyDescription, SeriesInstanceUID, SeriesNumber, SeriesDescription, SOPInstanceUID, InstanceNumber, Modality, BodyPartExamined, Rows, Columns, NumberOfFrames, InstitutionName, Manufacturer and ManufacturerModelName.

## Duplicate rule

`SOPInstanceUID` is the instance-level uniqueness key. A duplicate is rejected with `DUPLICATE_INSTANCE` before a second Orthanc upload is attempted. Existing Study/Series UIDs are reused only when their parent relationship remains consistent.

## Transaction boundary

Orthanc and PostgreSQL do not share a distributed transaction. Axiom therefore performs validation/duplicate checks first, stores the object in Orthanc, then commits application metadata. If PostgreSQL fails after the PACS accepts an object, the backend rolls back the database transaction and deliberately avoids destructive automatic deletion from Orthanc. Reconciliation is safer for the prototype and is documented as a limitation rather than hidden.
