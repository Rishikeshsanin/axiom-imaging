from __future__ import annotations

from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, File, Query, UploadFile
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.errors import AxiomError
from app.domain.models import Alert, AuditEvent, Device, ImagingOrder, Patient, Study, WorkflowEvent
from app.domain.schemas import (
    AlertRead,
    AlertUpdate,
    AuditEventRead,
    DashboardSnapshot,
    DeviceFaultRequest,
    DeviceRead,
    ImagingOrderCreate,
    ImagingOrderRead,
    OrderStatusUpdate,
    PatientCreate,
    PatientRead,
    SchedulerDispatchResponse,
    StudyDetail,
    StudyRead,
    UploadResponse,
)
from app.repositories import patients as patient_repo
from app.repositories import studies as study_repo
from app.services.device_engine import send_device_command
from app.services.health import build_health
from app.services.ingestion import IngestionService
from app.services.orthanc import OrthancClient
from app.services.scheduler import pop_next_order, scheduler_score

router = APIRouter(prefix="/api")


@router.get("/health")
async def health(db: Session = Depends(get_db)):
    return await build_health(db)


@router.get("/dashboard", response_model=DashboardSnapshot)
async def dashboard(db: Session = Depends(get_db)) -> DashboardSnapshot:
    today = date.today()
    return DashboardSnapshot(
        studies_today=db.scalar(select(func.count(Study.id)).where(Study.study_date == today)) or 0,
        active_exams=db.scalar(select(func.count(ImagingOrder.id)).where(ImagingOrder.status.in_(["SCHEDULED", "IN_PROGRESS", "PROCESSING"]))) or 0,
        patients=db.scalar(select(func.count(Patient.id))) or 0,
        devices_online=db.scalar(select(func.count(Device.id)).where(Device.status.not_in(["OFFLINE", "FAULT", "MAINTENANCE"]))) or 0,
        queue_depth=db.scalar(select(func.coalesce(func.sum(Device.queue_depth), 0))) or 0,
        qc_review_required=db.scalar(select(func.count(Study.id)).where(Study.validation_status.in_(["REVIEW", "FAIL"]))) or 0,
        critical_alerts=db.scalar(select(func.count(Alert.id)).where(Alert.severity == "CRITICAL", Alert.status != "RESOLVED")) or 0,
        average_processing_time_seconds=None,
        health=await build_health(db),
    )


@router.get("/patients", response_model=list[PatientRead])
def patients(search: str | None = None, limit: int = Query(50, ge=1, le=200), offset: int = Query(0, ge=0), db: Session = Depends(get_db)):
    return [PatientRead.model_validate(patient).model_copy(update={"study_count": count, "most_recent_imaging_date": recent}) for patient, count, recent in patient_repo.list_patients(db, search=search, limit=limit, offset=offset)]


@router.post("/patients", response_model=PatientRead, status_code=201)
def create_patient(payload: PatientCreate, db: Session = Depends(get_db)):
    if db.scalar(select(Patient).where(Patient.patient_identifier == payload.patient_identifier)):
        raise AxiomError("PATIENT_ALREADY_EXISTS", "A patient with this identifier already exists.", 409)
    patient = Patient(**payload.model_dump())
    db.add(patient); db.commit(); db.refresh(patient)
    return PatientRead.model_validate(patient)


@router.get("/patients/{patient_id}", response_model=PatientRead)
def patient(patient_id: str, db: Session = Depends(get_db)):
    row = patient_repo.get_patient(db, patient_id)
    if row is None:
        raise AxiomError("PATIENT_NOT_FOUND", "Patient not found.", 404)
    count = db.scalar(select(func.count(Study.id)).where(Study.patient_id == row.id)) or 0
    recent = db.scalar(select(func.max(Study.study_date)).where(Study.patient_id == row.id))
    return PatientRead.model_validate(row).model_copy(update={"study_count": count, "most_recent_imaging_date": recent})


@router.get("/patients/{patient_id}/studies", response_model=list[StudyRead])
def patient_studies(patient_id: str, db: Session = Depends(get_db)):
    if db.get(Patient, patient_id) is None:
        raise AxiomError("PATIENT_NOT_FOUND", "Patient not found.", 404)
    return list(db.scalars(select(Study).where(Study.patient_id == patient_id).order_by(Study.uploaded_at.desc())).all())


@router.get("/studies", response_model=list[StudyRead])
def studies(search: str | None = None, modality: str | None = None, status: str | None = None, quality: str | None = None, date_from: date | None = None, date_to: date | None = None, limit: int = Query(100, ge=1, le=200), offset: int = Query(0, ge=0), db: Session = Depends(get_db)):
    return list(study_repo.list_studies(db, search=search, modality=modality, status=status, quality=quality, date_from=date_from, date_to=date_to, limit=limit, offset=offset))


