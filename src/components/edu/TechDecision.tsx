"use client";

import { z } from "zod";
import { CheckCircle, Clock, AlertCircle, AlertTriangle } from "lucide-react";

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
  accepted: {
    icon: CheckCircle,
    label: "Decision Accepted",
    headerBg: "bg-emerald-600 dark:bg-emerald-700",
    badgeBg: "bg-emerald-500/20 text-emerald-100 border border-emerald-400/30",
  },
  proposed: {
    icon: Clock,
    label: "Decision Proposed",
    headerBg: "bg-blue-600 dark:bg-blue-700",
    badgeBg: "bg-blue-500/20 text-blue-100 border border-blue-400/30",
  },
  superseded: {
    icon: AlertCircle,
    label: "Decision Superseded",
    headerBg: "bg-zinc-600 dark:bg-zinc-700",
    badgeBg: "bg-zinc-500/20 text-zinc-200 border border-zinc-400/30",
  },
};

export function TechDecision({ decision, status = "accepted", context, options, consequences }: TechDecisionProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.accepted;
  const StatusIcon = config.icon;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className={`${config.headerBg} px-4 py-3`}>
        <div className="flex items-center gap-2 mb-1">
          <StatusIcon className="w-4 h-4 text-white" />
          <span className="text-xs font-semibold text-white/80 uppercase tracking-wider">{config.label}</span>
        </div>
        <p className="text-base font-bold text-white">{decision}</p>
      </div>

      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
        <div className="px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1.5">
            Context
          </p>
          <p className="text-sm text-zinc-700 dark:text-zinc-300">{context}</p>
        </div>

        {options && options.length > 0 && (
          <div className="px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-3">
              Options Considered
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {options.map((opt, i) => (
                <div
                  key={i}
                  className={[
                    "rounded-lg border p-3",
                    opt.chosen
                      ? "ring-2 ring-blue-400 dark:ring-blue-500 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30"
                      : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{opt.name}</span>
                    {opt.chosen && (
                      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                        ✓ CHOSEN
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    {opt.pros.map((pro, j) => (
                      <p key={j} className="text-xs text-emerald-700 dark:text-emerald-400">
                        <span className="font-semibold">+</span> {pro}
                      </p>
                    ))}
                    {opt.cons.map((con, j) => (
                      <p key={j} className="text-xs text-red-600 dark:text-red-400">
                        <span className="font-semibold">-</span> {con}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {consequences && consequences.length > 0 && (
          <div className="px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2">
              Trade-offs Accepted
            </p>
            <div className="space-y-1.5">
              {consequences.map((c, i) => (
                <div key={i} className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900 rounded-lg px-3 py-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-zinc-700 dark:text-zinc-300">{c}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
