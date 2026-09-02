from __future__ import annotations

import asyncio

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.domain.schemas import HealthComponent, HealthResponse
from app.services.orthanc import OrthancClient


async def build_health(db: Session, orthanc: OrthancClient | None = None) -> HealthResponse:
    postgres = HealthComponent(status="offline")
    orthanc_status = HealthComponent(status="offline")
    device = HealthComponent(status="not_configured")

    try:
        db.execute(text("SELECT 1"))
        postgres = HealthComponent(status="online")
    except Exception as exc:
        postgres = HealthComponent(status="offline", detail=type(exc).__name__)

    try:
        data = await (orthanc or OrthancClient()).health()
        orthanc_status = HealthComponent(
            status="online",
            detail=str(data.get("Version") or data.get("Name") or "reachable"),
        )
    except Exception as exc:
        orthanc_status = HealthComponent(status="offline", detail=type(exc).__name__)

    if settings.device_engine_host:
        try:
            reader, writer = await asyncio.wait_for(
                asyncio.open_connection(settings.device_engine_host, settings.device_engine_port),
                timeout=1.0,
            )
            writer.close()
            await writer.wait_closed()
            device = HealthComponent(status="online")
            del reader
        except Exception as exc:
            device = HealthComponent(status="offline", detail=type(exc).__name__)

    overall = "ok" if postgres.status == "online" and orthanc_status.status == "online" else "degraded"
    return HealthResponse(
        status=overall,
        api=HealthComponent(status="online"),
        postgres=postgres,
        orthanc=orthanc_status,
        device_engine=device,
    )
