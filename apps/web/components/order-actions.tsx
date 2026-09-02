"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function parseError(response: Response) {
  try {
    const body = await response.json();
    return body?.error?.message || `Request failed (${response.status})`;
  } catch {
    return `Request failed (${response.status})`;
  }
}

export function CreateOrderForm({ patients }: { patients: Array<{ id: string; patient_identifier: string; display_name: string }> }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(formData: FormData) {
    setBusy(true);
    setMessage(null);
    const payload = {
      patient_id: String(formData.get("patient_id") || ""),
      requested_modality: String(formData.get("requested_modality") || "CT"),
      body_part: String(formData.get("body_part") || "") || null,
      priority: String(formData.get("priority") || "ROUTINE"),
      requested_by: String(formData.get("requested_by") || "demo-technician"),
      notes: String(formData.get("notes") || "") || null,
    };
    try {
      const response = await fetch(`${apiUrl}/api/orders`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(await parseError(response));
      setMessage("Imaging order created and added to the scheduler queue.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create order.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form action={submit} className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 md:grid-cols-2 xl:grid-cols-6">
      <label className="text-sm font-medium text-slate-700 xl:col-span-2">Patient
        <select name="patient_id" required className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5">
          <option value="">Select patient</option>
          {patients.map((p) => <option key={p.id} value={p.id}>{p.patient_identifier} · {p.display_name}</option>)}
        </select>
      </label>
      <label className="text-sm font-medium text-slate-700">Modality
        <select name="requested_modality" className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5">
          <option value="CT">CT</option><option value="MR">MRI</option><option value="XR">X-Ray</option>
        </select>
      </label>
      <label className="text-sm font-medium text-slate-700">Body part
        <input name="body_part" placeholder="HEAD" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5" />
      </label>
      <label className="text-sm font-medium text-slate-700">Priority
        <select name="priority" className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5">
          <option value="ROUTINE">Routine</option><option value="URGENT">Urgent</option><option value="EMERGENCY">Emergency</option>
        </select>
      </label>
      <label className="text-sm font-medium text-slate-700">Requested by
        <input name="requested_by" defaultValue="demo-technician" required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5" />
      </label>
      <label className="text-sm font-medium text-slate-700 md:col-span-2 xl:col-span-5">Notes
        <input name="notes" placeholder="Optional operational note" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5" />
      </label>
      <div className="flex items-end"><button disabled={busy || patients.length === 0} className="w-full rounded-lg bg-cyan-800 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Creating…" : "Create order"}</button></div>
      {message && <p className="text-sm text-slate-600 md:col-span-2 xl:col-span-6" role="status">{message}</p>}
    </form>
  );
}

export function DispatchButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  async function dispatch() {
    setBusy(true); setMessage(null);
    try {
      const response = await fetch(`${apiUrl}/api/scheduler/dispatch`, { method: "POST" });
      if (!response.ok) throw new Error(await parseError(response));
      const result = await response.json();
      setMessage(`Scheduled ${result.order.patient_identifier} on ${result.device_identifier}.`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Scheduler failed.");
    } finally { setBusy(false); }
  }
  return <div className="flex flex-col items-end gap-2"><button onClick={dispatch} disabled={busy} className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Scheduling…" : "Dispatch next order"}</button>{message && <span className="max-w-md text-right text-xs text-slate-600">{message}</span>}</div>;
}

export function OrderStatusAction({ orderId, status, label }: { orderId: string; status: string; label: string }) {
  const router = useRouter(); const [busy, setBusy] = useState(false);
  async function update() {
    setBusy(true);
    try {
      const response = await fetch(`${apiUrl}/api/orders/${encodeURIComponent(orderId)}/status`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status }) });
      if (!response.ok) throw new Error(await parseError(response));
      router.refresh();
    } catch (error) { window.alert(error instanceof Error ? error.message : "Status update failed."); }
    finally { setBusy(false); }
  }
  return <button onClick={update} disabled={busy} className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">{busy ? "…" : label}</button>;
}
