"use client";

import { useState, useEffect, useRef } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Database, RefreshCw, AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react";

export const DeadlockDetectionSchema = z.object({
  title: z.string().optional().default("Deadlock Detection"),
  databaseEngine: z.enum(["postgres", "mysql", "sqlserver"]).optional().default("postgres"),
  interactive: z.boolean().optional().default(true),
});

export type DeadlockDetectionProps = z.infer<typeof DeadlockDetectionSchema>;

type TxState = "idle" | "running" | "waiting" | "victim" | "committed";

type Step = {
  txA: { action: string; lock: string | null; state: TxState };
  txB: { action: string; lock: string | null; state: TxState };
  edge?: "A→B" | "B→A" | "cycle";
  note: string;
};

const STEPS: Step[] = [
  {
    txA: { action: "BEGIN", lock: null, state: "running" },
    txB: { action: "BEGIN", lock: null, state: "running" },
    note: "Two transactions start at the same time.",
  },
  {
    txA: { action: "UPDATE accounts SET … WHERE id=1", lock: "Row 1", state: "running" },
    txB: { action: "UPDATE orders SET … WHERE id=10", lock: "Row 10", state: "running" },
    note: "Each transaction grabs its first row lock — no conflict yet.",
  },
  {
    txA: { action: "UPDATE orders SET … WHERE id=10", lock: "Row 1", state: "waiting" },
    txB: { action: "UPDATE accounts SET … WHERE id=1", lock: "Row 10", state: "waiting" },
    edge: "cycle",
    note: "Circular wait — Tx A needs Row 10 (held by B), Tx B needs Row 1 (held by A). Deadlock!",
  },
  {
    txA: { action: "ROLLBACK (victim)", lock: null, state: "victim" },
    txB: { action: "Lock acquired — continues", lock: "Row 1 + Row 10", state: "running" },
    edge: "cycle",
    note: "DB detects the cycle in the wait-for graph and picks Tx A as the victim.",
  },
  {
    txA: { action: "Aborted — app retries", lock: null, state: "idle" },
    txB: { action: "COMMIT", lock: null, state: "committed" },
    note: "Victim rolled back, locks released — the survivor commits successfully.",
  },
];

const ENGINE_LABELS = {
  postgres: "PostgreSQL",
  mysql: "MySQL / InnoDB",
  sqlserver: "SQL Server",
};

