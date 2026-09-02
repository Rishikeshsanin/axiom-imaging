import Link from "next/link";
import { ApiUnavailable } from "@/components/api-unavailable";
import { PageHeader } from "@/components/page-header";
import { api, ApiUnavailableError } from "@/lib/api";

const labels: Record<string, string> = {
  patient_id: "Patient ID", patient_name: "Patient", patient_birth_date: "Birth date", patient_sex: "Sex",
  study_instance_uid: "Study Instance UID", study_date: "Study date", study_time: "Study time", study_description: "Study description",
  series_instance_uid: "Series Instance UID", series_number: "Series number", series_description: "Series description",
  sop_instance_uid: "SOP Instance UID", instance_number: "Instance number", modality: "Modality", body_part_examined: "Body part",
  rows: "Rows", columns: "Columns", number_of_frames: "Frames", institution_name: "Institution", manufacturer: "Manufacturer",
  manufacturer_model_name: "Manufacturer model", has_pixel_data: "Pixel data present",
};

export default async function MetadataPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const [study, response] = await Promise.all([api.study(id), api.studyMetadata(id)]);
    const entries = Object.entries(response.metadata);
    return (
      <>
        <PageHeader title="DICOM Metadata" description={`${study.patient.patient_identifier} · Values captured from the actual uploaded DICOM ingestion event.`} action={<Link href={`/studies/${id}`} className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Back to study</Link>} />
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 bg-slate-50 px-5 py-3 font-mono text-xs text-slate-600">StudyInstanceUID: {response.study_instance_uid}</div>
          <dl className="grid sm:grid-cols-2 xl:grid-cols-3">
            {entries.map(([key, value]) => <div key={key} className="border-b border-r border-slate-100 p-5"><dt className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{labels[key] || key.replaceAll("_", " ")}</dt><dd className="mt-2 break-all text-sm text-slate-900">{value == null || value === "" ? "—" : String(value)}</dd></div>)}
          </dl>
        </section>
      </>
    );
  } catch (error) {
    return <><PageHeader title="DICOM Metadata" description="Metadata recorded by the ingestion pipeline." /><ApiUnavailable detail={error instanceof ApiUnavailableError ? error.message : undefined} /></>;
  }
}
