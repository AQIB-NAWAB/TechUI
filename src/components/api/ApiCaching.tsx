"use client";

import { useState, useEffect, useRef } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Layers, Monitor, Globe, Zap, Database, ArrowRight } from "lucide-react";

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
  hitUpTo: number;
  latency: string;
  color: "emerald" | "blue" | "amber" | "red";
};

const TYPE_COLORS: Record<string, string> = {
  browser:  "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700",
  cdn:      "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 border-violet-300 dark:border-violet-700",
  server:   "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700",
  database: "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700",
};

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  browser: Monitor,
  cdn: Globe,
  server: Zap,
  database: Database,
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

  const scenarios: Scenario[] = ([
    { label: "Browser HIT", description: "Browser cache fresh", hitUpTo: 0, latency: "2ms", color: "emerald" as const },
    { label: "CDN HIT", description: "Browser expired → CDN hit", hitUpTo: Math.min(1, activeLayers.length - 1), latency: "12ms", color: "blue" as const },
    { label: "Redis HIT", description: "CDN + browser expired", hitUpTo: Math.min(2, activeLayers.length - 1), latency: "45ms", color: "amber" as const },
    { label: "DB query", description: "All caches miss → DB", hitUpTo: activeLayers.length - 1, latency: "312ms", color: "red" as const },
  ] as Scenario[]).filter((s) => s.hitUpTo < activeLayers.length);

  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [animStep, setAnimStep] = useState(-1);
  const [done, setDone] = useState(false);
  const [running, setRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeScenario = scenarios[scenarioIdx] ?? scenarios[0];

  function clearTimers() {
    if (timerRef.current) clearTimeout(timerRef.current);
  }

  function traceRequest() {
    if (running || !activeScenario) return;
    clearTimers();
    setAnimStep(-1);
    setDone(false);
    setRunning(true);

    const stepsToAnimate = activeScenario.hitUpTo + 1;
    for (let i = 0; i < stepsToAnimate; i++) {
      timerRef.current = setTimeout(() => {
        setAnimStep(i);
        if (i === stepsToAnimate - 1) {
          timerRef.current = setTimeout(() => {
            setDone(true);
            setRunning(false);
          }, 500);
        }
      }, i * 1200 + 200);
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

  const statusText = !done && animStep < 0
    ? `Scenario: ${activeScenario?.label} — click Trace Request to animate`
    : done
    ? `Served from ${activeLayers[activeScenario.hitUpTo]?.name} in ${activeScenario.latency}`
    : `Checking ${activeLayers[Math.min(animStep, activeLayers.length - 1)]?.name}…`;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800">
        <Layers className="size-4 text-blue-500 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">API Caching</span>
        <code className="text-xs font-mono text-zinc-500 dark:text-zinc-400 truncate max-w-[180px]">{endpoint}</code>
      </div>

      <div className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        Requests check each cache layer in order — a hit at any layer avoids slower layers below.
      </div>

      <div className="min-h-[280px] px-4 py-4 flex flex-col justify-center gap-4">
        <div className="flex gap-1 flex-wrap">
          {scenarios.map((s, i) => (
            <button
              key={s.label}
              onClick={() => { setScenarioIdx(i); setAnimStep(-1); setDone(false); }}
              className={cn(
                "px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all duration-500",
                scenarioIdx === i
                  ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white"
                  : "border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 flex-wrap justify-center">
          <div className="flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/40">
            <Monitor className="size-4 text-zinc-500" />
            <span className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-300">Client</span>
          </div>

          {activeLayers.map((layer, idx) => {
            const reached = animStep >= idx;
            const isHit = activeScenario && idx === activeScenario.hitUpTo && done;
            const isMiss = activeScenario && reached && idx < activeScenario.hitUpTo;
            const isPending = activeScenario && animStep === idx && !done;
            const Icon = TYPE_ICONS[layer.type] ?? Zap;

            return (
              <div key={idx} className="flex items-center gap-1">
                <ArrowRight className={cn("size-3 transition-all duration-500", reached ? "text-zinc-400" : "text-zinc-200 dark:text-zinc-700")} />
                <div className="flex flex-col items-center gap-0.5">
                  <div
                    className={cn(
                      "px-2 py-1.5 rounded-lg border text-[10px] font-semibold transition-all duration-500 relative flex items-center gap-1",
                      isHit
                        ? "bg-emerald-100 dark:bg-emerald-900/40 border-emerald-400 dark:border-emerald-600 text-emerald-700 dark:text-emerald-300 scale-105"
                        : isMiss
                        ? "bg-red-100 dark:bg-red-900/30 border-red-400 dark:border-red-600 text-red-600 dark:text-red-400"
                        : reached
                        ? TYPE_COLORS[layer.type] ?? ""
                        : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-600"
                    )}
                  >
                    <Icon className="size-3 shrink-0" />
                    {layer.name.split(" ")[0]}
                    {isPending && (
                      <span className="absolute -top-1 -right-1 size-2.5 bg-blue-500 rounded-full animate-pulse" />
                    )}
                  </div>
                  <span className={cn(
                    "text-[9px] font-mono transition-all duration-500",
                    isHit ? "text-emerald-600 dark:text-emerald-400 font-bold" : isMiss ? "text-red-500 dark:text-red-400" : "text-zinc-400 dark:text-zinc-500"
                  )}>
                    {isHit ? "✓ HIT" : isMiss ? "✗ MISS" : layer.ttl}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className={cn(
          "rounded-lg px-3 py-2 border text-xs font-semibold min-h-[40px] flex items-center transition-all duration-500",
          done ? scenarioBg[activeScenario.color] ?? "" : "bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-700 text-zinc-500"
        )}>
          {done ? (
            <span className={scenarioColor[activeScenario.color] ?? ""}>
              Served from <strong>{activeLayers[activeScenario.hitUpTo]?.name}</strong> in{" "}
              <strong className="font-mono">{activeScenario.latency}</strong>
              {activeScenario.color === "red" && (
                <span className="ml-2 font-normal text-zinc-500">— 100× slower than browser cache</span>
              )}
            </span>
          ) : (
            <span className="text-zinc-500 dark:text-zinc-400">{activeScenario?.description}</span>
          )}
        </div>

        <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-2 font-mono text-[10px] space-y-0.5">
          <div><span className="text-violet-500">Cache-Control:</span> <span className="text-zinc-600 dark:text-zinc-300">{cacheControl}</span></div>
          <div><span className="text-violet-500">ETag:</span> <span className="text-zinc-600 dark:text-zinc-300">{etag}</span></div>
        </div>
      </div>

      <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
        <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1 transition-all duration-500">{statusText}</span>
        <button
          onClick={traceRequest}
          disabled={running}
          className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          Trace Request
        </button>
      </div>
    </div>
  );
}
