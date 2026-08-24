"use client";

import { useState, useEffect, useRef } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Database, Play, RefreshCw, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

export const DatabaseTransactionsSchema = z.object({
  scenario: z.enum(["commit", "rollback", "partial-failure"]).default("commit"),
  tableName: z.string().default("bank_accounts"),
});

export type DatabaseTransactionsProps = z.infer<typeof DatabaseTransactionsSchema>;

type Step = {
  sql: string;
  description: string;
  alice?: { from: number; to: number };
  bob?: { from: number; to: number };
  status: "pending" | "ok" | "error" | "info";
};

const STEPS: Record<string, Step[]> = {
  commit: [
    { sql: "BEGIN;", description: "Start transaction", status: "info" },
    {
      sql: "UPDATE accounts SET balance = balance - 500 WHERE id = 'alice';",
      description: "Debit alice",
      alice: { from: 1000, to: 500 },
      status: "ok",
    },
    {
      sql: "UPDATE accounts SET balance = balance + 500 WHERE id = 'bob';",
      description: "Credit bob",
      bob: { from: 200, to: 700 },
      status: "ok",
    },
    { sql: "COMMIT;", description: "Persist all changes", status: "ok" },
  ],
  rollback: [
    { sql: "BEGIN;", description: "Start transaction", status: "info" },
    {
      sql: "UPDATE accounts SET balance = balance - 500 WHERE id = 'alice';",
      description: "Debit alice",
      alice: { from: 1000, to: 500 },
      status: "ok",
    },
    {
      sql: "UPDATE accounts SET balance = balance + 500 WHERE id = 'bob';",
      description: 'ERROR: account "bob" is frozen',
      bob: { from: 200, to: 200 },
      status: "error",
    },
    { sql: "ROLLBACK;", description: "Revert all changes — alice gets $500 back", status: "error" },
  ],
  "partial-failure": [
    { sql: "-- No transaction wrapper", description: "Running without a transaction", status: "info" },
    {
      sql: "UPDATE accounts SET balance = balance - 500 WHERE id = 'alice';",
      description: "Debit alice — SUCCESS",
      alice: { from: 1000, to: 500 },
      status: "ok",
    },
    {
      sql: "-- SERVER CRASH before bob's update",
      description: "Process killed — bob's credit never runs",
      status: "error",
    },
    {
      sql: "-- alice lost $500, bob got nothing",
      description: "Money vanished from the system!",
      status: "error",
    },
  ],
};

const SCENARIO_LABELS = {
  commit: "Commit",
  rollback: "Rollback",
  "partial-failure": "No Transaction",
};

