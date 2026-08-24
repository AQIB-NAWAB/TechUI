"use client";

import { useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertTriangle, XCircle, Wrench, Server, RefreshCw } from "lucide-react";

export const ServerStatusSchema = z.object({
  title: z.string().optional().default("System Status"),
  overallStatus: z.enum(["operational", "degraded", "outage", "maintenance"]).optional().default("operational"),
  lastUpdated: z.string().optional().default("2 min ago"),
  interactive: z.boolean().optional().default(true),
  services: z.array(
    z.object({
      name: z.string(),
      status: z.enum(["operational", "degraded", "down", "maintenance"]),
      uptime: z.number().optional(),
      latency: z.number().optional(),
      description: z.string().optional(),
    })
  ),
});

export type ServerStatusProps = z.infer<typeof ServerStatusSchema>;

type SvcStatus = "operational" | "degraded" | "down" | "maintenance";

const STATUS = {
  operational: { label: "Operational", dot: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400", Icon: CheckCircle2 },
  degraded:    { label: "Degraded",    dot: "bg-amber-500",   text: "text-amber-600 dark:text-amber-400",   Icon: AlertTriangle },
  down:        { label: "Down",        dot: "bg-red-500",     text: "text-red-600 dark:text-red-400",       Icon: XCircle },
  maintenance: { label: "Maintenance", dot: "bg-blue-400",    text: "text-blue-600 dark:text-blue-400",     Icon: Wrench },
};

const OVERALL = {
  operational: { label: "All Systems Operational", cls: "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800" },
  degraded:    { label: "Some Services Degraded",  cls: "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800" },
  outage:      { label: "Service Outage Detected", cls: "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800" },
  maintenance: { label: "Under Scheduled Maintenance", cls: "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800" },
};

function jitterLatency(base: number) {
  return Math.max(1, Math.round(base + (Math.random() - 0.5) * base * 0.15));
}

export function ServerStatus({
  title = "System Status",
  overallStatus: initialOverall = "operational",
  lastUpdated: initialUpdated = "2 min ago",
  interactive = true,
  services: initialServices,
}: ServerStatusProps) {
  const [services, setServices] = useState(initialServices);
  const [overallStatus, setOverallStatus] = useState(initialOverall);
  const [lastUpdated, setLastUpdated] = useState(initialUpdated);
  const [refreshing, setRefreshing] = useState(false);

  const overall = OVERALL[overallStatus];

  function refresh() {
    if (refreshing) return;
    setRefreshing(true);
    setTimeout(() => {
      setServices((prev) =>
        prev.map((svc) => ({
          ...svc,
          latency: svc.latency !== undefined ? jitterLatency(svc.latency) : undefined,
          uptime: svc.uptime !== undefined ? Math.min(100, +(svc.uptime + (Math.random() - 0.5) * 0.02).toFixed(2)) : undefined,
        }))
      );
      const hasDown = services.some((s) => s.status === "down");
      const hasDegraded = services.some((s) => s.status === "degraded");
      setOverallStatus(hasDown ? "outage" : hasDegraded ? "degraded" : initialOverall);
      setLastUpdated("just now");
      setRefreshing(false);
    }, 1000);
  }

  const healthyCount = services.filter((s) => s.status === "operational").length;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="h-12 px-4 flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <Server className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">{title}</span>
        <span className="text-[10px] text-zinc-400">Updated {lastUpdated}</span>
      </div>

      <div className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        Live health dashboard — uptime and latency for each service in your stack.
      </div>

      <div className="min-h-[220px] px-4 py-3">
        <div className={cn("mb-3 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-500", overall.cls)}>
          {overall.label}
        </div>

        <div className="rounded-lg border border-zinc-100 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800 overflow-hidden">
          {services.map((svc, i) => {
            const s = STATUS[svc.status];
            const Icon = s.Icon;
            return (
              <div
                key={i}
                className="flex items-center gap-3 px-3 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all duration-500"
              >
                <div className="relative shrink-0">
                  <Icon className={cn("size-4", s.text)} />
                  {svc.status === "operational" && (
                    <span className={cn("absolute -top-0.5 -right-0.5 size-1.5 rounded-full animate-pulse", s.dot)} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-zinc-800 dark:text-zinc-200">{svc.name}</div>
                  {svc.description && (
                    <div className="text-[10px] text-zinc-400 mt-0.5 truncate">{svc.description}</div>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0 text-[10px] text-zinc-400">
                  {svc.uptime !== undefined && (
                    <span className="font-mono tabular-nums">{svc.uptime.toFixed(2)}%</span>
                  )}
                  {svc.latency !== undefined && (
                    <span className={cn(
                      "font-mono tabular-nums px-1.5 py-0.5 rounded transition-all duration-500",
                      svc.latency > 200
                        ? "bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400"
                        : "bg-zinc-100 dark:bg-zinc-800"
                    )}>
                      {svc.latency}ms
                    </span>
                  )}
                  <span className={cn("font-semibold w-16 text-right", s.text)}>{s.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {interactive && (
        <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/30">
          <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">
            {healthyCount}/{services.length} services operational
          </span>
          <button
            onClick={refresh}
            disabled={refreshing}
            className={cn(
              "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2",
              refreshing && "opacity-50 cursor-not-allowed"
            )}
          >
            <RefreshCw className={cn("size-3.5", refreshing && "animate-spin")} />
            {refreshing ? "Refreshing…" : "Refresh Status"}
          </button>
        </div>
      )}
    </div>
  );
}
