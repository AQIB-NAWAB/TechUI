"use client";

import { useState, useEffect, useRef } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Zap, Play, RotateCcw } from "lucide-react";

export const QueryOptimizerSchema = z.object({
  query: z.string().default("SELECT * FROM orders WHERE user_id = 123 AND status = 'pending'"),
  tableName: z.string().default("orders"),
  tableRows: z.number().default(1000000),
  hasIndex: z.boolean().default(false),
  planType: z.enum(["sequential", "index", "bitmap"]).optional().default("sequential"),
});

export type QueryOptimizerProps = z.infer<typeof QueryOptimizerSchema>;

function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "K";
  return String(n);
}

function computePlan(tableRows: number, useIndex: boolean) {
  const returnedRows = Math.max(1, Math.round(tableRows * 0.000047));
  const seqCost = tableRows * 0.01 - 1;
  const idxCost = returnedRows * 0.1 + 0.42;
  if (useIndex) {
    return {
      type: "Index Scan",
      cost: idxCost,
      scannedRows: returnedRows,
      returnedRows,
      timeMs: Math.max(2, Math.round(idxCost / 6)),
      indexName: `orders_user_id_idx`,
    };
  }
  return {
    type: "Seq Scan",
    cost: seqCost,
    scannedRows: tableRows,
    returnedRows,
    timeMs: Math.round(seqCost / 9.5),
    indexName: null,
  };
}

