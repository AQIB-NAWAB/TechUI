"use client";

import { z } from "zod";
import { Globe } from "lucide-react";

export const RealWorldEventSchema = z.object({
  title: z.string(),
  when: z.string(),
  summary: z.string(),
  lesson: z.string(),
  company: z.string().optional(),
  outcome: z.enum(["success", "failure", "mixed"]).optional().default("success"),
});

export type RealWorldEventProps = z.infer<typeof RealWorldEventSchema>;

const OUTCOME_BADGE: Record<string, { label: string; classes: string }> = {
  success: { label: "Success", classes: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" },
  failure: { label: "Failure", classes: "bg-red-500/20 text-red-300 border border-red-500/30" },
  mixed:   { label: "Mixed",   classes: "bg-amber-500/20 text-amber-300 border border-amber-500/30" },
};

export function RealWorldEvent({ title, when, summary, lesson, company, outcome = "success" }: RealWorldEventProps) {
  const badge = OUTCOME_BADGE[outcome] ?? OUTCOME_BADGE.success;

  return (
    <div className="rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
      <div className="bg-zinc-900 dark:bg-zinc-800 px-4 py-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-white" />
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Real World</span>
            {company && (
              <span className="text-xs text-zinc-500">· {company}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badge.classes}`}>
              {badge.label}
            </span>
            <span className="text-xs text-zinc-400">{when}</span>
          </div>
        </div>
        <p className="text-base font-semibold text-white">{title}</p>
      </div>

      <div className="bg-white dark:bg-zinc-900 border-t-0 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-1">
          What happened:
        </p>
        <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-3">{summary}</p>

        <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900 rounded-lg p-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-500 mb-1">
            ◆ What this teaches you:
          </p>
          <p className="text-sm text-zinc-700 dark:text-zinc-300">{lesson}</p>
        </div>
      </div>
    </div>
  );
}
