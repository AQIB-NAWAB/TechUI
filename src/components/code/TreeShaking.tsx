"use client";

import { useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Scissors, Check, X } from "lucide-react";

export const TreeShakingSchema = z.object({
  bundler: z.enum(["webpack", "rollup", "esbuild"]).default("rollup"),
  entryPoint: z.string().default("app.js"),
  modules: z.array(z.object({
    name: z.string(),
    exports: z.array(z.object({
      name: z.string(),
      sizeKb: z.number(),
      used: z.boolean(),
    })),
  })).default([
    { name: "lodash-es", exports: [
      { name: "debounce",  sizeKb: 1.2, used: true  },
      { name: "throttle",  sizeKb: 1.1, used: false },
      { name: "merge",     sizeKb: 2.3, used: false },
      { name: "cloneDeep", sizeKb: 3.8, used: false },
    ]},
    { name: "date-fns", exports: [
      { name: "format",  sizeKb: 0.8, used: true  },
      { name: "parse",   sizeKb: 0.9, used: true  },
      { name: "addDays", sizeKb: 0.3, used: false },
    ]},
  ]),
});

export type TreeShakingProps = z.infer<typeof TreeShakingSchema>;

const BUNDLER_LABELS: Record<string, string> = {
  webpack: "Webpack 5",
  rollup:  "Rollup",
  esbuild: "esbuild",
};

const BUNDLER_COLORS: Record<string, string> = {
  webpack: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
  rollup:  "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
  esbuild: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300",
};