export function QueryOptimizer({
  query = "SELECT * FROM orders WHERE user_id = 123 AND status = 'pending'",
  tableName = "orders",
  tableRows = 1000000,
}: QueryOptimizerProps) {
  const [activeTab, setActiveTab] = useState<"no-index" | "index">("no-index");
  const [running, setRunning] = useState(false);
  const [revealed, setRevealed] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const seqPlan = computePlan(tableRows, false);
  const idxPlan = computePlan(tableRows, true);
  const speedup = Math.round(seqPlan.cost / idxPlan.cost);
  const rowRatio = Math.round(seqPlan.scannedRows / idxPlan.scannedRows);

  const currentPlan = activeTab === "no-index" ? seqPlan : idxPlan;
  const maxCost = seqPlan.cost;
  const barWidth = Math.max(2, Math.round((currentPlan.cost / maxCost) * 100));

  function handleRun() {
    if (running) return;
    setRevealed(false);
    setRunning(true);
    timerRef.current = setTimeout(() => {
      setRunning(false);
      setRevealed(true);
    }, 1200);
  }

  function handleReset() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setRunning(false);
    setRevealed(true);
    setActiveTab("no-index");
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  // highlight WHERE clause
  const whereIdx = query.indexOf("WHERE");
  const beforeWhere = whereIdx >= 0 ? query.slice(0, whereIdx + 6) : query;
  const afterWhere = whereIdx >= 0 ? query.slice(whereIdx + 6) : "";

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
        <Zap className="size-4 text-amber-500 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">Query Optimizer</span>
        <button onClick={handleReset} className="p-1 rounded text-zinc-400 hover:text-zinc-600 transition-all duration-500">
          <RotateCcw className="size-3.5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        {(["no-index", "index"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setRevealed(true); }}
            className={cn(
              "px-3 py-1 rounded-md text-[11px] font-semibold transition-all duration-500",
              activeTab === tab
                ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            )}
          >
            {tab === "no-index" ? "No Index" : "With Index"}
          </button>
        ))}
      </div>

      <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          The database planner picks how to find rows. An index lets it skip millions of rows and jump straight to matches.
        </p>
      </div>

      {/* Body */}
      <div className="min-h-[280px] p-4 space-y-3">
        {/* Query display */}
        <div className="font-mono text-xs bg-zinc-950 dark:bg-zinc-950 text-zinc-300 rounded-lg px-3 py-2.5 border border-zinc-800">
          <span className="text-sky-400">SELECT</span>
          <span className="text-zinc-300"> * </span>
          <span className="text-sky-400">FROM</span>
          <span className="text-zinc-300"> {tableName} </span>
          {whereIdx >= 0 ? (
            <>
              <span className="text-sky-400">WHERE</span>
              <span className="text-amber-300"> {afterWhere}</span>
            </>
          ) : (
            <span className="text-zinc-300">{afterWhere}</span>
          )}
          {whereIdx < 0 && <span className="text-zinc-400">{beforeWhere}</span>}
        </div>

        {/* EXPLAIN output */}
        <div className={cn("space-y-3 transition-all duration-500", !revealed && "opacity-30")}>
          {/* Plan type badge */}
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-[10px] font-bold px-2 py-0.5 rounded-full",
              activeTab === "no-index"
                ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
            )}>
              {currentPlan.type}
            </span>
            {currentPlan.indexName && (
              <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
                using {currentPlan.indexName}
              </span>
            )}
          </div>

          {/* Cost bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-zinc-500 dark:text-zinc-400 font-medium">Cost</span>
              <span className={cn(
                "font-mono font-bold",
                activeTab === "no-index" ? "text-red-500 dark:text-red-400" : "text-emerald-500 dark:text-emerald-400"
              )}>
                {currentPlan.cost < 100 ? currentPlan.cost.toFixed(2) : Math.round(currentPlan.cost).toLocaleString()}
              </span>
            </div>
            <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded-md overflow-hidden relative">
              <div
                className={cn(
                  "h-full rounded-md transition-all duration-700 flex items-center justify-end pr-2",
                  activeTab === "no-index"
                    ? "bg-red-400 dark:bg-red-500"
                    : "bg-emerald-400 dark:bg-emerald-500"
                )}
                style={{ width: `${barWidth}%` }}
              />
            </div>
          </div>

          {/* Row scan info */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-zinc-500 dark:text-zinc-400 font-medium">Rows scanned</span>
              <span className="font-mono text-zinc-700 dark:text-zinc-300">
                {formatNum(currentPlan.scannedRows)} → {formatNum(currentPlan.returnedRows)} returned
              </span>
            </div>
            <div className="h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden relative">
              {/* scanned bar (full width = seqPlan.scannedRows) */}
              <div className="absolute inset-0 bg-zinc-200 dark:bg-zinc-700 rounded-full" />
              {/* returned bar */}
              <div
                className="absolute inset-y-0 left-0 bg-sky-400 dark:bg-sky-500 rounded-full transition-all duration-700"
                style={{ width: `${Math.max(0.5, (currentPlan.returnedRows / seqPlan.scannedRows) * 100)}%` }}
              />
              {/* scanned */}
              <div
                className={cn(
                  "absolute inset-y-0 left-0 rounded-full transition-all duration-700 opacity-30",
                  activeTab === "no-index" ? "bg-red-400" : "bg-emerald-400"
                )}
                style={{ width: `${(currentPlan.scannedRows / seqPlan.scannedRows) * 100}%` }}
              />
            </div>
            <div className="flex gap-3 text-[10px] text-zinc-400">
              <span className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-sky-400 inline-block" /> returned</span>
              <span className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600 inline-block" /> scanned</span>
            </div>
          </div>

          {/* Time */}
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/60">
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Estimated time</span>
            <span className={cn(
              "text-sm font-bold font-mono",
              activeTab === "no-index" ? "text-red-500 dark:text-red-400" : "text-emerald-500 dark:text-emerald-400"
            )}>
              ~{currentPlan.timeMs < 1000 ? `${currentPlan.timeMs}ms` : `${(currentPlan.timeMs / 1000).toFixed(1)}s`}
            </span>
          </div>

          {/* Index creation hint */}
          {activeTab === "index" && (
            <div className="font-mono text-[10px] bg-emerald-950/20 dark:bg-emerald-950/30 border border-emerald-800/30 text-emerald-700 dark:text-emerald-400 rounded-lg px-3 py-2">
              CREATE INDEX ON {tableName}(user_id);
            </div>
          )}

          {/* Key insight */}
          <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30">
            <Zap className="size-3 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-[10px] text-amber-700 dark:text-amber-400 leading-relaxed">
              Adding an index reduced rows scanned from{" "}
              <strong>{formatNum(seqPlan.scannedRows)}</strong> to{" "}
              <strong>{formatNum(idxPlan.scannedRows)}</strong> — {rowRatio.toLocaleString()}× less work, {speedup}× faster
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/30">
        <span className="text-xs text-zinc-500 flex-1">
          {running ? "Analyzing query plan…" : revealed ? `${currentPlan.type} · ~${currentPlan.timeMs}ms` : "Ready to explain"}
        </span>
        <button
          onClick={handleRun}
          disabled={running}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-500",
            running
              ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
              : "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90"
          )}
        >
          {running ? (
            <>
              <svg className="size-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Planning…
            </>
          ) : (
            <>
              <Play className="size-3.5" />
              Run EXPLAIN
            </>
          )}
        </button>
      </div>
    </div>
  );
}
