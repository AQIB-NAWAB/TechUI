"use client";

import { useState, useEffect, useRef } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Globe, Home, CheckCircle2, XCircle } from "lucide-react";

const RegionSchema = z.object({
  id: z.string(),
  label: z.string(),
  latencyMs: z.number(),
  originLatencyMs: z.number(),
});

const AssetSchema = z.object({
  path: z.string(),
  cached: z.boolean(),
});

export const CdnEdgeSchema = z.object({
  origin: z.string().optional().default("origin.example.com"),
  regions: z.array(RegionSchema).optional().default([
    { id: "us-west", label: "US West", latencyMs: 12, originLatencyMs: 180 },
    { id: "us-east", label: "US East", latencyMs: 28, originLatencyMs: 165 },
    { id: "europe", label: "Europe", latencyMs: 68, originLatencyMs: 200 },
    { id: "asia", label: "Asia Pacific", latencyMs: 95, originLatencyMs: 210 },
  ]),
  assets: z.array(AssetSchema).optional().default([
    { path: "/index.html", cached: true },
    { path: "/api/data", cached: false },
    { path: "/logo.png", cached: true },
  ]),
  interactive: z.boolean().optional().default(true),
});

export type CdnEdgeProps = z.infer<typeof CdnEdgeSchema>;

type AnimPhase = "idle" | "edge" | "origin" | "done";
type Result = { hit: boolean; edgeMs: number; originMs: number } | null;

