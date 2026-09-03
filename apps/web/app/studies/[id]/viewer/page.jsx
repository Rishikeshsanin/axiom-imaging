"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, LoaderCircle, ShieldCheck } from "lucide-react";
import { useParams } from "next/navigation";
import * as dicomParser from "dicom-parser";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const UNCOMPRESSED = new Set([
  "1.2.840.10008.1.2",
  "1.2.840.10008.1.2.1",
]);

function numericValue(dataSet, tag, fallback = null) {
  const raw = dataSet.string(tag);
  if (!raw) return fallback;
  const value = Number(String(raw).split("\\")[0]);
  return Number.isFinite(value) ? value : fallback;
}

function drawDicom(canvas, bytes) {
  const dataSet = dicomParser.parseDicom(bytes);
  const transferSyntax = dataSet.string("x00020010") || "1.2.840.10008.1.2";
  if (!UNCOMPRESSED.has(transferSyntax)) {
    throw new Error("This hosted viewer supports uncompressed little-endian DICOM. Use the local Orthanc/OHIF deployment for compressed transfer syntaxes.");
  }

  const rows = dataSet.uint16("x00280010");
  const columns = dataSet.uint16("x00280011");
  const bitsAllocated = dataSet.uint16("x00280100") || 16;
  const pixelRepresentation = dataSet.uint16("x00280103") || 0;
  const samplesPerPixel = dataSet.uint16("x00280002") || 1;
  const photometric = dataSet.string("x00280004") || "MONOCHROME2";
  const pixelElement = dataSet.elements.x7fe00010;

  if (!rows || !columns || !pixelElement) throw new Error("Pixel data is unavailable in this DICOM instance.");
  if (samplesPerPixel !== 1) throw new Error("The hosted viewer currently supports single-channel grayscale DICOM only.");
  if (bitsAllocated !== 8 && bitsAllocated !== 16) throw new Error(`Unsupported pixel depth: ${bitsAllocated}-bit.`);

  const count = rows * columns;
  const offset = dataSet.byteArray.byteOffset + pixelElement.dataOffset;
  const buffer = dataSet.byteArray.buffer;
  let pixels;
  if (bitsAllocated === 8) {
    pixels = pixelRepresentation === 1
      ? new Int8Array(buffer, offset, count)
      : new Uint8Array(buffer, offset, count);
  } else {
    pixels = pixelRepresentation === 1
      ? new Int16Array(buffer, offset, count)
      : new Uint16Array(buffer, offset, count);
  }

  const slope = numericValue(dataSet, "x00281053", 1) || 1;
  const intercept = numericValue(dataSet, "x00281052", 0) || 0;
  let center = numericValue(dataSet, "x00281050");
  let width = numericValue(dataSet, "x00281051");

  if (center == null || width == null || width <= 1) {
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < pixels.length; i += 1) {
      const value = pixels[i] * slope + intercept;
      if (value < min) min = value;
      if (value > max) max = value;
    }
    center = (min + max) / 2;
    width = Math.max(2, max - min);
  }

  canvas.width = columns;
  canvas.height = rows;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas rendering is unavailable in this browser.");
  const image = ctx.createImageData(columns, rows);
  const low = center - width / 2;
  const high = center + width / 2;
  const invert = photometric === "MONOCHROME1";

  for (let i = 0; i < count; i += 1) {
    const value = pixels[i] * slope + intercept;
    let gray = value <= low ? 0 : value >= high ? 255 : Math.round(((value - low) / (high - low)) * 255);
    if (invert) gray = 255 - gray;
    const j = i * 4;
    image.data[j] = gray;
    image.data[j + 1] = gray;
    image.data[j + 2] = gray;
    image.data[j + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);

  return {
    rows,
    columns,
    modality: dataSet.string("x00080060") || "—",
    instanceNumber: dataSet.string("x00200013") || "—",
    transferSyntax,
    windowCenter: center,
    windowWidth: width,
  };
}

