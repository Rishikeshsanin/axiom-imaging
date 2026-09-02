# Roadmap

## Runtime-verified P0

- DICOM upload and metadata extraction
- Orthanc PACS storage
- PostgreSQL imaging hierarchy
- searchable patient/study repositories
- Quality Gate
- duplicate detection
- OHIF viewer
- real system health

## P1 implemented in source — runtime re-verification pending

- imaging orders
- emergency/urgent/routine priority scheduler with aging
- load-aware device assignment
- operations workflow board
- device fleet dashboard
- separate C++20 device engine
- C++ thread pool / atomics / state model
- TCP JSON-line IPC
- persisted device telemetry
- controlled fault/recovery commands
- alerts
- expanded audit trail
- CI C++ job

## Next

- WebSocket event fan-out
- report drafts
- FHIR-oriented Patient / ImagingStudy export
- stronger automated browser/integration coverage

## Advanced / P2

- richer fault-recovery policies
- richer OHIF workflows
- draft dictation
- expanded FHIR mappings
- analytics and image QC metrics
- role-based authentication
- DICOM ZIP ingestion
- research dataset mode

Roadmap items are not completed functionality and must not be presented as completed work on a resume until verified.
