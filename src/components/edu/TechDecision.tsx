"use client";

import { useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Scale, CheckCircle, Clock, AlertCircle, ArrowRight } from "lucide-react";

export const TechDecisionSchema = z.object({
  decision: z.string(),
  status: z.enum(["accepted", "superseded", "proposed"]).default("accepted"),
  context: z.string(),
  options: z.array(z.object({
    name: z.string(),
    pros: z.array(z.string()),
    cons: z.array(z.string()),
    chosen: z.boolean().optional(),
  })).optional(),
  consequences: z.array(z.string()).optional(),
});

export type TechDecisionProps = z.infer<typeof TechDecisionSchema>;

const STATUS_CONFIG = {
  accepted: { icon: CheckCircle, label: "Accepted", badge: "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800" },
  proposed: { icon: Clock, label: "Proposed", badge: "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800" },
  superseded: { icon: AlertCircle, label: "Superseded", badge: "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700" },
};

export function TechDecision({ decision, status = "accepted", context, options, consequences }: TechDecisionProps) {
  const [revealed, setRevealed] = useState(false);
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.accepted;
  const StatusIcon = config.icon;
  const chosenOption = options?.find((o) => o.chosen);

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800">
        <Scale className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">Architecture Decision</span>
        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1", config.badge)}>
          <StatusIcon className="size-3" />
          {config.label}
        </span>
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        {decision}
      </p>

      <div className="min-h-[220px] px-4 pt-3 pb-2 flex flex-col gap-3">
        <div className="border border-zinc-100 dark:border-zinc-800 rounded-lg p-3 bg-zinc-50 dark:bg-zinc-800/50">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-1.5">Context</p>
          <p className="text-sm text-zinc-700 dark:text-zinc-300">{context}</p>
        </div>

        {options && options.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
            {options.map((opt, i) => (
              <div
                key={i}
                className={cn(
                  "rounded-lg border p-3 transition-all duration-500",
                  revealed && opt.chosen
                    ? "ring-2 ring-blue-400 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30"
                    : revealed
                    ? "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 opacity-50"
                    : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{opt.name}</span>
                  {revealed && opt.chosen && (
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 rounded-full">CHOSEN</span>
                  )}
                </div>
                <div className="space-y-1">
                  {opt.pros.slice(0, revealed ? undefined : 1).map((pro, j) => (
                    <p key={j} className="text-xs text-emerald-700 dark:text-emerald-400">+ {pro}</p>
                  ))}
                  {revealed && opt.cons.map((con, j) => (
                    <p key={j} className="text-xs text-red-600 dark:text-red-400">− {con}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {revealed && consequences && consequences.length > 0 && (
          <div className="border border-amber-200 dark:border-amber-800 rounded-lg p-3 bg-amber-50 dark:bg-amber-950/30 transition-all duration-500">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-600 mb-1.5">Trade-offs accepted</p>
            <div className="space-y-1">
              {consequences.map((c, i) => (
                <p key={i} className="text-xs text-zinc-700 dark:text-zinc-300">{c}</p>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
        <ArrowRight className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">
          {revealed
            ? chosenOption ? `Chose: ${chosenOption.name}` : "Decision revealed"
            : "Compare options, then reveal the final choice"}
        </span>
        <button
          onClick={() => setRevealed((r) => !r)}
          className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity shrink-0"
        >
          {revealed ? "Hide Choice" : "Reveal Choice"}
        </button>
      </div>
    </div>
  );
}
