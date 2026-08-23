"use client";

import { useState, useCallback, useRef } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Cpu, Wifi, WifiOff, Globe, Database, RefreshCw } from "lucide-react";

export const ServiceWorkerSchema = z.object({
  strategy: z.enum(["cache-first", "network-first", "stale-while-revalidate", "cache-only"]).default("cache-first"),
  resources: z.array(z.object({
    url: z.string(),
    type: z.enum(["html", "css", "js", "image", "api"]),
    cached: z.boolean(),
  })).default([
    { url: "/",             type: "html",  cached: true  },
    { url: "/styles.css",   type: "css",   cached: true  },
    { url: "/app.js",       type: "js",    cached: true  },
    { url: "/logo.png",     type: "image", cached: true  },
    { url: "/api/products", type: "api",   cached: false },
  ]),
});

export type ServiceWorkerProps = z.infer<typeof ServiceWorkerSchema>;

type Strategy = "cache-first" | "network-first" | "stale-while-revalidate" | "cache-only";

type FlowStep = {
  label: string;
  path: "cache" | "network" | "response" | "update";
  result?: "hit" | "miss" | "error" | "ok";
};

const STRATEGY_CONFIG: Record<Strategy, {
  label: string;
  description: string;
  insight: string;
  color: string;
  bg: string;
}> = {
  "cache-first": {
    label: "Cache-First",
    description: "Check cache → serve immediately. Fetch from network only on cache miss.",
    insight: "Best for static assets like CSS, JS, fonts. Blazing fast — never hits the network if cached.",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40",
  },
  "network-first": {
    label: "Network-First",
    description: "Always try network → fall back to cache if offline.",
    insight: "Best for API calls where fresh data matters. Falls back gracefully when offline.",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/40",
  },
  "stale-while-revalidate": {
    label: "Stale-While-Revalidate",
    description: "Serve from cache immediately, then fetch fresh copy in background.",
    insight: "Best for non-critical content. Users get instant response, cache silently updates.",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40",
  },
  "cache-only": {
    label: "Cache-Only",
    description: "Only serve from cache. Never touches the network.",
    insight: "Best for offline-first apps with pre-cached assets. Requires careful pre-caching setup.",
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-950/20 border-violet-200 dark:border-violet-900/40",
  },
};

function getFlowSteps(strategy: Strategy, cached: boolean, offline: boolean): FlowStep[] {
  switch (strategy) {
    case "cache-first":
      if (cached) {
        return [
          { label: "App → SW: Request resource", path: "cache", result: "ok" },
          { label: "SW checks cache", path: "cache", result: "hit" },
          { label: "Cache HIT → serve immediately", path: "response", result: "ok" },
        ];
      }
      return [
        { label: "App → SW: Request resource", path: "cache", result: "ok" },
        { label: "SW checks cache", path: "cache", result: "miss" },
        { label: offline ? "Network unavailable!" : "SW fetches from network", path: "network", result: offline ? "error" : "ok" },
        ...(offline ? [] : [
          { label: "SW caches response", path: "cache" as const, result: "ok" as const },
          { label: "Serve to app", path: "response" as const, result: "ok" as const },
        ]),
      ];
    case "network-first":
      if (offline) {
        return [
          { label: "App → SW: Request resource", path: "network", result: "ok" },
          { label: "Network unavailable!", path: "network", result: "error" },
          { label: cached ? "SW falls back to cache" : "No cache — request fails", path: "cache", result: cached ? "hit" : "miss" },
        ];
      }
      return [
        { label: "App → SW: Request resource", path: "network", result: "ok" },
        { label: "Fetch from network (fresh)", path: "network", result: "ok" },
        { label: "Update cache", path: "update", result: "ok" },
        { label: "Serve fresh response", path: "response", result: "ok" },
      ];
    case "stale-while-revalidate":
      return [
        { label: "App → SW: Request resource", path: "cache", result: "ok" },
        { label: cached ? "Serve stale from cache immediately" : "Cache miss — fetch network", path: "cache", result: cached ? "hit" : "miss" },
        { label: offline ? "Background fetch skipped (offline)" : "Simultaneously fetch from network", path: "network", result: offline ? "error" : "ok" },
        ...(offline || !cached ? [] : [{ label: "Cache updated for next request", path: "update" as const, result: "ok" as const }]),
      ];
    case "cache-only":
      return [
        { label: "App → SW: Request resource", path: "cache", result: "ok" },
        { label: cached ? "Cache HIT — serve immediately" : "Cache MISS — request fails!", path: "cache", result: cached ? "hit" : "miss" },
        ...(cached ? [{ label: "Serve from cache (network never used)", path: "response" as const, result: "ok" as const }] : []),
      ];
  }
}

