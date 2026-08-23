"use client";

import { useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Play, RefreshCw, ChevronRight } from "lucide-react";

export const StateMachineSchema = z.object({
  title: z.string().optional().default("Order State Machine"),
  states: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      type: z.enum(["initial", "normal", "final", "error"]).optional().default("normal"),
      description: z.string().optional(),
    })
  ),
  transitions: z.array(
    z.object({
      from: z.string(),
      to: z.string(),
      label: z.string(),
      event: z.string().optional(),
      guard: z.string().optional(),
    })
  ),
  initialState: z.string().optional(),
  interactive: z.boolean().optional().default(true),
});

export type StateMachineProps = z.infer<typeof StateMachineSchema>;

const TYPE_CFG = {
  initial: {
    outer: "border-2 border-zinc-800 dark:border-zinc-200 bg-zinc-800 dark:bg-zinc-200",
    inner: "text-white dark:text-zinc-900",
    badge: "bg-zinc-700 dark:bg-zinc-300 text-white dark:text-zinc-900",
  },
  normal: {
    outer: "border-2 border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950",
    inner: "text-zinc-700 dark:text-zinc-300",
    badge: "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400",
  },
  final: {
    outer: "border-2 border-emerald-400 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-950/20",
    inner: "text-emerald-700 dark:text-emerald-400",
    badge: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400",
  },
  error: {
    outer: "border-2 border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-950/20",
    inner: "text-red-700 dark:text-red-400",
    badge: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
  },
};

const ACTIVE_RING = "ring-2 ring-blue-400 dark:ring-blue-500 ring-offset-2 ring-offset-white dark:ring-offset-zinc-950";

export function StateMachine({
  title = "Order State Machine",
  states,
  transitions,
  initialState,
  interactive = true,
}: StateMachineProps) {
  const init = initialState ?? states.find((s) => s.type === "initial")?.id ?? states[0]?.id ?? "";
  const [current, setCurrent] = useState(init);
  const [history, setHistory] = useState<string[]>([init]);

  const availableTransitions = transitions.filter((t) => t.from === current);

  function go(to: string) {
    setCurrent(to);
    setHistory((prev) => [...prev, to]);
  }

  function reset() {
    setCurrent(init);
    setHistory([init]);
  }

  const currentState = states.find((s) => s.id === current);

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/50">
        <Play className="size-3.5 text-zinc-400 shrink-0" />
        <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex-1">{title}</span>
        {interactive && (
          <button onClick={reset} className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
            <RefreshCw className="size-3.5" />
          </button>
        )}
      </div>

      {/* States grid */}
      <div className="p-4">
        <div className="flex flex-wrap gap-2 mb-4">
          {states.map((state) => {
            const cfg = TYPE_CFG[state.type ?? "normal"];
            const isActive = state.id === current;
            return (
              <div
                key={state.id}
                className={cn(
                  "relative flex flex-col items-center gap-1 px-3 py-2 rounded-xl min-w-20 transition-all duration-150",
                  cfg.outer,
                  isActive && ACTIVE_RING,
                  interactive && availableTransitions.some((t) => t.to === state.id) && "cursor-pointer hover:scale-105",
                )}
                onClick={() => {
                  if (interactive && availableTransitions.some((t) => t.to === state.id)) {
                    go(state.id);
                  }
                }}
              >
                {isActive && (
                  <span className="absolute -top-1.5 -right-1.5 size-3 rounded-full bg-blue-500 border-2 border-white dark:border-zinc-950" />
                )}
                {state.type === "initial" && (
                  <span className="size-2 rounded-full bg-white dark:bg-zinc-900 mb-0.5" />
                )}
                {state.type === "final" && (
                  <span className="size-2 rounded-full bg-emerald-500 mb-0.5" />
                )}
                <span className={cn("text-[11px] font-semibold text-center leading-tight", cfg.inner)}>
                  {state.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Current state detail */}
        {currentState && (
          <div className="mb-4 px-3 py-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40">
            <div className="flex items-center gap-2 mb-1">
              <span className="size-1.5 rounded-full bg-blue-500" />
              <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                Current State
              </span>
            </div>
            <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{currentState.label}</div>
            {currentState.description && (
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">{currentState.description}</div>
            )}
          </div>
        )}

        {/* Available transitions */}
        {interactive && (
          <div>
            <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide mb-2">
              Available Transitions
            </div>
            {availableTransitions.length === 0 ? (
              <div className="text-xs text-zinc-400 py-2">
                {currentState?.type === "final" || currentState?.type === "error"
                  ? "Terminal state — no outgoing transitions"
                  : "No transitions available"}
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {availableTransitions.map((t, i) => {
                  const toState = states.find((s) => s.id === t.to);
                  const toCfg = TYPE_CFG[(toState?.type ?? "normal")];
                  return (
                    <button
                      key={i}
                      onClick={() => go(t.to)}
                      className="flex items-center gap-2 text-left px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/10 transition-all group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">{t.label}</span>
                          {t.event && (
                            <span className="text-[10px] font-mono text-blue-500 dark:text-blue-400">{t.event}</span>
                          )}
                        </div>
                        {t.guard && (
                          <div className="text-[10px] text-zinc-400 mt-0.5 font-mono">[{t.guard}]</div>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <ChevronRight className="size-3 text-zinc-300 dark:text-zinc-700" />
                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-semibold", toCfg.badge)}>
                          {toState?.label ?? t.to}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Transition history */}
        {history.length > 1 && (
          <div className="mt-4 flex items-center gap-1 flex-wrap">
            {history.map((h, i) => {
              const s = states.find((st) => st.id === h);
              return (
                <div key={i} className="flex items-center gap-1">
                  <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-500">
                    {s?.label ?? h}
                  </span>
                  {i < history.length - 1 && (
                    <ChevronRight className="size-2.5 text-zinc-300 dark:text-zinc-700 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* All transitions table (non-interactive) */}
      {!interactive && (
        <div className="border-t border-zinc-100 dark:border-zinc-900 divide-y divide-zinc-50 dark:divide-zinc-900">
          {transitions.map((t, i) => {
            const from = states.find((s) => s.id === t.from);
            const to = states.find((s) => s.id === t.to);
            return (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5 text-xs">
                <span className="text-zinc-500 dark:text-zinc-500 font-mono">{from?.label ?? t.from}</span>
                <ChevronRight className="size-3 text-zinc-300 dark:text-zinc-700 shrink-0" />
                <span className="font-semibold text-zinc-700 dark:text-zinc-300 flex-1">{t.label}</span>
                <ChevronRight className="size-3 text-zinc-300 dark:text-zinc-700 shrink-0" />
                <span className="text-zinc-500 dark:text-zinc-500 font-mono">{to?.label ?? t.to}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
