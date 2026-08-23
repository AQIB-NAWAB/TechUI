"use client";

import { z } from "zod";
import { BookOpen, Database, Server, Lock, Zap, Globe, Code2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const BigWordAlertSchema = z.object({
  term: z.string(),
  plainEnglish: z.string(),
  whyItMatters: z.string(),
  icon: z.string().optional(),
});

export type BigWordAlertProps = z.infer<typeof BigWordAlertSchema>;

const ICON_MAP: Record<string, LucideIcon> = {
  database: Database,
  server: Server,
  lock: Lock,
  zap: Zap,
  globe: Globe,
  code: Code2,
};

export function BigWordAlert({ term, plainEnglish, whyItMatters, icon }: BigWordAlertProps) {
  const IconComponent = (icon && ICON_MAP[icon]) ? ICON_MAP[icon] : BookOpen;

  return (
    <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50 overflow-hidden">
      <div className="flex items-stretch">
        <div className="w-1 bg-amber-400 flex-shrink-0" />
        <div className="flex-1 p-4">
          <div className="flex items-center gap-2 mb-3">
            <IconComponent className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{term}</span>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-1">
                In plain English:
              </p>
              <p className="text-sm text-zinc-700 dark:text-zinc-300">{plainEnglish}</p>
            </div>

            <div className="border-t border-amber-200 dark:border-amber-800/60 pt-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-1">
                Why it matters here:
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 italic">{whyItMatters}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
