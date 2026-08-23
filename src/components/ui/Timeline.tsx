"use client";

import { z } from "zod";
import { cn } from "@/lib/utils";

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
  default: { dot: "bg-zinc-400 dark:bg-zinc-600",  badge: "bg-zinc-100 dark:bg-zinc-800 text-zinc-500" },
  info:    { dot: "bg-blue-500",                    badge: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300" },
  success: { dot: "bg-emerald-500",                 badge: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300" },
  warning: { dot: "bg-amber-500",                   badge: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300" },
  error:   { dot: "bg-red-500",                     badge: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300" },
};

export function Timeline({ title, events, compact = false }: TimelineProps) {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
      {title && (
        <div className="px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/50">
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{title}</span>
        </div>
      )}

      <div className="px-4 py-4">
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[6px] top-2 bottom-2 w-px bg-zinc-100 dark:bg-zinc-800" />

          <div className="space-y-5">
            {events.map((event, i) => {
              const cfg = TYPE_CFG[event.type ?? "default"];
              return (
                <div key={i} className="flex gap-4">
                  {/* Dot */}
                  <div
                    className={cn(
                      "size-3.5 rounded-full mt-0.5 shrink-0 border-2 border-white dark:border-zinc-950 z-10",
                      cfg.dot
                    )}
                  />

                  {/* Content */}
                  <div className="flex-1 min-w-0 pb-1">
                    <div className="flex items-start gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex-1 leading-tight">
                        {event.title}
                      </span>
                      {event.badge && (
                        <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide shrink-0", cfg.badge)}>
                          {event.badge}
                        </span>
                      )}
                    </div>
                    {!compact && event.description && (
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-snug">{event.description}</p>
                    )}
                    <span className="text-[10px] text-zinc-400 font-mono mt-1 block">{event.timestamp}</span>
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
