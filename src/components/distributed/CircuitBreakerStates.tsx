"use client";

import { useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Zap, ZapOff, AlertCircle, ChevronDown } from "lucide-react";

export const CircuitBreakerStatesSchema = z.object({
  failureThreshold: z.number().int().default(5),
  successThreshold: z.number().int().default(2),
  timeoutSeconds: z.number().default(30),
  activeState: z.enum(["closed", "open", "half-open"]).optional().default("closed"),
});

export type CircuitBreakerStatesProps = z.infer<typeof CircuitBreakerStatesSchema>;

type CBState = "closed" | "open" | "half-open";

const STATE_DETAILS: Record<
  CBState,
  {
    label: string;
    icon: React.ReactNode;
    borderColor: string;
    bgColor: string;
    textColor: string;
    badgeBg: string;
    statusIcon: string;
    statusLabel: string;
    statusDesc: string;
    what: string;
    exitLabel: string;
  }
> = {
  closed: {
    label: "CLOSED",
    icon: <Zap className="size-4 text-emerald-600 dark:text-emerald-400" />,
    borderColor: "border-emerald-400 dark:border-emerald-600",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    textColor: "text-emerald-700 dark:text-emerald-300",
    badgeBg: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300",
    statusIcon: "✓",
    statusLabel: "Requests pass through",
    statusDesc: "Normal operation — all traffic flows to the service",
    what: "The circuit is healthy. Every request goes directly to the service as normal. The breaker counts failures in the background but takes no action yet.",
    exitLabel: "Exits when",
  },
  open: {
    label: "OPEN",
    icon: <ZapOff className="size-4 text-red-600 dark:text-red-400" />,
    borderColor: "border-red-400 dark:border-red-600",
    bgColor: "bg-red-50 dark:bg-red-950/30",
    textColor: "text-red-700 dark:text-red-300",
    badgeBg: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300",
    statusIcon: "✗",
    statusLabel: "All requests blocked",
    statusDesc: "Service unavailable — requests fail immediately",
    what: "The service has failed too many times. The breaker trips OPEN and rejects all incoming requests immediately — without even trying — to stop overloading a struggling service.",
    exitLabel: "Exits when",
  },
  "half-open": {
    label: "HALF-OPEN",
    icon: <AlertCircle className="size-4 text-amber-600 dark:text-amber-400" />,
    borderColor: "border-amber-400 dark:border-amber-600",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    textColor: "text-amber-700 dark:text-amber-300",
    badgeBg: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
    statusIcon: "⟳",
    statusLabel: "Test requests only",
    statusDesc: "Probing for recovery — limited traffic allowed",
    what: "After the timeout, the breaker cautiously lets a few test requests through to probe whether the service has recovered. If they succeed it closes; if they fail it opens again.",
    exitLabel: "Exits when",
  },
};

function ArrowWithLabel({ label, align = "left" }: { label: string; align?: "left" | "right" }) {
  return (
    <div className={cn("flex items-center gap-2 py-0.5", align === "right" ? "flex-row-reverse" : "flex-row")}>
      <div className="flex flex-col items-center">
        <div className="w-px h-3 bg-zinc-300 dark:bg-zinc-600" />
        <ChevronDown className="size-3.5 text-zinc-400 dark:text-zinc-500 -mt-1" />
      </div>
      <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full border border-zinc-200 dark:border-zinc-700">
        {label}
      </span>
    </div>
  );
}