export function DeadlockDetection({
  title = "Deadlock Detection",
  databaseEngine = "postgres",
  interactive = true,
}: DeadlockDetectionProps) {
  const [step, setStep] = useState(-1);
  const [running, setRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const current = step >= 0 ? STEPS[step] : null;
  const done = step >= STEPS.length - 1;
  const hasCycle = current?.edge === "cycle" || (step >= 2 && step < STEPS.length - 1);

  function reset() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setStep(-1);
    setRunning(false);
  }

  function handlePrimary() {
    if (running) return;
    setStep(-1);
    setRunning(true);
  }

  useEffect(() => {
    if (!running) return;
    if (step >= STEPS.length - 1) {
      setRunning(false);
      return;
    }
    timerRef.current = setTimeout(() => setStep((s) => s + 1), 1200);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [running, step]);

  const statusText =
    step < 0
      ? "When transactions lock rows in opposite order, they can wait on each other forever — the DB must break the cycle."
      : hasCycle && !done
        ? "Wait-for graph has a cycle — database picks a victim transaction and rolls it back."
        : done
          ? `${ENGINE_LABELS[databaseEngine]} aborted the younger transaction — the other committed cleanly.`
          : current?.note ?? "Simulating concurrent row locks…";

  const txColor = (state: TxState) => {
    switch (state) {
      case "running":
        return "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300";
      case "waiting":
        return "border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300";
      case "victim":
        return "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300";
      case "committed":
        return "border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300";
      default:
        return "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500";
    }
  };

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <Database className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">{title}</span>
        <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
          {ENGINE_LABELS[databaseEngine]}
        </span>
        {interactive && (
          <button
            type="button"
            onClick={reset}
            className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all duration-500"
          >
            <RefreshCw className="size-3.5" />
          </button>
        )}
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        Two transactions lock rows in opposite order — each waits on the other forever until the database detects the cycle and aborts one.
      </p>

      <div className="p-4 min-h-[280px] flex flex-col gap-4">
        {/* Row locks */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {(["Row 1", "Row 10"] as const).map((row) => {
            const heldByA = current?.txA.lock?.includes(row);
            const heldByB = current?.txB.lock?.includes(row);
            const locked = heldByA || heldByB;
            return (
              <div
                key={row}
                className={cn(
                  "rounded-lg border p-3 text-center transition-all duration-500",
                  locked
                    ? heldByA
                      ? "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/20"
                      : "border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-950/20"
                    : "border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50"
                )}
              >
                <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-1">{row}</div>
                <div className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-200">
                  {locked ? (heldByA ? "Tx A 🔒" : "Tx B 🔒") : "unlocked"}
                </div>
              </div>
            );
          })}
        </div>

        {/* Transactions */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {(["A", "B"] as const).map((tx) => {
            const data = tx === "A" ? current?.txA : current?.txB;
            const state = data?.state ?? "idle";
            return (
              <div
                key={tx}
                className={cn(
                  "rounded-lg border-2 p-3 transition-all duration-500",
                  txColor(state)
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold">Transaction {tx}</span>
                  <span className="text-[10px] font-mono uppercase">{state}</span>
                </div>
                <div className="text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800 rounded-md px-2 py-1 min-h-[32px]">
                  {data?.action ?? "—"}
                </div>
                {data?.lock && (
                  <div className="text-[10px] mt-1.5 opacity-80">Holds: {data.lock}</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Wait-for graph */}
        <div
          className={cn(
            "rounded-lg border p-3 transition-all duration-500",
            hasCycle
              ? "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20"
              : "border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50"
          )}
        >
          <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-2">
            Wait-for graph
          </div>
          <div className="flex items-center justify-center gap-3 min-h-[48px]">
            {step < 2 ? (
              <span className="text-xs text-zinc-400">No edges yet — transactions not blocked</span>
            ) : (
              <>
                <div className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-bold border transition-all duration-500",
                  current?.txA.state === "victim"
                    ? "border-red-400 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 line-through"
                    : "border-blue-300 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                )}>
                  Tx A
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <ArrowRight className={cn("size-4 transition-all duration-500", hasCycle ? "text-red-500" : "text-zinc-300")} />
                  <span className="text-[9px] text-zinc-400">waits for</span>
                </div>
                <div className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-bold border transition-all duration-500",
                  current?.txB.state === "committed"
                    ? "border-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                    : "border-violet-300 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"
                )}>
                  Tx B
                </div>
                {hasCycle && (
                  <>
                    <div className="flex flex-col items-center gap-0.5 ml-1">
                      <ArrowRight className="size-4 text-red-500 rotate-180" />
                      <span className="text-[9px] text-red-500">waits for</span>
                    </div>
                    <AlertTriangle className="size-5 text-red-500 animate-pulse" />
                  </>
                )}
              </>
            )}
          </div>
          {hasCycle && (
            <div className="mt-2 flex items-center gap-1.5 text-[10px] text-red-600 dark:text-red-400">
              <AlertTriangle className="size-3 shrink-0" />
              Cycle detected — one transaction must be aborted
            </div>
          )}
          {done && (
            <div className="mt-2 flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-3 shrink-0" />
              Victim rolled back, survivor committed — deadlock resolved
            </div>
          )}
        </div>
      </div>

      {interactive && (
        <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/30 min-h-[52px]">
          <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">{statusText}</span>
          <button
            type="button"
            onClick={handlePrimary}
            disabled={running}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 transition-all duration-500 hover:opacity-90 shrink-0 disabled:opacity-50"
          >
            {running ? "Running…" : done ? "Run Again" : "Simulate Deadlock"}
          </button>
        </div>
      )}
    </div>
  );
}
