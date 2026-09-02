# Architecture

Axiom Imaging separates medical-image storage, application metadata, operational UI and systems simulation.

```text
Browser
  │
  ▼
Next.js web UI :3000
  │ REST
  ▼
FastAPI :8000 ───────────────► PostgreSQL
  │                              patients / studies / orders
  │ Orthanc REST                 device state / alerts / audit
  ▼
Orthanc :8042
  │ DICOMweb
  ▼
OHIF Viewer

FastAPI ◄──── TCP JSON-lines ──── C++20 Device Engine :9300
```

## Boundaries

### Next.js

Responsible for operations presentation and user interactions. It does not invent device health, study counts, QC results or workflow transitions.

### FastAPI

Owns application APIs, state-transition validation, priority scheduling, DICOM ingestion orchestration, audit/alert creation and the bridge to the device engine.

### PostgreSQL

Stores relational application/workflow metadata. Large DICOM binaries are not duplicated here.

### Orthanc

Stores the DICOM resources and exposes DICOMweb/OHIF integrations.

### C++ device engine

A separate educational systems service for concurrency, device state, telemetry and fault simulation. It is deliberately independent from browser JavaScript.
