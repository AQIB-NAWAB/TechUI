"use client";

import { useState, useRef, useEffect } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import {
  Monitor,
  Globe,
  GitBranch,
  Server,
  Database,
  Zap,
  Activity,
} from "lucide-react";

export const NetworkLatencySchema = z.object({
  hops: z
    .array(
      z.object({
        name: z.string(),
        type: z.enum(["client", "cdn", "loadbalancer", "server", "database", "cache"]),
        latencyMs: z.number(),
      })
    )
    .default([
      { name: "Browser", type: "client", latencyMs: 0 },
      { name: "CDN Edge", type: "cdn", latencyMs: 8 },
      { name: "Load Balancer", type: "loadbalancer", latencyMs: 2 },
      { name: "App Server", type: "server", latencyMs: 45 },
      { name: "PostgreSQL", type: "database", latencyMs: 12 },
    ]),
});

export type NetworkLatencyProps = z.infer<typeof NetworkLatencySchema>;

const HOP_ICONS: Record<string, React.ReactNode> = {
  client: <Monitor className="size-4" />,
  cdn: <Globe className="size-4" />,
  loadbalancer: <GitBranch className="size-4" />,
  server: <Server className="size-4" />,
  database: <Database className="size-4" />,
  cache: <Zap className="size-4" />,
};

