"use client";

import { useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { BarChart3, RefreshCw } from "lucide-react";

export const SloSliSlaSchema = z.object({
  sloPercent: z.number().default(99.9),
  currentUptimePercent: z.number().default(99.85),
  windowDays: z.number().default(30),
});

export type SloSliSlaProps = z.infer<typeof SloSliSlaSchema>;

const NINES_TABLE = [
  { label: "99%",     downtime: "7.3h/month",    downMin: 7.3 * 60 },
  { label: "99.9%",   downtime: "43.2min/month",  downMin: 43.2 },
  { label: "99.99%",  downtime: "4.3min/month",   downMin: 4.3 },
  { label: "99.999%", downtime: "26s/month",       downMin: 26 / 60 },
];

function calcBudgetMin(sloPercent: number, windowDays: number) {
  return ((100 - sloPercent) / 100) * windowDays * 24 * 60;
}

function formatMin(min: number): string {
  if (min >= 60) return `${(min / 60).toFixed(1)}h`;
  if (min >= 1)  return `${min.toFixed(1)}min`;
  return `${(min * 60).toFixed(0)}s`;
}

function findNinesRow(pct: number): number {
  const targets = [99, 99.9, 99.99, 99.999];
  let closest = 0;
  let minDiff = Infinity;
  targets.forEach((t, i) => {
    const diff = Math.abs(t - pct);
    if (diff < minDiff) { minDiff = diff; closest = i; }
  });
  return closest;
}

export function SloSliSla({
  sloPercent: initialSlo = 99.9,
  currentUptimePercent: initialUptime = 99.85,
  windowDays = 30,
}: SloSliSlaProps) {
  const [currentUptime, setCurrentUptime] = useState(initialUptime);
  const [sloPercent] = useState(initialSlo);

  const budgetMin = calcBudgetMin(sloPercent, windowDays);
  const remainingMin = Math.max(0, ((currentUptime - sloPercent) / 100) * windowDays * 24 * 60);
  const usedMinActual = Math.max(0, budgetMin - remainingMin);
  const budgetPct = budgetMin > 0 ? Math.min((usedMinActual / budgetMin) * 100, 120) : 0;
  const breached = budgetPct >= 100;

  const ninesIdx = findNinesRow(sloPercent);

  function simulateIncident() {
    const lostPct = 10 / (windowDays * 24 * 60) * 100;
    setCurrentUptime((prev) => Math.max(prev - lostPct, 0));
  }

  function reset() {
    setCurrentUptime(initialUptime);
  }

  const barColor =
    budgetPct > 80 ? "bg-red-500"
    : budgetPct > 50 ? "bg-amber-400"
    : "bg-emerald-500";

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800">
        <BarChart3 className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">SLO / SLI / SLA</span>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">{windowDays}-day window</span>
        <button
          type="button"
          onClick={reset}
          className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all duration-500"
          title="Reset uptime"
        >
          <RefreshCw className="size-3.5" />
        </button>
      </div>

      <p className="text-sm text-zinc-500 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        Error budget = allowed downtime. When it&apos;s gone, freeze deploys to protect reliability.
      </p>

      <div className="min-h-[280px] px-4 py-3 flex flex-col gap-3">
        <div className="grid grid-cols-3 gap-2">
          {[
            { term: "SLA", color: "blue", def: "Contract with customers" },
            { term: "SLO", color: "violet", def: "Internal reliability target" },
            { term: "SLI", color: "emerald", def: "Actual measured metric" },
          ].map(({ term, color, def }) => (
            <div
              key={term}
              className={cn(
                "rounded-lg border p-2.5",
                color === "blue" && "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950",
                color === "violet" && "border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950",
                color === "emerald" && "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950",
              )}
            >
              <div className={cn(
                "text-xs font-bold mb-1",
                color === "blue" && "text-blue-600 dark:text-blue-400",
                color === "violet" && "text-violet-600 dark:text-violet-400",
                color === "emerald" && "text-emerald-600 dark:text-emerald-400",
              )}>{term}</div>
              <div className="text-[10px] text-zinc-500 leading-tight">{def}</div>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-zinc-100 dark:border-zinc-800 p-3 space-y-2 bg-zinc-50 dark:bg-zinc-800/50">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-600 dark:text-zinc-300 font-semibold">SLO: {sloPercent}% uptime</span>
            <span className="text-zinc-400 font-mono text-[10px]">Budget: {formatMin(budgetMin)}/month</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500">Current SLI: {currentUptime.toFixed(4)}%</span>
            <span className={cn("text-[10px] font-mono", breached ? "text-red-500" : "text-zinc-400")}>
              Remaining: {formatMin(Math.max(0, remainingMin))}
            </span>
          </div>
          <div>
            <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1">
              <span className="font-semibold uppercase tracking-widest">Budget consumed</span>
              <span className={cn("font-bold", breached ? "text-red-500" : budgetPct > 80 ? "text-amber-500" : "text-zinc-600")}>
                {Math.min(budgetPct, 100).toFixed(0)}%
              </span>
            </div>
            <div className="h-4 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-500", barColor)}
                style={{ width: `${Math.min(budgetPct, 100)}%` }}
              />
            </div>
          </div>
          {breached && (
            <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 px-3 py-2 text-xs font-bold text-red-700 dark:text-red-400 text-center">
              SLO BREACHED — notify on-call! Freeze new deploys.
            </div>
          )}
        </div>

        <div className="rounded-lg border border-zinc-100 dark:border-zinc-800 overflow-hidden flex-1">
          <div className="px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">The famous nines</span>
          </div>
          {NINES_TABLE.map((row, i) => (
            <div
              key={row.label}
              className={cn(
                "flex items-center justify-between px-3 py-1.5 text-[11px] border-t border-zinc-100 dark:border-zinc-800",
                i === ninesIdx ? "bg-violet-50 dark:bg-violet-950 font-semibold" : ""
              )}
            >
              <span className={cn("font-mono", i === ninesIdx ? "text-violet-600 dark:text-violet-400" : "text-zinc-600")}>
                {row.label}
              </span>
              <span className={cn(i === ninesIdx ? "text-violet-600 dark:text-violet-400" : "text-zinc-400")}>
                {row.downtime}
                {i === ninesIdx && " ← you are here"}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-3">
        <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">
          {breached
            ? "Error budget gone — stop deploying until reliability recovers"
            : `${formatMin(Math.max(0, remainingMin))} of allowed downtime left this month`}
        </span>
        <button
          onClick={simulateIncident}
          className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity shrink-0"
        >
          Simulate Incident
        </button>
      </div>
    </div>
  );
}
