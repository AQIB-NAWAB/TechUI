"use client";

import { useState, useEffect, useRef } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Layers } from "lucide-react";

export const ApiCachingSchema = z.object({
  endpoint: z.string().default("GET /api/products"),
  cacheControl: z.string().default("public, max-age=3600, stale-while-revalidate=60"),
  etag: z.string().default('"abc123xyz"'),
  layers: z.array(z.object({
    name: z.string(),
    type: z.enum(["browser", "cdn", "server", "database"]),
    ttl: z.string(),
    hit: z.boolean().optional().default(true),
  })).default([
    { name: "Browser Cache",    type: "browser",  ttl: "1 hour",    hit: true  },
    { name: "CDN (CloudFront)", type: "cdn",       ttl: "1 hour",    hit: true  },
    { name: "Redis Cache",      type: "server",    ttl: "5 minutes", hit: false },
    { name: "PostgreSQL",       type: "database",  ttl: "—",         hit: false },
  ]),
});

export type ApiCachingProps = z.infer<typeof ApiCachingSchema>;

type LayerConfig = {
  name: string;
  type: "browser" | "cdn" | "server" | "database";
  ttl: string;
  hit?: boolean;
};

type Scenario = {
  label: string;
  description: string;
  hitUpTo: number; // layer index that serves the response (-1 = all miss, goes to DB)
  latency: string;
  color: "emerald" | "blue" | "amber" | "red";
};

const TYPE_COLORS: Record<string, string> = {
  browser:  "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700",
  cdn:      "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 border-violet-300 dark:border-violet-700",
  server:   "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700",
  database: "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700",
};

const TYPE_ICONS: Record<string, string> = {
  browser:  "🌐",
  cdn:      "🌍",
  server:   "⚡",
  database: "🗄",
};