@router.get("/studies/{study_id}", response_model=StudyDetail)
def study(study_id: str, db: Session = Depends(get_db)):
    row = study_repo.get_study(db, study_id)
    if row is None:
        raise AxiomError("STUDY_NOT_FOUND", "Study not found.", 404)
    return StudyDetail(
        **StudyRead.model_validate(row).model_dump(),
        patient=PatientCreate.model_validate(row.patient, from_attributes=True),
        series=[{"id": s.id, "series_instance_uid": s.series_instance_uid, "series_number": s.series_number, "description": s.description, "modality": s.modality, "instance_count": s.instance_count} for s in row.series],
        viewer_url=OrthancClient().ohif_study_url(row.study_instance_uid) if row.orthanc_study_id else None,
    )


@router.post("/studies/upload", response_model=UploadResponse, status_code=201)
async def upload(files: list[UploadFile] = File(...), db: Session = Depends(get_db)):
    max_bytes = settings.max_upload_mb * 1024 * 1024
    service, results = IngestionService(), []
    for item in files:
        filename = item.filename or "dicom-upload.dcm"
        if not filename.lower().endswith((".dcm", ".dicom")):
            raise AxiomError("UNSUPPORTED_FILE", "Axiom accepts .dcm or .dicom files.", 415, {"filename": filename})
        data = await item.read(max_bytes + 1)
        if len(data) > max_bytes:
            raise AxiomError("UPLOAD_TOO_LARGE", f"Each DICOM file must be {settings.max_upload_mb} MB or smaller.", 413)
        if not data:
            raise AxiomError("INVALID_DICOM", "The uploaded DICOM file is empty.", 422)
        results.append(await service.ingest(db, filename=filename, data=data))
    return UploadResponse(uploaded=results)


def _quality_event(db: Session, study_id: str):
    return db.scalar(select(WorkflowEvent).where(WorkflowEvent.study_id == study_id, WorkflowEvent.event_type == "QUALITY_GATE_COMPLETED").order_by(WorkflowEvent.created_at.desc()))


@router.get("/studies/{study_id}/metadata")
def metadata(study_id: str, db: Session = Depends(get_db)):
    row = db.get(Study, study_id)
    if row is None:
        raise AxiomError("STUDY_NOT_FOUND", "Study not found.", 404)
    event = _quality_event(db, study_id)
    return {"study_instance_uid": row.study_instance_uid, "metadata": (event.event_metadata or {}).get("metadata", {}) if event else {}}


@router.get("/studies/{study_id}/quality")
def quality(study_id: str, db: Session = Depends(get_db)):
    if db.get(Study, study_id) is None:
        raise AxiomError("STUDY_NOT_FOUND", "Study not found.", 404)
    event = _quality_event(db, study_id)
    if event is None:
        raise AxiomError("QUALITY_NOT_FOUND", "No Quality Gate result exists for this study.", 404)
    return event.event_metadata.get("quality", {})


@router.get("/studies/{study_id}/viewer")
def viewer(study_id: str, db: Session = Depends(get_db)):
    row = db.get(Study, study_id)
    if row is None:
        raise AxiomError("STUDY_NOT_FOUND", "Study not found.", 404)
    if not row.orthanc_study_id:
        raise AxiomError("VIEWER_UNAVAILABLE", "This study has no Orthanc resource reference.", 409)
    return {"study_id": row.id, "study_instance_uid": row.study_instance_uid, "viewer_url": OrthancClient().ohif_study_url(row.study_instance_uid)}


def _order_read(db: Session, order: ImagingOrder) -> ImagingOrderRead:
    p, d = db.get(Patient, order.patient_id), db.get(Device, order.scheduled_device_id) if order.scheduled_device_id else None
    now, requested = datetime.now(timezone.utc), order.requested_at
    if requested.tzinfo is None:
        requested = requested.replace(tzinfo=timezone.utc)
    return ImagingOrderRead(
        **{k: getattr(order, k) for k in ["id", "patient_id", "requested_modality", "body_part", "priority", "requested_by", "status", "scheduled_device_id", "requested_at", "scheduled_at", "notes"]},
        patient_identifier=p.patient_identifier if p else "UNKNOWN",
        patient_display_name=p.display_name if p else "Unknown Patient",
        scheduled_device_identifier=d.device_identifier if d else None,
        wait_minutes=max(0.0, (now - requested).total_seconds() / 60.0),
        scheduler_score=scheduler_score(order, now=now) if order.status == "ORDERED" else None,
    )


