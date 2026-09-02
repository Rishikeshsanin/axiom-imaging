# Security and privacy baseline

Axiom Imaging is not certified for HIPAA, GDPR or clinical use.

P0 safeguards:

- use synthetic or properly de-identified DICOM only
- reject unsupported upload extensions
- enforce per-file upload size limits
- parse uploaded bytes instead of trusting client metadata
- do not use uploaded filenames as filesystem paths
- keep DICOM binaries in Orthanc rather than PostgreSQL
- use environment variables for service credentials
- do not commit `.env`
- configure CORS explicitly
- return structured API errors rather than raw stack traces
- record ingestion/audit events on the backend

For a shared environment, rotate the demo Orthanc password and any JWT secret before use. P2 authentication/RBAC must add backend enforcement; hiding buttons in the frontend is not authorization.
