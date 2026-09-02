# Axiom Imaging

## Open Radiology Operations & Interoperability Platform

> **Research and educational prototype. Not intended for clinical diagnosis or clinical decision-making.**

Axiom Imaging is an imaging-centric full-stack and systems-engineering platform built around real DICOM/PACS workflow boundaries rather than generic hospital CRUD screens. It ingests de-identified DICOM studies, extracts metadata, stores original imaging objects through Orthanc PACS, maps patient/study/series/instance relationships into PostgreSQL, runs an operational Axiom Quality Gate, exposes searchable workflows through Next.js + FastAPI, and opens the actual study in OHIF.

The engineering expansion adds persistent imaging orders, priority scheduling with aging, a device fleet, alerts/audit, and a separate C++20 systems component.

## Runtime-verified P0

The following flow was executed successfully with the project's 12-slice synthetic CT study:

```text
Upload DICOM → pydicom → duplicate protection → Orthanc → PostgreSQL
             → Quality Gate → Study Library → OHIF rendering
```

Verified demo state:

- Patient `P-10042 / DEMO PATIENT`
- Study `Synthetic CT Head Demo`
- Modality `CT`
- 1 series / 12 instances
- Quality Gate `PASS`
- Workflow `READY`
- duplicate SOP re-upload rejected
- Orthanc + PostgreSQL health verified
- OHIF rendered and navigated the 12-slice study

## Engineering highlights

- Real DICOM ingestion and metadata extraction with `pydicom`
- Orthanc PACS + DICOMweb + OHIF integration
- PostgreSQL patient → study → series → instance hierarchy
- Axiom Quality Gate with backend-generated checks
- SOP Instance UID duplicate prevention
- Searchable patients and study library
- Imaging orders with `EMERGENCY > URGENT > ROUTINE`
- Heap-backed scheduler with waiting-time aging
- Operations workflow state machine
- Device telemetry, alerts and audit trail
- Separate C++20 device engine with Factory/State concepts, atomics, mutexes, condition variables, a thread pool and IPC
- Docker / Docker Compose local stack
- GitHub Actions validation
- Dedicated Help & Product Guide for first-time users

## Architecture

```text
Next.js / TypeScript UI
        │
        ▼
     FastAPI
   ┌────┼───────────────┐
   ▼    ▼               ▼
Postgres Orthanc PACS   C++20 Device Engine
           │
           ▼
     DICOMweb / OHIF
```

PostgreSQL stores application/workflow metadata. Orthanc stores DICOM objects and pixel data. These boundaries are deliberately separate.

## Local quick start

```powershell
Copy-Item .env.example .env
python scripts\generate_sample_dicom.py
docker compose up --build
```

Open:

- Axiom Imaging: `http://localhost:3000`
- FastAPI docs: `http://localhost:8000/docs`
- Orthanc Explorer: `http://localhost:8042/ui/`
- OHIF: launch from Study Details

## Help & onboarding

The application includes a permanent **HELP** entry at the bottom of the sidebar covering:

- what Axiom Imaging is
- how to run the six-step demo
- Patient → Study → Series → Instance
- DICOM / PACS / DICOMweb / OHIF terminology
- architecture and service boundaries
- Quality Gate and duplicate behavior
- privacy/safety rules
- troubleshooting
- developer integrations
- creator/business contact information

## Creator

**Rishikesh Munnaluri**  
Business: **rishikeshsanin@gmail.com**  
GitHub: **@Rishikeshsanin**

## Safety

Axiom Imaging is not a medical device, does not provide diagnostic conclusions, and is not production hospital software. Use only synthetic or properly de-identified imaging data. No HIPAA/GDPR/clinical certification is claimed.

See `docs/` for architecture, DICOM flow, data model, concurrency, IPC, security, roadmap and testing notes.