export function ApiCaching({
  endpoint = "GET /api/products",
  cacheControl = "public, max-age=3600, stale-while-revalidate=60",
  etag = '"abc123xyz"',
  layers = [
    { name: "Browser Cache",    type: "browser" as const,  ttl: "1 hour",    hit: true  },
    { name: "CDN (CloudFront)", type: "cdn" as const,       ttl: "1 hour",    hit: true  },
    { name: "Redis Cache",      type: "server" as const,    ttl: "5 minutes", hit: false },
    { name: "PostgreSQL",       type: "database" as const,  ttl: "—",         hit: false },
  ],
}: ApiCachingProps) {

  const activeLayers: LayerConfig[] = layers;

  // Build scenarios from the layers
  const scenarios: Scenario[] = ([
    {
      label: "HIT all",
      description: "Browser cache fresh",
      hitUpTo: 0,
      latency: "2ms",
      color: "emerald" as const,
    },
    {
      label: "Miss browser",
      description: "Browser expired → CDN hit",
      hitUpTo: Math.min(1, activeLayers.length - 1),
      latency: "12ms",
      color: "blue" as const,
    },
    {
      label: "Full miss",
      description: "CDN + browser expired",
      hitUpTo: Math.min(2, activeLayers.length - 1),
      latency: "45ms",
      color: "amber" as const,
    },
    {
      label: "DB query",
      description: "All caches miss → DB",
      hitUpTo: activeLayers.length - 1,
      latency: "312ms",
      color: "red" as const,
    },
  ] as Scenario[]).filter((s) => s.hitUpTo < activeLayers.length);

  const [activeScenario, setActiveScenario] = useState<Scenario | null>(null);
  const [animStep, setAnimStep] = useState(-1); // which layer the dot has reached
  const [done, setDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearTimers() {
    if (timerRef.current) clearTimeout(timerRef.current);
  }

  function runScenario(scenario: Scenario) {
    clearTimers();
    setActiveScenario(scenario);
    setAnimStep(-1);
    setDone(false);

    // Animate through layers up to the hit layer
    const stepsToAnimate = scenario.hitUpTo + 1;
    for (let i = 0; i < stepsToAnimate; i++) {
      timerRef.current = setTimeout(() => {
        setAnimStep(i);
        if (i === stepsToAnimate - 1) {
          timerRef.current = setTimeout(() => setDone(true), 500);
        }
      }, i * 700 + 200);
    }
  }

  useEffect(() => () => clearTimers(), []);

  const scenarioColor: Record<string, string> = {
    emerald: "text-emerald-700 dark:text-emerald-400",
    blue:    "text-blue-700 dark:text-blue-400",
    amber:   "text-amber-700 dark:text-amber-400",
    red:     "text-red-700 dark:text-red-400",
  };
  const scenarioBg: Record<string, string> = {
    emerald: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700",
    blue:    "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700",
    amber:   "bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700",
    red:     "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700",
  };

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <Layers className="size-4 text-blue-500 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">API Caching</span>
        <code className="text-xs font-mono text-zinc-500 dark:text-zinc-400 truncate max-w-[180px]">{endpoint}</code>
      </div>

      {/* HTTP headers */}
      <div className="px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/30 space-y-1">
        <div className="flex gap-2 text-[11px] font-mono">
          <span className="text-violet-500 dark:text-violet-400 shrink-0">Cache-Control:</span>
          <span className="text-zinc-700 dark:text-zinc-300 truncate">{cacheControl}</span>
        </div>
        <div className="flex gap-2 text-[11px] font-mono">
          <span className="text-violet-500 dark:text-violet-400 shrink-0">ETag:</span>
          <span className="text-zinc-700 dark:text-zinc-300">{etag}</span>
        </div>
      </div>

      {/* Interactive area */}
      <div className="min-h-[300px] px-4 pt-4 pb-3 flex flex-col gap-4">

        {/* Cache layer flow */}
        <div>
          <div className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
            Request flow
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            {/* Client */}
            <div className="flex flex-col items-center gap-1">
              <div className={cn(
                "px-2 py-1.5 rounded-lg border text-[11px] font-semibold transition-all duration-500",
                activeScenario
                  ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-300 dark:border-zinc-600"
              )}>
                Client
              </div>
            </div>

            {activeLayers.map((layer, idx) => {
              const reached = animStep >= idx;
              const isHit = activeScenario && idx === activeScenario.hitUpTo && done;
              const isMiss = activeScenario && reached && idx < (activeScenario?.hitUpTo ?? 0);
              const isPending = activeScenario && animStep === idx && !done;

              return (
                <div key={idx} className="flex items-center gap-1">
                  {/* Arrow */}
                  <div className={cn(
                    "flex items-center transition-all duration-500",
                    reached ? "opacity-100" : "opacity-20"
                  )}>
                    <div className={cn(
                      "h-0.5 w-4 transition-all duration-500",
                      isMiss ? "bg-red-400" : reached ? "bg-zinc-400 dark:bg-zinc-500" : "bg-zinc-200 dark:bg-zinc-700"
                    )} />
                    <div className={cn(
                      "w-0 h-0 border-t-4 border-b-4 border-l-4 border-transparent transition-all duration-300",
                      isMiss
                        ? "border-l-red-400"
                        : reached
                        ? "border-l-zinc-400 dark:border-l-zinc-500"
                        : "border-l-zinc-200 dark:border-l-zinc-700"
                    )} />
                  </div>

                  {/* Layer box */}
                  <div className="flex flex-col items-center gap-0.5">
                    <div className={cn(
                      "px-2 py-1.5 rounded-lg border text-[11px] font-semibold transition-all duration-500 relative",
                      isHit
                        ? "bg-emerald-100 dark:bg-emerald-900/40 border-emerald-400 dark:border-emerald-600 text-emerald-700 dark:text-emerald-300 scale-105"
                        : isMiss
                        ? "bg-red-100 dark:bg-red-900/30 border-red-400 dark:border-red-600 text-red-600 dark:text-red-400"
                        : reached
                        ? TYPE_COLORS[layer.type] ?? ""
                        : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-600"
                    )}>
                      {TYPE_ICONS[layer.type]} {layer.name.split(" ")[0]}
                      {isPending && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full animate-ping" />
                      )}
                    </div>
                    <span className={cn(
                      "text-[9px] font-mono transition-all duration-300",
                      isHit ? "text-emerald-600 dark:text-emerald-400 font-bold" : isMiss ? "text-red-500 dark:text-red-400" : "text-zinc-400 dark:text-zinc-500"
                    )}>
                      {isHit ? "✓ HIT" : isMiss ? "✗ MISS" : layer.ttl}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Result */}
        {activeScenario && done && (
          <div className={cn(
            "rounded-lg px-3 py-2 border text-xs font-semibold transition-all duration-500",
            scenarioBg[activeScenario.color] ?? ""
          )}>
            <span className={scenarioColor[activeScenario.color] ?? ""}>
              Served from{" "}
              <strong>{activeLayers[activeScenario.hitUpTo]?.name ?? "DB"}</strong>
              {" "}in{" "}
              <strong className="font-mono">{activeScenario.latency}</strong>
            </span>
            {activeScenario.color === "red" && (
              <span className="ml-2 text-zinc-500 dark:text-zinc-400 font-normal">
                — 100× slower than browser cache
              </span>
            )}
          </div>
        )}

        {/* Scenario buttons */}
        <div className="flex flex-wrap gap-2">
          {scenarios.map((scenario) => (
            <button
              key={scenario.label}
              onClick={() => runScenario(scenario)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200",
                activeScenario?.label === scenario.label
                  ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white"
                  : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700"
              )}
            >
              {scenario.label}
            </button>
          ))}
        </div>

        {/* Layer details table */}
        <div className="rounded-lg border border-zinc-100 dark:border-zinc-800 overflow-hidden">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/60">
                <th className="text-left px-3 py-1.5 text-zinc-500 dark:text-zinc-400 font-semibold">Layer</th>
                <th className="text-left px-3 py-1.5 text-zinc-500 dark:text-zinc-400 font-semibold">Type</th>
                <th className="text-left px-3 py-1.5 text-zinc-500 dark:text-zinc-400 font-semibold">TTL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
              {activeLayers.map((layer, idx) => (
                <tr key={idx} className={cn(
                  "transition-all duration-300",
                  activeScenario && animStep >= idx ? "bg-zinc-50/50 dark:bg-zinc-800/20" : ""
                )}>
                  <td className="px-3 py-1.5 font-mono text-zinc-700 dark:text-zinc-300">{layer.name}</td>
                  <td className="px-3 py-1.5">
                    <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-semibold border", TYPE_COLORS[layer.type] ?? "")}>
                      {layer.type}
                    </span>
                  </td>
                  <td className="px-3 py-1.5 font-mono text-zinc-500 dark:text-zinc-400">{layer.ttl}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Key insight */}
        <div className="text-[10px] text-zinc-400 dark:text-zinc-500 bg-zinc-50 dark:bg-zinc-800/40 rounded-lg px-3 py-2">
          Each cache layer reduces load.{" "}
          <strong className="text-zinc-600 dark:text-zinc-300">Browser cache costs 0 network.</strong>{" "}
          DB query is <strong className="text-red-500">100× slower</strong>.{" "}
          ETag enables <code className="font-mono">304 Not Modified</code> — saves bandwidth when data is unchanged.
        </div>
      </div>
    </div>
  );
}
