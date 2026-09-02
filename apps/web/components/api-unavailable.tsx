import { ServerCrash } from "lucide-react";

export function ApiUnavailable({ detail }: { detail?: string }) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
      <div className="flex gap-4">
        <ServerCrash className="mt-0.5 text-amber-800" aria-hidden="true" />
        <div>
          <h2 className="font-semibold text-amber-950">Live backend data is unavailable</h2>
          <p className="mt-1 text-sm leading-6 text-amber-900">
            Axiom does not substitute demo metrics when the API is offline. Start the backend/Compose stack and refresh this page.
          </p>
          {detail ? <p className="mt-2 font-mono text-xs text-amber-800">{detail}</p> : null}
        </div>
      </div>
    </div>
  );
}
