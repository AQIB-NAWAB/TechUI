"use client";

import { useState, useEffect, useRef } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Database, RefreshCw, Play, AlertTriangle, CheckCircle2 } from "lucide-react";

export const IsolationLevelsSchema = z.object({
  title: z.string().optional().default("Transaction Isolation"),
  level: z
    .enum(["read-uncommitted", "read-committed", "repeatable-read", "serializable"])
    .optional()
    .default("read-committed"),
  interactive: z.boolean().optional().default(true),
});

export type IsolationLevelsProps = z.infer<typeof IsolationLevelsSchema>;

type Step = {
  tx: "A" | "B";
  action: string;
  sql: string;
  balanceShown: number;
  anomaly?: "dirty-read" | "non-repeatable" | "phantom" | null;
  note?: string;
};

const SCENARIOS: Record<
  IsolationLevelsProps["level"],
  { label: string; short: string; steps: Step[]; prevented: boolean; anomalyName: string }
> = {
  "read-uncommitted": {
    label: "Read Uncommitted",
    short: "RU",
    prevented: false,
    anomalyName: "Dirty read",
    steps: [
      { tx: "A", action: "BEGIN", sql: "BEGIN;", balanceShown: 1000 },
      { tx: "A", action: "UPDATE (uncommitted)", sql: "UPDATE accounts SET balance = 900;", balanceShown: 900, note: "Alice debited $100 — not committed yet" },
      { tx: "B", action: "SELECT", sql: "SELECT balance FROM accounts;", balanceShown: 900, anomaly: "dirty-read", note: "Tx B reads uncommitted change — dirty read!" },
      { tx: "A", action: "ROLLBACK", sql: "ROLLBACK;", balanceShown: 1000, note: "Tx A rolls back — the $900 never existed" },
      { tx: "B", action: "Used bad data", sql: "-- acted on $900", balanceShown: 1000, anomaly: "dirty-read", note: "Tx B made decisions on data that was rolled back" },
    ],
  },
  "read-committed": {
    label: "Read Committed",
    short: "RC",
    prevented: true,
    anomalyName: "Dirty read",
    steps: [
      { tx: "A", action: "BEGIN", sql: "BEGIN;", balanceShown: 1000 },
      { tx: "A", action: "UPDATE (uncommitted)", sql: "UPDATE accounts SET balance = 900;", balanceShown: 900, note: "Alice debited $100 — not committed yet" },
      { tx: "B", action: "SELECT (blocked)", sql: "SELECT balance FROM accounts;", balanceShown: 1000, note: "Tx B waits — cannot read uncommitted data" },
      { tx: "A", action: "COMMIT", sql: "COMMIT;", balanceShown: 900, note: "Tx A commits — now visible to others" },
      { tx: "B", action: "SELECT (sees committed)", sql: "SELECT balance FROM accounts;", balanceShown: 900, note: "Tx B reads the committed $900 — no dirty read" },
    ],
  },
  "repeatable-read": {
    label: "Repeatable Read",
    short: "RR",
    prevented: true,
    anomalyName: "Non-repeatable read",
    steps: [
      { tx: "A", action: "BEGIN", sql: "BEGIN;", balanceShown: 1000 },
      { tx: "A", action: "SELECT #1", sql: "SELECT balance FROM accounts;", balanceShown: 1000, note: "Tx A reads $1000" },
      { tx: "B", action: "UPDATE + COMMIT", sql: "UPDATE ... COMMIT;", balanceShown: 800, note: "Tx B debits $200 and commits" },
      { tx: "A", action: "SELECT #2", sql: "SELECT balance FROM accounts;", balanceShown: 1000, note: "Tx A still sees $1000 — snapshot held for the transaction" },
      { tx: "A", action: "COMMIT", sql: "COMMIT;", balanceShown: 800, note: "After commit, next query would see $800" },
    ],
  },
  serializable: {
    label: "Serializable",
    short: "SER",
    prevented: true,
    anomalyName: "Write skew / phantom",
    steps: [
      { tx: "A", action: "BEGIN", sql: "BEGIN;", balanceShown: 1000 },
      { tx: "B", action: "BEGIN", sql: "BEGIN;", balanceShown: 1000 },
      { tx: "A", action: "SELECT count", sql: "SELECT COUNT(*) WHERE balance > 500;", balanceShown: 1000, note: "Tx A: 1 account above $500" },
      { tx: "B", action: "INSERT row", sql: "INSERT INTO accounts ...;", balanceShown: 1000, note: "Tx B inserts a new high-balance account" },
      { tx: "A", action: "SELECT count again", sql: "SELECT COUNT(*) WHERE balance > 500;", balanceShown: 1000, note: "Serializable blocks this — would see phantom row" },
      { tx: "B", action: "BLOCKED", sql: "COMMIT;", balanceShown: 1000, note: "One transaction must abort — no concurrent anomalies" },
    ],
  },
};

