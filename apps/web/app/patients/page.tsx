import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { ApiUnavailable } from "@/components/api-unavailable";
import { api, ApiUnavailableError } from "@/lib/api";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function PatientsPage({ searchParams }: { searchParams: SearchParams }) {
  const raw = (await searchParams).search;
  const search = Array.isArray(raw) ? raw[0] : raw;
  try {
    const patients = await api.patients({ search });
    return (
      <>
        <PageHeader title="Patient Repository" description="Synthetic or de-identified patient identities associated with imaging studies. Search is backed by the patient repository API." />
        <form method="get" className="mb-5 flex max-w-2xl gap-2 rounded-xl border border-slate-200 bg-white p-4">
          <input name="search" defaultValue={search} placeholder="Search patient ID or display name" className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100" />
          <button className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">Search</button>
          {search ? <Link href="/patients" className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Clear</Link> : null}
        </form>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr><th className="px-5 py-3">Patient ID</th><th className="px-5 py-3">Patient</th><th className="px-5 py-3">Studies</th><th className="px-5 py-3">Last imaging</th><th className="px-5 py-3">Details</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {patients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-4 font-mono text-xs font-semibold text-slate-800">{patient.patient_identifier}</td>
                    <td className="px-5 py-4"><div className="font-medium text-slate-900">{patient.display_name}</div><div className="mt-1 text-xs text-slate-500">{patient.sex || "Sex not provided"}</div></td>
                    <td className="px-5 py-4 tabular-nums">{patient.study_count}</td>
                    <td className="px-5 py-4 text-slate-600">{patient.most_recent_imaging_date || "—"}</td>
                    <td className="px-5 py-4"><Link className="font-semibold text-cyan-800 hover:underline" href={`/patients/${patient.id}`}>View patient</Link></td>
                  </tr>
                ))}
                {patients.length === 0 ? <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-500">No patients match the current search.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  } catch (error) {
    return <><PageHeader title="Patient Repository" description="Synthetic or de-identified patient identities associated with imaging studies." /><ApiUnavailable detail={error instanceof ApiUnavailableError ? error.message : undefined} /></>;
  }
}
