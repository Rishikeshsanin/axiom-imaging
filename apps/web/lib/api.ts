import type { Alert, AuditEvent, DashboardSnapshot, Health, ImagingDevice, ImagingOrder, Patient, QualityReport, Study, StudyDetail, StudyMetadataResponse } from "@/lib/types";

const serverApi = process.env.AXIOM_INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class ApiUnavailableError extends Error {}

async function getJson<T>(path: string): Promise<T> {
  try {
    const response = await fetch(`${serverApi}${path}`, { cache: "no-store" });
    if (!response.ok) {
      throw new ApiUnavailableError(`API returned ${response.status}`);
    }
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiUnavailableError) throw error;
    throw new ApiUnavailableError(error instanceof Error ? error.message : "API unavailable");
  }
}

function withQuery(path: string, query?: Record<string, string | undefined>) {
  if (!query) return path;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value?.trim()) params.set(key, value.trim());
  }
  const encoded = params.toString();
  return encoded ? `${path}?${encoded}` : path;
}

export const api = {
  dashboard: () => getJson<DashboardSnapshot>("/api/dashboard"),
  health: () => getJson<Health>("/api/health"),
  patients: (query?: Record<string, string | undefined>) => getJson<Patient[]>(withQuery("/api/patients", query)),
  studies: (query?: Record<string, string | undefined>) => getJson<Study[]>(withQuery("/api/studies", query)),
  study: (id: string) => getJson<StudyDetail>(`/api/studies/${encodeURIComponent(id)}`),
  studyQuality: (id: string) => getJson<QualityReport>(`/api/studies/${encodeURIComponent(id)}/quality`),
  studyMetadata: (id: string) => getJson<StudyMetadataResponse>(`/api/studies/${encodeURIComponent(id)}/metadata`),
  orders: (query?: Record<string, string | undefined>) => getJson<ImagingOrder[]>(withQuery("/api/orders", query)),
  devices: () => getJson<ImagingDevice[]>("/api/devices"),
  alerts: (query?: Record<string, string | undefined>) => getJson<Alert[]>(withQuery("/api/alerts", query)),
  audit: (query?: Record<string, string | undefined>) => getJson<AuditEvent[]>(withQuery("/api/audit", query)),
};