export function CircuitBreakerStates({
  failureThreshold = 5,
  successThreshold = 2,
  timeoutSeconds = 30,
  activeState = "closed",
}: CircuitBreakerStatesProps) {
  const [selected, setSelected] = useState<CBState>(activeState as CBState);

  const states: CBState[] = ["closed", "open", "half-open"];
  const details = STATE_DETAILS[selected];

  const exitConditions: Record<CBState, string> = {
    closed: `${failureThreshold} consecutive failures → trips to OPEN`,
    open: `${timeoutSeconds}s timeout expires → moves to HALF-OPEN`,
    "half-open": `${successThreshold} successes → closes  |  any failure → opens again`,
  };

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
        <Zap className="size-3.5 text-zinc-400 shrink-0" />
        <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex-1">Circuit Breaker States</span>
        <span
          className={cn(
            "text-[11px] font-semibold px-2 py-0.5 rounded-full",
            STATE_DETAILS[selected].badgeBg,
          )}
        >
          {STATE_DETAILS[selected].label}
        </span>
      </div>

      <div className="flex flex-col md:flex-row gap-0 min-h-[320px]">
        {/* State diagram column */}
        <div className="flex-1 px-5 py-4 flex flex-col items-start gap-0">
          {states.map((state, i) => {
            const cfg = STATE_DETAILS[state];
            const isSelected = selected === state;

            return (
              <div key={state} className="w-full">
                {/* State box */}
                <button
                  onClick={() => setSelected(state)}
                  className={cn(
                    "w-full text-left rounded-lg border-2 px-4 py-3 transition-all duration-500 cursor-pointer",
                    cfg.borderColor,
                    cfg.bgColor,
                    isSelected
                      ? "scale-[1.02] ring-2 ring-offset-1 ring-offset-white dark:ring-offset-zinc-900 ring-current shadow-md"
                      : "opacity-70 hover:opacity-90 hover:scale-[1.01]",
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {cfg.icon}
                    <span className={cn("text-xs font-bold tracking-wider", cfg.textColor)}>
                      {cfg.label}
                    </span>
                    <span className={cn("ml-auto text-base font-bold", cfg.textColor)}>
                      {cfg.statusIcon}
                    </span>
                  </div>
                  <div className={cn("text-[11px] font-medium", cfg.textColor)}>
                    {cfg.statusLabel}
                  </div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {cfg.statusDesc}
                  </div>
                </button>

                {/* Arrow between states */}
                {i === 0 && (
                  <div className="pl-3 py-0.5">
                    <ArrowWithLabel label={`${failureThreshold} failures`} />
                  </div>
                )}
                {i === 1 && (
                  <div className="pl-3 py-0.5">
                    <ArrowWithLabel label={`${timeoutSeconds}s timeout`} />
                  </div>
                )}
              </div>
            );
          })}

          {/* Back arrows annotation */}
          <div className="mt-2 pl-1 w-full">
            <div className="text-[10px] text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-amber-600 dark:text-amber-500">HALF-OPEN</span>
              <span>→</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-500">CLOSED</span>
              <span className="text-zinc-300 dark:text-zinc-700">·</span>
              <span>{successThreshold} successes</span>
              <span className="text-zinc-300 dark:text-zinc-700 mx-1">or</span>
              <span className="font-semibold text-amber-600 dark:text-amber-500">HALF-OPEN</span>
              <span>→</span>
              <span className="font-semibold text-red-600 dark:text-red-500">OPEN</span>
              <span className="text-zinc-300 dark:text-zinc-700">·</span>
              <span>any failure</span>
            </div>
          </div>
        </div>

        {/* Detail panel */}
        <div
          className={cn(
            "w-full md:w-56 border-t md:border-t-0 md:border-l border-zinc-100 dark:border-zinc-800 px-4 py-4 transition-all duration-500",
            details.bgColor,
          )}
        >
          <div className="flex items-center gap-2 mb-3">
            {details.icon}
            <span className={cn("text-xs font-bold tracking-wider", details.textColor)}>
              {details.label}
            </span>
          </div>

          <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
            {details.what}
          </p>

          <div className={cn("rounded-md border px-3 py-2", details.borderColor, "bg-white/60 dark:bg-zinc-900/40")}>
            <div className={cn("text-[10px] font-bold uppercase tracking-wide mb-1", details.textColor)}>
              {details.exitLabel}
            </div>
            <div className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {exitConditions[selected]}
            </div>
          </div>
        </div>
      </div>

      {/* Footer hint */}
      <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-2 bg-zinc-50/50 dark:bg-zinc-900/30">
        <p className="text-[10px] text-zinc-400">
          Click any state box to see what it means and when it transitions
        </p>
      </div>
    </div>
  );
}
