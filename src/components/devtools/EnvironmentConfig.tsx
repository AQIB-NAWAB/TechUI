"use client";

import { useState, useMemo } from "react";
import { z } from "zod";
import { Settings2, Lock, Eye, EyeOff, Zap, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export const EnvironmentConfigSchema = z.object({
  appName: z.string().default("FreshMarket API"),
  environments: z
    .array(
      z.object({
        name: z.string(),
        color: z.enum(["blue", "amber", "emerald"]),
        vars: z.array(
          z.object({
            key: z.string(),
            value: z.string(),
            secret: z.boolean().optional().default(false),
          })
        ),
      })
    )
    .default([
      {
        name: "Development",
        color: "blue",
        vars: [
          { key: "DATABASE_URL", value: "mongodb://localhost:27017/freshmarket_dev", secret: false },
          { key: "JWT_SECRET", value: "dev-secret-not-for-prod", secret: true },
          { key: "STRIPE_KEY", value: "sk_test_abc123", secret: true },
          { key: "LOG_LEVEL", value: "debug", secret: false },
          { key: "PORT", value: "3000", secret: false },
        ],
      },
      {
        name: "Staging",
        color: "amber",
        vars: [
          { key: "DATABASE_URL", value: "mongodb+srv://staging.cluster.mongodb.net/freshmarket", secret: false },
          { key: "JWT_SECRET", value: "••••••••••••••••", secret: true },
          { key: "STRIPE_KEY", value: "sk_test_xyz789", secret: true },
          { key: "LOG_LEVEL", value: "info", secret: false },
          { key: "PORT", value: "3000", secret: false },
        ],
      },
      {
        name: "Production",
        color: "emerald",
        vars: [
          { key: "DATABASE_URL", value: "mongodb+srv://prod.cluster.mongodb.net/freshmarket", secret: false },
          { key: "JWT_SECRET", value: "••••••••••••••••", secret: true },
          { key: "STRIPE_KEY", value: "sk_live_••••••••", secret: true },
          { key: "LOG_LEVEL", value: "warn", secret: false },
          { key: "PORT", value: "8080", secret: false },
        ],
      },
    ]),
});

export type EnvironmentConfigProps = z.infer<typeof EnvironmentConfigSchema>;

const COLOR_MAP = {
  blue: {
    tab: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800",
    activeTab: "bg-blue-600 text-white border-blue-600 dark:bg-blue-500 dark:border-blue-500",
    dot: "bg-blue-500",
    ring: "ring-blue-500/20",
  },
  amber: {
    tab: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
    activeTab: "bg-amber-500 text-white border-amber-500 dark:bg-amber-500 dark:border-amber-500",
    dot: "bg-amber-500",
    ring: "ring-amber-500/20",
  },
  emerald: {
    tab: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
    activeTab: "bg-emerald-600 text-white border-emerald-600 dark:bg-emerald-500 dark:border-emerald-500",
    dot: "bg-emerald-500",
    ring: "ring-emerald-500/20",
  },
};

function truncate(str: string, max: number) {
  return str.length > max ? str.slice(0, max) + "…" : str;
}

export function EnvironmentConfig({
  appName = "FreshMarket API",
  environments = [],
}: EnvironmentConfigProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [showSecrets, setShowSecrets] = useState(false);

  const activeEnv = environments[activeIndex];
  const colors = activeEnv ? COLOR_MAP[activeEnv.color] : COLOR_MAP.blue;

  // Compute keys that differ across environments
  const differingKeys = useMemo(() => {
    if (environments.length < 2) return new Set<string>();
    const allKeys = new Set(environments.flatMap((e) => e.vars.map((v) => v.key)));
    const diff = new Set<string>();
    allKeys.forEach((key) => {
      const values = environments.map((e) => e.vars.find((v) => v.key === key)?.value ?? "__missing__");
      if (new Set(values).size > 1) diff.add(key);
    });
    return diff;
  }, [environments]);

  if (!activeEnv) {
    return (
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 text-center text-sm text-zinc-400">
        No environments configured.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <Settings2 className="size-4 text-zinc-500 dark:text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex-1">
          Environment Config
        </span>
        <span className="text-xs text-zinc-400 dark:text-zinc-500 font-mono">{appName}</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 px-4 pt-3 pb-0">
        {environments.map((env, i) => {
          const c = COLOR_MAP[env.color];
          const isActive = i === activeIndex;
          return (
            <button
              key={env.name}
              onClick={() => setActiveIndex(i)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-300",
                isActive ? c.activeTab : c.tab,
                "hover:opacity-90"
              )}
            >
              {env.name}
            </button>
          );
        })}
      </div>

      {/* Env vars table */}
      <div className="min-h-[260px] px-4 py-3">
        {/* Env label */}
        <div className="flex items-center gap-2 mb-3">
          <span className={cn("size-2.5 rounded-full shrink-0", colors.dot)} />
          <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{activeEnv.name}</span>
        </div>

        {/* Vars list */}
        <div className="divide-y divide-zinc-50 dark:divide-zinc-800/50 rounded-lg border border-zinc-100 dark:border-zinc-800 overflow-hidden">
          {activeEnv.vars.map((v) => {
            const isSecret = v.secret;
            const differs = differingKeys.has(v.key);
            const displayValue = isSecret && !showSecrets ? "••••••••••••••••" : truncate(v.value, 42);

            return (
              <div
                key={v.key}
                className="group flex items-center gap-3 px-3 py-2.5 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
              >
                {/* Key */}
                <div className="flex items-center gap-1.5 shrink-0" style={{ width: "38%" }}>
                  <span className="font-mono text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">
                    {v.key}
                  </span>
                  {differs && (
                    <span title="Differs across environments">
                      <AlertCircle className="size-3 text-amber-500 shrink-0" />
                    </span>
                  )}
                </div>

                {/* Value */}
                <div className="flex-1 flex items-center gap-1.5 min-w-0">
                  <span
                    className={cn(
                      "font-mono text-xs truncate flex-1 transition-all duration-500",
                      isSecret && !showSecrets
                        ? "text-zinc-400 dark:text-zinc-600 tracking-widest"
                        : "text-emerald-600 dark:text-emerald-400"
                    )}
                  >
                    {displayValue}
                  </span>
                </div>

                {/* Secret badge */}
                {isSecret && (
                  <div className="flex items-center gap-1 shrink-0 text-zinc-400 dark:text-zinc-500">
                    <Lock className="size-3" />
                    <span className="text-[10px] font-medium">secret</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Insight */}
        <div className="mt-3 flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
          <Zap className="size-3 text-amber-400 shrink-0" />
          <span>12-factor: Store config in environment, never in code</span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
          Secrets masked · Never commit to git
        </span>
        <button
          onClick={() => setShowSecrets((v) => !v)}
          className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          {showSecrets ? (
            <>
              <EyeOff className="size-3" />
              Hide secrets
            </>
          ) : (
            <>
              <Eye className="size-3" />
              Show secrets
            </>
          )}
        </button>
      </div>
    </div>
  );
}
