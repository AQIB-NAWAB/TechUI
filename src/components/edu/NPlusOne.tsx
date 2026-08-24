"use client";

import { useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { XCircle, CheckCircle2, Database } from "lucide-react";

export const NPlusOneSchema = z.object({
  title: z.string().optional().default("N+1 Query Problem"),
  entity: z.string().default("products"),
  relation: z.string().default("store"),
  badExample: z.string().optional(),
  goodExample: z.string().optional(),
  n: z.number().default(10),
});

const BAD_WIDTHS = [62, 71, 58, 75, 65, 69, 73, 60, 68, 55, 63, 72];

export type NPlusOneProps = z.infer<typeof NPlusOneSchema>;

export function NPlusOne({
  title = "N+1 Query Problem",
  entity = "products",
  relation = "store",
  badExample,
  goodExample,
  n = 10,
}: NPlusOneProps) {
  const [animating, setAnimating] = useState(false);
  const [badStep, setBadStep] = useState(0);
  const [goodDone, setGoodDone] = useState(false);
  const [showCode, setShowCode] = useState(false);

  const totalBad = n + 1;

  async function simulate() {
    if (animating) return;
    setAnimating(true);
    setBadStep(0);
    setGoodDone(false);
    setGoodDone(true);

    for (let i = 0; i <= totalBad; i++) {
      setBadStep(i);
      await new Promise((r) => setTimeout(r, 1200));
    }

    setAnimating(false);
  }

  const badFinished = badStep >= totalBad;

  const defaultBad = `// Bad: N+1 queries
const ${entity} = await ${entity[0].toUpperCase() + entity.slice(1)}.find({});
for (const item of ${entity}) {
  item.${relation} = await ${relation[0].toUpperCase() + relation.slice(1)}.findById(item.${relation}Id);
}
// Total: ${n + 1} DB queries`;

  const defaultGood = `// Good: Single query with populate
const ${entity} = await ${entity[0].toUpperCase() + entity.slice(1)}
  .find({})
  .populate('${relation}');
// Total: 1 DB query`;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800">
        <Database className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">{title}</span>
        <span className="text-[10px] font-mono text-zinc-400 border border-zinc-200 dark:border-zinc-700 px-2 py-0.5 rounded">
          {n} {entity}
        </span>
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        Loading related data in a loop fires one extra query per row — use a JOIN instead.
      </p>

      <div className="min-h-[220px] p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 mb-2">
            <XCircle className="size-4 text-red-500 shrink-0" />
            <span className="text-xs font-semibold text-red-600 dark:text-red-400">N+1 queries</span>
          </div>

          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3 flex-1">
            <p className="text-[10px] text-red-500 font-mono mb-2">
              1 query: SELECT * FROM {entity}
            </p>

            <div className="space-y-1 min-h-[12px]">
              {Array.from({ length: Math.min(badStep, 1) }).map((_, i) => (
                <div key={i} className="h-3 rounded bg-red-400 dark:bg-red-600 transition-all duration-500" style={{ width: "80%" }} />
              ))}
            </div>

            <p className={cn("text-[10px] text-red-400 font-mono mt-2 transition-all duration-500", badStep > 1 ? "opacity-100" : "opacity-0")}>
              Then for each {entity.slice(0, -1)}:
            </p>

            <div className="space-y-1 mt-1 min-h-[80px]">
              {Array.from({ length: Math.min(Math.max(badStep - 1, 0), n) }).map((_, i) => (
                <div
                  key={i}
                  className="h-2 rounded bg-red-300 dark:bg-red-700 transition-all duration-500"
                  style={{ width: `${BAD_WIDTHS[i % BAD_WIDTHS.length]}%` }}
                />
              ))}
            </div>

            <div className="mt-3 text-sm font-bold text-red-600 dark:text-red-400 min-h-[20px]">
              {badFinished && `Total: ${totalBad} queries`}
            </div>
          </div>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 mb-2">
            <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Single JOIN</span>
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 flex-1">
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mb-2">
              1 query: SELECT {entity} JOIN {relation}s
            </p>

            <div
              className="h-3 rounded bg-emerald-400 dark:bg-emerald-500 transition-all duration-700"
              style={{ width: goodDone ? "90%" : "0%" }}
            />

            <div className="mt-3 text-sm font-bold text-emerald-600 dark:text-emerald-400 min-h-[20px]">
              {goodDone && "Total: 1 query"}
            </div>
          </div>
        </div>
      </div>

      {showCode && (
        <div className="border-t border-zinc-100 dark:border-zinc-800 p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-lg border-l-4 border-l-red-400 border border-zinc-200 dark:border-zinc-700 overflow-hidden">
            <div className="bg-red-50 dark:bg-red-950/50 px-3 py-1.5 border-b border-zinc-200 dark:border-zinc-700">
              <span className="text-xs font-semibold text-red-600 dark:text-red-400">Bad Pattern</span>
            </div>
            <pre className="text-xs font-mono p-3 text-zinc-700 dark:text-zinc-300 overflow-x-auto leading-5">
              {badExample ?? defaultBad}
            </pre>
          </div>
          <div className="rounded-lg border-l-4 border-l-emerald-400 border border-zinc-200 dark:border-zinc-700 overflow-hidden">
            <div className="bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1.5 border-b border-zinc-200 dark:border-zinc-700">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Good Pattern</span>
            </div>
            <pre className="text-xs font-mono p-3 text-zinc-700 dark:text-zinc-300 overflow-x-auto leading-5">
              {goodExample ?? defaultGood}
            </pre>
          </div>
        </div>
      )}

      <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-3">
        <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">
          {badFinished
            ? `${totalBad} queries vs 1 — ${totalBad}× more database work`
            : `${n} ${entity} × 1 ${relation} lookup = ${totalBad} queries`}
        </span>
        <button
          onClick={simulate}
          disabled={animating}
          className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0"
        >
          {animating ? "Running…" : "Simulate"}
        </button>
      </div>
    </div>
  );
}
