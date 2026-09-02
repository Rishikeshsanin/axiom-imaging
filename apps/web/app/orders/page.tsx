import { Clock3, ListChecks, Siren } from "lucide-react";
import { ApiUnavailable } from "@/components/api-unavailable";
import { CreateOrderForm, DispatchButton } from "@/components/order-actions";
import { PageHeader } from "@/components/page-header";
import { StatusChip } from "@/components/status-chip";
import { api, ApiUnavailableError } from "@/lib/api";

function priorityClass(priority: string) {
  if (priority === "EMERGENCY") return "border-rose-200 bg-rose-50 text-rose-800";
  if (priority === "URGENT") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

export default async function OrdersPage() {
  try {
    const [orders, patients] = await Promise.all([api.orders(), api.patients()]);
    const queued = orders.filter((item) => item.status === "ORDERED").length;
    const emergencies = orders.filter((item) => item.status === "ORDERED" && item.priority === "EMERGENCY").length;
    return (
      <>
        <PageHeader title="Imaging Orders" description="Persistent imaging requests with explicit priority, workflow state and scheduler ownership." action={<DispatchButton />} />
        <div className="mb-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4"><div className="flex items-center gap-3"><ListChecks className="text-cyan-800" size={19}/><span className="text-sm text-slate-600">Total orders</span></div><div className="mt-2 text-2xl font-semibold">{orders.length}</div></div>
          <div className="rounded-xl border border-slate-200 bg-white p-4"><div className="flex items-center gap-3"><Clock3 className="text-cyan-800" size={19}/><span className="text-sm text-slate-600">Waiting for scheduler</span></div><div className="mt-2 text-2xl font-semibold">{queued}</div></div>
          <div className="rounded-xl border border-slate-200 bg-white p-4"><div className="flex items-center gap-3"><Siren className="text-rose-700" size={19}/><span className="text-sm text-slate-600">Emergency waiting</span></div><div className="mt-2 text-2xl font-semibold">{emergencies}</div></div>
        </div>
        <CreateOrderForm patients={patients} />
        <section className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4"><h2 className="font-semibold text-slate-950">Order queue and history</h2><p className="mt-1 text-sm text-slate-600">Scheduler score is shown only while an order is waiting.</p></div>
          {orders.length === 0 ? <div className="p-8 text-sm text-slate-500">No imaging orders yet. Create the first request above.</div> : (
            <div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Patient</th><th className="px-4 py-3">Exam</th><th className="px-4 py-3">Priority</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Device</th><th className="px-4 py-3">Wait</th><th className="px-4 py-3">Score</th><th className="px-4 py-3">Requested by</th></tr></thead><tbody className="divide-y divide-slate-100">{orders.map((order) => <tr key={order.id}><td className="px-5 py-4"><div className="font-semibold text-slate-900">{order.patient_identifier}</div><div className="text-xs text-slate-500">{order.patient_display_name}</div></td><td className="px-4 py-4"><div className="font-semibold">{order.requested_modality} · {order.body_part || "Unspecified"}</div><div className="text-xs text-slate-500">{new Date(order.requested_at).toLocaleString()}</div></td><td className="px-4 py-4"><span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${priorityClass(order.priority)}`}>{order.priority}</span></td><td className="px-4 py-4"><StatusChip value={order.status}/></td><td className="px-4 py-4 font-mono text-xs">{order.scheduled_device_identifier || "—"}</td><td className="px-4 py-4">{order.wait_minutes.toFixed(1)} min</td><td className="px-4 py-4 font-mono text-xs">{order.scheduler_score ?? "—"}</td><td className="px-4 py-4">{order.requested_by}</td></tr>)}</tbody></table></div>
          )}
        </section>
      </>
    );
  } catch (error) {
    return <><PageHeader title="Imaging Orders" description="Imaging request queue."/><ApiUnavailable detail={error instanceof ApiUnavailableError ? error.message : undefined}/></>;
  }
}
