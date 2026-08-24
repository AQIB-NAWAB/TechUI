"use client";

import { useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Shield, Zap, Globe, Monitor, Server, Database, RotateCcw } from "lucide-react";

const RouteSchema = z.object({
  path: z.string(),
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE", "ANY"]).optional().default("ANY"),
  upstream: z.string(),
  plugins: z.array(z.enum(["auth", "rate-limit", "cache", "transform", "log"])).optional().default([]),
});

export const ApiGatewaySchema = z.object({
  name: z.string().optional().default("API Gateway"),
  host: z.string().optional().default("api.example.com"),
  routes: z.array(RouteSchema).optional(),
  interactive: z.boolean().optional().default(true),
});

export type ApiGatewayProps = z.infer<typeof ApiGatewaySchema>;

const METHOD_COLORS: Record<string, string> = {
  GET:    "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400",
  POST:   "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400",
  PUT:    "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400",
  PATCH:  "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400",
  DELETE: "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400",
  ANY:    "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400",
};

const PLUGIN_CFG: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  "auth":       { icon: <Shield className="size-2.5" />,   label: "Auth",       color: "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800" },
  "rate-limit": { icon: <Zap className="size-2.5" />,      label: "Rate Limit", color: "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800" },
  "cache":      { icon: <Database className="size-2.5" />, label: "Cache",      color: "bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800" },
  "transform":  { icon: <span className="text-[8px] font-bold">⇄</span>, label: "Transform", color: "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700" },
  "log":        { icon: <span className="text-[8px] font-bold">✎</span>, label: "Log",       color: "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700" },
};

const DEFAULT_ROUTES: ApiGatewayProps["routes"] = [
  { path: "/api/users",    method: "GET",  upstream: "user-service",    plugins: ["auth", "rate-limit", "log"] },
  { path: "/api/orders",   method: "POST", upstream: "order-service",   plugins: ["auth", "rate-limit"] },
  { path: "/api/products", method: "GET",  upstream: "catalog-service", plugins: ["cache", "log"] },
  { path: "/api/webhooks", method: "POST", upstream: "webhook-service", plugins: ["log"] },
];

type SimState = "idle" | "traveling-to-gateway" | "traveling-to-service" | "done";
type Outcome = "200" | "401" | "429" | "502" | null;

function simulate(plugins: string[]): Outcome {
  if (plugins.includes("auth") && Math.random() < 0.3) return "401";
  if (plugins.includes("rate-limit") && Math.random() < 0.2) return "429";
  return "200";
}

