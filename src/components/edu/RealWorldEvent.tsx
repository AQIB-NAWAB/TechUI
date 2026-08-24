"use client";

import { useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Globe, CheckCircle, XCircle, AlertCircle, BookOpen } from "lucide-react";

export const RealWorldEventSchema = z.object({
  title: z.string(),
  when: z.string(),
  summary: z.string(),
  lesson: z.string(),
  company: z.string().optional(),
  outcome: z.enum(["success", "failure", "mixed"]).optional().default("success"),
});

export type RealWorldEventProps = z.infer<typeof RealWorldEventSchema>;

const OUTCOME_CONFIG = {
  success: { icon: CheckCircle, label: "Success", badge: "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800" },
  failure: { icon: XCircle, label: "Failure", badge: "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800" },
  mixed: { icon: AlertCircle, label: "Mixed", badge: "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800" },
};

export function RealWorldEvent({ title, when, summary, lesson, company, outcome = "success" }: RealWorldEventProps) {
  const [showLesson, setShowLesson] = useState(false);
  const config = OUTCOME_CONFIG[outcome] ?? OUTCOME_CONFIG.success;
  const OutcomeIcon = config.icon;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800">
        <Globe className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">Real World Event</span>
        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1", config.badge)}>
          <OutcomeIcon className="size-3" />
          {config.label}
        </span>
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        {title}{company ? ` · ${company}` : ""} · {when}
      </p>

      <div className="min-h-[220px] px-4 pt-4 pb-2 flex flex-col gap-3">
        <div className="border border-zinc-100 dark:border-zinc-800 rounded-lg p-3 bg-zinc-50 dark:bg-zinc-800/50 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-1.5">What happened</p>
          <p className="text-sm text-zinc-700 dark:text-zinc-300">{summary}</p>
        </div>

        <div className={cn(
          "border rounded-lg p-3 transition-all duration-500 min-h-[80px]",
          showLesson
            ? "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 opacity-100"
            : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 opacity-40"
        )}>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-500 mb-1.5 flex items-center gap-1">
            <BookOpen className="size-3" />
            What this teaches you
          </p>
          <p className={cn("text-sm text-zinc-700 dark:text-zinc-300 transition-all duration-500", !showLesson && "blur-[3px] select-none")}>
            {lesson}
          </p>
        </div>
      </div>

      <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
        <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">
          {showLesson ? "Lesson revealed — apply this to your own work" : "What can we learn from this?"}
        </span>
        <button
          onClick={() => setShowLesson((s) => !s)}
          className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity shrink-0"
        >
          {showLesson ? "Hide Lesson" : "Show Lesson"}
        </button>
      </div>
    </div>
  );
}
