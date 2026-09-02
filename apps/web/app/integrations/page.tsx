import { BookOpenText, Boxes, Code2, Database, ExternalLink, MonitorPlay, Network, ServerCog } from "lucide-react";
import { ApiUnavailable } from "@/components/api-unavailable";
import { PageHeader } from "@/components/page-header";
import { StatusChip } from "@/components/status-chip";
import { api, ApiUnavailableError } from "@/lib/api";

export default async function IntegrationsPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const orthancUrl = process.env.NEXT_PUBLIC_ORTHANC_URL || "http://localhost:8042";
  const githubUrl = process.env.NEXT_PUBLIC_GITHUB_URL || "https://github.com/Rishikeshsanin/axiom-imaging";
  try {
    const health = await api.health();
    const cards = [
      { name: "FastAPI", description: "REST API, OpenAPI contract and backend operations.", href: `${apiUrl}/docs`, label: "Open API Docs", icon: BookOpenText, status: health.api.status },
      { name: "Orthanc PACS", description: "DICOM object store and Orthanc Explorer 2.", href: `${orthancUrl}/ui/`, label: "Open PACS Explorer", icon: Boxes, status: health.orthanc.status },
      { name: "OHIF Viewer", description: "Medical-imaging viewer integration for uploaded DICOM studies through Orthanc/DICOMweb.", href: `${orthancUrl}/ohif/`, label: "Open OHIF", icon: MonitorPlay, status: health.orthanc.status },
      { name: "DICOMweb", description: "QIDO/WADO/STOW interoperability layer exposed by Orthanc.", href: `${orthancUrl}/dicom-web/`, label: "Open DICOMweb Root", icon: Network, status: health.orthanc.status },
      { name: "PostgreSQL", description: "Application, workflow, QC, alert and audit metadata store.", href: null, label: null, icon: Database, status: health.postgres.status },
      { name: "C++ Device Engine", description: "Separate C++20 concurrency and telemetry simulation service over IPC.", href: null, label: null, icon: ServerCog, status: health.device_engine.status },
    ];
    return <><PageHeader title="System Integrations" description="One place to inspect the services behind Axiom Imaging and open operational developer tools without manually typing service URLs." action={<a href={githubUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"><Code2 size={17}/>GitHub<ExternalLink size={14}/></a>}/><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{cards.map(({ name, description, href, label, icon: Icon, status }) => <article key={name} className="flex min-h-52 flex-col rounded-xl border border-slate-200 bg-white p-5"><div className="flex items-start justify-between gap-4"><div className="rounded-lg bg-cyan-50 p-2 text-cyan-800"><Icon size={20}/></div><StatusChip value={status}/></div><h2 className="mt-4 font-semibold text-slate-950">{name}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>{href && label ? <a href={href} target="_blank" rel="noreferrer" className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-semibold text-cyan-800 hover:text-cyan-950">{label}<ExternalLink size={14}/></a> : <div className="mt-auto pt-5 text-xs font-medium text-slate-400">Internal service · no public console</div>}</article>)}</div><section className="mt-6 rounded-xl border border-cyan-200 bg-cyan-50 p-5 text-sm text-cyan-950"><strong>Architecture boundary:</strong> PostgreSQL stores application/workflow metadata, Orthanc stores DICOM objects and pixel data, OHIF renders DICOM through DICOMweb, and the C++ engine supplies simulated device telemetry. These are separate services by design.</section></>;
  } catch (error) { return <><PageHeader title="System Integrations" description="Connected platform services."/><ApiUnavailable detail={error instanceof ApiUnavailableError ? error.message : undefined}/></>; }
}
