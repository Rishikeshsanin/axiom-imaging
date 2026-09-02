import Link from "next/link";
import { ApiUnavailable } from "@/components/api-unavailable";
import { PageHeader } from "@/components/page-header";
import { StatusChip } from "@/components/status-chip";
import { api, ApiUnavailableError } from "@/lib/api";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function StudiesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const filters = {
    search: valueOf(params.search),
    modality: valueOf(params.modality),
    status: valueOf(params.status),
    quality: valueOf(params.quality),
    date_from: valueOf(params.date_from),
    date_to: valueOf(params.date_to),
  };

  try {
    const studies = await api.studies(filters);
    return (
      <>
        <PageHeader title="Study Library" description="Search by patient ID/name, study description or StudyInstanceUID, then filter the persisted imaging workflow metadata." action={<Link href="/upload" className="rounded-lg bg-cyan-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-900">Upload study</Link>} />

        <form method="get" className="mb-5 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 lg:grid-cols-[minmax(240px,1.6fr)_repeat(3,minmax(130px,0.6fr))_auto]">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Search
            <input name="search" defaultValue={filters.search} placeholder="Patient ID, name, study UID..." className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-normal normal-case tracking-normal outline-none focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100" />
          </label>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Modality
            <select name="modality" defaultValue={filters.modality || ""} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal normal-case tracking-normal">
              <option value="">All</option><option value="MR">MR</option><option value="CT">CT</option><option value="XR">XR</option><option value="US">US</option><option value="CR">CR</option>
            </select>
          </label>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">QC
            <select name="quality" defaultValue={filters.quality || ""} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal normal-case tracking-normal">
              <option value="">All</option><option value="PASS">Pass</option><option value="REVIEW">Review</option><option value="FAIL">Fail</option>
            </select>
          </label>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Workflow
            <select name="status" defaultValue={filters.status || ""} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal normal-case tracking-normal">
              <option value="">All</option><option value="READY">Ready</option><option value="REVIEW">Review</option><option value="ERROR">Error</option><option value="VALIDATING">Validating</option>
            </select>
          </label>
          <div className="flex items-end gap-2"><button type="submit" className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">Apply</button><Link href="/studies" className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Clear</Link></div>
        </form>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr><th className="px-4 py-3">Patient</th><th className="px-4 py-3">Study</th><th className="px-4 py-3">Modality</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Series</th><th className="px-4 py-3">Images</th><th className="px-4 py-3">QC</th><th className="px-4 py-3">Workflow</th><th className="px-4 py-3">Open</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {studies.map((study) => (
                  <tr key={study.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-4"><div className="font-mono text-xs font-semibold text-slate-800">{study.patient_identifier}</div><div className="mt-1 text-xs text-slate-500">{study.patient_display_name}</div></td>
                    <td className="px-4 py-4"><div className="font-medium text-slate-900">{study.study_description || "Untitled imaging study"}</div><div className="mt-1 max-w-[270px] truncate font-mono text-[11px] text-slate-500">{study.study_instance_uid}</div></td>
                    <td className="px-4 py-4 font-semibold text-slate-800">{study.modality || "—"}</td>
                    <td className="px-4 py-4 text-slate-600">{study.study_date || "—"}</td>
                    <td className="px-4 py-4 tabular-nums">{study.series_count}</td>
                    <td className="px-4 py-4 tabular-nums">{study.instance_count}</td>
                    <td className="px-4 py-4"><StatusChip value={study.validation_status} /></td>
                    <td className="px-4 py-4"><StatusChip value={study.status} /></td>
                    <td className="px-4 py-4"><Link className="font-semibold text-cyan-800 hover:underline" href={`/studies/${study.id}`}>Study details</Link></td>
                  </tr>
                ))}
                {studies.length === 0 ? <tr><td colSpan={9} className="px-5 py-12 text-center text-slate-500">No studies match the current filters.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  } catch (error) {
    return <><PageHeader title="Study Library" description="Imaging studies persisted by the backend." /><ApiUnavailable detail={error instanceof ApiUnavailableError ? error.message : undefined} /></>;
  }
}
