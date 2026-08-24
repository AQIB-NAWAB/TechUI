"use client";

import { useState, useMemo } from "react";
import { z } from "zod";
import { Settings2, Globe, Database, Zap, Server } from "lucide-react";
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
    header: "from-blue-500 to-blue-600",
    badge: "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    dot: "bg-blue-500",
    panel: "border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20",
    accent: "text-blue-600 dark:text-blue-400",
  },
  amber: {
    header: "from-amber-500 to-amber-600",
    badge: "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    dot: "bg-amber-500",
    panel: "border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20",
    accent: "text-amber-600 dark:text-amber-400",
  },
  emerald: {
    header: "from-emerald-500 to-emerald-600",
    badge: "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    dot: "bg-emerald-500",
    panel: "border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20",
    accent: "text-emerald-600 dark:text-emerald-400",
  },
};

function getVar(vars: EnvironmentConfigProps["environments"][0]["vars"], key: string): string {
  return vars.find((v) => v.key === key)?.value ?? "—";
}

function AppPreview({
  env,
  switching,
}: {
  env: EnvironmentConfigProps["environments"][0];
  switching: boolean;
}) {
  const colors = COLOR_MAP[env.color];
  const logLevel = getVar(env.vars, "LOG_LEVEL");
  const port = getVar(env.vars, "PORT");
  const dbUrl = getVar(env.vars, "DATABASE_URL");
  const isLocal = dbUrl.includes("localhost");
  const isProd = env.color === "emerald";

  return (
    <div className={cn(
      "rounded-lg border overflow-hidden transition-all duration-700 flex-1 min-w-0",
      colors.panel,
      switching && "opacity-50 scale-[0.98]"
    )}>
      <div className={cn("px-3 py-2 bg-gradient-to-r text-white flex items-center gap-2", colors.header)}>
        <Globe className="size-3.5 shrink-0" />
        <span className="text-xs font-semibold truncate flex-1">{env.name}</span>
        <span className="text-[10px] font-mono opacity-80">:{port}</span>
      </div>

      <div className="p-3 space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0">
            <Server className="size-4 text-zinc-500" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 truncate">FreshMarket</div>
            <div className={cn("text-[10px] font-mono truncate", colors.accent)}>
              {isLocal ? "localhost" : isProd ? "freshmarket.com" : "staging.freshmarket.com"}
            </div>
          </div>
          <span className={cn(
            "text-[9px] font-bold uppercase px-1.5 py-0.5 rounded transition-all duration-500",
            logLevel === "debug" ? "bg-violet-100 dark:bg-violet-900 text-violet-600" :
            logLevel === "info" ? "bg-blue-100 dark:bg-blue-900 text-blue-600" :
            "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
          )}>
            {logLevel}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-md bg-white/60 dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800 p-2">
            <div className="flex items-center gap-1 text-[9px] text-zinc-400 mb-0.5">
              <Database className="size-2.5" /> Database
            </div>
            <div className="text-[10px] font-mono text-zinc-600 dark:text-zinc-400 truncate">
              {isLocal ? "local MongoDB" : isProd ? "prod cluster" : "staging cluster"}
            </div>
          </div>
          <div className="rounded-md bg-white/60 dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800 p-2">
            <div className="flex items-center gap-1 text-[9px] text-zinc-400 mb-0.5">
              <Zap className="size-2.5" /> Payments
            </div>
            <div className="text-[10px] font-mono text-zinc-600 dark:text-zinc-400">
              {isProd ? "live mode" : "test mode"}
            </div>
          </div>
        </div>

        <div className={cn(
          "rounded-md px-2 py-1.5 text-[10px] font-medium text-center transition-all duration-500",
          isProd
            ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400"
            : env.color === "amber"
              ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400"
              : "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400"
        )}>
          {isProd ? "Real customers · real charges" : env.color === "amber" ? "QA testing · fake data" : "Local dev · safe to break"}
        </div>
      </div>
    </div>
  );
}

export function EnvironmentConfig({
  appName = "FreshMarket API",
  environments = [],
}: EnvironmentConfigProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [switching, setSwitching] = useState(false);

  const activeEnv = environments[activeIndex];
  const colors = activeEnv ? COLOR_MAP[activeEnv.color] : COLOR_MAP.blue;

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

  function switchEnvironment() {
    if (switching) return;
    setSwitching(true);
    setTimeout(() => {
      setActiveIndex((i) => (i + 1) % environments.length);
      setTimeout(() => setSwitching(false), 500);
    }, 500);
  }

  if (!activeEnv) {
    return (
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 text-center text-sm text-zinc-400">
        No environments configured.
      </div>
    );
  }

  const diffCount = differingKeys.size;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <Settings2 className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">Environment Config</span>
        <span className="text-xs font-mono text-zinc-500">{appName}</span>
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        Same app, different settings — swap environments to see how database, logging, and payments change.
      </p>

      <div className="min-h-[260px] px-4 py-4 flex flex-col gap-4">
        <div className="flex gap-2 overflow-x-auto">
          {environments.map((env, i) => {
            const c = COLOR_MAP[env.color];
            const isActive = i === activeIndex;
            return (
              <button
                key={env.name}
                onClick={() => setActiveIndex(i)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-500 shrink-0",
                  isActive ? c.badge : "border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-300"
                )}
              >
                <span className={cn("size-2 rounded-full", c.dot)} />
                {env.name}
              </button>
            );
          })}
        </div>

        <div className="flex gap-3 items-stretch min-h-[180px]">
          {environments.map((env, i) => (
            <div
              key={env.name}
              className={cn(
                "transition-all duration-700 flex-1 min-w-0",
                i === activeIndex ? "opacity-100 scale-100" : "opacity-30 scale-95 hidden sm:block"
              )}
            >
              <AppPreview env={env} switching={switching && i === activeIndex} />
            </div>
          ))}
          <div className="sm:hidden flex-1">
            <AppPreview env={activeEnv} switching={switching} />
          </div>
        </div>

        <div className="rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 p-3">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-2">
            What changes ({diffCount} vars differ)
          </div>
          <div className="flex flex-wrap gap-2">
            {[...differingKeys].slice(0, 5).map((key) => {
              const val = activeEnv.vars.find((v) => v.key === key)?.value ?? "—";
              return (
                <div key={key} className="bg-zinc-100 dark:bg-zinc-800 rounded-md px-2.5 py-1 transition-all duration-500">
                  <div className="text-[9px] font-mono font-bold text-zinc-500">{key}</div>
                  <div className={cn("text-[10px] font-mono truncate max-w-[120px]", colors.accent)}>
                    {val.length > 20 ? val.slice(0, 18) + "…" : val}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/30 min-h-[52px]">
        <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">
          {switching
            ? "Switching environment…"
            : `Running as ${activeEnv.name} — ${activeEnv.vars.length} config values loaded`}
        </span>
        <button
          onClick={switchEnvironment}
          disabled={switching || environments.length < 2}
          className={cn(
            "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-all duration-500 shrink-0",
            (switching || environments.length < 2) && "opacity-60 cursor-not-allowed"
          )}
        >
          Switch Environment
        </button>
      </div>
    </div>
  );
}
