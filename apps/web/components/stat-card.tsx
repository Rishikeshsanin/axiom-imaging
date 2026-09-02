import type { LucideIcon } from "lucide-react";

export function StatCard({ label, value, icon: Icon, note }: { label: string; value: string | number; icon: LucideIcon; note?: string }) {
  return (
    <div className="group rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-slate-950">{value}</p>
        </div>
        <div className="rounded-xl border border-cyan-100 bg-cyan-50 p-2.5 text-cyan-800 transition group-hover:bg-cyan-100/70"><Icon size={19} aria-hidden="true" /></div>
      </div>
      {note ? <p className="mt-3 text-xs leading-5 text-slate-500">{note}</p> : null}
    </div>
  );
}
