# Orthanc integration

The Docker Compose stack uses the official Orthanc Team image with DICOMweb and OHIF plugins enabled.

- Internal API URL: `ORTHANC_URL=http://orthanc:8042`
- Browser URL: `ORTHANC_PUBLIC_URL=http://localhost:8042`
- DICOM port exposed for local testing: `4242`
- REST/OHIF port: `8042`
- persistent data volume: `orthanc_data`

FastAPI uploads DICOM bytes to `/instances`. Study viewer links target `/ohif/viewer?StudyInstanceUIDs=<StudyInstanceUID>` on the browser-facing base URL.
