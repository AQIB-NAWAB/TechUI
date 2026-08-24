"use client";

import { useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Flag, AlertTriangle } from "lucide-react";

export const FeatureFlagSchema = z.object({
  name: z.string().default("dark-mode"),
  description: z.string().default("Enable the new dark mode UI for all users"),
  environments: z
    .array(
      z.object({
        name: z.string(),
        enabled: z.boolean(),
        rolloutPercent: z.number().min(0).max(100),
      })
    )
    .default([
      { name: "Development", enabled: true, rolloutPercent: 100 },
      { name: "Staging", enabled: true, rolloutPercent: 50 },
      { name: "Production", enabled: false, rolloutPercent: 0 },
    ]),
  killSwitch: z.boolean().optional().default(false),
});

export type FeatureFlagProps = z.infer<typeof FeatureFlagSchema>;

type EnvState = {
  name: string;
  enabled: boolean;
  rolloutPercent: number;
};

export function FeatureFlag({
  name = "dark-mode",
  description = "Enable the new dark mode UI for all users",
  environments = [
    { name: "Development", enabled: true, rolloutPercent: 100 },
    { name: "Staging", enabled: true, rolloutPercent: 50 },
    { name: "Production", enabled: false, rolloutPercent: 0 },
  ],
  killSwitch = false,
}: FeatureFlagProps) {
  const [envs, setEnvs] = useState<EnvState[]>(
    environments.map((e) => ({ ...e }))
  );
  const [killActive, setKillActive] = useState(killSwitch);
  const [killBanner, setKillBanner] = useState(false);

  const enabledCount = envs.filter((e) => e.enabled).length;

  function toggleEnv(idx: number) {
    if (killActive) return;
    setEnvs((prev) =>
      prev.map((e, i) => (i === idx ? { ...e, enabled: !e.enabled } : e))
    );
  }

  function toggleAll() {
    setKillActive(true);
    setEnvs((prev) => prev.map((e) => ({ ...e, enabled: false })));
    setKillBanner(true);
    setTimeout(() => setKillBanner(false), 2000);
  }

  function reset() {
    setKillActive(false);
    setKillBanner(false);
    setEnvs(environments.map((e) => ({ ...e })));
  }

  function rolloutLabel(pct: number) {
    if (pct === 100) return "all";
    if (pct === 0) return "none";
    if (pct <= 10) return "few";
    if (pct <= 50) return "half";
    return `${pct}%`;
  }

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800">
        <Flag className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">
          Feature Flag
        </span>
        <span
          className={cn(
            "text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-all duration-500",
            enabledCount > 0
              ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700"
          )}
        >
          {enabledCount}/{envs.length} on
        </span>
      </div>

      <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        <div className="font-mono text-sm font-bold text-zinc-800 dark:text-zinc-100">{name}</div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">{description}</p>
      </div>

      <div className="min-h-[260px] px-4 py-3">
        {(killActive || killBanner) && (
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold mb-3 transition-all duration-500",
              killBanner
                ? "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                : "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800"
            )}
          >
            <AlertTriangle className="size-3.5 shrink-0" />
            <span className="flex-1">
              {killBanner ? "All environments disabled" : "Kill switch active — all traffic blocked"}
            </span>
            {killActive && !killBanner && (
              <button
                onClick={reset}
                className="px-2 py-0.5 rounded-md bg-white/80 dark:bg-zinc-900/80 hover:opacity-90 transition-opacity text-[10px] font-bold"
              >
                Reset
              </button>
            )}
          </div>
        )}

        <div className="border border-zinc-100 dark:border-zinc-800 rounded-lg p-3 space-y-3">
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
            <span>Environment</span>
            <span className="text-right">Status</span>
            <span className="text-right">Rollout</span>
            <span className="text-right">Users</span>
          </div>

          {envs.map((env, idx) => (
            <div
              key={env.name}
              className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 items-center"
            >
              <div className="flex items-center gap-2 min-w-0">
                <button
                  onClick={() => toggleEnv(idx)}
                  disabled={killActive}
                  aria-label={`Toggle ${env.name}`}
                  className={cn(
                    "relative w-9 h-5 rounded-full shrink-0 transition-all duration-500 focus:outline-none",
                    env.enabled ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700",
                    killActive ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-500",
                      env.enabled ? "left-[18px]" : "left-0.5"
                    )}
                  />
                </button>
                <span className="text-xs text-zinc-700 dark:text-zinc-300 font-medium truncate">
                  {env.name}
                </span>
              </div>

              <span
                className={cn(
                  "text-[10px] font-bold px-1.5 py-0.5 rounded transition-all duration-500",
                  env.enabled
                    ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
                )}
              >
                {env.enabled ? "ON" : "OFF"}
              </span>

              <div className="flex flex-col items-end gap-0.5 min-w-[52px]">
                <span className="text-[10px] font-mono font-bold text-zinc-600 dark:text-zinc-400">
                  {env.enabled ? env.rolloutPercent : 0}%
                </span>
                <div className="w-12 h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      env.enabled ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700"
                    )}
                    style={{ width: `${env.enabled ? env.rolloutPercent : 0}%` }}
                  />
                </div>
              </div>

              <span className="text-[10px] text-zinc-400 w-8 text-right">
                {env.enabled ? rolloutLabel(env.rolloutPercent) : "none"}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
        <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">
          {killActive ? "Kill switch is on — reset to restore flags" : "Toggle environments or use kill switch for emergencies"}
        </span>
        {killActive ? (
          <button
            onClick={reset}
            className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity shrink-0"
          >
            Reset All
          </button>
        ) : (
          <button
            onClick={toggleAll}
            className="bg-amber-500 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity shrink-0"
          >
            Kill Switch
          </button>
        )}
      </div>
    </div>
  );
}
