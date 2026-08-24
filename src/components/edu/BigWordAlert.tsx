"use client";

import { useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { BookOpen, Database, Server, Lock, Zap, Globe, Code2, Lightbulb } from "lucide-react";
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
  const [revealed, setRevealed] = useState(false);
  const IconComponent = (icon && ICON_MAP[icon]) ? ICON_MAP[icon] : BookOpen;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800">
        <IconComponent className="size-4 text-amber-500 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">Big Word</span>
        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded">
          {term}
        </span>
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        Technical jargon decoded into plain English.
      </p>

      <div className="min-h-[220px] px-4 pt-4 pb-2 flex flex-col gap-3 justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">{term}</div>
          <div className={cn(
            "rounded-lg border p-4 transition-all duration-500",
            revealed
              ? "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 opacity-100"
              : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 opacity-60 blur-[2px] select-none"
          )}>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-1.5">In plain English</p>
            <p className="text-sm text-zinc-700 dark:text-zinc-300">{plainEnglish}</p>
          </div>
        </div>

        {revealed && (
          <div className="border border-zinc-100 dark:border-zinc-800 rounded-lg p-3 bg-zinc-50 dark:bg-zinc-800/50 transition-all duration-500">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-1.5">Why it matters</p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 italic">{whyItMatters}</p>
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
        <Lightbulb className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">
          {revealed ? "Now you know what it means!" : "Don't know this term? Click to decode it"}
        </span>
        <button
          onClick={() => setRevealed((r) => !r)}
          className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity shrink-0"
        >
          {revealed ? "Hide" : "Explain It"}
        </button>
      </div>
    </div>
  );
}
