"use client";

import { useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { BarChart3 } from "lucide-react";

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
  // Returns index of the closest nines row
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
  const [sloPercent]                       = useState(initialSlo);

  const budgetMin      = calcBudgetMin(sloPercent, windowDays);
  const usedMin        = calcBudgetMin(currentUptime > sloPercent ? sloPercent : currentUptime, windowDays);
  // Actually: used = budget - remaining
  // remaining = (currentUptime - sloPercent) / 100 * days * 24 * 60
  // if currentUptime >= sloPercent: unused budget remaining
  // usedMin = budgetMin - remainingMin
  const remainingMin   = Math.max(0, ((currentUptime - sloPercent) / 100) * windowDays * 24 * 60);
  const usedMinActual  = Math.max(0, budgetMin - remainingMin);
  const budgetPct      = budgetMin > 0 ? Math.min((usedMinActual / budgetMin) * 100, 120) : 0;
  const breached       = budgetPct >= 100;

  const ninesIdx = findNinesRow(sloPercent);

  function simulateIncident() {
    // Consume 10 minutes of budget by reducing uptime
    const lostPct = 10 / (windowDays * 24 * 60) * 100;
    setCurrentUptime((prev) => Math.max(prev - lostPct, 0));
  }

  function reset() {
    setCurrentUptime(initialUptime);
  }

  const barColor =
    budgetPct > 80  ? "bg-red-500 dark:bg-red-500"
    : budgetPct > 50 ? "bg-amber-400 dark:bg-amber-400"
    : "bg-emerald-500 dark:bg-emerald-500";

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <BarChart3 className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">SLO / SLI / SLA</span>
        <span className="text-[10px] text-zinc-400">{windowDays}-day window</span>
      </div>

      <div className="min-h-[300px] p-4 space-y-4">
        {/* Term definitions */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { term: "SLA", color: "blue",    def: "Contract with customers (legal, external)" },
            { term: "SLO", color: "violet",  def: "Internal reliability target you aim for" },
            { term: "SLI", color: "emerald", def: "Actual measured metric (e.g. uptime %)" },
          ].map(({ term, color, def }) => (
            <div
              key={term}
              className={cn(
                "rounded-lg border p-2.5",
                color === "blue"   && "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30",
                color === "violet" && "border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/30",
                color === "emerald"&& "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30",
              )}
            >
              <div className={cn(
                "text-xs font-bold mb-1",
                color === "blue"   && "text-blue-600 dark:text-blue-400",
                color === "violet" && "text-violet-600 dark:text-violet-400",
                color === "emerald"&& "text-emerald-600 dark:text-emerald-400",
              )}>{term}</div>
              <div className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight">{def}</div>
            </div>
          ))}
        </div>

        {/* Budget section */}
        <div className="rounded-lg border border-zinc-100 dark:border-zinc-800 p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-600 dark:text-zinc-300 font-semibold">Your SLO: {sloPercent}% uptime</span>
            <span className="text-zinc-400 font-mono text-[10px]">Budget: {formatMin(budgetMin)}/month</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500 dark:text-zinc-400">Current SLI: {currentUptime.toFixed(4)}% uptime</span>
            <span className={cn("text-[10px] font-mono", breached ? "text-red-500" : "text-zinc-400")}>
              Remaining: {formatMin(Math.max(0, remainingMin))}
            </span>
          </div>

          {/* Budget bar */}
          <div>
            <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1">
              <span>Budget consumed</span>
              <span className={cn("font-bold", breached ? "text-red-500" : budgetPct > 80 ? "text-amber-500" : "text-zinc-600 dark:text-zinc-300")}>
                {Math.min(budgetPct, 100).toFixed(0)}%
              </span>
            </div>
            <div className="h-4 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden relative">
              <div
                className={cn("h-full rounded-full transition-all duration-500", barColor)}
                style={{ width: `${Math.min(budgetPct, 100)}%` }}
              />
            </div>
          </div>

          {/* Breached banner */}
          {breached && (
            <div className="rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/40 px-3 py-2 text-xs font-bold text-red-600 dark:text-red-400 text-center">
              SLO BREACHED — notify on-call! Freeze new deploys.
            </div>
          )}
        </div>

        {/* Nines table */}
        <div className="rounded-lg border border-zinc-100 dark:border-zinc-800 overflow-hidden">
          <div className="px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800/50 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
            The famous nines
          </div>
          {NINES_TABLE.map((row, i) => (
            <div
              key={row.label}
              className={cn(
                "flex items-center justify-between px-3 py-1.5 text-[11px] border-t border-zinc-100 dark:border-zinc-800",
                i === ninesIdx
                  ? "bg-violet-50 dark:bg-violet-950/30 font-semibold"
                  : "bg-white dark:bg-zinc-900"
              )}
            >
              <span className={cn("font-mono", i === ninesIdx ? "text-violet-600 dark:text-violet-400" : "text-zinc-600 dark:text-zinc-400")}>
                {row.label}
              </span>
              <span className={cn(i === ninesIdx ? "text-violet-600 dark:text-violet-400" : "text-zinc-400")}>
                {row.downtime}
                {i === ninesIdx && " ← you are here"}
              </span>
            </div>
          ))}
        </div>

        {/* Key insight */}
        <div className="text-[10px] text-zinc-400 dark:text-zinc-500 bg-zinc-50 dark:bg-zinc-800/40 rounded-lg px-3 py-2">
          Error budget = the allowed downtime. When it&apos;s gone, freeze new deploys to protect reliability.
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            onClick={simulateIncident}
            className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Simulate incident (10 min)
          </button>
          <button
            onClick={reset}
            className="rounded-lg px-4 py-2 text-sm font-semibold border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all duration-300"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
