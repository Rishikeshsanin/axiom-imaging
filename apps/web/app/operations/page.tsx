import { PageHeader } from "@/components/page-header";
import { OrderStatusAction } from "@/components/order-actions";
import { ApiUnavailable } from "@/components/api-unavailable";
import { StatusChip } from "@/components/status-chip";
import { api, ApiUnavailableError } from "@/lib/api";
import type { ImagingOrder } from "@/lib/types";

const columns = ["ORDERED", "SCHEDULED", "IN_PROGRESS", "PROCESSING", "COMPLETED", "ERROR"] as const;
const nextAction: Record<string, { status: string; label: string } | undefined> = {
  SCHEDULED: { status: "IN_PROGRESS", label: "Start exam" },
  IN_PROGRESS: { status: "PROCESSING", label: "Begin processing" },
  PROCESSING: { status: "COMPLETED", label: "Complete" },
  ERROR: { status: "ORDERED", label: "Retry" },
};

function Card({ order }: { order: ImagingOrder }) {
  const action = nextAction[order.status];
  return <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><div className="font-semibold text-slate-950">{order.patient_identifier}</div><div className="text-xs text-slate-500">{order.patient_display_name}</div></div><StatusChip value={order.priority}/></div><div className="mt-3 text-sm font-semibold text-slate-800">{order.requested_modality} · {order.body_part || "Unspecified"}</div><div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-500"><span>Wait {order.wait_minutes.toFixed(0)}m</span><span className="text-right">{order.scheduled_device_identifier || "Unassigned"}</span></div>{action && <div className="mt-3"><OrderStatusAction orderId={order.id} status={action.status} label={action.label}/></div>}</article>;
}

export default async function OperationsPage() {
  try {
    const orders = await api.orders();
    return <><PageHeader title="Operations Workflow" description="Backend-owned imaging workflow states. Actions perform validated state transitions rather than cosmetic drag-and-drop."/><div className="grid gap-4 xl:grid-cols-3 2xl:grid-cols-6">{columns.map((state) => { const items = orders.filter((o) => o.status === state); return <section key={state} className="min-h-72 rounded-xl border border-slate-200 bg-slate-100/70 p-3"><div className="mb-3 flex items-center justify-between"><h2 className="text-xs font-bold uppercase tracking-wide text-slate-600">{state.replace("_", " ")}</h2><span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-500">{items.length}</span></div><div className="space-y-3">{items.map((order) => <Card key={order.id} order={order}/>)}{items.length === 0 && <div className="rounded-lg border border-dashed border-slate-300 p-5 text-center text-xs text-slate-400">No work in this state</div>}</div></section>; })}</div></>;
  } catch (error) { return <><PageHeader title="Operations Workflow" description="Imaging workflow board."/><ApiUnavailable detail={error instanceof ApiUnavailableError ? error.message : undefined}/></>; }
}
