"use client";

import { useState, useRef } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Database, Server, ArrowRight } from "lucide-react";

export const DatabaseShardingSchema = z.object({
  shardKey: z.string().default("user_id"),
  totalRecords: z.number().default(10000),
  shards: z.array(z.object({
    id: z.string(),
    label: z.string(),
    recordCount: z.number(),
    color: z.enum(["blue", "violet", "emerald", "amber"]),
  })).default([
    { id: "shard-1", label: "Shard 1 (US-East)", recordCount: 3421, color: "blue" },
    { id: "shard-2", label: "Shard 2 (US-West)", recordCount: 3289, color: "violet" },
    { id: "shard-3", label: "Shard 3 (EU)", recordCount: 3290, color: "emerald" },
  ]),
});

export type DatabaseShardingProps = z.infer<typeof DatabaseShardingSchema>;

const colorMap = {
  blue:    { bar: "bg-blue-500",    ring: "ring-blue-400",    text: "text-blue-600 dark:text-blue-400",    badge: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300" },
  violet:  { bar: "bg-violet-500",  ring: "ring-violet-400",  text: "text-violet-600 dark:text-violet-400",  badge: "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300" },
  emerald: { bar: "bg-emerald-500", ring: "ring-emerald-400", text: "text-emerald-600 dark:text-emerald-400", badge: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300" },
  amber:   { bar: "bg-amber-500",   ring: "ring-amber-400",   text: "text-amber-600 dark:text-amber-400",   badge: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300" },
};

export function DatabaseSharding({
  shardKey = "user_id",
  totalRecords = 10000,
  shards = [
    { id: "shard-1", label: "Shard 1 (US-East)", recordCount: 3421, color: "blue" as const },
    { id: "shard-2", label: "Shard 2 (US-West)", recordCount: 3289, color: "violet" as const },
    { id: "shard-3", label: "Shard 3 (EU)", recordCount: 3290, color: "emerald" as const },
  ],
}: DatabaseShardingProps) {
  const [inputValue, setInputValue] = useState("1042");
  const [routedShardId, setRoutedShardId] = useState<string | null>(null);
  const [animating, setAnimating] = useState(false);
  const [showFormula, setShowFormula] = useState(false);
  const [localCounts, setLocalCounts] = useState<Record<string, number>>({});
  const highlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const shardCounts = shards.map((s) => ({
    ...s,
    recordCount: s.recordCount + (localCounts[s.id] ?? 0),
  }));

  function computeRoute(val: string) {
    const num = parseInt(val) || 0;
    const idx = Math.abs(num) % shards.length;
    return { idx, shard: shards[idx], hashVal: Math.abs(num) };
  }

  function handleRoute() {
    if (animating) return;
    setAnimating(true);
    setShowFormula(true);
    setRoutedShardId(null);

    const { shard, idx } = computeRoute(inputValue);
    setTimeout(() => {
      setRoutedShardId(shard.id);
      setLocalCounts((prev) => ({ ...prev, [shard.id]: (prev[shard.id] ?? 0) + 1 }));
      if (highlightTimer.current) clearTimeout(highlightTimer.current);
      highlightTimer.current = setTimeout(() => {
        setRoutedShardId(null);
        setAnimating(false);
      }, 2000);
    }, 1000);

    void idx; // used in formula display below
  }

  const { idx: routeIdx, hashVal } = computeRoute(inputValue);
  const targetShardLabel = shards[routeIdx]?.label ?? "";

  // Distribution quality
  const counts = shardCounts.map((s) => s.recordCount);
  const maxCount = Math.max(...counts);
  const minCount = Math.min(...counts);
  const ratio = minCount > 0 ? maxCount / minCount : Infinity;
  const distQuality = ratio < 1.2 ? "Even" : "Uneven";

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
        <Database className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">Database Sharding</span>
        <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
          {shards.length} shards
        </span>
      </div>

      <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Split a large database into smaller shards. Each record routes to one shard based on a hash of the shard key.
        </p>
      </div>

      <div className="p-4 space-y-4 min-h-[280px]">
        {/* Routing flow */}
        <div className="flex items-center justify-center gap-2 py-2 border border-zinc-100 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-800/40">
          <Server className={cn("size-4 transition-all duration-500", animating ? "text-blue-500" : "text-zinc-400")} />
          <div className="relative flex-1 h-1 max-w-[80px] bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
            {animating && (
              <div className="absolute inset-y-0 w-2 bg-blue-500 rounded-full animate-[travel_1s_ease-in-out_forwards]" />
            )}
          </div>
          <ArrowRight className={cn("size-3 transition-all duration-500", routedShardId ? "text-emerald-500" : "text-zinc-300")} />
          <Database className={cn("size-4 transition-all duration-500", routedShardId ? "text-emerald-500" : "text-zinc-400")} />
          <span className="text-[10px] font-semibold text-zinc-500">{routedShardId ? targetShardLabel : "Shard ?"}</span>
        </div>
        {/* Input + formula row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">{shardKey}:</span>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setShowFormula(false);
              setRoutedShardId(null);
            }}
            className="w-24 px-2 py-1 text-sm font-mono border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-500"
            placeholder="e.g. 1042"
          />
          {showFormula && (
            <div className="flex items-center gap-1.5 text-xs font-mono transition-all duration-500">
              <span className="text-zinc-400">→</span>
              <span className="text-zinc-600 dark:text-zinc-300">hash({hashVal}) % {shards.length}</span>
              <span className="text-zinc-400">=</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">{routeIdx}</span>
              <span className="text-zinc-400">→</span>
              <span className="font-semibold text-zinc-700 dark:text-zinc-200">{targetShardLabel}</span>
            </div>
          )}
        </div>

        {/* Shard grid */}
        <div className="grid grid-cols-2 gap-3">
          {shardCounts.map((shard) => {
            const colors = colorMap[shard.color] ?? colorMap.blue;
            const pct = Math.round((shard.recordCount / totalRecords) * 100);
            const isRouted = routedShardId === shard.id;

            return (
              <div
                key={shard.id}
                className={cn(
                  "rounded-lg border p-3 transition-all duration-500",
                  isRouted
                    ? `ring-2 ${colors.ring} scale-105 border-transparent bg-zinc-50 dark:bg-zinc-800`
                    : "border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50"
                )}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-200">{shard.label}</span>
                  {isRouted && (
                    <span className={cn("text-[9px] font-bold uppercase px-1.5 py-0.5 rounded", colors.badge)}>
                      Routed
                    </span>
                  )}
                </div>
                <div className="text-xs font-mono text-zinc-500 dark:text-zinc-400 mb-2">
                  {shard.recordCount.toLocaleString()} records
                </div>
                <div className="h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-500", colors.bar)}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
                <div className={cn("text-[9px] font-mono mt-1", colors.text)}>{pct}% of total</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 bg-zinc-50 dark:bg-zinc-900/40 flex items-center gap-3">
        <span className="text-xs text-zinc-500 flex-1">
          {animating ? "Routing record to shard…" : showFormula ? `Routed to ${targetShardLabel}` : `Enter a ${shardKey} and click Route`}
        </span>
        <span className="text-[10px] text-zinc-400 hidden sm:inline">
          Total: {totalRecords.toLocaleString()} · {distQuality} distribution
        </span>
        <button
          onClick={handleRoute}
          disabled={animating}
          className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0"
        >
          Route
        </button>
      </div>
      <style>{`
        @keyframes travel {
          from { left: 0; opacity: 1; }
          to { left: calc(100% - 8px); opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
