"use client";

import { useState, useCallback } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Scale, RefreshCw, ArrowRight, Monitor, Server, ZapOff } from "lucide-react";

const AlgorithmEnum = z.enum(["round-robin", "least-connections", "ip-hash", "random", "weighted"]);
const BackendStatusEnum = z.enum(["healthy", "unhealthy", "draining"]);

export const LoadBalancerSchema = z.object({
  name: z.string().optional().default("Application Load Balancer"),
  algorithm: AlgorithmEnum.optional().default("round-robin"),
  protocol: z.enum(["HTTP", "HTTPS", "TCP", "UDP"]).optional().default("HTTPS"),
  backends: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      host: z.string().optional(),
      weight: z.number().optional().default(1),
      status: BackendStatusEnum.optional().default("healthy"),
      connections: z.number().optional().default(0),
      responseTime: z.number().optional(),
    })
  ),
  interactive: z.boolean().optional().default(true),
  showMetrics: z.boolean().optional().default(true),
});

export type LoadBalancerProps = z.infer<typeof LoadBalancerSchema>;

type Backend = LoadBalancerProps["backends"][number] & { requests: number };

const STATUS_CFG = {
  healthy:   { dot: "bg-emerald-500",  text: "text-emerald-600 dark:text-emerald-400", label: "healthy",   serverColor: "text-emerald-500" },
  unhealthy: { dot: "bg-red-500",      text: "text-red-600 dark:text-red-400",         label: "unhealthy", serverColor: "text-red-500"     },
  draining:  { dot: "bg-amber-500",    text: "text-amber-600 dark:text-amber-400",     label: "draining",  serverColor: "text-amber-500"   },
};

const ALGO_BADGE_COLOR: Record<string, string> = {
  "round-robin":        "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300",
  "weighted":           "bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300",
  "least-connections":  "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300",
  "ip-hash":            "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300",
  "random":             "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400",
};


let _rrIndex = 0;