export default function HostedDicomViewerPage() {
  const params = useParams();
  const studyId = Array.isArray(params.id) ? params.id[0] : params.id;
  const canvasRef = useRef(null);
  const [instances, setInstances] = useState([]);
  const [index, setIndex] = useState(0);
  const [study, setStudy] = useState(null);
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sliceLoading, setSliceLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!studyId) return;
    let cancelled = false;
    async function loadStudy() {
      await Promise.resolve();
      if (cancelled) return;
      setLoading(true);
      setError(null);
      try {
        const [studyResponse, instanceResponse] = await Promise.all([
          fetch(`${API}/api/studies/${encodeURIComponent(studyId)}`, { cache: "no-store" }),
          fetch(`${API}/api/studies/${encodeURIComponent(studyId)}/instances`, { cache: "no-store" }),
        ]);
        if (!studyResponse.ok || !instanceResponse.ok) throw new Error("Could not load the hosted study.");
        const nextStudy = await studyResponse.json();
        const nextInstances = await instanceResponse.json();
        if (!cancelled) {
          setStudy(nextStudy);
          setInstances(nextInstances);
          setIndex(0);
        }
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Could not load study.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadStudy();
    return () => { cancelled = true; };
  }, [studyId]);

  const current = instances[index];
  useEffect(() => {
    if (!current || !canvasRef.current) return;
    let cancelled = false;
    async function loadSlice() {
      await Promise.resolve();
      if (cancelled) return;
      setSliceLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API}/api/instances/${encodeURIComponent(current.id)}/dicom`, { cache: "no-store" });
        if (!response.ok) throw new Error(`DICOM instance request failed (${response.status}).`);
        const bytes = new Uint8Array(await response.arrayBuffer());
        if (!cancelled && canvasRef.current) setInfo(drawDicom(canvasRef.current, bytes));
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Could not render DICOM slice.");
      } finally {
        if (!cancelled) setSliceLoading(false);
      }
    }
    loadSlice();
    return () => { cancelled = true; };
  }, [current]);

  const title = useMemo(() => study?.study_description || "Hosted DICOM viewer", [study]);

  if (loading) {
    return <div className="grid min-h-[65vh] place-items-center"><div className="flex items-center gap-2 text-sm text-slate-600"><LoaderCircle className="animate-spin" size={18} />Loading hosted study…</div></div>;
  }

  return (
    <div className="space-y-5">
      <header className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-cyan-800"><ShieldCheck size={15} />Hosted research viewer</div>
            <h1 className="mt-2 text-2xl font-bold text-slate-950">{title}</h1>
            <p className="mt-1 text-sm text-slate-600">{study ? `${study.patient_identifier} · ${study.modality || "Imaging"}` : "Axiom Imaging"}</p>
          </div>
          <div className="max-w-xl rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-950">Research and education only. Upload synthetic or de-identified DICOM only. This viewer is not intended for diagnosis or clinical use. The full local deployment uses Orthanc/OHIF.</div>
        </div>
      </header>

      {error ? <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">{error}</div> : null}

      {instances.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-600">No hosted pixel instances are stored for this seeded metadata-only study. Upload a synthetic/de-identified DICOM study to use the viewer.</div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
          <section className="relative grid min-h-[560px] place-items-center overflow-hidden rounded-xl bg-slate-950 p-4 shadow-inner">
            {sliceLoading ? <div className="absolute right-4 top-4 z-10 flex items-center gap-2 rounded-full bg-black/70 px-3 py-1.5 text-xs text-white"><LoaderCircle className="animate-spin" size={14} />Rendering</div> : null}
            <canvas ref={canvasRef} className="max-h-[72vh] max-w-full object-contain [image-rendering:auto]" aria-label={`DICOM slice ${index + 1}`} />
          </section>

          <aside className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Slice navigation</div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <button type="button" onClick={() => setIndex((value) => Math.max(0, value - 1))} disabled={index === 0} className="rounded-lg border border-slate-300 p-2 text-slate-700 disabled:opacity-30" aria-label="Previous slice"><ChevronLeft size={18} /></button>
              <span className="text-sm font-semibold text-slate-900">{index + 1} / {instances.length}</span>
              <button type="button" onClick={() => setIndex((value) => Math.min(instances.length - 1, value + 1))} disabled={index >= instances.length - 1} className="rounded-lg border border-slate-300 p-2 text-slate-700 disabled:opacity-30" aria-label="Next slice"><ChevronRight size={18} /></button>
            </div>
            <input className="mt-4 w-full accent-cyan-700" type="range" min="0" max={Math.max(0, instances.length - 1)} value={index} onChange={(event) => setIndex(Number(event.target.value))} aria-label="DICOM slice" />

            <dl className="mt-6 space-y-4 border-t border-slate-100 pt-5 text-sm">
              <div><dt className="text-xs font-bold uppercase text-slate-500">File</dt><dd className="mt-1 break-all text-slate-800">{current?.filename || "—"}</dd></div>
              <div><dt className="text-xs font-bold uppercase text-slate-500">Instance</dt><dd className="mt-1 text-slate-800">{info?.instanceNumber || current?.instance_number || "—"}</dd></div>
              <div><dt className="text-xs font-bold uppercase text-slate-500">Matrix</dt><dd className="mt-1 text-slate-800">{info ? `${info.columns} × ${info.rows}` : "—"}</dd></div>
              <div><dt className="text-xs font-bold uppercase text-slate-500">Modality</dt><dd className="mt-1 text-slate-800">{info?.modality || study?.modality || "—"}</dd></div>
              <div><dt className="text-xs font-bold uppercase text-slate-500">Window</dt><dd className="mt-1 text-slate-800">{info ? `${Math.round(info.windowCenter)} / ${Math.round(info.windowWidth)}` : "—"}</dd></div>
              <div><dt className="text-xs font-bold uppercase text-slate-500">Transfer syntax</dt><dd className="mt-1 break-all font-mono text-[11px] text-slate-700">{info?.transferSyntax || "—"}</dd></div>
            </dl>
          </aside>
        </div>
      )}
    </div>
  );
}