export function TreeShaking({
  bundler = "rollup",
  entryPoint = "app.js",
  modules = [
    { name: "lodash-es", exports: [
      { name: "debounce",  sizeKb: 1.2, used: true  },
      { name: "throttle",  sizeKb: 1.1, used: false },
      { name: "merge",     sizeKb: 2.3, used: false },
      { name: "cloneDeep", sizeKb: 3.8, used: false },
    ]},
    { name: "date-fns", exports: [
      { name: "format",  sizeKb: 0.8, used: true  },
      { name: "parse",   sizeKb: 0.9, used: true  },
      { name: "addDays", sizeKb: 0.3, used: false },
    ]},
  ],
}: TreeShakingProps) {
  const [activeBundler, setActiveBundler] = useState(bundler);
  const [showAll, setShowAll] = useState(true);
  const [showImport, setShowImport] = useState(false);

  const totalKb = modules.flatMap((m) => m.exports).reduce((sum, e) => sum + e.sizeKb, 0);
  const usedKb = modules.flatMap((m) => m.exports).filter((e) => e.used).reduce((sum, e) => sum + e.sizeKb, 0);
  const savedPct = Math.round(((totalKb - usedKb) / totalKb) * 100);

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/50">
        <Scissors className="size-3.5 text-zinc-400 shrink-0" />
        <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex-1">Tree Shaking</span>
        <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">Entry: {entryPoint}</span>
      </div>

      {/* Bundler tabs */}
      <div className="flex border-b border-zinc-100 dark:border-zinc-800">
        {(["webpack", "rollup", "esbuild"] as const).map((b) => (
          <button
            key={b}
            onClick={() => setActiveBundler(b)}
            className={cn(
              "flex-1 py-2 text-xs font-semibold transition-all duration-500",
              activeBundler === b
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border-b-2 border-zinc-900 dark:border-zinc-100"
                : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 bg-zinc-50 dark:bg-zinc-900/50"
            )}
          >
            {BUNDLER_LABELS[b]}
          </button>
        ))}
      </div>

      <div className="p-4 min-h-[300px] flex flex-col gap-3">
        {/* Bundler badge */}
        <div className="flex items-center justify-between">
          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded", BUNDLER_COLORS[activeBundler])}>
            {BUNDLER_LABELS[activeBundler]}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowImport((v) => !v)}
              className="text-[10px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 underline transition-colors"
            >
              {showImport ? "Hide import" : "Show import"}
            </button>
            <button
              onClick={() => setShowAll((v) => !v)}
              className="text-[10px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 underline transition-colors"
            >
              {showAll ? "Used only" : "Show all"}
            </button>
          </div>
        </div>

        {/* Import statement */}
        {showImport && (
          <div className="bg-zinc-50 dark:bg-zinc-800/60 rounded-lg px-3 py-2 text-[11px] font-mono transition-all duration-500">
            <div className="text-emerald-600 dark:text-emerald-400 mb-1">
              {/* Named import = tree-shakeable */}
              <span className="text-blue-500">import</span>
              {" { "}
              {modules.flatMap((m) => m.exports.filter((e) => e.used).map((e) => e.name)).join(", ")}
              {" } "}
              <span className="text-blue-500">from</span>
              {` '${modules[0]?.name ?? "lib"}'`}
              <span className="ml-2 text-emerald-600 dark:text-emerald-400 text-[10px] not-italic font-sans">✓ tree-shakeable</span>
            </div>
            <div className="text-red-500 dark:text-red-400 text-[10px] mt-1 border-t border-zinc-200 dark:border-zinc-700 pt-1">
              <span className="opacity-50">// vs.</span>{" "}
              <span className="text-blue-500">import</span>
              {` _ from '${modules[0]?.name?.replace("-es", "") ?? "lib"}'`}
              <span className="ml-2 text-red-500 text-[10px] font-sans">✗ bundles everything</span>
            </div>
          </div>
        )}

        {/* Module exports list */}
        <div className="flex flex-col gap-3">
          {modules.map((mod) => (
            <div key={mod.name}>
              <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold mb-1.5 font-mono">
                {mod.name}
              </div>
              <div className="flex flex-col gap-1">
                {mod.exports
                  .filter((e) => showAll || e.used)
                  .map((exp) => (
                    <div
                      key={exp.name}
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-3 py-1.5 transition-all duration-500",
                        exp.used
                          ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                          : "bg-zinc-50 dark:bg-zinc-800/40 border border-transparent opacity-60"
                      )}
                    >
                      {exp.used ? (
                        <Check className="size-3 text-emerald-500 shrink-0" />
                      ) : (
                        <X className="size-3 text-zinc-400 shrink-0" />
                      )}
                      <span className={cn(
                        "text-xs font-mono flex-1",
                        exp.used
                          ? "text-blue-700 dark:text-blue-300 font-semibold"
                          : "text-zinc-400 line-through"
                      )}>
                        {exp.name}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400">{exp.sizeKb}KB</span>
                      {exp.used ? (
                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40 px-1.5 py-0.5 rounded">
                          INCLUDED
                        </span>
                      ) : (
                        <span className="text-[10px] text-zinc-400 italic">shaken out</span>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bundle size comparison */}
        <div className="mt-auto">
          <div className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wide mb-2">Bundle size</div>
          <div className="flex flex-col gap-1.5">
            <div>
              <div className="flex justify-between text-[10px] mb-1">
                <span className="text-red-500 dark:text-red-400">Without tree-shaking</span>
                <span className="font-mono font-bold text-red-600 dark:text-red-400">{totalKb.toFixed(1)}KB</span>
              </div>
              <div className="h-4 rounded-md bg-red-100 dark:bg-red-900/20 overflow-hidden">
                <div className="h-full bg-red-400 dark:bg-red-600 rounded-md w-full transition-all duration-500" />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[10px] mb-1">
                <span className="text-emerald-600 dark:text-emerald-400">With tree-shaking ({activeBundler})</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{usedKb.toFixed(1)}KB</span>
              </div>
              <div className="h-4 rounded-md bg-emerald-100 dark:bg-emerald-900/20 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-md transition-all duration-500"
                  style={{ width: `${(usedKb / totalKb) * 100}%` }}
                />
              </div>
            </div>
          </div>
          <div className="mt-2 text-center text-xs font-bold text-emerald-600 dark:text-emerald-400">
            {savedPct}% smaller — {(totalKb - usedKb).toFixed(1)}KB eliminated
          </div>
        </div>

        {/* Key insight */}
        <div className="bg-zinc-50 dark:bg-zinc-800/60 rounded-lg px-3 py-2 text-[11px] text-zinc-500 dark:text-zinc-400 border border-zinc-100 dark:border-zinc-700">
          <span className="font-semibold text-zinc-700 dark:text-zinc-300">Key insight: </span>
          Named imports + ES modules = tree-shakeable. Default imports bundle everything.
        </div>
      </div>
    </div>
  );
}