export function LoadBalancer({
  name = "Application Load Balancer",
  algorithm = "round-robin",
  protocol = "HTTPS",
  backends: backendsProp,
  interactive = true,
  showMetrics = true,
}: LoadBalancerProps) {
  const [backends, setBackends] = useState<Backend[]>(() =>
    backendsProp.map((b) => ({ ...b, requests: 0 }))
  );
  const [lastTarget, setLastTarget] = useState<string | null>(null);
  const [totalRequests, setTotalRequests] = useState(0);
  const [animating, setAnimating] = useState(false);

  const healthyBackends = backends.filter((b) => b.status === "healthy");

  const pickBackend = useCallback((): Backend | null => {
    if (healthyBackends.length === 0) return null;
    if (algorithm === "round-robin") {
      const idx = _rrIndex % healthyBackends.length;
      _rrIndex++;
      return healthyBackends[idx]!;
    }
    if (algorithm === "least-connections") {
      return [...healthyBackends].sort((a, b) => a.connections - b.connections)[0]!;
    }
    if (algorithm === "weighted") {
      const totalWeight = healthyBackends.reduce((s, b) => s + (b.weight ?? 1), 0);
      let rand = Math.random() * totalWeight;
      for (const b of healthyBackends) {
        rand -= b.weight ?? 1;
        if (rand <= 0) return b;
      }
      return healthyBackends[0]!;
    }
    return healthyBackends[Math.floor(Math.random() * healthyBackends.length)]!;
  }, [healthyBackends, algorithm]);

  function sendRequest() {
    if (animating) return;
    const target = pickBackend();
    if (!target) return;
    setAnimating(true);
    setLastTarget(target.id);
    setTotalRequests((n) => n + 1);
    setBackends((prev) =>
      prev.map((b) =>
        b.id === target.id
          ? { ...b, requests: b.requests + 1, connections: b.connections + 1 }
          : b
      )
    );
    setTimeout(() => {
      setBackends((prev) =>
        prev.map((b) =>
          b.id === target.id ? { ...b, connections: Math.max(0, b.connections - 1) } : b
        )
      );
      setAnimating(false);
    }, 600);
  }

  function toggleBackend(id: string) {
    setBackends((prev) =>
      prev.map((b) =>
        b.id === id
          ? { ...b, status: b.status === "healthy" ? "unhealthy" : "healthy" }
          : b
      )
    );
  }

  function reset() {
    setBackends(backendsProp.map((b) => ({ ...b, requests: 0 })));
    setLastTarget(null);
    setTotalRequests(0);
    setAnimating(false);
    _rrIndex = 0;
  }

  const maxRequests = Math.max(1, ...backends.map((b) => b.requests));

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/50">
        <Scale className="size-3.5 text-zinc-400 shrink-0" />
        <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex-1">{name}</span>
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-[10px] font-mono px-2 py-0.5 rounded",
            ALGO_BADGE_COLOR[algorithm] ?? "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
          )}>
            {algorithm}
          </span>
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400">{protocol}</span>
        </div>
        {interactive && (
          <button onClick={reset} className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
            <RefreshCw className="size-3.5" />
          </button>
        )}
      </div>

      {/* Diagram area */}
      <div className="px-4 py-4">
        <div className="flex items-center gap-4">
          {/* Client */}
          <div className="shrink-0 flex flex-col items-center gap-1">
            <div className="size-10 rounded-lg border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
              <Monitor className="size-4 text-blue-500" />
            </div>
            <span className="text-[10px] text-zinc-400">Client</span>
          </div>

          {/* Arrow to LB */}
          <div className={cn("flex-1 flex items-center gap-1", animating && "opacity-100")}>
            <div className="flex-1 h-0.5 bg-zinc-200 dark:bg-zinc-800 relative overflow-hidden">
              {animating && (
                <div className="absolute inset-y-0 left-0 w-8 bg-blue-400 dark:bg-blue-500 animate-[slide-right_0.3s_ease-in-out]" />
              )}
            </div>
            <ArrowRight className="size-3 text-zinc-400 shrink-0" />
          </div>

          {/* Load balancer box */}
          <div className="shrink-0 flex flex-col items-center gap-1">
            <div className="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 flex items-center gap-1.5">
              <Scale className="size-3.5 text-zinc-400" />
              <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">LB</span>
            </div>
            {totalRequests > 0 && (
              <span className="text-[10px] text-zinc-400 tabular-nums">{totalRequests} req</span>
            )}
          </div>

          {/* Fan-out arrows */}
          <div className="flex-1 flex flex-col justify-center gap-2">
            {backends.map((b) => {
              const isTarget = b.id === lastTarget && animating;
              return (
                <div key={b.id} className="flex items-center gap-1">
                  <div className={cn(
                    "flex-1 h-0.5 transition-all duration-500",
                    b.status === "unhealthy" ? "bg-red-200 dark:bg-red-900/30" : "bg-zinc-200 dark:bg-zinc-800",
                    isTarget && "bg-blue-400 dark:bg-blue-500"
                  )} />
                  <ArrowRight className={cn("size-3 shrink-0", isTarget ? "text-blue-500" : "text-zinc-300 dark:text-zinc-700")} />
                </div>
              );
            })}
          </div>

          {/* Backends */}
          <div className="shrink-0 flex flex-col gap-2">
            {backends.map((b) => {
              const sc = STATUS_CFG[b.status ?? "healthy"];
              const isTarget = b.id === lastTarget && animating;
              return (
                <div
                  key={b.id}
                  onClick={() => interactive && toggleBackend(b.id)}
                  className={cn(
                    "flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-all duration-500",
                    b.status === "unhealthy"
                      ? "border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/10 opacity-60"
                      : b.status === "draining"
                      ? "border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/10"
                      : "border-zinc-200 dark:border-zinc-800",
                    isTarget && "border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/20 scale-105",
                    interactive && "cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700"
                  )}
                >
                  <div className="relative shrink-0">
                    <Server className={cn("size-3.5", sc.serverColor)} />
                    {b.status === "unhealthy" && (
                      <ZapOff className="size-2.5 text-red-500 absolute -top-1 -right-1" />
                    )}
                  </div>
                  <span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                    {b.label}
                  </span>
                  {b.weight && b.weight > 1 && (
                    <span className="text-[10px] text-zinc-400 ml-1">×{b.weight}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Distribution bars */}
      {showMetrics && totalRequests > 0 && (
        <div className="border-t border-zinc-50 dark:border-zinc-900 px-4 py-3">
          <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide mb-2">
            Request Distribution
          </div>
          <div className="space-y-2">
            {backends.map((b) => {
              const pct = Math.round((b.requests / totalRequests) * 100);
              const isRecent = b.id === lastTarget;
              return (
                <div key={b.id} className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-zinc-500 w-20 truncate shrink-0">{b.label}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-300",
                        isRecent ? "bg-blue-500" : "bg-zinc-400 dark:bg-zinc-600"
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 w-16 justify-end">
                    <span className="text-[10px] font-mono text-zinc-500">{b.requests}</span>
                    <span className="text-[10px] font-mono text-zinc-400">({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Controls */}
      {interactive && (
        <div className="border-t border-zinc-100 dark:border-zinc-900 px-4 py-2.5 flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900/30">
          <span className="text-[10px] text-zinc-400 flex-1">
            {healthyBackends.length}/{backends.length} backends healthy
            {interactive && " · click backend to toggle"}
          </span>
          <button
            onClick={sendRequest}
            disabled={animating || healthyBackends.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold transition-colors"
          >
            <ArrowRight className="size-3" />
            Send Request
          </button>
        </div>
      )}
    </div>
  );
}
