import { FileClock } from "lucide-react";
import { ApiUnavailable } from "@/components/api-unavailable";
import { PageHeader } from "@/components/page-header";
import { api, ApiUnavailableError } from "@/lib/api";

export default async function AuditPage() {
  try {
    const events = await api.audit();
    return <><PageHeader title="Audit Trail" description="Traceable backend events for study ingestion, workflow changes, scheduler decisions, alerts and controlled device tests."/><section className="overflow-hidden rounded-xl border border-slate-200 bg-white">{events.length === 0 ? <div className="p-10 text-center text-sm text-slate-500">No audit events have been recorded yet.</div> : <div className="divide-y divide-slate-100">{events.map((event) => <div key={event.id} className="grid gap-3 px-5 py-4 md:grid-cols-[180px_1fr_220px]"><div className="flex items-center gap-2 text-xs text-slate-500"><FileClock size={14}/>{new Date(event.created_at).toLocaleString()}</div><div><div className="font-semibold text-slate-900">{event.action.replaceAll("_", " ")}</div><div className="mt-1 text-xs text-slate-500">{event.resource_type} · {event.resource_id}</div></div><div className="text-xs text-slate-500"><div className="font-medium text-slate-700">{event.actor || "system"}</div><pre className="mt-1 max-w-full overflow-hidden text-ellipsis whitespace-nowrap font-mono">{JSON.stringify(event.details)}</pre></div></div>)}</div>}</section></>;
  } catch (error) { return <><PageHeader title="Audit Trail" description="Backend audit events."/><ApiUnavailable detail={error instanceof ApiUnavailableError ? error.message : undefined}/></>; }
}
