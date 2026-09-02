# Sample data

Only synthetic or properly de-identified DICOM studies belong here.

Run:

```bash
python scripts/generate_sample_dicom.py
```

The generator creates `axiom-demo-ct-study/` with 12 synthetic CT instances in one Study/Series. The files contain an artificial 64×64 pixel phantom, basic CT geometry needed for a viewer, and obviously fictional metadata (`P-10042`, `DEMO^PATIENT`). They are generated from code and are not derived from a real patient.

For the demo, select all 12 `.dcm` files on the Axiom upload screen.
