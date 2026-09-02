export type ComponentHealth = {
  status: "online" | "offline" | "not_configured";
  detail?: string | null;
};

export type Health = {
  status: "ok" | "degraded";
  api: ComponentHealth;
  postgres: ComponentHealth;
  orthanc: ComponentHealth;
  device_engine: ComponentHealth;
};

export type DashboardSnapshot = {
  studies_today: number;
  active_exams: number;
  patients: number;
  devices_online: number;
  queue_depth: number;
  qc_review_required: number;
  critical_alerts: number;
  average_processing_time_seconds: number | null;
  health: Health;
};

export type Patient = {
  id: string;
  patient_identifier: string;
  display_name: string;
  birth_date?: string | null;
  sex?: string | null;
  created_at: string;
  updated_at: string;
  study_count: number;
  most_recent_imaging_date?: string | null;
};

export type Study = {
  id: string;
  patient_id: string;
  patient_identifier: string;
  patient_display_name: string;
  study_instance_uid: string;
  study_date?: string | null;
  study_description?: string | null;
  modality?: string | null;
  body_part_examined?: string | null;
  institution_name?: string | null;
  manufacturer?: string | null;
  status: string;
  series_count: number;
  instance_count: number;
  validation_status: string;
  uploaded_at: string;
  orthanc_study_id?: string | null;
};

export type StudyDetail = Study & {
  patient: {
    patient_identifier: string;
    display_name: string;
    birth_date?: string | null;
    sex?: string | null;
  };
  series: Array<{
    id: string;
    series_instance_uid: string;
    series_number?: number | null;
    description?: string | null;
    modality?: string | null;
    instance_count: number;
  }>;
  viewer_url?: string | null;
};

export type QualityCheck = {
  name: string;
  status: "PASS" | "REVIEW" | "FAIL";
  message: string;
};


export type QualityReport = {
  overall: "PASS" | "REVIEW" | "FAIL";
  checks: QualityCheck[];
};

export type StudyMetadataResponse = {
  study_instance_uid: string;
  metadata: Record<string, unknown>;
};

export type UploadResult = {
  filename: string;
  study_id: string;
  study_instance_uid: string;
  series_instance_uid: string;
  sop_instance_uid: string;
  patient_identifier: string;
  orthanc_instance_id: string;
  metadata: Record<string, unknown>;
  quality: {
    overall: "PASS" | "REVIEW" | "FAIL";
    checks: QualityCheck[];
  };
};

export type ImagingOrder = {
  id: string;
  patient_id: string;
  patient_identifier: string;
  patient_display_name: string;
  requested_modality: string;
  body_part?: string | null;
  priority: "EMERGENCY" | "URGENT" | "ROUTINE" | string;
  requested_by: string;
  status: string;
  scheduled_device_id?: string | null;
  scheduled_device_identifier?: string | null;
  requested_at: string;
  scheduled_at?: string | null;
  notes?: string | null;
  wait_minutes: number;
  scheduler_score?: number | null;
};

export type ImagingDevice = {
  id: string;
  device_identifier: string;
  name: string;
  modality: string;
  manufacturer?: string | null;
  model?: string | null;
  status: string;
  location?: string | null;
  last_heartbeat?: string | null;
  utilization: number;
  queue_depth: number;
  created_at: string;
};

export type Alert = {
  id: string;
  severity: string;
  source_type: string;
  source_id?: string | null;
  title: string;
  description: string;
  status: string;
  created_at: string;
  resolved_at?: string | null;
};

export type AuditEvent = {
  id: string;
  actor?: string | null;
  action: string;
  resource_type: string;
  resource_id: string;
  details: Record<string, unknown>;
  created_at: string;
};
