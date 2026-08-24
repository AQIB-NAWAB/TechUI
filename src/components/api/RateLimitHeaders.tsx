"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Gauge, RefreshCw } from "lucide-react";

export const RateLimitHeadersSchema = z.object({
  name: z.string().optional().default("API Rate Limit Headers"),
  limit: z.number().int().min(1).max(20).optional().default(10),
  windowSeconds: z.number().optional().default(60),
  headerStyle: z.enum(["standard", "draft-6"]).optional().default("standard"),
  interactive: z.boolean().optional().default(true),
});

export type RateLimitHeadersProps = z.infer<typeof RateLimitHeadersSchema>;

type RequestEntry = { id: number; status: number; remaining: number; blocked: boolean };

let _reqId = 0;

function formatReset(seconds: number): string {
  const d = new Date(Date.now() + seconds * 1000);
  return d.toUTCString();
}

export function RateLimitHeaders({
  name = "API Rate Limit Headers",
  limit = 10,
  windowSeconds = 60,
  headerStyle = "standard",
  interactive = true,
}: RateLimitHeadersProps) {
  const [remaining, setRemaining] = useState(limit);
  const [resetIn, setResetIn] = useState(windowSeconds);
  const [history, setHistory] = useState<RequestEntry[]>([]);
  const [flash, setFlash] = useState<"ok" | "limited" | null>(null);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (!interactive) return;
    const id = setInterval(() => {
      setResetIn((s) => {
        if (s <= 1) {
          setRemaining(limit);
          return windowSeconds;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [limit, windowSeconds, interactive]);

  function makeRequest() {
    const blocked = remaining <= 0;
    const id = ++_reqId;
    const status = blocked ? 429 : 200;
    const newRemaining = blocked ? 0 : remaining - 1;

    setHistory((prev) => [
      { id, status, remaining: newRemaining, blocked },
      ...prev,
    ].slice(0, 8));

    if (blocked) {
      setFlash("limited");
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } else {
      setRemaining(newRemaining);
      setFlash("ok");
    }
    setTimeout(() => setFlash(null), 700);
  }

  function reset() {
    setRemaining(limit);
    setResetIn(windowSeconds);
    setHistory([]);
    setFlash(null);
    setShake(false);
  }

  const retryAfter = Math.min(resetIn, 30);
  const fillPct = (remaining / limit) * 100;

  const headers: Array<{ key: string; value: string; highlight?: boolean }> = headerStyle === "standard"
    ? [
        { key: "X-RateLimit-Limit", value: String(limit) },
        { key: "X-RateLimit-Remaining", value: String(remaining), highlight: true },
        { key: "X-RateLimit-Reset", value: String(Math.floor(Date.now() / 1000) + resetIn) },
        ...(remaining <= 0 ? [{ key: "Retry-After", value: String(retryAfter), highlight: true }] : []),
      ]
    : [
        { key: "RateLimit-Limit", value: String(limit) },
        { key: "RateLimit-Remaining", value: String(remaining), highlight: true },
        { key: "RateLimit-Reset", value: formatReset(resetIn) },
        ...(remaining <= 0 ? [{ key: "Retry-After", value: String(retryAfter), highlight: true }] : []),
      ];

  const statusCode = remaining <= 0 && flash === "limited" ? 429 : flash === "ok" ? 200 : remaining <= 0 ? 429 : 200;

  return (
    <>
      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20% { transform: translateX(-4px); }
          40% { transform: translateX(4px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
      `}</style>
      <div className={cn(
        "rounded-xl border bg-white dark:bg-zinc-950 overflow-hidden transition-all duration-500",
        flash === "limited" ? "border-red-300 dark:border-red-800" : "border-zinc-200 dark:border-zinc-800"
      )}>
        <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/50">
          <Gauge className="size-4 text-zinc-400 shrink-0" />
          <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">{name}</span>
          <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">{headerStyle}</span>
          {interactive && (
            <button onClick={reset} className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all duration-500">
              <RefreshCw className="size-3.5" />
            </button>
          )}
        </div>

        <div className="p-4 min-h-[240px] flex gap-5 items-start">
          {/* Remaining gauge */}
          <div className="flex flex-col items-center gap-2 shrink-0">
            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide">Remaining</span>
            <div
              className={cn(
                "relative w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all duration-500",
                remaining <= 0 ? "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/20" : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900"
              )}
              style={shake ? { animation: "shake 0.4s ease-in-out" } : undefined}
            >
              <span className={cn(
                "text-lg font-bold font-mono",
                remaining <= 0 ? "text-red-600 dark:text-red-400" : "text-zinc-700 dark:text-zinc-300"
              )}>
                {remaining}
              </span>
            </div>
            <span className="text-[10px] font-mono text-zinc-400">of {limit}</span>
          </div>

          <div className="flex-1 min-w-0 space-y-3">
            {/* Response status */}
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-xs font-bold font-mono px-2 py-0.5 rounded",
                statusCode === 429
                  ? "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400"
                  : "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
              )}>
                {statusCode === 429 ? "429 Too Many Requests" : "200 OK"}
              </span>
              <span className="text-[10px] text-zinc-400">Resets in {resetIn}s</span>
            </div>

            {/* Headers panel */}
            <div className="rounded-lg border border-zinc-100 dark:border-zinc-800 overflow-hidden">
              <div className="px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-[10px] font-semibold text-zinc-400 uppercase tracking-wide">
                Response Headers
              </div>
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {headers.map((h) => (
                  <div
                    key={h.key}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 text-[11px] font-mono transition-all duration-500",
                      h.highlight && "bg-amber-50 dark:bg-amber-950/20"
                    )}
                  >
                    <span className="text-violet-600 dark:text-violet-400 shrink-0">{h.key}:</span>
                    <span className="text-zinc-700 dark:text-zinc-300 truncate">{h.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Fill bar */}
            <div>
              <div className="flex justify-between text-[10px] mb-1">
                <span className="text-zinc-400">Quota used</span>
                <span className="font-mono text-zinc-500">{limit - remaining}/{limit}</span>
              </div>
              <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    fillPct > 30 ? "bg-emerald-500" : fillPct > 0 ? "bg-amber-500" : "bg-red-500"
                  )}
                  style={{ width: `${100 - fillPct}%` }}
                />
              </div>
            </div>

            {/* History dots */}
            <div>
              <div className="text-[10px] text-zinc-400 mb-1.5">Request history</div>
              <div className="flex gap-1.5 items-center">
                {history.length === 0 && (
                  <span className="text-[10px] text-zinc-400">No requests yet</span>
                )}
                {history.map((req) => (
                  <span
                    key={req.id}
                    title={req.blocked ? "429 Rate limited" : `200 OK — ${req.remaining} remaining`}
                    className={cn(
                      "size-3.5 rounded-full",
                      req.blocked ? "bg-red-500" : "bg-emerald-500"
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {interactive && (
          <div className="border-t border-zinc-100 dark:border-zinc-900 px-4 py-3 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/30">
            <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">
              {flash === "limited"
                ? "Rate limited — check Retry-After header before retrying."
                : "Each request decrements X-RateLimit-Remaining. Quota resets when the window expires."}
            </span>
            <button
              onClick={makeRequest}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-500 shrink-0 hover:opacity-90",
                flash === "limited"
                  ? "bg-red-500 text-white"
                  : "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
              )}
            >
              Make Request
            </button>
          </div>
        )}
      </div>
    </>
  );
}
