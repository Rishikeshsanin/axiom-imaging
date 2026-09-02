"use client";

import { useState, type ChangeEvent } from "react";
import { CheckCircle2, FileImage, LoaderCircle, ShieldCheck, UploadCloud } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatusChip } from "@/components/status-chip";
import type { UploadResult } from "@/lib/types";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type ApiError = { error?: { code?: string; message?: string; details?: unknown } };

export default function UploadPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<UploadResult[]>([]);

  async function submit() {
    if (files.length === 0 || busy) return;
    setBusy(true);
    setError(null);
    setResults([]);
    const form = new FormData();
    files.forEach((file) => form.append("files", file));
    try {
      const response = await fetch(`${API}/api/studies/upload`, { method: "POST", body: form });
      const payload = (await response.json()) as { uploaded?: UploadResult[] } & ApiError;
      if (!response.ok) {
        throw new Error(`${payload.error?.code || "UPLOAD_ERROR"}: ${payload.error?.message || "Upload failed"}`);
      }
      setResults(payload.uploaded || []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="Upload DICOM Study" description="Upload de-identified .dcm/.dicom files. Axiom reads the actual DICOM metadata, checks duplicate SOP Instance UIDs, stores objects through Orthanc, maps them into the patient/study hierarchy and runs the Axiom Quality Gate." />

      <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-3"><div className="rounded-lg bg-cyan-50 p-2 text-cyan-800"><UploadCloud size={20} /></div><div><h2 className="font-semibold text-slate-950">Select DICOM files</h2><p className="mt-1 text-sm text-slate-600">No real identifiable patient information.</p></div></div>
          <label className="mt-5 flex min-h-52 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center transition hover:border-cyan-500 hover:bg-cyan-50/40">
            <FileImage className="text-slate-500" size={30} />
            <span className="mt-3 text-sm font-semibold text-slate-800">Choose .dcm or .dicom files</span>
            <span className="mt-1 text-xs text-slate-500">Multiple instances can be uploaded together.</span>
            <input className="sr-only" type="file" accept=".dcm,.dicom,application/dicom" multiple onChange={(event: ChangeEvent<HTMLInputElement>) => setFiles(Array.from(event.target.files || []))} />
          </label>

          {files.length ? <div className="mt-4 rounded-lg border border-slate-200 p-3"><div className="text-xs font-bold uppercase tracking-wide text-slate-500">Selected</div><ul className="mt-2 max-h-32 space-y-1 overflow-y-auto text-sm text-slate-700">{files.map((file) => <li key={`${file.name}-${file.size}`} className="flex justify-between gap-4"><span className="truncate">{file.name}</span><span className="shrink-0 text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</span></li>)}</ul></div> : null}

          <button type="button" disabled={files.length === 0 || busy} onClick={submit} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-900 disabled:cursor-not-allowed disabled:bg-slate-300">
            {busy ? <><LoaderCircle className="animate-spin" size={18} /> Ingesting DICOM…</> : <><UploadCloud size={18} /> Upload and validate</>}
          </button>
          {error ? <div role="alert" className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error}</div> : null}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-3"><div className="rounded-lg bg-emerald-50 p-2 text-emerald-800"><ShieldCheck size={20} /></div><div><h2 className="font-semibold text-slate-950">Extracted metadata & Quality Gate</h2><p className="mt-1 text-sm text-slate-600">Values below come from the uploaded DICOM object.</p></div></div>
          {results.length === 0 ? <div className="mt-6 grid min-h-52 place-items-center rounded-lg bg-slate-50 p-8 text-center text-sm text-slate-500">Results appear here only after a real backend ingestion response.</div> : null}
          <div className="mt-5 space-y-5">
            {results.map((result) => (
              <article key={result.sop_instance_uid} className="rounded-xl border border-slate-200 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2 font-semibold text-slate-950"><CheckCircle2 size={17} className="text-emerald-700" />{result.filename}</div><div className="mt-1 font-mono text-[11px] text-slate-500">SOP {result.sop_instance_uid}</div></div><StatusChip value={result.quality.overall} /></div>
                <dl className="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    ["Patient ID", result.metadata.patient_id],
                    ["Patient", result.metadata.patient_name],
                    ["Modality", result.metadata.modality],
                    ["Study Date", result.metadata.study_date],
                    ["Study", result.metadata.study_description],
                    ["Series", result.metadata.series_description],
                    ["Resolution", result.metadata.rows && result.metadata.columns ? `${result.metadata.rows} × ${result.metadata.columns}` : null],
                    ["Manufacturer", result.metadata.manufacturer],
                    ["Study UID", result.metadata.study_instance_uid],
                  ].map(([label, value]) => <div key={String(label)}><dt className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{String(label)}</dt><dd className="mt-1 break-all text-sm text-slate-800">{value == null || value === "" ? "—" : String(value)}</dd></div>)}
                </dl>
                <div className="mt-5 border-t border-slate-100 pt-4"><div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Axiom Quality Gate</div><div className="space-y-2">{result.quality.checks.map((check) => <div key={check.name} className="grid gap-2 rounded-md bg-slate-50 px-3 py-2 text-sm sm:grid-cols-[160px_88px_1fr]"><span className="font-medium text-slate-800">{check.name}</span><StatusChip value={check.status} /><span className="text-slate-600">{check.message}</span></div>)}</div></div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
