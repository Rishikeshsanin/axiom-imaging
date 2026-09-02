import Link from "next/link";
import { Activity, AlertTriangle, Database, Gauge, Images, ListOrdered, ShieldCheck, Users } from "lucide-react";
import { ApiUnavailable } from "@/components/api-unavailable";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { StatusChip } from "@/components/status-chip";
import { api, ApiUnavailableError } from "@/lib/api";

export default async function DashboardPage() {
  try {
    const [data, studies, orders, devices, alerts] = await Promise.all([
      api.dashboard(), api.studies(), api.orders(), api.devices(), api.alerts(),
    ]);
    const health = [["API", data.health.api], ["PostgreSQL", data.health.postgres], ["Orthanc", data.health.orthanc], ["Device Engine", data.health.device_engine]] as const;
    const queued = orders.filter((o) => o.status === "ORDERED").sort((a, b) => (b.scheduler_score || 0) - (a.scheduler_score || 0)).slice(0, 5);
    const recentStudies = studies.slice(0, 5);
    const activeAlerts = alerts.filter((a) => a.status !== "RESOLVED").slice(0, 4);

    return (
      <>
        <PageHeader title="Imaging Operations Overview" description="Live operational metrics across DICOM ingestion, scheduling, device telemetry, quality validation and system health." />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Studies Today" value={data.studies_today} icon={Images} />
          <StatCard label="Active Exams" value={data.active_exams} icon={Activity} />
          <StatCard label="Patients" value={data.patients} icon={Users} />
          <StatCard label="Devices Online" value={data.devices_online} icon={Gauge} />
          <StatCard label="Queue Depth" value={data.queue_depth} icon={ListOrdered} />
          <StatCard label="QC Review Required" value={data.qc_review_required} icon={ShieldCheck} />
          <StatCard label="Critical Alerts" value={data.critical_alerts} icon={AlertTriangle} />
          <StatCard label="Avg Processing Time" value={data.average_processing_time_seconds == null ? "—" : `${data.average_processing_time_seconds.toFixed(1)} s`} icon={Database} note="Shown only when real duration events are available." />
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <section className="rounded-xl border border-slate-200 bg-white p-5"><div className="flex items-start justify-between"><div><h2 className="font-semibold text-slate-950">Device fleet</h2><p className="mt-1 text-sm text-slate-600">Latest C++ engine heartbeat persisted by FastAPI.</p></div><Link href="/devices" className="text-sm font-semibold text-cyan-800">View fleet</Link></div><div className="mt-4 space-y-2">{devices.slice(0, 5).map((device) => <div key={device.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-3"><div><div className="text-sm font-semibold text-slate-900">{device.device_identifier}</div><div className="text-xs text-slate-500">{device.modality} · {device.location || "—"}</div></div><span className="text-xs text-slate-500">{device.utilization}%</span><StatusChip value={device.status}/></div>)}{devices.length === 0 && <p className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">Waiting for device-engine telemetry.</p>}</div></section>

          <section className="rounded-xl border border-slate-200 bg-white p-5"><div className="flex items-start justify-between"><div><h2 className="font-semibold text-slate-950">Priority scheduler</h2><p className="mt-1 text-sm text-slate-600">Highest effective queued work, including waiting-time aging.</p></div><Link href="/orders" className="text-sm font-semibold text-cyan-800">Open orders</Link></div><div className="mt-4 space-y-2">{queued.map((order) => <div key={order.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-3"><div><div className="text-sm font-semibold text-slate-900">{order.patient_identifier} · {order.requested_modality}</div><div className="text-xs text-slate-500">{order.body_part || "Unspecified"} · waiting {order.wait_minutes.toFixed(0)}m</div></div><StatusChip value={order.priority}/><span className="font-mono text-xs text-slate-500">{order.scheduler_score ?? "—"}</span></div>)}{queued.length === 0 && <p className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">No orders are waiting for scheduling.</p>}</div></section>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <section className="rounded-xl border border-slate-200 bg-white p-5"><div className="flex items-start justify-between"><div><h2 className="font-semibold text-slate-950">Recent studies</h2><p className="mt-1 text-sm text-slate-600">Persisted patient/study records created by DICOM ingestion.</p></div><Link href="/studies" className="text-sm font-semibold text-cyan-800">Study library</Link></div><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="text-xs uppercase tracking-wide text-slate-500"><tr><th className="py-2">Patient</th><th>Study</th><th>Images</th><th>QC</th><th>Workflow</th></tr></thead><tbody className="divide-y divide-slate-100">{recentStudies.map((study) => <tr key={study.id}><td className="py-3 font-semibold">{study.patient_identifier}</td><td>{study.study_description || "Imaging study"}</td><td>{study.instance_count}</td><td><StatusChip value={study.validation_status}/></td><td><StatusChip value={study.status}/></td></tr>)}</tbody></table></div></section>
          <section className="rounded-xl border border-slate-200 bg-white p-5"><div className="flex items-start justify-between"><div><h2 className="font-semibold text-slate-950">Recent alerts</h2><p className="mt-1 text-sm text-slate-600">Open reliability events.</p></div><Link href="/alerts" className="text-sm font-semibold text-cyan-800">All alerts</Link></div><div className="mt-4 space-y-3">{activeAlerts.map((alert) => <div key={alert.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3"><div className="flex items-center justify-between gap-3"><div className="text-sm font-semibold">{alert.title}</div><StatusChip value={alert.severity}/></div><p className="mt-1 line-clamp-2 text-xs text-slate-500">{alert.description}</p></div>)}{activeAlerts.length === 0 && <p className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">No active alerts.</p>}</div></section>
        </div>

        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6"><div className="mb-5"><h2 className="text-lg font-semibold text-slate-950">System health</h2><p className="mt-1 text-sm text-slate-600">Backend component reachability from the API service.</p></div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{health.map(([name, component]) => <div key={name} className="rounded-lg border border-slate-200 bg-slate-50 p-4"><div className="flex items-center justify-between gap-3"><span className="text-sm font-medium text-slate-800">{name}</span><StatusChip value={component.status}/></div><p className="mt-2 min-h-5 text-xs text-slate-500">{component.detail || "No additional detail"}</p></div>)}</div></section>
      </>
    );
  } catch (error) {
    const detail = error instanceof ApiUnavailableError ? error.message : "Unknown backend error";
    return <><PageHeader title="Imaging Operations Overview" description="Live operational metrics from the Axiom backend."/><ApiUnavailable detail={detail}/></>;
  }
}