const OUTCOME_CFG: Record<string, { label: string; color: string }> = {
  "200": { label: "200 OK",                  color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800" },
  "401": { label: "401 Unauthorized",        color: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800" },
  "429": { label: "429 Rate Limited",        color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800" },
  "502": { label: "502 Bad Gateway",         color: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800" },
};

function ServiceIcon({ name }: { name: string }) {
  if (name.toLowerCase().includes("catalog") || name.toLowerCase().includes("product")) {
    return <Database className="size-3.5 text-violet-500" />;
  }
  return <Server className="size-3.5 text-emerald-500" />;
}

export function ApiGateway({
  name = "API Gateway",
  host = "api.example.com",
  routes: routesProp,
  interactive = true,
}: ApiGatewayProps) {
  const routes = (routesProp ?? DEFAULT_ROUTES)!;
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [simState, setSimState] = useState<SimState>("idle");
  const [outcome, setOutcome] = useState<Outcome>(null);

  const selectedRoute = routes[selectedIdx]!;

  function sendRequest() {
    if (simState !== "idle" || !interactive) return;
    setOutcome(null);
    setSimState("traveling-to-gateway");
    setTimeout(() => setSimState("traveling-to-service"), 600);
    setTimeout(() => {
      const result = simulate(selectedRoute.plugins ?? []);
      setOutcome(result);
      setSimState("done");
    }, 1200);
    setTimeout(() => {
      setSimState("idle");
    }, 3000);
  }

  function reset() {
    setSimState("idle");
    setOutcome(null);
  }

  const outcomeCfg = outcome ? OUTCOME_CFG[outcome] : null;

  return (
    <>
      <style>{`
        @keyframes gwTravel {
          from { left: 0; opacity: 1; }
          to { left: calc(100% - 8px); opacity: 0.9; }
        }
        .gw-travel-dot { animation: gwTravel 0.8s ease-in-out forwards; }
      `}</style>
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800">
        <Globe className="size-4 text-zinc-500 shrink-0" />
        <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex-1">{name}</span>
        <code className="text-[11px] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">{host}</code>
        {(simState !== "idle" || outcome) && (
          <button onClick={reset} className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all duration-500">
            <RotateCcw className="size-3.5" />
          </button>
        )}
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        A single front door for your APIs — routes traffic, checks auth, and applies rate limits before requests reach backend services.
      </p>

      {/* Traffic flow visual */}
      <div className="px-4 py-4 min-h-[220px] flex items-center gap-3">
        {/* Client */}
        <div className="flex flex-col items-center gap-1.5 shrink-0">
          <div className={cn(
            "w-16 h-14 rounded-lg border-2 flex flex-col items-center justify-center gap-1 transition-all duration-500",
            simState === "traveling-to-gateway" ? "border-blue-400 bg-blue-50 dark:bg-blue-950/30" : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
          )}>
            <Monitor className="size-4 text-zinc-500" />
            <span className="text-[9px] font-semibold text-zinc-500">Client</span>
          </div>
        </div>

        {/* Arrow: client → gateway */}
        <div className="flex-1 relative h-1 flex items-center">
          <div className="w-full h-px bg-zinc-200 dark:bg-zinc-700" />
          {simState === "traveling-to-gateway" && (
            <div className="absolute top-1/2 -translate-y-1/2 left-0 w-2 h-2 rounded-full bg-blue-500 gw-travel-dot" />
          )}
          <div className="absolute right-0 w-0 h-0 border-t-4 border-b-4 border-l-4 border-transparent border-l-zinc-300 dark:border-l-zinc-600" />
        </div>

        {/* Gateway */}
        <div className={cn(
          "w-24 shrink-0 rounded-xl border-2 px-2 py-2 flex flex-col items-center gap-1.5 transition-all duration-700",
          simState !== "idle" ? "border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-950/20" : "border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800"
        )}>
          <Globe className="size-5 text-blue-500" />
          <span className="text-[9px] font-bold text-zinc-600 dark:text-zinc-400 text-center leading-tight">API Gateway</span>
          {/* Middleware badges */}
          <div className="flex gap-0.5 flex-wrap justify-center">
            {(selectedRoute.plugins ?? []).slice(0, 3).map((p) => {
              const cfg = PLUGIN_CFG[p];
              if (!cfg) return null;
              return (
                <span key={p} className={cn("flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] font-semibold", cfg.color)}>
                  {cfg.icon}
                </span>
              );
            })}
          </div>
        </div>

        {/* Arrow: gateway → service */}
        <div className="flex-1 relative h-1 flex items-center">
          <div className="w-full h-px bg-zinc-200 dark:bg-zinc-700" />
          {simState === "traveling-to-service" && (
            <div className="absolute top-1/2 -translate-y-1/2 left-0 w-2 h-2 rounded-full bg-emerald-500 gw-travel-dot" />
          )}
          <div className="absolute right-0 w-0 h-0 border-t-4 border-b-4 border-l-4 border-transparent border-l-zinc-300 dark:border-l-zinc-600" />
        </div>

        {/* Services */}
        <div className="flex flex-col gap-1.5 shrink-0">
          {routes.map((route, i) => (
            <button
              key={i}
              onClick={() => { setSelectedIdx(i); setOutcome(null); setSimState("idle"); }}
              className={cn(
                "w-28 h-9 rounded-lg border flex items-center gap-1.5 px-2 transition-all duration-500",
                selectedIdx === i
                  ? simState === "done" && outcome === "200"
                    ? "border-emerald-400 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-950/20"
                    : simState === "done" && outcome
                    ? "border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-950/20"
                    : "border-blue-400 dark:border-blue-600 bg-blue-50 dark:bg-blue-950/20"
                  : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600"
              )}
            >
              <ServiceIcon name={route.upstream} />
              <span className="text-[9px] font-semibold text-zinc-600 dark:text-zinc-400 truncate">{route.upstream}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Route selector + details */}
      <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 bg-zinc-50/50 dark:bg-zinc-800/20">
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Selected Route</div>
          {interactive && (
            <select
              value={selectedIdx}
              onChange={(e) => { setSelectedIdx(Number(e.target.value)); setOutcome(null); setSimState("idle"); }}
              disabled={simState !== "idle"}
              className="ml-auto text-xs font-mono rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-1 text-zinc-700 dark:text-zinc-300 disabled:opacity-50"
            >
              {routes.map((route, i) => (
                <option key={i} value={i}>{route.method} {route.path}</option>
              ))}
            </select>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-bold", METHOD_COLORS[selectedRoute.method ?? "ANY"])}>
            {selectedRoute.method}
          </span>
          <code className="text-xs font-mono text-zinc-700 dark:text-zinc-300">{selectedRoute.path}</code>
          <div className="flex gap-1 ml-auto flex-wrap">
            {(selectedRoute.plugins ?? []).map((p) => {
              const cfg = PLUGIN_CFG[p];
              if (!cfg) return null;
              return (
                <span key={p} className={cn("flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold", cfg.color)}>
                  {cfg.icon} {cfg.label}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/30 min-h-[52px]">
        <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">
          {outcomeCfg
            ? outcomeCfg.label
            : simState === "idle"
            ? "Pick a route above, then send a request through the gateway"
            : "Simulating…"}
        </span>
        {interactive && (
          <button
            onClick={sendRequest}
            disabled={simState !== "idle"}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-500 shrink-0",
              simState !== "idle"
                ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-400 cursor-not-allowed"
                : "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90"
            )}
          >
            {simState !== "idle" ? "Sending…" : "Send Request"}
          </button>
        )}
      </div>
    </div>
    </>
  );
}
