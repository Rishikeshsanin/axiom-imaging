"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function DeviceActions({ deviceId, faulted }: { deviceId: string; faulted: boolean }) {
  const router = useRouter(); const [busy, setBusy] = useState(false);
  async function call(path: string, body?: object) {
    setBusy(true);
    try {
      const response = await fetch(`${apiUrl}/api/devices/${encodeURIComponent(deviceId)}/${path}`, { method: "POST", headers: body ? { "content-type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error?.message || `Request failed (${response.status})`);
      }
      router.refresh();
    } catch (error) { window.alert(error instanceof Error ? error.message : "Device command failed."); }
    finally { setBusy(false); }
  }
  return faulted
    ? <button disabled={busy} onClick={() => call("recover")} className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">{busy ? "Recovering…" : "Recover"}</button>
    : <button disabled={busy} onClick={() => call("fault", { fault: "SCANNER_OVERHEAT" })} className="rounded-md border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-800">{busy ? "Injecting…" : "Inject test fault"}</button>;
}