export function IsolationLevels({
  title = "Transaction Isolation",
  level: initialLevel = "read-committed",
  interactive = true,
}: IsolationLevelsProps) {
  const [level, setLevel] = useState(initialLevel);
  const [step, setStep] = useState(-1);
  const [running, setRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scenario = SCENARIOS[level];
  const current = step >= 0 ? scenario.steps[step] : null;
  const balance = current?.balanceShown ?? 1000;
  const done = step >= scenario.steps.length - 1;
  const hasAnomaly = scenario.steps.some((s) => s.anomaly) && !scenario.prevented;

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
    setLevel(initialLevel);
  }, [initialLevel]);

  useEffect(() => {
    reset();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level]);

  useEffect(() => {
    if (!running) return;
    if (step >= scenario.steps.length - 1) {
      setRunning(false);
      return;
    }
    timerRef.current = setTimeout(() => setStep((s) => s + 1), 1200);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [running, step, scenario.steps.length]);

  const statusText = step < 0
    ? `Pick an isolation level and run the demo to see how ${scenario.anomalyName.toLowerCase()} is handled.`
    : done
      ? scenario.prevented
        ? `${scenario.label} prevents ${scenario.anomalyName.toLowerCase()} — transactions stay consistent.`
        : `${scenario.label} allows ${scenario.anomalyName.toLowerCase()} — data can be read before it's final.`
      : current?.note ?? "Stepping through concurrent transactions…";

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <Database className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">{title}</span>
        <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
          {scenario.short}
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
        Isolation levels control what one transaction can read while another is still open — stricter levels block dirty reads, phantom rows, and other concurrency bugs.
      </p>

      <div className="px-4 pt-3 pb-1 flex gap-1.5 flex-wrap">
        {(Object.keys(SCENARIOS) as IsolationLevelsProps["level"][]).map((key) => (
          <button
            key={key}
            type="button"
            disabled={running}
            onClick={() => setLevel(key)}
            className={cn(
              "text-[10px] font-semibold px-2.5 py-1 rounded-md transition-all duration-500",
              level === key
                ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            )}
          >
            {SCENARIOS[key].short}
          </button>
        ))}
      </div>

      <div className="p-4 min-h-[240px]">
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="col-span-1 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-3 text-center transition-all duration-500">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-1">Shared row</div>
            <div className={cn(
              "text-2xl font-bold font-mono transition-all duration-500",
              current?.anomaly ? "text-red-600 dark:text-red-400" : "text-zinc-800 dark:text-zinc-200"
            )}>
              ${balance}
            </div>
            <div className="text-[10px] text-zinc-400 mt-1">accounts.balance</div>
          </div>

          {(["A", "B"] as const).map((tx) => {
            const active = current?.tx === tx;
            const txSteps = scenario.steps.filter((s) => s.tx === tx);
            const txIndex = current ? txSteps.findIndex((s) => s === current) : -1;
            return (
              <div
                key={tx}
                className={cn(
                  "rounded-lg border p-3 transition-all duration-500",
                  active
                    ? "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/30 ring-2 ring-blue-200 dark:ring-blue-800"
                    : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900"
                )}
              >
                <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-2">
                  Transaction {tx}
                </div>
                <div className="space-y-1 min-h-[72px]">
                  {txSteps.map((s, i) => {
                    const visible = step >= 0 && scenario.steps.indexOf(s) <= step;
                    const isCurrent = active && i === txIndex;
                    if (!visible) return null;
                    return (
                      <div
                        key={i}
                        className={cn(
                          "text-[10px] font-mono rounded px-2 py-1 transition-all duration-500",
                          isCurrent
                            ? "bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                        )}
                      >
                        {s.action}
                      </div>
                    );
                  })}
                  {step < 0 && (
                    <span className="text-[10px] text-zinc-400 italic">Waiting…</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-100 dark:border-zinc-800 p-3 min-h-[56px]">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-1">Current SQL</div>
          {current ? (
            <code className="text-xs font-mono text-zinc-700 dark:text-zinc-300">{current.sql}</code>
          ) : (
            <span className="text-xs text-zinc-400 italic">Run the demo to step through each SQL statement</span>
          )}
        </div>

        <div className="mt-3 min-h-[40px]">
          {done && (
            <div className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-all duration-500",
              hasAnomaly
                ? "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800"
                : "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
            )}>
              {hasAnomaly ? <AlertTriangle className="size-4 shrink-0" /> : <CheckCircle2 className="size-4 shrink-0" />}
              {scenario.prevented ? `${scenario.anomalyName} prevented` : `${scenario.anomalyName} occurred`}
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
            className="flex items-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-all duration-500 shrink-0 disabled:opacity-50"
          >
            <Play className="size-3.5" />
            {running ? "Running…" : done ? "Run Again" : "Run Demo"}
          </button>
        </div>
      )}
    </div>
  );
}
