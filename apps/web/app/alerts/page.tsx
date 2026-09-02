import { AlertTriangle } from "lucide-react";
import { AlertAction } from "@/components/alert-actions";
import { ApiUnavailable } from "@/components/api-unavailable";
import { PageHeader } from "@/components/page-header";
import { StatusChip } from "@/components/status-chip";
import { api, ApiUnavailableError } from "@/lib/api";

export default async function AlertsPage() {
  try {
    const alerts = await api.alerts();
    return <><PageHeader title="Operational Alerts" description="Backend-generated reliability and workflow alerts. Controlled simulation faults are clearly identified as test events."/><div className="space-y-3">{alerts.map((alert) => <article key={alert.id} className="rounded-xl border border-slate-200 bg-white p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div className="flex gap-3"><div className={`rounded-lg p-2 ${alert.severity === "CRITICAL" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"}`}><AlertTriangle size={19}/></div><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold text-slate-950">{alert.title}</h2><StatusChip value={alert.severity}/><StatusChip value={alert.status}/></div><p className="mt-1 text-sm text-slate-600">{alert.description}</p><p className="mt-2 text-xs text-slate-400">{new Date(alert.created_at).toLocaleString()} · {alert.source_type}</p></div></div><div className="flex gap-2">{alert.status === "OPEN" && <AlertAction alertId={alert.id} status="ACKNOWLEDGED" label="Acknowledge"/>}{alert.status !== "RESOLVED" && <AlertAction alertId={alert.id} status="RESOLVED" label="Resolve"/>}</div></div></article>)}{alerts.length === 0 && <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">No operational alerts. Controlled fault injection from Devices will create one.</div>}</div></>;
  } catch (error) { return <><PageHeader title="Operational Alerts" description="Reliability alerts."/><ApiUnavailable detail={error instanceof ApiUnavailableError ? error.message : undefined}/></>; }
}