const PATH_COLOR: Record<string, string> = {
  cache: "text-emerald-600 dark:text-emerald-400",
  network: "text-blue-600 dark:text-blue-400",
  response: "text-zinc-700 dark:text-zinc-300",
  update: "text-amber-600 dark:text-amber-400",
};

const RESULT_ICON: Record<string, string> = {
  hit: "✓ HIT",
  miss: "✗ MISS",
  error: "✗ OFFLINE",
  ok: "→",
};

const TYPE_COLORS: Record<string, string> = {
  html:  "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
  css:   "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300",
  js:    "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
  image: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300",
  api:   "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300",
};

export function ServiceWorker({
  strategy: strategyProp = "cache-first",
  resources = [
    { url: "/",             type: "html",  cached: true  },
    { url: "/styles.css",   type: "css",   cached: true  },
    { url: "/app.js",       type: "js",    cached: true  },
    { url: "/logo.png",     type: "image", cached: true  },
    { url: "/api/products", type: "api",   cached: false },
  ],
}: ServiceWorkerProps) {
  const [activeStrategy, setActiveStrategy] = useState<Strategy>(strategyProp);
  const [isOffline, setIsOffline] = useState(false);
  const [flowSteps, setFlowSteps] = useState<FlowStep[]>([]);
  const [visibleSteps, setVisibleSteps] = useState(0);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const strategies = (["cache-first", "network-first", "stale-while-revalidate", "cache-only"] as Strategy[]);
  const cfg = STRATEGY_CONFIG[activeStrategy];

  const requestResource = useCallback((url: string) => {
    const resource = resources.find((r) => r.url === url);
    const cached = resource?.cached ?? false;
    const steps = getFlowSteps(activeStrategy, cached, isOffline);

    setSelectedUrl(url);
    setFlowSteps(steps);
    setVisibleSteps(0);

    let i = 0;
    const tick = () => {
      i++;
      setVisibleSteps(i);
      if (i < steps.length) {
        timerRef.current = setTimeout(tick, 800);
      }
    };
    timerRef.current = setTimeout(tick, 300);
  }, [activeStrategy, resources, isOffline]);

  const reset = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setFlowSteps([]);
    setVisibleSteps(0);
    setSelectedUrl(null);
  };

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/70">
        <Cpu className="size-3.5 text-violet-500 shrink-0" />
        <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex-1">Service Worker</span>
        <button
          onClick={() => { setIsOffline((v) => !v); reset(); }}
          className={cn(
            "flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full transition-all duration-300",
            isOffline
              ? "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700"
          )}
        >
          {isOffline ? <WifiOff className="size-3" /> : <Wifi className="size-3" />}
          {isOffline ? "Offline" : "Online"}
        </button>
      </div>

      {/* Strategy tabs */}
      <div className="flex border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 px-4 gap-1 pt-2 overflow-x-auto">
        {strategies.map((s) => (
          <button
            key={s}
            onClick={() => { setActiveStrategy(s); reset(); }}
            className={cn(
              "px-2.5 py-1.5 text-[10px] font-semibold rounded-t-md transition-all duration-300 border-b-2 whitespace-nowrap shrink-0",
              activeStrategy === s
                ? "bg-white dark:bg-zinc-900 text-violet-600 dark:text-violet-400 border-violet-500 shadow-sm"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 border-transparent"
            )}
          >
            {STRATEGY_CONFIG[s].label}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div className="min-h-[300px] p-4 flex flex-col gap-3">
        {/* Architecture diagram */}
        <div className="flex items-center gap-2 justify-center flex-wrap">
          {/* App */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2">
              <Globe className="size-3.5 text-zinc-500" />
              <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">App</span>
            </div>
          </div>

          <div className="text-zinc-300 dark:text-zinc-600 text-xs font-mono">→→</div>

          {/* Service Worker */}
          <div className="flex flex-col items-center gap-1">
            <div className={cn(
              "flex items-center gap-1.5 border rounded-lg px-3 py-2 transition-all duration-300",
              flowSteps.length > 0
                ? "bg-violet-50 dark:bg-violet-950/20 border-violet-300 dark:border-violet-700"
                : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
            )}>
              <Cpu className="size-3.5 text-violet-500" />
              <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">SW</span>
              <span className={cn("size-1.5 rounded-full transition-all duration-300", flowSteps.length > 0 ? "bg-violet-500 animate-pulse" : "bg-zinc-300 dark:bg-zinc-600")} />
            </div>
          </div>

          <div className="text-zinc-300 dark:text-zinc-600 text-xs font-mono">⇌</div>

          {/* Cache + Network */}
          <div className="flex gap-2">
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg px-2.5 py-2">
                <Database className="size-3 text-emerald-500" />
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">Cache</span>
              </div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className={cn(
                "flex items-center gap-1.5 border rounded-lg px-2.5 py-2 transition-all duration-300",
                isOffline
                  ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
                  : "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"
              )}>
                {isOffline ? <WifiOff className="size-3 text-red-500" /> : <Wifi className="size-3 text-blue-500" />}
                <span className={cn("text-[10px] font-semibold", isOffline ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400")}>
                  {isOffline ? "Offline" : "Network"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Strategy description */}
        <div className={cn("text-[10px] rounded-lg border px-3 py-2", cfg.bg)}>
          <span className={cn("font-bold", cfg.color)}>{cfg.label}: </span>
          <span className="text-zinc-600 dark:text-zinc-400">{cfg.description}</span>
        </div>

        {/* Flow animation */}
        {flowSteps.length > 0 && (
          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-100 dark:border-zinc-800 p-3 space-y-1.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                Request: <code className="font-mono text-zinc-700 dark:text-zinc-300">{selectedUrl}</code>
              </span>
              <button onClick={reset} className="p-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                <RefreshCw className="size-3" />
              </button>
            </div>
            {flowSteps.slice(0, visibleSteps).map((step, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-center gap-2 text-[11px] transition-all duration-500",
                  i < visibleSteps ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"
                )}
              >
                <span className={cn("font-bold text-[10px] w-14 shrink-0 text-right", PATH_COLOR[step.path])}>
                  {RESULT_ICON[step.result ?? "ok"]}
                </span>
                <span className="text-zinc-600 dark:text-zinc-400">{step.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Resource buttons */}
        <div className="mt-auto">
          <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-1.5">Request resource:</p>
          <div className="flex flex-wrap gap-1.5">
            {resources.slice(0, 5).map((r) => (
              <button
                key={r.url}
                onClick={() => requestResource(r.url)}
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-mono transition-all duration-300 border",
                  selectedUrl === r.url
                    ? "bg-violet-100 dark:bg-violet-900/40 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300"
                    : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600"
                )}
              >
                <span className={cn("text-[9px] px-1 py-0.5 rounded font-semibold", TYPE_COLORS[r.type])}>{r.type}</span>
                {r.url}
                <span className={r.cached ? "text-emerald-500" : "text-zinc-300 dark:text-zinc-600"}>
                  {r.cached ? "✓" : "✗"}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Insight footer */}
      <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-2.5 bg-zinc-50/50 dark:bg-zinc-900/30">
        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
          <span className="font-bold text-violet-500">TIP </span>{cfg.insight}
        </p>
      </div>
    </div>
  );
}
