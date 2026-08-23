"use client";

import { z } from "zod";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertTriangle, XCircle, Wrench } from "lucide-react";

export const ServerStatusSchema = z.object({
  title: z.string().optional().default("System Status"),
  overallStatus: z.enum(["operational", "degraded", "outage", "maintenance"]).optional().default("operational"),
  lastUpdated: z.string().optional().default("2 min ago"),
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

const STATUS = {
  operational: { label: "Operational", dot: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400", Icon: CheckCircle2 },
  degraded:    { label: "Degraded",    dot: "bg-amber-500",   text: "text-amber-600 dark:text-amber-400",   Icon: AlertTriangle },
  down:        { label: "Down",        dot: "bg-red-500",     text: "text-red-600 dark:text-red-400",       Icon: XCircle },
  maintenance: { label: "Maintenance", dot: "bg-blue-400",    text: "text-blue-600 dark:text-blue-400",     Icon: Wrench },
};

const OVERALL = {
  operational: { label: "All Systems Operational", cls: "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400" },
  degraded:    { label: "Some Services Degraded",  cls: "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400" },
  outage:      { label: "Service Outage Detected", cls: "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400" },
  maintenance: { label: "Under Scheduled Maintenance", cls: "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400" },
};

export function ServerStatus({
  title = "System Status",
  overallStatus = "operational",
  lastUpdated = "2 min ago",
  services,
}: ServerStatusProps) {
  const overall = OVERALL[overallStatus];

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-between">
        <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{title}</span>
        <span className="text-[10px] text-zinc-400">Updated {lastUpdated}</span>
      </div>

      {/* Overall status banner */}
      <div className={cn("mx-4 mt-4 mb-3 px-4 py-2.5 rounded-lg border font-semibold text-sm", overall.cls)}>
        {overall.label}
      </div>

      {/* Service list */}
      <div className="divide-y divide-zinc-50 dark:divide-zinc-900/60 pb-2">
        {services.map((svc, i) => {
          const s = STATUS[svc.status];
          const Icon = s.Icon;
          return (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <Icon className={cn("size-4 shrink-0", s.text)} />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-zinc-800 dark:text-zinc-200">{svc.name}</div>
                {svc.description && (
                  <div className="text-[10px] text-zinc-400 mt-0.5">{svc.description}</div>
                )}
              </div>
              <div className="flex items-center gap-4 shrink-0 text-[10px] text-zinc-400">
                {svc.uptime !== undefined && (
                  <span className="font-mono">{svc.uptime.toFixed(2)}% uptime</span>
                )}
                {svc.latency !== undefined && (
                  <span className="font-mono">{svc.latency}ms</span>
                )}
                <span className={cn("font-semibold", s.text)}>{s.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
