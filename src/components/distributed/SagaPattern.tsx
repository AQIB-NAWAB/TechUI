"use client";

import { useState, useRef } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { RotateCcw, ChevronDown, CheckCircle2, XCircle, ArrowRight } from "lucide-react";

export const SagaPatternSchema = z.object({
  sagaName: z.string().default("Order Checkout"),
  steps: z.array(z.object({
    service: z.string(),
    action: z.string(),
    compensate: z.string(),
    color: z.enum(["blue", "emerald", "violet", "amber", "rose"]).optional().default("blue"),
  })).default([
    { service: "Order Service",     action: "Create Order",      compensate: "Cancel Order",      color: "blue"    },
    { service: "Payment Service",   action: "Reserve Payment",   compensate: "Release Payment",   color: "emerald" },
    { service: "Inventory Service", action: "Reserve Stock",     compensate: "Release Stock",     color: "violet"  },
    { service: "Shipping Service",  action: "Schedule Delivery", compensate: "Cancel Delivery",   color: "amber"   },
    { service: "Notification Svc",  action: "Send Confirmation", compensate: "Send Cancellation", color: "rose"    },
  ]),
  failAt: z.number().optional(),
});

export type SagaPatternProps = z.infer<typeof SagaPatternSchema>;

type StepStatus = "idle" | "running" | "done" | "failed" | "compensating" | "compensated";

const COLOR_MAP = {
  blue:    { badge: "bg-blue-100 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200",       ring: "ring-blue-400 dark:ring-blue-600"    },
  emerald: { badge: "bg-emerald-100 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200", ring: "ring-emerald-400 dark:ring-emerald-600" },
  violet:  { badge: "bg-violet-100 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800 text-violet-800 dark:text-violet-200",   ring: "ring-violet-400 dark:ring-violet-600"  },
  amber:   { badge: "bg-amber-100 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200",     ring: "ring-amber-400 dark:ring-amber-600"    },
  rose:    { badge: "bg-rose-100 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200",          ring: "ring-rose-400 dark:ring-rose-600"      },
};

const EVENT_NAMES: Record<string, string> = {
  "Create Order":      "OrderCreated",
  "Reserve Payment":   "PaymentReserved",
  "Reserve Stock":     "StockReserved",
  "Schedule Delivery": "DeliveryScheduled",
  "Send Confirmation": "ConfirmationSent",
  "Charge Card":       "CardCharged",
};

function getEvent(action: string): string {
  return EVENT_NAMES[action] ?? action.replace(/\s+/g, "");
}

