const styles: Record<string, string> = {
  PASS: "bg-emerald-50 text-emerald-800 border-emerald-200",
  READY: "bg-emerald-50 text-emerald-800 border-emerald-200",
  ONLINE: "bg-emerald-50 text-emerald-800 border-emerald-200",
  COMPLETED: "bg-emerald-50 text-emerald-800 border-emerald-200",
  RESOLVED: "bg-emerald-50 text-emerald-800 border-emerald-200",
  REVIEW: "bg-amber-50 text-amber-800 border-amber-200",
  URGENT: "bg-amber-50 text-amber-800 border-amber-200",
  ACKNOWLEDGED: "bg-amber-50 text-amber-800 border-amber-200",
  VALIDATING: "bg-sky-50 text-sky-800 border-sky-200",
  INGESTING: "bg-sky-50 text-sky-800 border-sky-200",
  SCHEDULED: "bg-sky-50 text-sky-800 border-sky-200",
  IN_PROGRESS: "bg-sky-50 text-sky-800 border-sky-200",
  PROCESSING: "bg-violet-50 text-violet-800 border-violet-200",
  RESERVED: "bg-violet-50 text-violet-800 border-violet-200",
  SCANNING: "bg-violet-50 text-violet-800 border-violet-200",
  EMERGENCY: "bg-rose-50 text-rose-800 border-rose-200",
  CRITICAL: "bg-rose-50 text-rose-800 border-rose-200",
  FAULT: "bg-rose-50 text-rose-800 border-rose-200",
  FAIL: "bg-rose-50 text-rose-800 border-rose-200",
  ERROR: "bg-rose-50 text-rose-800 border-rose-200",
  OFFLINE: "bg-slate-100 text-slate-700 border-slate-200",
  ORDERED: "bg-slate-50 text-slate-700 border-slate-200",
  ROUTINE: "bg-slate-50 text-slate-700 border-slate-200",
  OPEN: "bg-slate-50 text-slate-700 border-slate-200",
};

export function StatusChip({ value }: { value: string }) {
  const key = value.toUpperCase();
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[key] ?? "bg-slate-50 text-slate-700 border-slate-200"}`}>{key.replaceAll("_", " ")}</span>;
}