export function NetworkLatency({ hops = [] }: NetworkLatencyProps) {
  const [activeHopIdx, setActiveHopIdx] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const measurableHops = hops.filter((h) => h.latencyMs > 0);
  const totalMs = measurableHops.reduce((acc, h) => acc + h.latencyMs, 0);

  const bottleneckIdx = measurableHops.reduce(
    (maxIdx, h, i, arr) => (h.latencyMs > arr[maxIdx].latencyMs ? i : maxIdx),
    0
  );

  const cumulativeTotals = measurableHops.reduce<number[]>((acc, h) => {
    const prev = acc.length > 0 ? acc[acc.length - 1] : 0;
    acc.push(prev + h.latencyMs);
    return acc;
  }, []);

  function measure() {
    if (running) return;
    setDone(false);
    setActiveHopIdx(null);
    setRunning(true);

    let i = 0;
    function step() {
      setActiveHopIdx(i);
      i++;
      if (i < measurableHops.length) {
        timerRef.current = setTimeout(step, 1200);
      } else {
        timerRef.current = setTimeout(() => {
          setRunning(false);
          setDone(true);
        }, 1000);
      }
    }
    step();
  }

  function reset() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setActiveHopIdx(null);
    setRunning(false);
    setDone(false);
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const activeHop = activeHopIdx !== null ? measurableHops[activeHopIdx] : null;
  const activeCumulative = activeHopIdx !== null ? cumulativeTotals[activeHopIdx] : 0;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <Activity className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">Network Latency</span>
        {done && (
          <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
            Total: <span className="font-bold text-zinc-800 dark:text-zinc-100">{totalMs}ms</span>
          </span>
        )}
      </div>

      <p className="text-sm text-zinc-500 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        Trace how long each hop adds to your request — find the bottleneck.
      </p>

      <div className="min-h-[220px] px-4 py-3 flex flex-col">
        <div className="flex items-center justify-center gap-0 flex-wrap py-2">
          {hops.map((hop, i) => {
            const mIdx = measurableHops.findIndex((m) => m === hop);
            const isActive = mIdx !== -1 && activeHopIdx === mIdx;
            const isDone = done || (activeHopIdx !== null && mIdx !== -1 && mIdx < activeHopIdx);
            const isBottleneck = done && mIdx === bottleneckIdx;
            const isLast = i === hops.length - 1;

            return (
              <div key={i} className="flex items-center">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={cn(
                      "size-10 rounded-lg border-2 flex items-center justify-center transition-all duration-500",
                      isActive
                        ? "border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 scale-110"
                        : isBottleneck
                        ? "border-amber-400 dark:border-amber-500 bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400"
                        : isDone
                        ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400"
                        : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-400"
                    )}
                  >
                    {HOP_ICONS[hop.type] ?? <Server className="size-4" />}
                  </div>
                  <span className={cn(
                    "text-[10px] font-medium text-center max-w-[60px] leading-tight transition-colors duration-500",
                    isActive ? "text-blue-600 dark:text-blue-400"
                      : isBottleneck ? "text-amber-600 dark:text-amber-400"
                      : "text-zinc-500 dark:text-zinc-400"
                  )}>
                    {hop.name}
                  </span>
                </div>

                {!isLast && (
                  <div className="flex flex-col items-center mx-1">
                    {hops[i + 1].latencyMs > 0 ? (
                      <span className={cn(
                        "text-[9px] font-mono mb-0.5 transition-colors duration-500",
                        isActive ? "text-blue-500 dark:text-blue-400 font-bold" : "text-zinc-400"
                      )}>
                        {hops[i + 1].latencyMs}ms
                      </span>
                    ) : (
                      <span className="text-[9px] mb-0.5 opacity-0">0ms</span>
                    )}
                    <div className={cn(
                      "flex items-center transition-colors duration-500",
                      isActive ? "text-blue-400" : "text-zinc-300 dark:text-zinc-600"
                    )}>
                      <div className="w-6 h-px bg-current" />
                      <div className="w-0 h-0 border-t-2 border-b-2 border-l-4 border-transparent border-l-current" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="min-h-[80px] mt-2">
          {(running || done) ? (
            <div className={cn(
              "p-3 rounded-lg border transition-all duration-500",
              activeHop && !done
                ? "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950"
                : "border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50"
            )}>
              {activeHop && !done ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-blue-700 dark:text-blue-300">
                      Current: {activeHop.name}
                    </span>
                    <span className="font-mono text-blue-600 dark:text-blue-400">
                      +{activeHop.latencyMs}ms · cumulative: {activeCumulative}ms
                    </span>
                  </div>
                  <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-400 dark:bg-blue-500 rounded-full transition-all duration-700"
                      style={{ width: `${Math.min((activeCumulative / totalMs) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ) : done ? (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Measurement complete · {measurableHops.length} hops · {totalMs}ms total
                </p>
              ) : null}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-xs text-zinc-400">Click Measure to trace latency across each hop</p>
            </div>
          )}
        </div>

        <div className="mt-auto space-y-1.5 pt-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
            Hop breakdown
          </p>
          {measurableHops.map((hop, i) => {
            const pct = totalMs > 0 ? (hop.latencyMs / totalMs) * 100 : 0;
            const isBottleneck = done && i === bottleneckIdx;
            const isCurrentlyActive = activeHopIdx === i;

            return (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-500 w-24 truncate shrink-0">{hop.name}</span>
                <div className="flex-1 h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-700",
                      isBottleneck ? "bg-amber-400"
                        : isCurrentlyActive ? "bg-blue-400"
                        : "bg-zinc-300 dark:bg-zinc-600"
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono text-zinc-500 w-8 shrink-0">{hop.latencyMs}ms</span>
                {isBottleneck && (
                  <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 shrink-0">
                    bottleneck
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className={cn(
        "border-t px-4 py-3 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/30 transition-all duration-500",
        done ? "border-amber-100 dark:border-amber-900/30" : "border-zinc-100 dark:border-zinc-800"
      )}>
        <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">
          {done
            ? `${measurableHops[bottleneckIdx]?.name} is the bottleneck (${totalMs}ms total)`
            : running
            ? `Tracing… ${activeCumulative}ms so far`
            : `${measurableHops.length} hops · ${totalMs}ms total`}
        </span>
        <button
          onClick={running || done ? reset : measure}
          disabled={running}
          className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {running ? "Measuring…" : done ? "Reset" : "Measure"}
        </button>
      </div>
    </div>
  );
}
