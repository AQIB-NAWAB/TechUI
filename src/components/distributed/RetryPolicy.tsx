"use client";

import { useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { RefreshCw, CheckCircle2, XCircle, Clock, AlertTriangle } from "lucide-react";

const BackoffEnum = z.enum(["fixed", "linear", "exponential", "exponential-jitter"]);

export const RetryPolicySchema = z.object({
  name: z.string().optional().default("HTTP Request Retry"),
  strategy: BackoffEnum.optional().default("exponential"),
  maxAttempts: z.number().int().min(1).max(10).optional().default(5),
  baseDelayMs: z.number().optional().default(500),
  maxDelayMs: z.number().optional().default(30000),
  multiplier: z.number().optional().default(2),
  jitter: z.boolean().optional().default(true),
  retryOn: z.array(z.string()).optional().default(["5xx", "timeout", "network_error"]),
  interactive: z.boolean().optional().default(true),
  successAt: z.number().optional(),
});

export type RetryPolicyProps = z.infer<typeof RetryPolicySchema>;

type AttemptState = "idle" | "pending" | "running" | "success" | "failure";

const FAILURE_MESSAGES = [
  "503 Service Unavailable",
  "timeout after 5s",
  "connection refused",
  "500 Internal Server Error",
  "502 Bad Gateway",
];

function computeDelay(
  attempt: number,
  strategy: string,
  baseMs: number,
  maxMs: number,
  multiplier: number,
  jitter: boolean
): number {
  let delay: number;
  if (strategy === "fixed") {
    delay = baseMs;
  } else if (strategy === "linear") {
    delay = baseMs * attempt;
  } else {
    delay = baseMs * Math.pow(multiplier, attempt - 1);
  }
  delay = Math.min(delay, maxMs);
  if (jitter && (strategy === "exponential" || strategy === "exponential-jitter")) {
    delay = delay * (0.5 + Math.random() * 0.5);
  }
  return Math.round(delay);
}

export function RetryPolicy({
  name = "HTTP Request Retry",
  strategy = "exponential",
  maxAttempts = 5,
  baseDelayMs = 500,
  maxDelayMs = 30000,
  multiplier = 2,
  jitter = true,
  retryOn = ["5xx", "timeout", "network_error"],
  interactive = true,
  successAt,
}: RetryPolicyProps) {
  const [states, setStates] = useState<AttemptState[]>(Array(maxAttempts).fill("idle"));
  const [failMessages, setFailMessages] = useState<(string | null)[]>(Array(maxAttempts).fill(null));
  const [running, setRunning] = useState(false);
  const [totalTime, setTotalTime] = useState<number | null>(null);
  const [successAttempt, setSuccessAttempt] = useState<number | null>(null);

  const delays = Array.from({ length: maxAttempts }, (_, i) =>
    computeDelay(i + 1, strategy, baseDelayMs, maxDelayMs, multiplier, false)
  );

  const maxDelay = Math.max(...delays);

  function simulate() {
    if (running) return;
    setRunning(true);
    setTotalTime(null);
    setSuccessAttempt(null);
    setStates(Array(maxAttempts).fill("idle"));
    setFailMessages(Array(maxAttempts).fill(null));

    const succeedAt = successAt ?? Math.floor(Math.random() * Math.min(maxAttempts, 3)) + 2;
    let elapsed = 0;
    let step = 0;

    function doStep() {
      if (step >= maxAttempts) {
        setRunning(false);
        setTotalTime(elapsed);
        return;
      }

      const current = step;
      setStates((prev) => {
        const next = [...prev];
        next[current] = "running";
        return next;
      });

      setTimeout(() => {
        const isSuccess = current + 1 >= succeedAt;
        const failMsg = FAILURE_MESSAGES[current % FAILURE_MESSAGES.length]!;
        elapsed += 100 + current * 80;

        setStates((prev) => {
          const next = [...prev];
          next[current] = isSuccess ? "success" : "failure";
          return next;
        });

        if (!isSuccess) {
          setFailMessages((prev) => {
            const next = [...prev];
            next[current] = failMsg;
            return next;
          });
        }

        if (isSuccess) {
          setSuccessAttempt(current + 1);
          setTotalTime(elapsed);
          setRunning(false);
          return;
        }

        step++;
        if (step >= maxAttempts) {
          setTotalTime(elapsed);
          setRunning(false);
          return;
        }

        const delay = delays[current] ?? baseDelayMs;
        elapsed += delay;
        setTimeout(doStep, 1200);
      }, 1200);
    }

    doStep();
  }

  function reset() {
    setStates(Array(maxAttempts).fill("idle"));
    setFailMessages(Array(maxAttempts).fill(null));
    setRunning(false);
    setTotalTime(null);
    setSuccessAttempt(null);
  }

  const lastDone = [...states].reverse().find((s) => s === "success" || s === "failure");
  const succeeded = successAttempt !== null;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/50">
        <RefreshCw className="size-3.5 text-zinc-400 shrink-0" />
        <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex-1">{name}</span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">{strategy}</span>
          <span className="text-[10px] text-zinc-400">{maxAttempts} max</span>
        </div>
        {interactive && (
          <button onClick={reset} className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
            <RefreshCw className="size-3.5" />
          </button>
        )}
      </div>

      {/* Vertical timeline */}
      <div className="px-6 py-4 min-h-[280px]">
        <div className="space-y-0">
          {Array.from({ length: maxAttempts }, (_, i) => {
            const state = states[i]!;
            const failMsg = failMessages[i];
            const isLast = i === maxAttempts - 1;
            const delay = delays[i] ?? baseDelayMs;
            const barWidth = Math.max(40, Math.round((delay / maxDelay) * 180));

            return (
              <div key={i} className="relative">
                {/* Attempt row */}
                <div className="flex items-start gap-3">
                  {/* Circle + vertical line */}
                  <div className="flex flex-col items-center shrink-0">
                    <div className={cn(
                      "size-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-500",
                      state === "idle" && "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950",
                      state === "pending" && "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950",
                      state === "running" && "border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-950/30",
                      state === "success" && "border-emerald-400 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30",
                      state === "failure" && "border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-950/30",
                    )}>
                      {state === "running" && <RefreshCw className="size-2.5 text-blue-500 animate-spin" />}
                      {state === "success" && <CheckCircle2 className="size-3 text-emerald-500" />}
                      {state === "failure" && <XCircle className="size-3 text-red-500" />}
                    </div>
                    {!isLast && (
                      <div className={cn(
                        "w-0.5 mt-1 transition-all duration-500",
                        state === "failure" || (i < maxAttempts - 1 && states[i + 1] !== "idle") ? "bg-zinc-300 dark:bg-zinc-700" : "bg-zinc-200 dark:bg-zinc-800",
                        "h-12"
                      )} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pb-2">
                    <div className="flex items-center gap-2 pt-0.5">
                      <span className={cn(
                        "text-xs font-semibold transition-colors duration-500",
                        state === "idle" || state === "pending" ? "text-zinc-400 dark:text-zinc-600" : "text-zinc-800 dark:text-zinc-200"
                      )}>
                        Attempt {i + 1}
                      </span>
                      {state === "running" && (
                        <span className="text-[10px] text-blue-500 font-medium">sending request…</span>
                      )}
                      {state === "success" && (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">✓ Success!</span>
                      )}
                    </div>
                    {failMsg && state === "failure" && (
                      <p className="text-[10px] text-red-500 dark:text-red-400 mt-0.5 font-mono">✗ {failMsg}</p>
                    )}
                  </div>
                </div>

                {/* Wait indicator between attempts */}
                {!isLast && state !== "idle" && state !== "running" && state !== "success" && (
                  <div className="flex items-center gap-2 ml-8 mb-1 mt-[-28px]">
                    <Clock className="size-2.5 text-amber-400 shrink-0" />
                    <span className="text-[9px] font-mono text-zinc-400">Wait {formatMs(delay)}</span>
                    <div
                      className={cn(
                        "h-0.5 rounded-full transition-all duration-500",
                        state === "failure" ? "bg-amber-300 dark:bg-amber-700" : "bg-zinc-200 dark:bg-zinc-800"
                      )}
                      style={{ width: barWidth }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Config row */}
      <div className="border-t border-zinc-100 dark:border-zinc-900 px-4 py-2.5 flex items-center gap-4 flex-wrap text-[10px] bg-zinc-50/50 dark:bg-zinc-900/20">
        <div>
          <span className="text-zinc-400">base </span>
          <span className="font-mono font-semibold text-zinc-600 dark:text-zinc-400">{formatMs(baseDelayMs)}</span>
        </div>
        <div>
          <span className="text-zinc-400">max </span>
          <span className="font-mono font-semibold text-zinc-600 dark:text-zinc-400">{formatMs(maxDelayMs)}</span>
        </div>
        {strategy.startsWith("exponential") && (
          <div>
            <span className="text-zinc-400">×</span>
            <span className="font-mono font-semibold text-zinc-600 dark:text-zinc-400">{multiplier}</span>
          </div>
        )}
        {jitter && <span className="text-amber-600 dark:text-amber-400 font-semibold">+ jitter</span>}
        <div className="flex flex-wrap gap-1 ml-auto">
          {retryOn.map((r) => (
            <span key={r} className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded text-[9px] font-semibold">{r}</span>
          ))}
        </div>
      </div>

      {/* Result + simulate button */}
      <div className="border-t border-zinc-100 dark:border-zinc-900 px-4 py-2.5 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/30 min-h-[52px]">
        <div className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-semibold flex-1 transition-all duration-500",
          totalTime !== null
            ? succeeded
              ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
              : "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
            : "opacity-0 border border-transparent"
        )}>
          {totalTime !== null && (
            <>
              {succeeded ? <CheckCircle2 className="size-3.5 shrink-0" /> : <AlertTriangle className="size-3.5 shrink-0" />}
              {succeeded
                ? `✓ Succeeded on attempt ${successAttempt} (${formatMs(Math.round(totalTime))} total)`
                : `✗ Exhausted all ${maxAttempts} attempts`
              }
            </>
          )}
        </div>
        {interactive && (
          <button
            onClick={simulate}
            disabled={running}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={cn("size-3", running && "animate-spin")} />
            {running ? "Running…" : "Simulate"}
          </button>
        )}
      </div>
    </div>
  );
}

function formatMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms / 60000)}m`;
}
