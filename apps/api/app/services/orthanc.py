from __future__ import annotations

from typing import Any

import httpx

from app.core.config import settings
from app.core.errors import AxiomError


class OrthancClient:
    def __init__(self) -> None:
        self.base_url = settings.orthanc_url
        self.public_url = settings.orthanc_public_url
        self.auth = (settings.orthanc_username, settings.orthanc_password)

    async def health(self) -> dict[str, Any]:
        async with httpx.AsyncClient(timeout=3.0, auth=self.auth) as client:
            response = await client.get(f"{self.base_url}/system")
            response.raise_for_status()
            return response.json()

    async def upload_instance(self, data: bytes) -> dict[str, Any]:
        try:
            async with httpx.AsyncClient(timeout=30.0, auth=self.auth) as client:
                response = await client.post(
                    f"{self.base_url}/instances",
                    content=data,
                    headers={"Content-Type": "application/dicom"},
                )
                response.raise_for_status()
                return response.json()
        except httpx.HTTPError as exc:
            raise AxiomError(
                code="ORTHANC_UNAVAILABLE",
                message="The DICOM object could not be stored because Orthanc is unavailable or rejected it.",
                status_code=503,
                details={"orthanc_error": str(exc)},
            ) from exc

    def ohif_study_url(self, study_instance_uid: str) -> str:
        # The browser must receive the host-facing Orthanc URL, not the Docker-only service name.
        return f"{self.public_url}/ohif/viewer?StudyInstanceUIDs={study_instance_uid}"