export function CdnEdge({
  origin = "origin.example.com",
  regions = [
    { id: "us-west", label: "US West", latencyMs: 12, originLatencyMs: 180 },
    { id: "us-east", label: "US East", latencyMs: 28, originLatencyMs: 165 },
    { id: "europe", label: "Europe", latencyMs: 68, originLatencyMs: 200 },
    { id: "asia", label: "Asia Pacific", latencyMs: 95, originLatencyMs: 210 },
  ],
  assets: initialAssets = [
    { path: "/index.html", cached: true },
    { path: "/api/data", cached: false },
    { path: "/logo.png", cached: true },
  ],
  interactive = true,
}: CdnEdgeProps) {
  const [selectedRegionId, setSelectedRegionId] = useState(regions[0]?.id ?? "");
  const [selectedAssetIdx, setSelectedAssetIdx] = useState(0);
  const [assets, setAssets] = useState(initialAssets);
  const [animPhase, setAnimPhase] = useState<AnimPhase>("idle");
  const [result, setResult] = useState<Result>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedRegion = regions.find((r) => r.id === selectedRegionId) ?? regions[0];
  const selectedAsset = assets[selectedAssetIdx];

  function sendRequest() {
    if (animPhase !== "idle") return;
    setResult(null);
    const isCached = selectedAsset?.cached ?? false;

    setAnimPhase("edge");
    timerRef.current = setTimeout(() => {
      if (isCached) {
        setAnimPhase("done");
        setResult({ hit: true, edgeMs: selectedRegion.latencyMs, originMs: 0 });
      } else {
        setAnimPhase("origin");
        timerRef.current = setTimeout(() => {
          setAnimPhase("done");
          setResult({ hit: false, edgeMs: selectedRegion.latencyMs, originMs: selectedRegion.originLatencyMs });
        }, 900);
      }
    }, 700);
  }

  function forceMiss() {
    setAssets((prev) => prev.map((a) => ({ ...a, cached: false })));
    setResult(null);
    setAnimPhase("idle");
  }

  function toggleAsset(idx: number) {
    setAssets((prev) => prev.map((a, i) => i === idx ? { ...a, cached: !a.cached } : a));
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const dotBase = "size-2.5 rounded-full transition-all duration-700";

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <Globe className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">CDN Edge Network</span>
        {result && (
          <span className={cn(
            "text-[10px] font-semibold px-2 py-0.5 rounded transition-all duration-500",
            result.hit
              ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
              : "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"
          )}>
            {result.hit ? `HIT · ${result.edgeMs}ms` : `MISS · ${result.edgeMs + result.originMs}ms`}
          </span>
        )}
      </div>

      <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Requests route to the nearest edge node. Cache hits are served instantly; misses fetch from origin.
        </p>
      </div>

      <div className="min-h-[260px] px-4 py-4 space-y-4">
        <div className="flex items-start gap-2 flex-wrap">
          {regions.map((region) => {
            const isSelected = region.id === selectedRegionId;
            const isActive = isSelected && (animPhase === "edge" || animPhase === "origin" || animPhase === "done");
            return (
              <button
                key={region.id}
                onClick={() => { setSelectedRegionId(region.id); setResult(null); setAnimPhase("idle"); }}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 rounded-xl border-2 text-center transition-all duration-500 cursor-pointer",
                  isSelected
                    ? "border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 hover:border-zinc-300 dark:hover:border-zinc-600"
                )}
              >
                <div className={cn(
                  dotBase,
                  isActive
                    ? "bg-blue-500 shadow-md shadow-blue-300 dark:shadow-blue-900"
                    : isSelected
                    ? "bg-blue-400"
                    : "bg-emerald-400"
                )} />
                <span className="text-[10px] font-semibold text-zinc-700 dark:text-zinc-300 leading-tight">{region.label}</span>
                <span className="text-[9px] font-mono text-zinc-400">{region.latencyMs}ms</span>
              </button>
            );
          })}

          <div className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/30 ml-auto">
            <div className={cn(
              dotBase,
              animPhase === "origin" || (animPhase === "done" && result && !result.hit)
                ? "bg-amber-500 shadow-md shadow-amber-300 dark:shadow-amber-900"
                : "bg-zinc-300 dark:bg-zinc-600"
            )} />
            <Home className="size-3.5 text-zinc-400" />
            <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">Origin</span>
            <span className="text-[9px] font-mono text-zinc-400 max-w-[72px] truncate" title={origin}>{origin}</span>
          </div>
        </div>

        {selectedRegion && (
          <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
            Your location: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{selectedRegion.label}</span>
          </div>
        )}

        {result && (
          <div className={cn(
            "rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-500",
            result.hit
              ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              : "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
          )}>
            {result.hit ? (
              <span>Cache HIT — served from edge in {result.edgeMs}ms · Origin would take ~{selectedRegion.originLatencyMs}ms</span>
            ) : (
              <span>Cache MISS → Origin fetch: {result.edgeMs}ms edge + {result.originMs}ms origin = {result.edgeMs + result.originMs}ms total</span>
            )}
          </div>
        )}

        <div>
          <div className="text-[10px] font-bold uppercase tracking-wide text-zinc-400 mb-1.5">Cache Status</div>
          <div className="flex flex-wrap gap-1.5">
            {assets.map((asset, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (selectedAssetIdx === idx) {
                    toggleAsset(idx);
                    setResult(null);
                    setAnimPhase("idle");
                  } else {
                    setSelectedAssetIdx(idx);
                    setResult(null);
                    setAnimPhase("idle");
                  }
                }}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-mono transition-all duration-500 cursor-pointer hover:opacity-80",
                  asset.cached
                    ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300"
                    : "border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400",
                  selectedAssetIdx === idx && "ring-2 ring-blue-400 dark:ring-blue-500"
                )}
              >
                {asset.cached ? <CheckCircle2 className="size-3" /> : <XCircle className="size-3" />}
                {asset.path}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-zinc-400 mt-1">Click to select · Click again to toggle cache status</p>
        </div>
      </div>

      {interactive && (
        <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-2 flex-wrap bg-zinc-50 dark:bg-zinc-900/30">
          <span className="text-xs text-zinc-500 flex-1">
            {animPhase === "edge" && "Routing to edge node…"}
            {animPhase === "origin" && "Cache miss — fetching from origin…"}
            {animPhase === "done" && result?.hit && "Cache hit! Served from edge."}
            {animPhase === "done" && result && !result.hit && "Cache miss. Origin served the response."}
            {animPhase === "idle" && !result && `Selected: ${selectedAsset?.path ?? "—"}`}
          </span>
          <button
            onClick={forceMiss}
            className="border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 rounded-lg px-3 py-2 text-xs font-semibold hover:opacity-80 transition-opacity"
          >
            Force MISS
          </button>
          <button
            onClick={animPhase === "done" ? () => { setResult(null); setAnimPhase("idle"); } : sendRequest}
            disabled={animPhase === "edge" || animPhase === "origin"}
            className={cn(
              "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity",
              (animPhase === "edge" || animPhase === "origin") && "opacity-50 cursor-not-allowed"
            )}
          >
            {animPhase === "done" ? "Reset" : `Request ${selectedAsset?.path ?? ""}`}
          </button>
        </div>
      )}
    </div>
  );
}
