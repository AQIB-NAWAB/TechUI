"use client";

import { useState, useCallback } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Zap, ZapOff, RefreshCw, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

export const CircuitBreakerSchema = z.object({
  name: z.string().optional().default("Payment Service"),
  failureThreshold: z.number().int().min(1).max(20).optional().default(5),
  successThreshold: z.number().int().min(1).max(10).optional().default(2),
  timeoutMs: z.number().optional().default(5000),
  interactive: z.boolean().optional().default(true),
});

export type CircuitBreakerProps = z.infer<typeof CircuitBreakerSchema>;

type CBState = "closed" | "open" | "half-open";
type RequestResult = "success" | "failure" | "rejected";

type RequestEntry = {
  id: number;
  result: RequestResult;
  ts: number;
};

let _reqId = 0;

const STATE_CFG: Record<CBState, {
  label: string;
  color: string;
  bg: string;
  ring: string;
  icon: React.ReactNode;
  wireIcon: React.ReactNode;
  description: string;
}> = {
  closed: {
    label: "CLOSED",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40",
    ring: "border-emerald-400 dark:border-emerald-600",
    icon: <CheckCircle2 className="size-4 text-emerald-500" />,
    wireIcon: <Zap className="size-5 text-emerald-500" />,
    description: "Circuit is healthy. Requests pass through normally.",
  },
  open: {
    label: "OPEN",
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40",
    ring: "border-red-400 dark:border-red-600",
    icon: <XCircle className="size-4 text-red-500" />,
    wireIcon: <ZapOff className="size-5 text-red-500" />,
    description: "Circuit is tripped. Requests are rejected immediately.",
  },
  "half-open": {
    label: "HALF-OPEN",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40",
    ring: "border-amber-400 dark:border-amber-600",
    icon: <AlertTriangle className="size-4 text-amber-500" />,
    wireIcon: <Zap className="size-5 text-amber-500" />,
    description: "Probing with limited traffic. Watching for recovery.",
  },
};

const RESULT_CFG: Record<RequestResult, { dot: string; label: string; text: string }> = {
  success:  { dot: "bg-emerald-500", label: "✓", text: "text-emerald-600 dark:text-emerald-400" },
  failure:  { dot: "bg-red-500",     label: "✗", text: "text-red-600 dark:text-red-400"         },
  rejected: { dot: "bg-zinc-400",    label: "⊘", text: "text-zinc-500 dark:text-zinc-500"       },
};

