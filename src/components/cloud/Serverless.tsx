"use client";

import { z } from "zod";
import { useState, useEffect, useRef } from "react";
import { Zap, Clock, Globe, Calendar, Database } from "lucide-react";
import { cn } from "@/lib/utils";

export const ServerlessSchema = z.object({
  provider: z.enum(["lambda", "cloudrun", "vercel"]).default("lambda"),
  runtime: z.string().default("Node.js 20"),
  memoryMb: z.number().default(256),
});

export type ServerlessProps = z.infer<typeof ServerlessSchema>;

type Provider = "lambda" | "cloudrun" | "vercel";

const PROVIDERS: { id: Provider; label: string; color: string }[] = [
  { id: "lambda", label: "AWS Lambda", color: "text-amber-600 dark:text-amber-400" },
  { id: "cloudrun", label: "Cloud Run", color: "text-blue-600 dark:text-blue-400" },
  { id: "vercel", label: "Vercel", color: "text-zinc-900 dark:text-zinc-100" },
];

const PROVIDER_COLORS: Record<Provider, string> = {
  lambda: "bg-amber-500",
  cloudrun: "bg-blue-500",
  vercel: "bg-zinc-800 dark:bg-white",
};

const COLD_PHASES = [
  { label: "Download code", ms: 50, color: "bg-violet-500" },
  { label: "Init runtime", ms: 200, color: "bg-blue-500" },
  { label: "Start fn", ms: 30, color: "bg-amber-500" },
  { label: "Handle req", ms: 15, color: "bg-emerald-500" },
];
const WARM_PHASES = [{ label: "Handle req", ms: 15, color: "bg-emerald-500" }];

const COLD_TOTAL = COLD_PHASES.reduce((s, p) => s + p.ms, 0); // 295
const WARM_TOTAL = WARM_PHASES.reduce((s, p) => s + p.ms, 0); // 15

const TRIGGER_ICONS: Record<string, React.ElementType> = {
  HTTP: Globe,
  Queue: Database,
  Cron: Calendar,
  "S3 Event": Zap,
};

const SCALE_STEPS = [0, 1, 5, 20, 100];