export function DatabaseTransactions({
  scenario: initialScenario = "commit",
  tableName = "bank_accounts",
}: DatabaseTransactionsProps) {
  const [scenario, setScenario] = useState(initialScenario);
  const [currentStep, setCurrentStep] = useState(-1);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const steps = STEPS[scenario];
  const activeSteps = currentStep >= 0 ? steps.slice(0, currentStep + 1) : [];

  // Derived balances from executed steps
  let aliceBalance = 1000;
  let bobBalance = 200;
  let aliceCrossed = false;
  let bobCrossed = false;

  const lastCommitted = scenario === "commit" && currentStep >= 3;
  const lastRolledBack = scenario === "rollback" && currentStep >= 3;
  const crashed = scenario === "partial-failure" && currentStep >= 2;

  for (let i = 0; i <= currentStep; i++) {
    const s = steps[i];
    if (scenario === "rollback" && i >= 3) break; // rollback reverts
    if (scenario === "partial-failure" && i >= 2) break; // crash
    if (s.alice) { aliceBalance = s.alice.to; aliceCrossed = true; }
    if (s.bob) { bobBalance = s.bob.to; bobCrossed = true; }
  }

  // After rollback, revert
  if (lastRolledBack) {
    aliceBalance = 1000;
    bobBalance = 200;
    aliceCrossed = false;
    bobCrossed = false;
  }

  function startRun() {
    if (running) return;
    setCurrentStep(-1);
    setRunning(true);
  }

  function reset() {
    if (intervalRef.current) clearTimeout(intervalRef.current);
    setCurrentStep(-1);
    setRunning(false);
  }

  useEffect(() => {
    if (!running) return;
    if (currentStep >= steps.length - 1) {
      setRunning(false);
      return;
    }
    intervalRef.current = setTimeout(() => {
      setCurrentStep((s) => s + 1);
    }, 1200);
    return () => { if (intervalRef.current) clearTimeout(intervalRef.current); };
  }, [running, currentStep, steps.length]);

  // Reset when scenario changes
  useEffect(() => {
    reset();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario]);

  const finalOutcome = scenario === "commit"
    ? { label: "Atomicity: all changes committed", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800" }
    : scenario === "rollback"
    ? { label: "Isolation: partial changes never visible", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800" }
    : { label: "Danger: money lost! This is why we need transactions.", color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800" };

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <Database className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">
          {tableName} — ACID Transactions
        </span>
        <button onClick={reset} className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all duration-500">
          <RefreshCw className="size-3.5" />
        </button>
      </div>

      <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          A transaction groups multiple changes into one unit — they all succeed together or none do.
        </p>
      </div>

      {/* Scenario tabs */}
      <div className="flex gap-1 px-4 pt-3">
        {(Object.keys(SCENARIO_LABELS) as Array<keyof typeof SCENARIO_LABELS>).map((key) => (
          <button
            key={key}
            onClick={() => setScenario(key)}
            className={cn(
              "px-3 py-1 rounded-md text-xs font-semibold transition-all duration-500",
              scenario === key
                ? key === "partial-failure"
                  ? "bg-red-600 text-white"
                  : key === "rollback"
                  ? "bg-amber-500 text-white"
                  : "bg-emerald-600 text-white"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            )}
          >
            {SCENARIO_LABELS[key]}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-2 gap-3 p-4 min-h-[300px]">
        {/* SQL Panel */}
        <div className="flex flex-col gap-2">
          <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide">SQL Execution</div>
          <div className="rounded-lg bg-zinc-950 dark:bg-zinc-950 flex-1 p-3 font-mono text-[11px] space-y-1 min-h-[200px]">
            {steps.map((step, i) => {
              const executed = i <= currentStep;
              const active = i === currentStep;
              const isErr = step.status === "error";
              const isOk = step.status === "ok";
              return (
                <div
                  key={i}
                  className={cn(
                    "px-2 py-1 rounded transition-all duration-500",
                    active && !isErr && "bg-blue-800/60",
                    active && isErr && "bg-red-900/60",
                    !executed && "opacity-30",
                    executed && !active && isOk && "text-emerald-400",
                    executed && !active && isErr && "text-red-400",
                    executed && !active && step.status === "info" && "text-zinc-400",
                  )}
                >
                  <span className={cn(
                    "block text-zinc-100",
                    executed && isOk && !active && "text-emerald-300",
                    executed && isErr && !active && "text-red-300",
                    executed && step.status === "info" && !active && "text-zinc-400",
                  )}>
                    {step.sql}
                  </span>
                  {executed && (
                    <span className={cn(
                      "text-[10px] flex items-center gap-1 mt-0.5",
                      isOk ? "text-emerald-500" : isErr ? "text-red-500" : "text-zinc-500",
                    )}>
                      {isOk && <CheckCircle2 className="size-2.5" />}
                      {isErr && <XCircle className="size-2.5" />}
                      {step.description}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <button
            onClick={startRun}
            disabled={running}
            className={cn(
              "flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-500",
              running
                ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
                : "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90"
            )}
          >
            <Play className="size-3.5" />
            {running ? "Running…" : "Run"}
          </button>
        </div>

        {/* Balance Panel */}
        <div className="flex flex-col gap-2">
          <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide">Account Balances</div>
          <div className="rounded-lg border border-zinc-100 dark:border-zinc-800 flex-1 p-3 space-y-3 min-h-[200px]">
            {/* Alice */}
            <div className="space-y-1">
              <div className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">alice</div>
              <div className="flex items-center gap-2">
                {aliceCrossed && !lastRolledBack && !crashed && currentStep >= 1 ? (
                  <>
                    <span className="text-sm line-through text-red-400 font-mono">$1,000</span>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">${aliceBalance.toLocaleString()}</span>
                  </>
                ) : lastRolledBack ? (
                  <>
                    <span className="text-sm font-bold text-zinc-700 dark:text-zinc-200 font-mono">$1,000</span>
                    <span className="text-[10px] text-blue-500 dark:text-blue-400 ml-1">restored</span>
                  </>
                ) : crashed && scenario === "partial-failure" ? (
                  <>
                    <span className="text-sm font-bold text-red-600 dark:text-red-400 font-mono">$500</span>
                    <span className="text-[10px] text-red-500 ml-1">lost!</span>
                  </>
                ) : (
                  <span className="text-sm font-bold text-zinc-700 dark:text-zinc-200 font-mono">$1,000</span>
                )}
              </div>
              <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    lastRolledBack || (!aliceCrossed) ? "bg-zinc-400" : crashed && scenario === "partial-failure" ? "bg-red-500" : "bg-emerald-500"
                  )}
                  style={{ width: `${(aliceBalance / 1500) * 100}%` }}
                />
              </div>
            </div>

            {/* Bob */}
            <div className="space-y-1">
              <div className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">bob</div>
              <div className="flex items-center gap-2">
                {bobCrossed && !lastRolledBack ? (
                  <>
                    <span className="text-sm line-through text-red-400 font-mono">$200</span>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">${bobBalance.toLocaleString()}</span>
                  </>
                ) : lastRolledBack ? (
                  <>
                    <span className="text-sm font-bold text-zinc-700 dark:text-zinc-200 font-mono">$200</span>
                    <span className="text-[10px] text-blue-500 dark:text-blue-400 ml-1">unchanged</span>
                  </>
                ) : crashed ? (
                  <>
                    <span className="text-sm font-bold text-zinc-700 dark:text-zinc-200 font-mono">$200</span>
                    <span className="text-[10px] text-zinc-500 ml-1">never credited</span>
                  </>
                ) : (
                  <span className="text-sm font-bold text-zinc-700 dark:text-zinc-200 font-mono">$200</span>
                )}
              </div>
              <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    lastRolledBack ? "bg-zinc-400" : bobCrossed ? "bg-emerald-500" : "bg-zinc-400"
                  )}
                  style={{ width: `${(bobBalance / 1500) * 100}%` }}
                />
              </div>
            </div>

            {/* Total / outcome */}
            <div className="pt-1 border-t border-zinc-100 dark:border-zinc-800">
              <div className="text-[10px] text-zinc-400">
                Total in system:&nbsp;
                <span className={cn(
                  "font-mono font-bold",
                  scenario === "partial-failure" && crashed ? "text-red-500" : "text-zinc-700 dark:text-zinc-200"
                )}>
                  ${(aliceBalance + bobBalance).toLocaleString()}
                </span>
                {scenario !== "partial-failure" && (
                  <span className="text-zinc-400"> (should be $1,200)</span>
                )}
                {scenario === "partial-failure" && crashed && (
                  <span className="text-red-500"> (should be $1,200!)</span>
                )}
              </div>
            </div>

            {/* Outcome message — fixed height slot */}
            <div className="min-h-[44px] flex items-center">
              {currentStep === steps.length - 1 && (
                <div className={cn("w-full rounded-lg border px-3 py-2 text-xs font-semibold flex items-center gap-2 transition-all duration-500", finalOutcome.bg)}>
                  {scenario === "partial-failure"
                    ? <AlertTriangle className="size-3.5 shrink-0 text-red-500" />
                    : scenario === "rollback"
                    ? <CheckCircle2 className="size-3.5 shrink-0 text-blue-500" />
                    : <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" />
                  }
                  <span className={finalOutcome.color}>{finalOutcome.label}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ACID legend */}
      <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-2 bg-zinc-50 dark:bg-zinc-900/30">
        <div className="flex gap-4 text-[10px] text-zinc-500 dark:text-zinc-400">
          <span><span className="font-bold text-zinc-700 dark:text-zinc-300">A</span>=Atomic</span>
          <span><span className="font-bold text-zinc-700 dark:text-zinc-300">C</span>=Consistent</span>
          <span><span className="font-bold text-zinc-700 dark:text-zinc-300">I</span>=Isolated</span>
          <span><span className="font-bold text-zinc-700 dark:text-zinc-300">D</span>=Durable</span>
          <span className="ml-auto text-zinc-400">All or nothing — no partial updates</span>
        </div>
      </div>
    </div>
  );
}
