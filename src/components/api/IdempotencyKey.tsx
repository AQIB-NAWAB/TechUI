"use client";

import { useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Key, Monitor, Server, CheckCircle2, RefreshCw } from "lucide-react";

export const IdempotencyKeySchema = z.object({
  endpoint: z.string().optional().default("POST /payments"),
  idempotencyKey: z.string().optional().default("pay_7f3a9c2b"),
  amount: z.number().optional().default(49.99),
  interactive: z.boolean().optional().default(true),
});

export type IdempotencyKeyProps = z.infer<typeof IdempotencyKeySchema>;

type RequestLog = {
  id: number;
  duplicate: boolean;
  status: number;
  result: string;
};

let _reqId = 0;

export function IdempotencyKey({
  endpoint = "POST /payments",
  idempotencyKey = "pay_7f3a9c2b",
  amount = 49.99,
  interactive = true,
}: IdempotencyKeyProps) {
  const [processed, setProcessed] = useState(false);
  const [cachedResponse, setCachedResponse] = useState<{ chargeId: string; amount: number } | null>(null);
  const [logs, setLogs] = useState<RequestLog[]>([]);
  const [animating, setAnimating] = useState(false);
  const [pulse, setPulse] = useState<"new" | "cached" | null>(null);

  function sendRequest() {
    if (animating) return;
    setAnimating(true);
    setPulse(null);

    const isDuplicate = processed;
    const id = ++_reqId;

    setTimeout(() => {
      if (!isDuplicate) {
        const chargeId = `ch_${Math.random().toString(36).slice(2, 10)}`;
        setCachedResponse({ chargeId, amount });
        setProcessed(true);
        setLogs((prev) => [
          { id, duplicate: false, status: 201, result: `Created charge ${chargeId}` },
          ...prev,
        ].slice(0, 6));
        setPulse("new");
      } else {
        setLogs((prev) => [
          {
            id,
            duplicate: true,
            status: 200,
            result: `Returned cached response — no second charge`,
          },
          ...prev,
        ].slice(0, 6));
        setPulse("cached");
      }
      setAnimating(false);
      setTimeout(() => setPulse(null), 1200);
    }, 1000);
  }

  function reset() {
    setProcessed(false);
    setCachedResponse(null);
    setLogs([]);
    setAnimating(false);
    setPulse(null);
  }

  const statusText = !processed
    ? "Send a payment request — the server will remember this key."
    : pulse === "cached"
    ? "Duplicate blocked — same key returned the original result."
    : "Key stored — resending with the same key won't charge twice.";

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="h-12 px-4 flex items-center gap-3 border-b border-zinc-200 dark:border-zinc-800">
        <Key className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex-1">Idempotency Key</span>
        <span
          className={cn(
            "text-[10px] font-semibold px-2 py-0.5 rounded-full transition-all duration-500",
            processed
              ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
          )}
        >
          {processed ? "● Key stored" : "No requests yet"}
        </span>
      </div>

      <div className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        Retry the same payment safely — the server recognizes duplicate requests and returns the original result.
      </div>

      <div className="min-h-[240px] px-4 py-4 flex flex-col gap-4">
        <div className="flex items-center justify-center gap-4">
          <div
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-lg border px-4 py-3 transition-all duration-500",
              animating ? "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/20" : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/40"
            )}
          >
            <Monitor className="size-5 text-zinc-500" />
            <span className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-400">Client</span>
          </div>

          <div className="flex-1 max-w-[120px] relative h-8">
            <div className="absolute inset-y-1/2 left-0 right-0 h-0.5 bg-zinc-200 dark:bg-zinc-700" />
            {animating && (
              <div
                className="absolute top-1/2 -translate-y-1/2 size-2.5 rounded-full bg-blue-500"
                style={{ animation: "travel 1s ease-in-out forwards" }}
              />
            )}
          </div>

          <div
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-lg border px-4 py-3 transition-all duration-500",
              pulse === "new"
                ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/20"
                : pulse === "cached"
                ? "border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/20"
                : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/40"
            )}
          >
            <Server className="size-5 text-zinc-500" />
            <span className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-400">API Server</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 p-3">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-1.5">Request</div>
            <div className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400">{endpoint}</div>
            <div className="mt-2 flex items-center gap-1.5">
              <Key className="size-3 text-amber-500" />
              <span className="text-[10px] font-mono text-zinc-700 dark:text-zinc-300 truncate">{idempotencyKey}</span>
            </div>
            <div className="mt-1 text-[10px] text-zinc-500">${amount.toFixed(2)}</div>
          </div>

          <div className="rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 p-3">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-1.5">Stored result</div>
            {cachedResponse ? (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 text-emerald-500" />
                  <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400">{cachedResponse.chargeId}</span>
                </div>
                <div className="text-[10px] text-zinc-500">Charged ${cachedResponse.amount.toFixed(2)} once</div>
              </div>
            ) : (
              <div className="text-[11px] text-zinc-400 italic">No charge yet</div>
            )}
          </div>
        </div>

        <div className="flex-1 min-h-[72px]">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-1.5">Request log</div>
          <div className="space-y-1.5">
            {logs.length === 0 && (
              <div className="text-[11px] text-zinc-400 italic">No requests sent yet</div>
            )}
            {logs.map((log) => (
              <div
                key={log.id}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[11px] border transition-all duration-500",
                  log.duplicate
                    ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400"
                    : "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400"
                )}
              >
                <span className="font-mono font-bold">{log.status}</span>
                <span>{log.result}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {interactive && (
        <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-3">
          <span className="text-[11px] text-zinc-500 flex-1">{statusText}</span>
          <button
            onClick={reset}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            title="Reset"
          >
            <RefreshCw className="size-3.5" />
          </button>
          <button
            onClick={sendRequest}
            disabled={animating}
            className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {processed ? "Retry Request" : "Send Request"}
          </button>
        </div>
      )}

      <style>{`
        @keyframes travel {
          from { left: 0; opacity: 1; }
          to { left: calc(100% - 10px); opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
