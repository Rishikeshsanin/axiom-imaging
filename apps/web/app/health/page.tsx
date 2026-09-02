import { Activity } from "lucide-react";
import { ApiUnavailable } from "@/components/api-unavailable";
import { PageHeader } from "@/components/page-header";
import { StatusChip } from "@/components/status-chip";
import { api, ApiUnavailableError } from "@/lib/api";

export default async function HealthPage() {
  try {
    const health = await api.health();
    const components = [
      ["API", health.api, "FastAPI application process"],
      ["PostgreSQL", health.postgres, "Application and workflow metadata"],
      ["Orthanc", health.orthanc, "PACS / DICOM object storage"],
      ["Device Engine", health.device_engine, "C++20 systems component / TCP IPC"],
    ] as const;
    return (
      <>
        <PageHeader title="System Health" description="Axiom reports component status only after real reachability checks. A service that cannot be checked is not shown as healthy." />
        <div className="grid gap-4 md:grid-cols-2">
          {components.map(([name, component, description]) => (
            <div key={name} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between gap-4"><div className="flex gap-3"><div className="rounded-lg bg-cyan-50 p-2 text-cyan-800"><Activity size={18} /></div><div><h2 className="font-semibold text-slate-950">{name}</h2><p className="mt-1 text-sm text-slate-600">{description}</p></div></div><StatusChip value={component.status} /></div>
              <p className="mt-4 font-mono text-xs text-slate-500">{component.detail || "No component detail"}</p>
            </div>
          ))}
        </div>
      </>
    );
  } catch (error) {
    return <><PageHeader title="System Health" description="Backend component reachability." /><ApiUnavailable detail={error instanceof ApiUnavailableError ? error.message : undefined} /></>;
  }
}
