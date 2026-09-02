# Contributing

1. Treat the master specification as the source of truth.
2. Preserve the patient -> study -> series -> instance hierarchy.
3. Never add identifiable patient data.
4. Do not add UI controls without real backend behavior.
5. Keep Orthanc as the DICOM binary store and PostgreSQL as application/workflow storage.
6. Add tests for changed business logic.
7. Prefer small, reviewable commits.
