import Link from "next/link";
import { ApiUnavailable } from "@/components/api-unavailable";
import { PageHeader } from "@/components/page-header";
import { StatusChip } from "@/components/status-chip";
import { ApiUnavailableError } from "@/lib/api";
import type { Patient, Study } from "@/lib/types";

const API = process.env.AXIOM_INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function loadPatient(id: string): Promise<{ patient: Patient; studies: Study[] }> {
  try {
    const [patientRes, studiesRes] = await Promise.all([
      fetch(`${API}/api/patients/${encodeURIComponent(id)}`, { cache: "no-store" }),
      fetch(`${API}/api/patients/${encodeURIComponent(id)}/studies`, { cache: "no-store" }),
    ]);
    if (!patientRes.ok || !studiesRes.ok) throw new ApiUnavailableError("Patient data could not be loaded");
    return { patient: await patientRes.json(), studies: await studiesRes.json() };
  } catch (error) {
    if (error instanceof ApiUnavailableError) throw error;
    throw new ApiUnavailableError(error instanceof Error ? error.message : "API unavailable");
  }
}

export default async function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { patient, studies } = await loadPatient(id);
    return (
      <>
        <PageHeader title={patient.display_name} description={`Patient identifier ${patient.patient_identifier} · ${patient.study_count} imaging studies`} />
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold text-slate-950">Imaging history</h2>
          <div className="mt-4 divide-y divide-slate-100">
            {studies.map((study) => (
              <div key={study.id} className="grid gap-4 py-5 md:grid-cols-[120px_1fr_auto] md:items-center">
                <div className="text-sm font-medium text-slate-600">{study.study_date || "Date unknown"}</div>
                <div><div className="font-semibold text-slate-900">{study.study_description || `${study.modality || "Imaging"} study`}</div><div className="mt-1 text-xs text-slate-500">{study.series_count} series · {study.instance_count} images</div><div className="mt-2 flex gap-2"><StatusChip value={study.status} /><StatusChip value={study.validation_status} /></div></div>
                <Link href={`/studies/${study.id}`} className="font-semibold text-cyan-800 hover:underline">View study</Link>
              </div>
            ))}
            {studies.length === 0 ? <p className="py-10 text-center text-sm text-slate-500">No imaging studies are associated with this patient.</p> : null}
          </div>
        </section>
      </>
    );
  } catch (error) {
    return <><PageHeader title="Patient details" description="Patient imaging history from Axiom." /><ApiUnavailable detail={error instanceof ApiUnavailableError ? error.message : undefined} /></>;
  }
}
