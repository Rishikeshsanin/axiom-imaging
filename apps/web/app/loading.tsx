export default function Loading() {
  return (
    <div aria-live="polite" className="space-y-5">
      <div className="h-8 w-72 animate-pulse rounded bg-slate-200" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => <div key={index} className="h-28 animate-pulse rounded-xl border border-slate-200 bg-slate-100" />)}
      </div>
      <div className="h-72 animate-pulse rounded-xl border border-slate-200 bg-slate-100" />
      <span className="sr-only">Loading Axiom Imaging data</span>
    </div>
  );
}