export function SagaPattern({
  sagaName = "Order Checkout",
  steps = [
    { service: "Order Service",     action: "Create Order",      compensate: "Cancel Order",      color: "blue"    as const },
    { service: "Payment Service",   action: "Reserve Payment",   compensate: "Release Payment",   color: "emerald" as const },
    { service: "Inventory Service", action: "Reserve Stock",     compensate: "Release Stock",     color: "violet"  as const },
    { service: "Shipping Service",  action: "Schedule Delivery", compensate: "Cancel Delivery",   color: "amber"   as const },
    { service: "Notification Svc",  action: "Send Confirmation", compensate: "Send Cancellation", color: "rose"    as const },
  ],
  failAt,
}: SagaPatternProps) {
  const [statuses, setStatuses] = useState<StepStatus[]>(() => steps.map(() => "idle"));
  const [failStep, setFailStep] = useState<number>(failAt ?? 3);
  const [running, setRunning] = useState(false);
  const [outcome, setOutcome] = useState<"idle" | "success" | "rolled-back">("idle");
  const [failOpen, setFailOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => { if (timerRef.current) clearTimeout(timerRef.current); };

  const reset = () => {
    clearTimer();
    setStatuses(steps.map(() => "idle"));
    setOutcome("idle");
    setRunning(false);
  };

  const runHappy = () => {
    reset();
    setRunning(true);
    const next = (i: number) => {
      if (i >= steps.length) {
        setOutcome("success");
        setRunning(false);
        return;
      }
      setStatuses((prev) => {
        const s = [...prev];
        s[i] = "running";
        return s;
      });
      timerRef.current = setTimeout(() => {
        setStatuses((prev) => {
          const s = [...prev];
          s[i] = "done";
          return s;
        });
        timerRef.current = setTimeout(() => next(i + 1), 200);
      }, 900);
    };
    timerRef.current = setTimeout(() => next(0), 150);
  };

  const runWithFailure = (failIdx: number) => {
    reset();
    setRunning(true);
    // 1-based failAt → 0-based
    const failAt0 = failIdx - 1;

    const forward = (i: number) => {
      if (i > failAt0) {
        // shouldn't happen, but safety
        setOutcome("success");
        setRunning(false);
        return;
      }
      setStatuses((prev) => {
        const s = [...prev];
        s[i] = "running";
        return s;
      });
      timerRef.current = setTimeout(() => {
        if (i === failAt0) {
          // fail this step
          setStatuses((prev) => {
            const s = [...prev];
            s[i] = "failed";
            return s;
          });
          timerRef.current = setTimeout(() => compensate(i - 1), 600);
        } else {
          setStatuses((prev) => {
            const s = [...prev];
            s[i] = "done";
            return s;
          });
          timerRef.current = setTimeout(() => forward(i + 1), 200);
        }
      }, 900);
    };

    const compensate = (i: number) => {
      if (i < 0) {
        setOutcome("rolled-back");
        setRunning(false);
        return;
      }
      setStatuses((prev) => {
        const s = [...prev];
        s[i] = "compensating";
        return s;
      });
      timerRef.current = setTimeout(() => {
        setStatuses((prev) => {
          const s = [...prev];
          s[i] = "compensated";
          return s;
        });
        timerRef.current = setTimeout(() => compensate(i - 1), 200);
      }, 900);
    };

    timerRef.current = setTimeout(() => forward(0), 150);
  };

  const cc = (color?: string) => COLOR_MAP[(color as keyof typeof COLOR_MAP) ?? "blue"] ?? COLOR_MAP.blue;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <RotateCcw className="size-4 text-violet-500" />
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Saga Pattern</span>
        </div>
        <span className="text-xs font-mono text-zinc-400 border border-zinc-200 dark:border-zinc-700 px-2 py-0.5 rounded">
          {sagaName}
        </span>
      </div>

      {/* Timeline */}
      <div className="min-h-[300px] px-4 pt-4 pb-2">
        <div className="space-y-2">
          {steps.map((step, i) => {
            const s = statuses[i];
            const col = cc(step.color);
            const isCompensating = s === "compensating" || s === "compensated";
            return (
              <div
                key={i}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-all duration-500",
                  s === "idle"         && "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/40 opacity-60",
                  s === "running"      && cn(col.badge, "ring-2", col.ring, "opacity-100"),
                  s === "done"         && "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20",
                  s === "failed"       && "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/20",
                  s === "compensating" && "border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/20",
                  s === "compensated"  && "border-zinc-300 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-800/60 opacity-70",
                )}
              >
                {/* Status icon */}
                <div className="shrink-0 w-5 h-5 flex items-center justify-center">
                  {s === "idle"         && <span className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-600" />}
                  {s === "running"      && <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />}
                  {s === "done"         && <CheckCircle2 className="size-4 text-emerald-500" />}
                  {s === "failed"       && <XCircle className="size-4 text-red-500" />}
                  {s === "compensating" && <RotateCcw className="size-4 text-amber-500 animate-spin" />}
                  {s === "compensated"  && <RotateCcw className="size-4 text-zinc-400" />}
                </div>

                {/* Step number */}
                <span className="text-[10px] font-mono font-semibold text-zinc-400 w-4 shrink-0">
                  {i + 1}
                </span>

                {/* Service badge */}
                <span className={cn(
                  "text-[9px] font-semibold px-1.5 py-0.5 rounded border shrink-0",
                  col.badge
                )}>
                  {step.service}
                </span>

                {/* Action or compensating action */}
                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex-1 truncate">
                  {isCompensating ? (
                    <span className="text-amber-700 dark:text-amber-300">↩ {step.compensate}</span>
                  ) : (
                    step.action
                  )}
                </span>

                {/* Event published (only on done) */}
                {s === "done" && (
                  <div className="flex items-center gap-1 shrink-0">
                    <ArrowRight className="size-3 text-zinc-400" />
                    <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.5 rounded">
                      {getEvent(step.action)}
                    </span>
                  </div>
                )}
                {s === "compensated" && (
                  <span className="text-[9px] text-zinc-400 shrink-0">rolled back</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Outcome message */}
        <div className={cn(
          "mt-3 px-3 py-2 rounded-lg text-[11px] font-medium text-center transition-all duration-500",
          outcome === "idle"        && "bg-zinc-50 dark:bg-zinc-800/40 text-zinc-400",
          outcome === "success"     && "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300",
          outcome === "rolled-back" && "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300",
        )}>
          {outcome === "idle"        && "Click a button below to run the saga"}
          {outcome === "success"     && `✓ All ${steps.length} steps complete — ${sagaName} saga succeeded`}
          {outcome === "rolled-back" && `✗ Failed at step ${failStep} — compensating transactions rolled back all changes`}
        </div>

        {/* Controls */}
        <div className="flex gap-3 mt-3">
          <button
            disabled={running}
            onClick={runHappy}
            className={cn(
              "flex-1 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-3 py-2 text-sm font-semibold hover:opacity-90 transition-opacity",
              running && "opacity-50 cursor-not-allowed"
            )}
          >
            Run (Happy Path)
          </button>

          <div className="flex gap-1.5 flex-1">
            {/* Fail at selector */}
            <div className="relative">
              <button
                disabled={running}
                onClick={() => setFailOpen((v) => !v)}
                className="h-full flex items-center gap-1.5 px-3 rounded-lg border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 text-xs font-semibold hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors disabled:opacity-50"
              >
                Fail @{failStep}
                <ChevronDown className={cn("size-3 transition-transform duration-300", failOpen && "rotate-180")} />
              </button>
              {failOpen && (
                <div className="absolute bottom-full mb-1 left-0 z-10 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg overflow-hidden">
                  {steps.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => { setFailStep(i + 1); setFailOpen(false); }}
                      className="block w-full text-left px-3 py-1.5 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-zinc-700 dark:text-zinc-300"
                    >
                      Step {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              disabled={running}
              onClick={() => runWithFailure(failStep)}
              className={cn(
                "flex-1 rounded-lg border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 px-3 py-2 text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors",
                running && "opacity-50 cursor-not-allowed"
              )}
            >
              Run with Failure
            </button>
          </div>
        </div>
      </div>

      {/* Insight footer */}
      <div className="px-4 py-2.5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40">
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
          <strong className="text-zinc-700 dark:text-zinc-300">Key insight:</strong> No central coordinator — each service reacts to events and knows its compensating action.
        </p>
      </div>
    </div>
  );
}
