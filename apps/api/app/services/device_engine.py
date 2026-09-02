from __future__ import annotations

import asyncio
import json
from datetime import datetime, timezone

from sqlalchemy import select

from app.core.config import settings
from app.core.database import SessionLocal
from app.core.logging import log_event
from app.domain.models import Alert, AuditEvent, Device


def _upsert_heartbeat(payload: dict) -> None:
    identifier = str(payload.get("deviceId") or "").strip()
    if not identifier:
        return
    with SessionLocal() as db:
        device = db.scalar(select(Device).where(Device.device_identifier == identifier))
        if device is None:
            device = Device(
                device_identifier=identifier,
                name=str(payload.get("name") or identifier),
                modality=str(payload.get("modality") or "UNKNOWN"),
                manufacturer=str(payload.get("manufacturer") or "Axiom Simulation Lab"),
                model=str(payload.get("model") or "SIM-1"),
                location=str(payload.get("location") or "Simulation Bay"),
            )
            db.add(device)
        device.status = str(payload.get("status") or "READY")
        device.utilization = max(0, min(100, int(payload.get("utilization") or 0)))
        device.queue_depth = max(0, int(payload.get("queueDepth") or 0))
        device.last_heartbeat = datetime.now(timezone.utc)
        db.commit()


def _record_fault(payload: dict) -> None:
    identifier = str(payload.get("deviceId") or "").strip()
    if not identifier:
        return
    fault = str(payload.get("fault") or payload.get("code") or "DEVICE_FAULT")
    with SessionLocal() as db:
        device = db.scalar(select(Device).where(Device.device_identifier == identifier))
        if device is not None:
            device.status = "FAULT"
            device.last_heartbeat = datetime.now(timezone.utc)
        db.add(
            Alert(
                severity="CRITICAL",
                source_type="device",
                source_id=device.id if device else None,
                title=f"{identifier} fault",
                description=f"Simulated device-engine fault: {fault}.",
                status="OPEN",
            )
        )
        db.add(
            AuditEvent(
                actor="device-engine",
                action="DEVICE_FAULT",
                resource_type="device",
                resource_id=device.id if device else identifier,
                details={"device_identifier": identifier, "fault": fault},
            )
        )
        db.commit()


def _record_recovery(payload: dict) -> None:
    identifier = str(payload.get("deviceId") or "").strip()
    if not identifier:
        return
    with SessionLocal() as db:
        device = db.scalar(select(Device).where(Device.device_identifier == identifier))
        if device is not None:
            device.status = "READY"
            device.last_heartbeat = datetime.now(timezone.utc)
            db.add(
                AuditEvent(
                    actor="device-engine",
                    action="DEVICE_RECOVERED",
                    resource_type="device",
                    resource_id=device.id,
                    details={"device_identifier": identifier},
                )
            )
            db.commit()


async def device_bridge_loop(stop_event: asyncio.Event) -> None:
    if not settings.device_engine_host:
        return
    while not stop_event.is_set():
        try:
            reader, writer = await asyncio.open_connection(
                settings.device_engine_host, settings.device_engine_port
            )
            writer.write(b'{"type":"SUBSCRIBE"}\n')
            await writer.drain()
            log_event("device_engine_connected", host=settings.device_engine_host)
            while not stop_event.is_set():
                line = await asyncio.wait_for(reader.readline(), timeout=10.0)
                if not line:
                    break
                payload = json.loads(line.decode("utf-8"))
                kind = payload.get("type")
                if kind == "HEARTBEAT":
                    await asyncio.to_thread(_upsert_heartbeat, payload)
                elif kind == "DEVICE_FAULT":
                    await asyncio.to_thread(_record_fault, payload)
                elif kind == "DEVICE_RECOVERED":
                    await asyncio.to_thread(_record_recovery, payload)
            writer.close()
            await writer.wait_closed()
        except (OSError, asyncio.TimeoutError, json.JSONDecodeError) as exc:
            log_event("device_engine_disconnected", severity="WARNING", error_type=type(exc).__name__)
            try:
                await asyncio.wait_for(stop_event.wait(), timeout=2.0)
            except asyncio.TimeoutError:
                pass


async def send_device_command(payload: dict) -> dict:
    if not settings.device_engine_host:
        raise ConnectionError("Device engine is not configured")
    reader, writer = await asyncio.wait_for(
        asyncio.open_connection(settings.device_engine_host, settings.device_engine_port), timeout=2.0
    )
    writer.write((json.dumps(payload, separators=(",", ":")) + "\n").encode("utf-8"))
    await writer.drain()
    line = await asyncio.wait_for(reader.readline(), timeout=3.0)
    writer.close()
    await writer.wait_closed()
    if not line:
        raise ConnectionError("Device engine returned no response")
    return json.loads(line.decode("utf-8"))