export function Serverless({
  provider: providerProp = "lambda",
  runtime = "Node.js 20",
  memoryMb = 256,
}: ServerlessProps) {
  const [activeProvider, setActiveProvider] = useState<Provider>(providerProp);
  const [mode, setMode] = useState<"idle" | "cold" | "warm">("idle");
  const [phaseIdx, setPhaseIdx] = useState(-1);
  const [scaleStep, setScaleStep] = useState(0);
  const animRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setActiveProvider(providerProp);
  }, [providerProp]);

  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProvider]);

  function reset() {
    if (animRef.current) clearTimeout(animRef.current);
    setMode("idle");
    setPhaseIdx(-1);
    setScaleStep(0);
  }

  function animatePhases(phases: typeof COLD_PHASES) {
    let idx = 0;
    function next() {
      if (idx >= phases.length) {
        // animate scale
        let step = 0;
        function scaleNext() {
          step++;
          setScaleStep(step);
          if (step < SCALE_STEPS.length - 1) {
            animRef.current = setTimeout(scaleNext, 1000);
          } else {
            // cool down
            animRef.current = setTimeout(() => {
              setScaleStep(1);
              animRef.current = setTimeout(() => setScaleStep(0), 1200);
            }, 1500);
          }
        }
        animRef.current = setTimeout(scaleNext, 1000);
        return;
      }
      setPhaseIdx(idx);
      animRef.current = setTimeout(() => {
        idx++;
        next();
      }, 800);
    }
    next();
  }

  function handleCold() {
    reset();
    setMode("cold");
    setPhaseIdx(0);
    animatePhases(COLD_PHASES);
  }

  function handleWarm() {
    reset();
    setMode("warm");
    setPhaseIdx(0);
    animatePhases(WARM_PHASES);
  }

  const phases = mode === "cold" ? COLD_PHASES : mode === "warm" ? WARM_PHASES : [];
  const total = mode === "cold" ? COLD_TOTAL : WARM_TOTAL;

  const providerLabel =
    PROVIDERS.find((p) => p.id === activeProvider)?.label ?? "AWS Lambda";
  const providerColor = PROVIDER_COLORS[activeProvider];

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <div className="flex items-center gap-2">
          <Zap className="size-4 text-amber-500" />
          <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
            Serverless
          </span>
        </div>
        <span
          className={cn(
            "text-xs font-semibold px-2 py-0.5 rounded-full",
            activeProvider === "lambda"
              ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400"
              : activeProvider === "cloudrun"
              ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
          )}
        >
          {providerLabel}
        </span>
      </div>

      {/* Provider Tabs */}
      <div className="flex border-b border-zinc-100 dark:border-zinc-800 px-4 pt-3 gap-1">
        {PROVIDERS.map((p) => (
          <button
            key={p.id}
            onClick={() => setActiveProvider(p.id)}
            className={cn(
              "px-3 py-1.5 text-xs font-semibold rounded-t-lg transition-all duration-500 border-b-2",
              activeProvider === p.id
                ? `border-current ${p.color} bg-zinc-50 dark:bg-zinc-800`
                : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Run code on demand — no servers to manage. First request is slow (cold start); later requests reuse a warm container.
        </p>
      </div>

      {/* Body */}
      <div className="px-4 py-4 min-h-[320px] flex flex-col gap-4">
        {/* Runtime + memory */}
        <div className="flex gap-3 text-xs text-zinc-500 dark:text-zinc-400 font-mono">
          <span>Runtime: <span className="text-zinc-700 dark:text-zinc-300 font-semibold">{runtime}</span></span>
          <span>Memory: <span className="text-zinc-700 dark:text-zinc-300 font-semibold">{memoryMb}MB</span></span>
        </div>

        {/* Trigger types */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(TRIGGER_ICONS).map(([label, Icon]) => (
            <div
              key={label}
              className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1"
            >
              <Icon className="w-3 h-3 text-zinc-500" />
              <span className="text-[10px] text-zinc-600 dark:text-zinc-400 font-medium">{label}</span>
            </div>
          ))}
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 flex items-center">← triggers</span>
        </div>

        {/* Execution phases */}
        <div className="rounded-lg bg-zinc-950 px-3 py-3 flex flex-col gap-2">
          {/* Mode label */}
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500">
              {mode === "cold"
                ? "Cold Start (first request)"
                : mode === "warm"
                ? "Warm Start (subsequent request)"
                : "Execution Timeline"}
            </span>
            {mode !== "idle" && phaseIdx >= phases.length - 1 && scaleStep === 0 && (
              <span
                className={cn(
                  "text-[10px] font-semibold font-mono",
                  mode === "cold" ? "text-amber-400" : "text-emerald-400"
                )}
              >
                Total: ~{total}ms
              </span>
            )}
          </div>

          {/* Phase bars */}
          {mode === "idle" ? (
            <div className="text-xs text-zinc-500 text-center py-4">
              Click a button below to simulate
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {phases.map((phase, i) => {
                const isActive = phaseIdx === i;
                const isDone = phaseIdx > i;
                const maxMs = mode === "cold" ? COLD_TOTAL : WARM_TOTAL;
                const widthPct = (phase.ms / maxMs) * 100;

                return (
                  <div key={phase.label} className="flex items-center gap-2">
                    <div className="w-24 shrink-0">
                      <span className="text-[10px] text-zinc-400">{phase.label}</span>
                    </div>
                    <div className="flex-1 h-4 bg-zinc-800 rounded overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded transition-all duration-500",
                          phase.color,
                          isDone ? "opacity-100" : isActive ? "opacity-100 animate-pulse" : "opacity-20"
                        )}
                        style={{ width: isDone || isActive ? `${widthPct}%` : "0%" }}
                      />
                    </div>
                    <span
                      className={cn(
                        "text-[10px] font-mono w-10 shrink-0 text-right",
                        isDone ? "text-zinc-300" : isActive ? "text-white" : "text-zinc-600"
                      )}
                    >
                      {phase.ms}ms
                    </span>
                    {isDone && <span className="text-[10px] text-emerald-400">✓</span>}
                    {isActive && <Clock className="w-3 h-3 text-amber-400 animate-spin" />}
                  </div>
                );
              })}

              {/* Cold vs warm delta callout */}
              {mode === "warm" && phaseIdx >= 0 && (
                <div className="mt-1 text-[10px] text-emerald-400 bg-emerald-950/40 rounded px-2 py-1 border border-emerald-800">
                  Container already running! Skip 280ms of cold start overhead.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Auto-scaling timeline */}
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2">
            Auto-scaling (instances)
          </p>
          <div className="flex items-end gap-1 h-8">
            {SCALE_STEPS.map((step, i) => {
              const active = i <= scaleStep;
              const barHeight = step === 0 ? 4 : (step / 100) * 32;
              return (
                <div key={i} className="flex flex-col items-center gap-0.5 flex-1">
                  <div
                    className={cn(
                      "w-full rounded-sm transition-all duration-500",
                      active ? providerColor : "bg-zinc-200 dark:bg-zinc-700"
                    )}
                    style={{ height: Math.max(barHeight, 4) }}
                  />
                  <span className="text-[9px] text-zinc-400 dark:text-zinc-500">{step}</span>
                </div>
              );
            })}
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 ml-1 self-center">→ 0 when idle</span>
          </div>
        </div>

        {/* Billing comparison */}
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-3 py-2 flex flex-col gap-1">
          <p className="text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Billing model</p>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <div className="flex items-center justify-between text-[10px] mb-0.5">
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Serverless</span>
                <span className="text-zinc-400">pay ~295ms/req</span>
              </div>
              <div className="h-2.5 bg-zinc-200 dark:bg-zinc-700 rounded overflow-hidden">
                <div className="h-full w-[3%] bg-emerald-500 rounded" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <div className="flex items-center justify-between text-[10px] mb-0.5">
                <span className="text-red-500 font-semibold">EC2 t3.small</span>
                <span className="text-zinc-400">pay 24h / day</span>
              </div>
              <div className="h-2.5 bg-zinc-200 dark:bg-zinc-700 rounded overflow-hidden">
                <div className="h-full w-full bg-red-400 rounded" />
              </div>
            </div>
          </div>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
            Serverless pays only for actual execution — zero cost at zero traffic.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-2 flex-wrap bg-zinc-50 dark:bg-zinc-900/30">
        <span className="text-xs text-zinc-500 flex-1">
          {mode === "idle"
            ? "Simulate a cold or warm start to see the difference"
            : mode === "cold"
            ? "Cold start: container must boot before handling the request"
            : "Warm start: container already running — instant response"}
        </span>
        <button
          onClick={handleCold}
          disabled={mode !== "idle" && phaseIdx < phases.length}
          className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          Simulate Cold Start
        </button>
        <button
          onClick={handleWarm}
          disabled={mode !== "idle" && phaseIdx < phases.length}
          className="bg-emerald-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          Simulate Warm Start
        </button>
        {mode !== "idle" && (
          <button
            onClick={reset}
            className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all duration-500"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
