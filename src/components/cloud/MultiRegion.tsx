"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Globe, Monitor, ArrowRight } from "lucide-react";

export const MultiRegionSchema = z.object({
  strategy: z.enum(["active-active", "active-passive"]).default("active-active"),
  regions: z
    .array(
      z.object({
        name: z.string(),
        code: z.string(),
        status: z.enum(["primary", "replica", "passive"]),
        latencyMs: z.number(),
        flag: z.string(),
      })
    )
    .default([
      { name: "US East",      code: "us-east-1",      status: "primary",  latencyMs: 25,  flag: "🇺🇸" },
      { name: "EU West",      code: "eu-west-1",      status: "primary",  latencyMs: 18,  flag: "🇪🇺" },
      { name: "AP Southeast", code: "ap-southeast-1", status: "primary",  latencyMs: 31,  flag: "🇸🇬" },
      { name: "SA East",      code: "sa-east-1",      status: "replica",  latencyMs: 89,  flag: "🇧🇷" },
    ]),
  userLocation: z.string().default("Europe"),
});

export type MultiRegionProps = z.infer<typeof MultiRegionSchema>;

const USER_LOCATIONS = ["North America", "Europe", "Asia", "South America"];

const LOCATION_LATENCY_MODIFIER: Record<string, Record<string, number>> = {
  "North America": { "us-east-1": 1, "eu-west-1": 2.2, "ap-southeast-1": 3.8, "sa-east-1": 1.6 },
  "Europe":        { "us-east-1": 2.2, "eu-west-1": 1, "ap-southeast-1": 3.5, "sa-east-1": 2.8 },
  "Asia":          { "us-east-1": 3.8, "eu-west-1": 3.5, "ap-southeast-1": 1, "sa-east-1": 3.2 },
  "South America": { "us-east-1": 1.6, "eu-west-1": 2.8, "ap-southeast-1": 3.2, "sa-east-1": 1 },
};

const STATUS_BADGES: Record<string, string> = {
  primary: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300",
  replica: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
  passive: "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400",
};

function getAdjustedLatency(baseLatency: number, code: string, userLocation: string): number {
  const modifier = LOCATION_LATENCY_MODIFIER[userLocation]?.[code] ?? 2;
  return Math.round(baseLatency * modifier);
}

function LatencyBar({ latencyMs, max }: { latencyMs: number; max: number }) {
  const pct = Math.min(100, (latencyMs / max) * 100);
  const color =
    latencyMs < 30
      ? "bg-emerald-400 dark:bg-emerald-500"
      : latencyMs < 60
      ? "bg-amber-400 dark:bg-amber-500"
      : "bg-red-400 dark:bg-red-500";

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 w-12 text-right">{latencyMs}ms</span>
    </div>
  );
}