export function CircuitBreaker({
  name = "Payment Service",
  failureThreshold = 5,
  successThreshold = 2,
  timeoutMs = 5000,
  interactive = true,
}: CircuitBreakerProps) {
  const [state, setState] = useState<CBState>("closed");
  const [failures, setFailures] = useState(0);
  const [successes, setSuccesses] = useState(0);
  const [requests, setRequests] = useState<RequestEntry[]>([]);
  const [openAt, setOpenAt] = useState<number | null>(null);

  const pushRequest = useCallback((result: RequestResult) => {
    const entry: RequestEntry = { id: ++_reqId, result, ts: Date.now() };
    setRequests((prev) => [entry, ...prev].slice(0, 12));
  }, []);

  function sendSuccess() {
    if (state === "open") {
      const elapsed = Date.now() - (openAt ?? 0);
      if (elapsed >= timeoutMs) {
        setState("half-open");
        setSuccesses(0);
        setFailures(0);
      } else {
        pushRequest("rejected");
        return;
      }
    }

    pushRequest("success");

    if (state === "half-open") {
      const next = successes + 1;
      if (next >= successThreshold) {
        setState("closed");
        setSuccesses(0);
        setFailures(0);
      } else {
        setSuccesses(next);
      }
    } else {
      setFailures(0);
    }
  }

  function sendFailure() {
    if (state === "open") {
      const elapsed = Date.now() - (openAt ?? 0);
      if (elapsed >= timeoutMs) {
        setState("half-open");
        setSuccesses(0);
        setFailures(1);
        pushRequest("failure");
        return;
      }
      pushRequest("rejected");
      return;
    }

    pushRequest("failure");

    const next = failures + 1;
    if (next >= failureThreshold || state === "half-open") {
      setState("open");
      setOpenAt(Date.now());
      setFailures(0);
      setSuccesses(0);
    } else {
      setFailures(next);
    }
  }

  function reset() {
    setState("closed");
    setFailures(0);
    setSuccesses(0);
    setRequests([]);
    setOpenAt(null);
  }

  function tripOpen() {
    setState("open");
    setOpenAt(Date.now());
    setFailures(0);
    setSuccesses(0);
  }

  function forceHalfOpen() {
    setState("half-open");
    setSuccesses(0);
    setFailures(0);
  }

  const cfg = STATE_CFG[state];
  const progress = state === "closed"
    ? (failures / failureThreshold) * 100
    : state === "half-open"
    ? (successes / successThreshold) * 100
    : 100;

  const progressColor = state === "closed"
    ? failures > 0 ? "bg-red-500" : "bg-emerald-500"
    : state === "half-open"
    ? "bg-amber-500"
    : "bg-red-500";

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/50">
        <Zap className="size-3.5 text-zinc-400 shrink-0" />
        <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex-1">{name}</span>
        <span className="text-[10px] text-zinc-400">
          failure_threshold={failureThreshold} · success_threshold={successThreshold}
        </span>
        {interactive && (
          <button onClick={reset} className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
            <RefreshCw className="size-3.5" />
          </button>
        )}
      </div>

      {/* Circuit visual + state card */}
      <div className="px-4 pt-4 pb-2 min-h-[220px]">
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="flex flex-col items-center gap-1">
            <div className="size-10 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center">
              <span className="text-[10px] font-semibold text-zinc-500">Client</span>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center relative max-w-[200px]">
            <svg viewBox="0 0 200 40" className="w-full h-10 transition-all duration-700">
              <line
                x1="10" y1="20" x2="85" y2="20"
                className={cn(
                  "transition-all duration-700",
                  state === "open" ? "stroke-red-300 dark:stroke-red-700" :
                  state === "half-open" ? "stroke-amber-400 dark:stroke-amber-600" :
                  "stroke-emerald-400 dark:stroke-emerald-600"
                )}
                strokeWidth="3"
                strokeDasharray={state === "half-open" ? "6 4" : undefined}
              />
              <line
                x1="115" y1="20" x2="190" y2="20"
                className={cn(
                  "transition-all duration-700",
                  state === "open" ? "stroke-red-300 dark:stroke-red-700" :
                  state === "half-open" ? "stroke-amber-400 dark:stroke-amber-600" :
                  "stroke-emerald-400 dark:stroke-emerald-600"
                )}
                strokeWidth="3"
                strokeDasharray={state === "half-open" ? "6 4" : undefined}
              />
              {state === "open" && (
                <>
                  <line x1="88" y1="12" x2="96" y2="28" className="stroke-red-500" strokeWidth="2" />
                  <line x1="96" y1="12" x2="88" y2="28" className="stroke-red-500" strokeWidth="2" />
                </>
              )}
            </svg>
            <div className={cn(
              "absolute left-1/2 -translate-x-1/2 size-10 rounded-full border-2 flex items-center justify-center transition-all duration-700 bg-white dark:bg-zinc-950",
              cfg.ring,
              state === "open" && "shadow-[0_0_12px_rgba(239,68,68,0.4)]"
            )}>
              {cfg.wireIcon}
            </div>
          </div>

          <div className="flex flex-col items-center gap-1">
            <div className="size-10 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center">
              <span className="text-[10px] font-semibold text-zinc-500 truncate max-w-[60px]">{name}</span>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 text-center mb-3 leading-relaxed">
          Closed = requests pass through · Open = all requests blocked · Half-Open = testing if service recovered
        </p>

        <div className={cn("rounded-lg border px-4 py-3 flex items-start gap-3 transition-all duration-700", cfg.bg)}>
          <div className={cn("mt-0.5 p-1.5 rounded-full border transition-all duration-700", cfg.ring, "bg-white dark:bg-zinc-950 shrink-0")}>
            {cfg.icon}
          </div>
          <div>
            <div className={cn("text-sm font-bold tracking-wide transition-colors duration-700", cfg.color)}>{cfg.label}</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{cfg.description}</div>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-4 pb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
            {state === "closed"
              ? `Failure count: ${failures}/${failureThreshold}`
              : state === "half-open"
              ? `Recovery probes: ${successes}/${successThreshold}`
              : `Circuit open · timeout ${timeoutMs / 1000}s`}
          </span>
          <span className="text-[10px] font-mono text-zinc-400">{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-700", progressColor)}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Controls */}
      {interactive && (
        <div className="px-4 pb-3 flex items-center gap-2 flex-wrap">
          <button
            onClick={sendSuccess}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
          >
            <CheckCircle2 className="size-3.5" />
            Send Success
          </button>
          <button
            onClick={sendFailure}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors"
          >
            <XCircle className="size-3.5" />
            Send Failure
          </button>
          {state === "closed" && (
            <button
              onClick={tripOpen}
              className="px-3 py-1.5 rounded-md bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 text-xs font-medium transition-colors ml-auto"
            >
              Force Open
            </button>
          )}
          {state === "open" && (
            <button
              onClick={forceHalfOpen}
              className="px-3 py-1.5 rounded-md bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 text-xs font-medium transition-colors ml-auto"
            >
              Skip Timeout
            </button>
          )}
        </div>
      )}

      {/* Request log */}
      {requests.length > 0 && (
        <div className="border-t border-zinc-50 dark:border-zinc-900 px-4 py-2">
          <div className="text-[10px] font-semibold text-zinc-400 mb-2 uppercase tracking-wide">Recent Requests</div>
          <div className="flex flex-wrap gap-1.5">
            {requests.map((r) => {
              const rc = RESULT_CFG[r.result];
              return (
                <span
                  key={r.id}
                  title={r.result}
                  className={cn("size-5 rounded flex items-center justify-center text-[11px] font-bold", rc.dot, "text-white")}
                >
                  {rc.label}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* How to use hint */}
      {interactive && (
        <div className="border-t border-zinc-50 dark:border-zinc-900 px-4 py-2 bg-zinc-50/50 dark:bg-zinc-900/20">
          <p className="text-[10px] text-zinc-400">
            <span className="font-semibold">How it works:</span> Send Failures until the threshold is reached — the circuit trips OPEN and blocks all requests. After the timeout, it enters HALF-OPEN to test recovery.
          </p>
        </div>
      )}

      {/* State machine diagram */}
      <div className="border-t border-zinc-50 dark:border-zinc-900 px-4 py-3">
        <div className="flex items-center justify-between text-[10px] font-mono">
          {(["closed", "open", "half-open"] as CBState[]).map((s, i) => {
            const c = STATE_CFG[s];
            const active = state === s;
            return (
              <div key={s} className="flex items-center gap-1.5">
                <span className={cn(
                  "px-2 py-0.5 rounded-full border font-semibold transition-all",
                  active
                    ? cn(c.color, "border-current bg-current/10 transition-all duration-700")
                    : "text-zinc-400 dark:text-zinc-600 border-zinc-200 dark:border-zinc-800 transition-all duration-500"
                )}>
                  {c.label}
                </span>
                {i < 2 && <span className="text-zinc-300 dark:text-zinc-700">→</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
