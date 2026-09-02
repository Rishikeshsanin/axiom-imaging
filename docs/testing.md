# Testing

## Backend unit/integration-with-boundary tests

From `apps/api`:

```bash
pytest -ra
```

Current tests cover:

- Quality Gate pass/fail behavior
- duplicate check classification
- patient -> study -> series persistence
- ingestion transaction through a controlled Orthanc boundary
- workflow/audit event creation
- duplicate SOP rejection before a second PACS upload
- study search by patient identifier/name
- real pydicom parsing of the generated sample when `pydicom` is installed

## Required local Docker verification

Before claiming P0 end-to-end complete:

1. `docker compose up --build` starts successfully.
2. `GET http://localhost:8000/api/health` reports PostgreSQL and Orthanc online.
3. Generate the 12-slice `sample-data/axiom-demo-ct-study/` with `python scripts/generate_sample_dicom.py`.
4. Upload it through the web UI.
5. Confirm extracted metadata matches the file.
6. Confirm the patient and study records appear after refresh.
7. Confirm Quality Gate is derived from the upload.
8. Open the study in OHIF and verify actual DICOM pixel rendering.
9. Upload the same instance again and confirm `DUPLICATE_INSTANCE`.
10. Restart the stack and confirm PostgreSQL/Orthanc persistence.

A screenshot is not evidence of this flow; the API, database and PACS must agree.
