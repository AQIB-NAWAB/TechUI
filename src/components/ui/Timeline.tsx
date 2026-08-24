"use client";

import { z } from "zod";
import { cn } from "@/lib/utils";
import { Clock, CheckCircle, AlertCircle, XCircle, Info, History } from "lucide-react";

export const TimelineSchema = z.object({
  title: z.string().optional(),
  events: z.array(
    z.object({
      timestamp: z.string(),
      title: z.string(),
      description: z.string().optional(),
      type: z.enum(["default", "info", "success", "warning", "error"]).optional().default("default"),
      badge: z.string().optional(),
    })
  ),
  compact: z.boolean().optional().default(false),
});

export type TimelineProps = z.infer<typeof TimelineSchema>;

const TYPE_CFG = {
  default: {
    ring: "bg-zinc-100 dark:bg-zinc-800",
    badge: "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700",
    icon: Clock,
    iconColor: "text-zinc-500",
  },
  info: {
    ring: "bg-blue-50 dark:bg-blue-950",
    badge: "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    icon: Info,
    iconColor: "text-blue-500",
  },
  success: {
    ring: "bg-emerald-50 dark:bg-emerald-950",
    badge: "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    icon: CheckCircle,
    iconColor: "text-emerald-500",
  },
  warning: {
    ring: "bg-amber-50 dark:bg-amber-950",
    badge: "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    icon: AlertCircle,
    iconColor: "text-amber-500",
  },
  error: {
    ring: "bg-red-50 dark:bg-red-950",
    badge: "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
    icon: XCircle,
    iconColor: "text-red-500",
  },
};

export function Timeline({ title, events, compact = false }: TimelineProps) {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {title && (
        <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800">
          <History className="size-4 text-zinc-400 shrink-0" />
          <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{title}</span>
        </div>
      )}

      <div className="px-4 py-4 min-h-[220px]">
        <div className="relative border border-zinc-100 dark:border-zinc-800 rounded-lg p-4 bg-zinc-50 dark:bg-zinc-800/30">
          <div className="absolute left-[22px] top-6 bottom-6 w-px bg-zinc-200 dark:bg-zinc-700" />

          <div className="space-y-4">
            {events.map((event, i) => {
              const cfg = TYPE_CFG[event.type ?? "default"];
              const Icon = cfg.icon;
              return (
                <div key={i} className="flex gap-3 transition-all duration-500">
                  <div
                    className={cn(
                      "size-7 rounded-full flex items-center justify-center border-2 border-white dark:border-zinc-900 z-10 shrink-0 transition-all duration-500",
                      cfg.ring
                    )}
                  >
                    <Icon className={cn("size-3.5", cfg.iconColor)} />
                  </div>

                  <div className="flex-1 min-w-0 border border-zinc-100 dark:border-zinc-800 rounded-lg p-3 bg-white dark:bg-zinc-900 transition-all duration-500">
                    <div className="flex items-start gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex-1 leading-tight">
                        {event.title}
                      </span>
                      {event.badge && (
                        <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wide shrink-0", cfg.badge)}>
                          {event.badge}
                        </span>
                      )}
                    </div>
                    {!compact && event.description && (
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 leading-snug">{event.description}</p>
                    )}
                    <span className="text-[10px] text-zinc-400 font-mono mt-1.5 flex items-center gap-1">
                      <Clock className="size-3" />
                      {event.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
