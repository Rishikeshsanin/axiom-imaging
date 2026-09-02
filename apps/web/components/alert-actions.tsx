"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function AlertAction({ alertId, status, label }: { alertId: string; status: "ACKNOWLEDGED" | "RESOLVED"; label: string }) {
  const router = useRouter(); const [busy, setBusy] = useState(false);
  async function update() {
    setBusy(true);
    try {
      const response = await fetch(`${apiUrl}/api/alerts/${encodeURIComponent(alertId)}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status }) });
      if (!response.ok) throw new Error(`Request failed (${response.status})`);
      router.refresh();
    } catch (error) { window.alert(error instanceof Error ? error.message : "Alert update failed."); }
    finally { setBusy(false); }
  }
  return <button onClick={update} disabled={busy} className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">{busy ? "…" : label}</button>;
}