export function MultiRegion({
  strategy: initialStrategy = "active-active",
  regions = [
    { name: "US East",      code: "us-east-1",      status: "primary",  latencyMs: 25,  flag: "🇺🇸" },
    { name: "EU West",      code: "eu-west-1",      status: "primary",  latencyMs: 18,  flag: "🇪🇺" },
    { name: "AP Southeast", code: "ap-southeast-1", status: "primary",  latencyMs: 31,  flag: "🇸🇬" },
    { name: "SA East",      code: "sa-east-1",      status: "replica",  latencyMs: 89,  flag: "🇧🇷" },
  ],
  userLocation: initialUserLocation = "Europe",
}: MultiRegionProps) {
  const [tab, setTab] = useState<"active-active" | "active-passive">(initialStrategy);
  const [userLocation, setUserLocation] = useState(initialUserLocation);
  const [failoverState, setFailoverState] = useState<"normal" | "failing" | "failed">("normal");
  const [requestAnim, setRequestAnim] = useState(false);
  const [rtt, setRtt] = useState<number | null>(null);
  const failoverRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (failoverRef.current) clearTimeout(failoverRef.current); }, []);

  const getRegionStatus = useCallback(
    (region: (typeof regions)[0]) => {
      if (tab === "active-active") return region.status;
      if (tab === "active-passive") {
        if (failoverState === "normal") {
          return region.code === regions[0]?.code ? "primary" : "passive";
        } else if (failoverState === "failing") {
          return region.code === regions[0]?.code ? "passive" : region.code === regions[1]?.code ? "primary" : "passive";
        } else {
          return region.code === regions[0]?.code ? "passive" : region.code === regions[1]?.code ? "primary" : "passive";
        }
      }
      return region.status;
    },
    [tab, failoverState, regions]
  );

  const adjustedRegions = regions.map((r) => ({
    ...r,
    adjustedLatency: getAdjustedLatency(r.latencyMs, r.code, userLocation),
    effectiveStatus: getRegionStatus(r),
  }));

  const maxLatency = Math.max(...adjustedRegions.map((r) => r.adjustedLatency), 1);
  const nearestRegion = adjustedRegions
    .filter((r) => r.effectiveStatus !== "passive")
    .sort((a, b) => a.adjustedLatency - b.adjustedLatency)[0];

  function triggerFailover() {
    if (failoverState !== "normal") { setFailoverState("normal"); return; }
    setFailoverState("failing");
    failoverRef.current = setTimeout(() => setFailoverState("failed"), 1500);
  }

  function sendRequest() {
    if (requestAnim) return;
    setRequestAnim(true);
    setTimeout(() => {
      setRtt(nearestRegion ? nearestRegion.adjustedLatency * 2 : 50);
      setRequestAnim(false);
    }, 1000);
  }

  const replicationRegions = adjustedRegions.filter((r) => r.effectiveStatus === "primary");

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
        <Globe className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">Multi-Region</span>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
          {tab === "active-active" ? "Active-Active" : "Active-Passive"}
        </span>
      </div>

      <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Deploy in multiple regions so users worldwide get low latency. GeoDNS routes each request to the nearest healthy region.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-100 dark:border-zinc-800">
        {(["active-active", "active-passive"] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setFailoverState("normal"); setRtt(null); }}
            className={cn(
              "px-4 py-2 text-xs font-semibold transition-all duration-500 capitalize",
              tab === t
                ? "border-b-2 border-zinc-900 dark:border-white text-zinc-900 dark:text-white"
                : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="min-h-[320px] p-4 space-y-3 flex flex-col">
        {/* User location */}
        <div className="flex items-center gap-2 text-xs border border-zinc-100 dark:border-zinc-800 rounded-lg px-3 py-2 bg-zinc-50 dark:bg-zinc-800/40">
          <Monitor className="size-3.5 text-zinc-400 shrink-0" />
          <span className="text-zinc-500 dark:text-zinc-400">You are in:</span>
          <select
            value={userLocation}
            onChange={(e) => { setUserLocation(e.target.value); setRtt(null); }}
            className="border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded px-2 py-0.5 text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none"
          >
            {USER_LOCATIONS.map((loc) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>

        {/* Failover indicator — fixed height slot */}
        <div className="min-h-[36px] flex items-center">
          {tab === "active-passive" && failoverState === "failing" && (
            <div className="w-full flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-600 dark:text-red-400 transition-all duration-500">
              <span className="size-2 bg-red-500 rounded-full animate-pulse" />
              Primary region failing — triggering failover...
            </div>
          )}
          {tab === "active-passive" && failoverState === "failed" && (
            <div className="w-full flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-600 dark:text-amber-400 transition-all duration-500">
              <span className="size-2 bg-emerald-500 rounded-full" />
              Failover complete — secondary is now primary
            </div>
          )}
        </div>

        {/* Request flow animation */}
        {nearestRegion && (
          <div className="flex items-center justify-center gap-2 py-2 border border-zinc-100 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-800/40">
            <Monitor className={cn("size-4 transition-all duration-500", requestAnim ? "text-blue-500" : "text-zinc-400")} />
            <div className="relative flex-1 h-1 max-w-[100px] bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
              {requestAnim && (
                <div className="absolute inset-y-0 w-2 bg-emerald-500 rounded-full animate-[travel_1s_ease-in-out_forwards]" />
              )}
            </div>
            <span className="text-base leading-none">{nearestRegion.flag}</span>
            <ArrowRight className={cn("size-3 transition-all duration-500", requestAnim ? "text-emerald-500" : "text-zinc-300")} />
            <span className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-300">{nearestRegion.name}</span>
          </div>
        )}

        {/* Region list */}
        <div className="space-y-2">
          {adjustedRegions.map((region) => {
            const isNearest = nearestRegion?.code === region.code;
            const isPassive = region.effectiveStatus === "passive";
            return (
              <div
                key={region.code}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg border transition-all duration-500",
                  isNearest && !isPassive
                    ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/10"
                    : "border-zinc-100 dark:border-zinc-800",
                  isPassive && "opacity-50"
                )}
              >
                <span className="text-base leading-none shrink-0">{region.flag}</span>
                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 w-24 shrink-0">{region.name}</span>
                <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0", STATUS_BADGES[region.effectiveStatus])}>
                  {region.effectiveStatus.toUpperCase()}
                </span>
                <div className="flex-1">
                  <LatencyBar latencyMs={region.adjustedLatency} max={maxLatency} />
                </div>
                {isNearest && !isPassive && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold shrink-0">you</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Nearest + routing */}
        <div className="text-xs text-zinc-500 dark:text-zinc-400 space-y-0.5 min-h-[48px]">
          {nearestRegion && (
            <div>
              Nearest: <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                {nearestRegion.flag} {nearestRegion.name} ({nearestRegion.adjustedLatency}ms)
              </span>
            </div>
          )}
          <div>Routed by: <span className="font-semibold text-zinc-600 dark:text-zinc-300">GeoDNS</span></div>
          <div className={cn("font-semibold transition-all duration-500", rtt ? "text-emerald-600 dark:text-emerald-400" : "text-transparent")}>
            Round-trip: {rtt ?? 0}ms
          </div>
        </div>

        {/* Replication row */}
        {replicationRegions.length > 1 && (
          <div className="text-[10px] text-zinc-400 border-t border-zinc-100 dark:border-zinc-800 pt-2 mt-auto">
            Replication: {replicationRegions.map((r) => `${r.flag} ${r.name}`).join(" ↔ ")}
            <span className="ml-1 text-zinc-300 dark:text-zinc-600">(writes replicate async, ~50ms lag)</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-2 flex-wrap bg-zinc-50 dark:bg-zinc-900/30">
        <span className="text-xs text-zinc-500 flex-1">
          {requestAnim ? "Sending request to nearest region…" : rtt ? `Response received in ${rtt}ms` : "Send a request to see GeoDNS routing"}
        </span>
        <button
          onClick={sendRequest}
          disabled={requestAnim}
          className={cn(
            "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity",
            requestAnim && "opacity-60"
          )}
        >
          {requestAnim ? "Sending…" : "Send Request"}
        </button>
        {tab === "active-passive" && (
          <button
            onClick={triggerFailover}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity",
              failoverState === "normal"
                ? "bg-red-600 text-white"
                : "bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300"
            )}
          >
            {failoverState === "normal" ? "Simulate Failover" : "Reset"}
          </button>
        )}
      </div>
      <style>{`
        @keyframes travel {
          from { left: 0; opacity: 1; }
          to { left: calc(100% - 8px); opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
