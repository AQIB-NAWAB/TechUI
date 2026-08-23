"use client";

import { useState } from "react";
import { z } from "zod";
import { XCircle, CheckCircle2, Code2 } from "lucide-react";

export const NPlusOneSchema = z.object({
  title: z.string().optional().default("N+1 Query Problem"),
  entity: z.string().default("products"),
  relation: z.string().default("store"),
  badExample: z.string().optional(),
  goodExample: z.string().optional(),
  n: z.number().default(10),
});

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
      await new Promise((r) => setTimeout(r, 300));
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
      <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Code2 className="size-3.5 text-zinc-400 shrink-0" />
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{title}</h3>
        </div>
        <button
          onClick={() => setShowCode((s) => !s)}
          className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors duration-500"
        >
          {showCode ? "Hide code" : "Show code"}
        </button>
      </div>

      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 min-h-[220px]">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 mb-3">
            <XCircle className="size-4 text-red-500 shrink-0" />
            <span className="text-sm font-bold text-red-600 dark:text-red-400">The Problem (N+1)</span>
          </div>

          <div className="bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 rounded-lg p-3 flex-1">
            <p className="text-[10px] text-red-500 font-mono mb-2">
              1 query: SELECT * FROM {entity}
            </p>

            <div className="space-y-1">
              {Array.from({ length: Math.min(badStep, 1) }).map((_, i) => (
                <div key={i} className="h-3 rounded bg-red-400 dark:bg-red-600 transition-all duration-500"
                  style={{ width: "80%" }} />
              ))}
            </div>

            {badStep > 1 && (
              <p className="text-[10px] text-red-400 font-mono mt-2">
                Then for each {entity.slice(0, -1)}:
              </p>
            )}

            <div className="space-y-1 mt-1">
              {Array.from({ length: Math.min(Math.max(badStep - 1, 0), n) }).map((_, i) => (
                <div
                  key={i}
                  className="h-2 rounded bg-red-300 dark:bg-red-700 transition-all duration-500"
                  style={{ width: `${50 + Math.random() * 30}%` }}
                />
              ))}
            </div>

            {badFinished && (
              <div className="mt-3 text-sm font-bold text-red-600 dark:text-red-400 animate-none">
                😱 Total: {totalBad} queries
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 mb-3">
            <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">The Fix (JOIN / populate)</span>
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900 rounded-lg p-3 flex-1">
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mb-2">
              1 query: SELECT {entity} JOIN {relation}s
            </p>

            <div className="h-3 rounded transition-all duration-700"
              style={{
                width: goodDone ? "90%" : "0%",
                backgroundColor: "rgb(52, 211, 153)",
              }} />

            {goodDone && (
              <div className="mt-3 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                ✓ Total: 1 query
              </div>
            )}
          </div>
        </div>
      </div>

      {showCode && (
        <div className="border-t border-zinc-100 dark:border-zinc-800 p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-lg border-l-4 border-l-red-400 border border-zinc-200 dark:border-zinc-700 overflow-hidden">
            <div className="bg-red-50 dark:bg-red-950/50 px-3 py-1.5 border-b border-zinc-200 dark:border-zinc-700">
              <span className="text-xs font-semibold text-red-600 dark:text-red-400">❌ Bad Pattern</span>
            </div>
            <pre className="text-xs font-mono p-3 text-zinc-700 dark:text-zinc-300 overflow-x-auto leading-5">
              {badExample ?? defaultBad}
            </pre>
          </div>
          <div className="rounded-lg border-l-4 border-l-emerald-400 border border-zinc-200 dark:border-zinc-700 overflow-hidden">
            <div className="bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1.5 border-b border-zinc-200 dark:border-zinc-700">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">✅ Good Pattern</span>
            </div>
            <pre className="text-xs font-mono p-3 text-zinc-700 dark:text-zinc-300 overflow-x-auto leading-5">
              {goodExample ?? defaultGood}
            </pre>
          </div>
        </div>
      )}

      <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
        <span className="text-xs text-zinc-400">
          {badFinished
            ? `${totalBad} queries vs 1 query — ${totalBad}× more work`
            : `${n} ${entity} × 1 ${relation} lookup each = ${totalBad} queries`}
        </span>
        <button
          onClick={simulate}
          disabled={animating}
          className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          Simulate
        </button>
      </div>
    </div>
  );
}
