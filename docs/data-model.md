# Data model

The core imaging hierarchy is:

```text
Patient
  └─ Study
      └─ Series
          └─ Instance
```

## Canonical entities

- `patients`: synthetic/de-identified patient identity and optional demographic tags from DICOM.
- `imaging_orders`: P1 workflow order contract reserved in the schema.
- `studies`: StudyInstanceUID, Orthanc reference, modality, dates, counts, workflow and validation state.
- `series`: SeriesInstanceUID, Orthanc reference, number/description/modality and instance count.
- `instances`: SOPInstanceUID, Orthanc instance reference, dimensions and frame count.
- `devices`: P1 device/fleet state contract.
- `workflow_events`: backend-generated operational events and structured metadata.
- `alerts`: P1 alert contract.
- `reports`: study-linked human-authored draft/report contract.
- `audit_events`: backend-generated trace of important actions.

Age is never stored canonically. It should be derived from `birth_date` when needed.

The initial Alembic migration under `apps/api/alembic/versions/` creates the schema; changes should be made through new migrations rather than mutating production databases manually.
