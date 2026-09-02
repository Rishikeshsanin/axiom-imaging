import Link from "next/link";
import { ApiUnavailable } from "@/components/api-unavailable";
import { PageHeader } from "@/components/page-header";
import { StatusChip } from "@/components/status-chip";
import { api, ApiUnavailableError } from "@/lib/api";

export default async function QualityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const [study, quality] = await Promise.all([api.study(id), api.studyQuality(id)]);
    return (
      <>
        <PageHeader title="Axiom Quality Gate" description={`${study.patient.patient_identifier} · ${study.study_description || study.study_instance_uid}`} action={<Link href={`/studies/${id}`} className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Back to study</Link>} />
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between gap-4"><div><h2 className="font-semibold text-slate-950">Validation result</h2><p className="mt-1 text-sm text-slate-600">Operational checks recorded by the backend during DICOM ingestion.</p></div><StatusChip value={quality.overall} /></div>
          <div className="mt-6 divide-y divide-slate-100 border-y border-slate-100">
            {quality.checks.map((check) => <div key={check.name} className="grid gap-3 py-4 md:grid-cols-[220px_110px_1fr] md:items-center"><div className="font-medium text-slate-900">{check.name}</div><StatusChip value={check.status} /><div className="text-sm text-slate-600">{check.message}</div></div>)}
          </div>
          <p className="mt-5 text-xs leading-5 text-slate-500">This Quality Gate is an operational prototype validator, not an official DICOM conformance or clinical quality certification.</p>
        </section>
      </>
    );
  } catch (error) {
    return <><PageHeader title="Axiom Quality Gate" description="Backend-recorded DICOM ingestion checks." /><ApiUnavailable detail={error instanceof ApiUnavailableError ? error.message : undefined} /></>;
  }
}
