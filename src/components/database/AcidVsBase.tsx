"use client";

import { useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Database, Shield, Zap, RefreshCw } from "lucide-react";

export const AcidVsBaseSchema = z.object({
  model: z.enum(["acid", "base"]).default("acid"),
  interactive: z.boolean().optional().default(true),
});

export type AcidVsBaseProps = z.infer<typeof AcidVsBaseSchema>;

type Model = "acid" | "base";

const TRAITS: Record<Model, Array<{ label: string; ok: boolean; detail: string }>> = {
  acid: [
    { label: "Atomic", ok: true, detail: "All-or-nothing — transfer both accounts or neither" },
    { label: "Consistent", ok: true, detail: "Rules always hold — balance never goes negative" },
    { label: "Isolated", ok: true, detail: "Concurrent transfers don't interfere" },
    { label: "Durable", ok: true, detail: "Committed data survives crashes" },
  ],
  base: [
    { label: "Basically Available", ok: true, detail: "System stays up even during partitions" },
    { label: "Soft state", ok: true, detail: "State may change without input (replication lag)" },
    { label: "Eventual consistency", ok: true, detail: "Replicas converge over time, not instantly" },
    { label: "Strict isolation", ok: false, detail: "Not guaranteed — reads may be stale" },
  ],
};

const EXAMPLES: Record<Model, { title: string; steps: string[]; outcome: string }> = {
  acid: {
    title: "Bank transfer ($100)",
    steps: ["Debit Alice −$100", "Credit Bob +$100", "Commit transaction"],
    outcome: "Both accounts updated together — rollback if either fails",
  },
  base: {
    title: "Social feed like count",
    steps: ["Write to US replica", "Write to EU replica (async)", "Reads may differ briefly"],
    outcome: "Like count converges to 42 within seconds — not instant everywhere",
  },
};

export function AcidVsBase({ model: initialModel = "acid", interactive = true }: AcidVsBaseProps) {
  const [model, setModel] = useState<Model>(initialModel);
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);

  const traits = TRAITS[model];
  const example = EXAMPLES[model];
  const maxSteps = example.steps.length;

  function simulate() {
    if (running) return;
    setStep(0);
    setRunning(true);
    let i = 0;
    const advance = () => {
      i++;
      setStep(i);
      if (i < maxSteps) {
        setTimeout(advance, 1200);
      } else {
        setTimeout(() => setRunning(false), 500);
      }
    };
    setTimeout(advance, 1200);
  }

  function reset() {
    setStep(0);
    setRunning(false);
  }

  const statusText =
    step === 0
      ? `Click Simulate to walk through a ${model === "acid" ? "transaction" : "eventual consistency"} example`
      : step < maxSteps
      ? example.steps[step - 1]
      : example.outcome;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="h-12 px-4 flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <Database className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">ACID vs BASE</span>
        <div className="flex rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
          {(["acid", "base"] as Model[]).map((m) => (
            <button
              key={m}
              onClick={() => { setModel(m); reset(); }}
              className={cn(
                "px-2.5 py-1 text-[10px] font-semibold uppercase transition-all duration-500",
                model === m
                  ? m === "acid"
                    ? "bg-emerald-600 text-white"
                    : "bg-blue-600 text-white"
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              )}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        {model === "acid"
          ? "ACID databases guarantee strong consistency — perfect for money and critical data."
          : "BASE systems favor availability and scale — replicas sync eventually, not instantly."}
      </div>

      <div className="min-h-[220px] px-4 py-4 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          {traits.map((t) => (
            <div
              key={t.label}
              className={cn(
                "rounded-lg border p-2.5 transition-all duration-500",
                t.ok
                  ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20"
                  : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/40"
              )}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                {model === "acid" ? (
                  <Shield className="size-3 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Zap className="size-3 text-blue-600 dark:text-blue-400" />
                )}
                <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">{t.label}</span>
                <span className={cn("ml-auto text-[10px] font-bold", t.ok ? "text-emerald-600" : "text-zinc-400")}>
                  {t.ok ? "✓" : "✗"}
                </span>
              </div>
              <div className="text-[10px] text-zinc-500 dark:text-zinc-400">{t.detail}</div>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 p-3">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-2">
            Example: {example.title}
          </div>
          <div className="flex gap-2 mb-2">
            {example.steps.map((s, i) => (
              <div
                key={s}
                className={cn(
                  "flex-1 rounded-md px-2 py-1.5 text-[10px] font-medium text-center transition-all duration-500 border",
                  step > i
                    ? model === "acid"
                      ? "bg-emerald-100 dark:bg-emerald-900/40 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300"
                      : "bg-blue-100 dark:bg-blue-900/40 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300"
                    : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-400"
                )}
              >
                {s}
              </div>
            ))}
          </div>
          <div
            className={cn(
              "text-[11px] rounded-md px-2.5 py-1.5 transition-all duration-500",
              step >= maxSteps
                ? model === "acid"
                  ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                  : "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
                : "text-zinc-400"
            )}
          >
            {step >= maxSteps ? example.outcome : "Waiting for simulation…"}
          </div>
        </div>
      </div>

      {interactive && (
        <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/30">
          <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">{statusText}</span>
          {step > 0 && !running && (
            <button
              onClick={reset}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all duration-500"
            >
              <RefreshCw className="size-3.5" />
            </button>
          )}
          <button
            onClick={simulate}
            disabled={running}
            className={cn(
              "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity",
              running && "opacity-50 cursor-not-allowed"
            )}
          >
            {running ? "Running…" : step >= maxSteps ? "Run Again" : "Simulate"}
          </button>
        </div>
      )}
    </div>
  );
}
