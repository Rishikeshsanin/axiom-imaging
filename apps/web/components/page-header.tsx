import type { ReactNode } from "react";

export function PageHeader({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="mb-7 flex flex-col gap-4 border-b border-slate-200/90 pb-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        <div className="mb-2 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-600" aria-hidden="true" />
          <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-teal-700">Axiom Imaging</p>
        </div>
        <h1 className="text-3xl font-semibold tracking-[-0.025em] text-slate-950 md:text-[2rem]">{title}</h1>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">{description}</p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
