from __future__ import annotations

from datetime import date, datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class PatientCreate(BaseModel):
    patient_identifier: str = Field(min_length=1, max_length=128)
    display_name: str = Field(min_length=1, max_length=255)
    birth_date: date | None = None
    sex: str | None = Field(default=None, max_length=32)


class PatientRead(PatientCreate):
    model_config = ConfigDict(from_attributes=True)
    id: str
    created_at: datetime
    updated_at: datetime
    study_count: int = 0
    most_recent_imaging_date: date | None = None


class StudyRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    patient_id: str
    patient_identifier: str
    patient_display_name: str
    study_instance_uid: str
    study_date: date | None
    study_description: str | None
    modality: str | None
    body_part_examined: str | None
    institution_name: str | None
    manufacturer: str | None
    status: str
    series_count: int
    instance_count: int
    validation_status: str
    uploaded_at: datetime
    orthanc_study_id: str | None = None


class StudyDetail(StudyRead):
    patient: PatientCreate
    series: list[dict[str, Any]] = []
    viewer_url: str | None = None


class QualityCheckItem(BaseModel):
    name: str
    status: Literal["PASS", "REVIEW", "FAIL"]
    message: str


class QualityReport(BaseModel):
    overall: Literal["PASS", "REVIEW", "FAIL"]
    checks: list[QualityCheckItem]


class UploadInstanceResult(BaseModel):
    filename: str
    study_id: str
    study_instance_uid: str
    series_instance_uid: str
    sop_instance_uid: str
    patient_identifier: str
    orthanc_instance_id: str
    metadata: dict[str, Any]
    quality: QualityReport


class UploadResponse(BaseModel):
    uploaded: list[UploadInstanceResult]


class HealthComponent(BaseModel):
    status: Literal["online", "offline", "not_configured"]
    detail: str | None = None


class HealthResponse(BaseModel):
    status: Literal["ok", "degraded"]
    api: HealthComponent
    postgres: HealthComponent
    orthanc: HealthComponent
    device_engine: HealthComponent


class DashboardSnapshot(BaseModel):
    studies_today: int
    active_exams: int
    patients: int
    devices_online: int
    queue_depth: int
    qc_review_required: int
    critical_alerts: int
    average_processing_time_seconds: float | None
    health: HealthResponse


OrderPriority = Literal["EMERGENCY", "URGENT", "ROUTINE"]
OrderStatus = Literal["ORDERED", "SCHEDULED", "IN_PROGRESS", "PROCESSING", "COMPLETED", "CANCELLED", "ERROR"]


class ImagingOrderCreate(BaseModel):
    patient_id: str
    requested_modality: str = Field(min_length=1, max_length=32)
    body_part: str | None = Field(default=None, max_length=128)
    priority: OrderPriority = "ROUTINE"
    requested_by: str = Field(min_length=1, max_length=255)
    notes: str | None = Field(default=None, max_length=2000)


class ImagingOrderRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    patient_id: str
    patient_identifier: str
    patient_display_name: str
    requested_modality: str
    body_part: str | None
    priority: str
    requested_by: str
    status: str
    scheduled_device_id: str | None
    scheduled_device_identifier: str | None = None
    requested_at: datetime
    scheduled_at: datetime | None
    notes: str | None
    wait_minutes: float = 0
    scheduler_score: float | None = None


class OrderStatusUpdate(BaseModel):
    status: OrderStatus


class SchedulerDispatchResponse(BaseModel):
    order: ImagingOrderRead
    device_identifier: str
    strategy: str = "Priority + aging / load-balanced device"


class DeviceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    device_identifier: str
    name: str
    modality: str
    manufacturer: str | None
    model: str | None
    status: str
    location: str | None
    last_heartbeat: datetime | None
    utilization: int
    queue_depth: int
    created_at: datetime


class DeviceFaultRequest(BaseModel):
    fault: Literal["SCANNER_OVERHEAT", "NETWORK_DISCONNECT", "HEARTBEAT_TIMEOUT", "WORKER_FAILURE", "QUEUE_OVERLOAD", "PROCESSING_ERROR"]


class AlertRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    severity: str
    source_type: str
    source_id: str | None
    title: str
    description: str
    status: str
    created_at: datetime
    resolved_at: datetime | None


class AlertUpdate(BaseModel):
    status: Literal["OPEN", "ACKNOWLEDGED", "RESOLVED"]


class AuditEventRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    actor: str | None
    action: str
    resource_type: str
    resource_id: str
    details: dict[str, Any]
    created_at: datetime