@router.get("/orders", response_model=list[ImagingOrderRead])
def orders(status: str | None = None, priority: str | None = None, db: Session = Depends(get_db)):
    stmt = select(ImagingOrder)
    if status: stmt = stmt.where(ImagingOrder.status == status.upper())
    if priority: stmt = stmt.where(ImagingOrder.priority == priority.upper())
    return [_order_read(db, o) for o in db.scalars(stmt.order_by(ImagingOrder.requested_at.desc())).all()]


@router.post("/orders", response_model=ImagingOrderRead, status_code=201)
def create_order(payload: ImagingOrderCreate, db: Session = Depends(get_db)):
    p = db.get(Patient, payload.patient_id)
    if p is None: raise AxiomError("PATIENT_NOT_FOUND", "Patient not found.", 404)
    order = ImagingOrder(**payload.model_dump(), status="ORDERED")
    db.add(order); db.flush()
    db.add(WorkflowEvent(order_id=order.id, event_type="ORDER_CREATED", message=f"{order.priority} {order.requested_modality} order created.", event_metadata={"priority": order.priority}))
    db.add(AuditEvent(actor=payload.requested_by, action="ORDER_CREATED", resource_type="order", resource_id=order.id, details={"patient_identifier": p.patient_identifier, "priority": order.priority}))
    db.commit(); db.refresh(order)
    return _order_read(db, order)


@router.get("/orders/{order_id}", response_model=ImagingOrderRead)
def order(order_id: str, db: Session = Depends(get_db)):
    row = db.get(ImagingOrder, order_id)
    if row is None: raise AxiomError("ORDER_NOT_FOUND", "Imaging order not found.", 404)
    return _order_read(db, row)


_TRANSITIONS = {"ORDERED": {"SCHEDULED", "CANCELLED", "ERROR"}, "SCHEDULED": {"IN_PROGRESS", "CANCELLED", "ERROR"}, "IN_PROGRESS": {"PROCESSING", "ERROR"}, "PROCESSING": {"COMPLETED", "ERROR"}, "COMPLETED": set(), "CANCELLED": set(), "ERROR": {"ORDERED", "CANCELLED"}}


@router.patch("/orders/{order_id}/status", response_model=ImagingOrderRead)
def order_status(order_id: str, payload: OrderStatusUpdate, db: Session = Depends(get_db)):
    row = db.get(ImagingOrder, order_id)
    if row is None: raise AxiomError("ORDER_NOT_FOUND", "Imaging order not found.", 404)
    if payload.status == row.status: return _order_read(db, row)
    if payload.status not in _TRANSITIONS.get(row.status, set()):
        raise AxiomError("INVALID_ORDER_TRANSITION", f"Order cannot transition from {row.status} to {payload.status}.", 409)
    previous, row.status = row.status, payload.status
    if row.scheduled_device_id and payload.status in {"COMPLETED", "CANCELLED", "ERROR"}:
        d = db.get(Device, row.scheduled_device_id)
        if d:
            d.queue_depth = max(0, d.queue_depth - 1)
            if payload.status == "COMPLETED" and d.status not in {"FAULT", "OFFLINE"}: d.status = "READY"
    db.add(WorkflowEvent(order_id=row.id, device_id=row.scheduled_device_id, event_type="ORDER_STATUS_CHANGED", message=f"Order moved from {previous} to {payload.status}.", event_metadata={"from": previous, "to": payload.status}))
    db.add(AuditEvent(actor="demo-technician", action="ORDER_STATUS_CHANGED", resource_type="order", resource_id=row.id, details={"from": previous, "to": payload.status}))
    db.commit(); db.refresh(row)
    return _order_read(db, row)


@router.post("/scheduler/dispatch", response_model=SchedulerDispatchResponse)
def dispatch(db: Session = Depends(get_db)):
    row = pop_next_order(list(db.scalars(select(ImagingOrder).where(ImagingOrder.status == "ORDERED")).all()))
    if row is None: raise AxiomError("SCHEDULER_EMPTY", "There are no ORDERED imaging requests to dispatch.", 409)
    devices = list(db.scalars(select(Device).where(Device.modality == row.requested_modality, Device.status.in_(["READY", "RESERVED"]))).all())
    if not devices: raise AxiomError("NO_AVAILABLE_DEVICE", f"No online {row.requested_modality} device is available.", 409)
    d = min(devices, key=lambda x: (x.queue_depth, x.utilization, x.device_identifier))
    row.status, row.scheduled_device_id, row.scheduled_at = "SCHEDULED", d.id, datetime.now(timezone.utc)
    d.status, d.queue_depth = "RESERVED", d.queue_depth + 1
    db.add(WorkflowEvent(order_id=row.id, device_id=d.id, event_type="ORDER_SCHEDULED", message=f"Scheduler assigned order to {d.device_identifier}.", event_metadata={"strategy": "priority-aging+load-balance"}))
    db.add(AuditEvent(actor="axiom-scheduler", action="ORDER_SCHEDULED", resource_type="order", resource_id=row.id, details={"device_identifier": d.device_identifier, "priority": row.priority}))
    db.commit(); db.refresh(row)
    return SchedulerDispatchResponse(order=_order_read(db, row), device_identifier=d.device_identifier)


@router.get("/devices", response_model=list[DeviceRead])
def devices(db: Session = Depends(get_db)):
    return list(db.scalars(select(Device).order_by(Device.device_identifier)).all())


def _device(db: Session, key: str):
    return db.get(Device, key) or db.scalar(select(Device).where(Device.device_identifier == key))


@router.get("/devices/{device_id}", response_model=DeviceRead)
def device(device_id: str, db: Session = Depends(get_db)):
    row = _device(db, device_id)
    if row is None: raise AxiomError("DEVICE_NOT_FOUND", "Imaging device not found.", 404)
    return row


@router.post("/devices/{device_id}/fault", response_model=DeviceRead)
async def fault(device_id: str, payload: DeviceFaultRequest, db: Session = Depends(get_db)):
    row = _device(db, device_id)
    if row is None: raise AxiomError("DEVICE_NOT_FOUND", "Imaging device not found.", 404)
    try: await send_device_command({"type": "INJECT_FAULT", "deviceId": row.device_identifier, "fault": payload.fault})
    except Exception as exc: raise AxiomError("DEVICE_ENGINE_UNAVAILABLE", "The C++ device engine could not accept the fault command.", 503, {"error": type(exc).__name__}) from exc
    row.status = "FAULT"
    db.add(Alert(severity="CRITICAL", source_type="device", source_id=row.id, title=f"{row.device_identifier} fault", description=f"Controlled simulation fault: {payload.fault}.", status="OPEN"))
    db.add(AuditEvent(actor="demo-admin", action="FAULT_INJECTED", resource_type="device", resource_id=row.id, details={"fault": payload.fault}))
    db.commit(); db.refresh(row)
    return row


@router.post("/devices/{device_id}/recover", response_model=DeviceRead)
async def recover(device_id: str, db: Session = Depends(get_db)):
    row = _device(db, device_id)
    if row is None: raise AxiomError("DEVICE_NOT_FOUND", "Imaging device not found.", 404)
    try: await send_device_command({"type": "RECOVER", "deviceId": row.device_identifier})
    except Exception as exc: raise AxiomError("DEVICE_ENGINE_UNAVAILABLE", "The C++ device engine could not accept recovery.", 503, {"error": type(exc).__name__}) from exc
    row.status = "READY"
    db.add(AuditEvent(actor="demo-admin", action="DEVICE_RECOVERED", resource_type="device", resource_id=row.id, details={"device_identifier": row.device_identifier}))
    db.commit(); db.refresh(row)
    return row


@router.get("/alerts", response_model=list[AlertRead])
def alerts(status: str | None = None, severity: str | None = None, limit: int = Query(100, ge=1, le=250), db: Session = Depends(get_db)):
    stmt = select(Alert)
    if status: stmt = stmt.where(Alert.status == status.upper())
    if severity: stmt = stmt.where(Alert.severity == severity.upper())
    return list(db.scalars(stmt.order_by(Alert.created_at.desc()).limit(limit)).all())


@router.patch("/alerts/{alert_id}", response_model=AlertRead)
def alert_status(alert_id: str, payload: AlertUpdate, db: Session = Depends(get_db)):
    row = db.get(Alert, alert_id)
    if row is None: raise AxiomError("ALERT_NOT_FOUND", "Alert not found.", 404)
    row.status, row.resolved_at = payload.status, datetime.now(timezone.utc) if payload.status == "RESOLVED" else None
    db.add(AuditEvent(actor="demo-admin", action="ALERT_STATUS_CHANGED", resource_type="alert", resource_id=row.id, details={"status": payload.status}))
    db.commit(); db.refresh(row)
    return row


@router.get("/audit", response_model=list[AuditEventRead])
def audit(action: str | None = None, resource_type: str | None = None, limit: int = Query(150, ge=1, le=500), db: Session = Depends(get_db)):
    stmt = select(AuditEvent)
    if action: stmt = stmt.where(AuditEvent.action == action.upper())
    if resource_type: stmt = stmt.where(AuditEvent.resource_type == resource_type.lower())
    return list(db.scalars(stmt.order_by(AuditEvent.created_at.desc()).limit(limit)).all())
