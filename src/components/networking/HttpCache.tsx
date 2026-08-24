"use client";

import { useState, useEffect, useRef } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Archive, Monitor, Zap, Server, ArrowRight } from "lucide-react";

export const HttpCacheSchema = z.object({
  url: z.string().default("https://api.example.com/products"),
  cacheControl: z.string().default("public, max-age=3600, stale-while-revalidate=86400"),
  maxAge: z.number().default(3600),
  etag: z.string().optional().default("\"abc123def456\""),
  staleWhileRevalidate: z.number().optional().default(86400),
  resource: z.string().optional().default("/products"),
});

export type HttpCacheProps = z.infer<typeof HttpCacheSchema>;

type CacheState = "idle" | "fetching" | "cached" | "stale" | "revalidating";

function parseCacheControl(cc: string) {
  const parts = cc.split(",").map((p) => p.trim());
  return parts.map((part) => {
    if (part.startsWith("max-age")) return { text: part, color: "text-emerald-600 dark:text-emerald-400" };
    if (part.startsWith("public") || part.startsWith("private")) return { text: part, color: "text-blue-600 dark:text-blue-400" };
    if (part.startsWith("stale-while-revalidate") || part.startsWith("stale-if-error")) return { text: part, color: "text-amber-600 dark:text-amber-400" };
    if (part.startsWith("no-")) return { text: part, color: "text-red-600 dark:text-red-400" };
    return { text: part, color: "text-zinc-600 dark:text-zinc-300" };
  });
}

const STATUS_CONFIG = {
  idle:          { label: "READY",        cls: "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300" },
  fetching:      { label: "MISS",         cls: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300" },
  cached:        { label: "HIT",          cls: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300" },
  stale:         { label: "STALE",        cls: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300" },
  revalidating:  { label: "REVALIDATING", cls: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 animate-pulse" },
};

export function HttpCache({
  url = "https://api.example.com/products",
  cacheControl = "public, max-age=3600, stale-while-revalidate=86400",
  maxAge = 3600,
  etag = "\"abc123def456\"",
  staleWhileRevalidate: _swr = 86400,
  resource = "/products",
}: HttpCacheProps) {
  const [state, setState] = useState<CacheState>("idle");
  const [ttlRemaining, setTtlRemaining] = useState(maxAge);
  const [ttlMax, setTtlMax] = useState(maxAge);
  const [lastEvent, setLastEvent] = useState("Click Make Request to begin.");
  const [arrowState, setArrowState] = useState<"none" | "to-server" | "to-cache">("none");
  const [requestCount, setRequestCount] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  function startTtlCountdown(from: number) {
    if (timerRef.current) clearInterval(timerRef.current);
    setTtlRemaining(from);
    setTtlMax(from);
    timerRef.current = setInterval(() => {
      setTtlRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setState("stale");
          setLastEvent("Cache expired — resource is now stale.");
          return 0;
        }
        return prev - 1;
      });
    }, 100);
  }

  function makeRequest() {
    if (state === "fetching" || state === "revalidating") return;

    if (state === "idle") {
      setRequestCount((n) => n + 1);
      setState("fetching");
      setArrowState("to-server");
      setLastEvent(`Request #${requestCount + 1}: Cache MISS — fetching from origin…`);
      setTimeout(() => {
        setState("cached");
        setArrowState("none");
        setLastEvent("Response: 200 OK · 124ms — stored in cache.");
        startTtlCountdown(maxAge);
      }, 1200);
      return;
    }

    if (state === "stale" || ttlRemaining === 0) {
      setRequestCount((n) => n + 1);
      setState("revalidating");
      setArrowState("to-server");
      setLastEvent("Stale — sending If-None-Match: " + etag);
      setTimeout(() => {
        setState("cached");
        setArrowState("none");
        setLastEvent("304 Not Modified — cache revalidated, TTL reset.");
        startTtlCountdown(maxAge);
      }, 1200);
      return;
    }

    if (state === "cached") {
      setRequestCount((n) => n + 1);
      setArrowState("to-cache");
      setLastEvent("Cache HIT — served locally · 2ms");
      setTimeout(() => setArrowState("none"), 800);
    }
  }

  function buttonLabel() {
    if (state === "idle") return "Make Request";
    if (state === "cached" && ttlRemaining > 0) return "Make Request (cached)";
    if (state === "stale" || ttlRemaining === 0) return "Revalidate";
    return "Make Request";
  }

  const ttlPct = ttlMax > 0 ? (ttlRemaining / ttlMax) * 100 : 0;
  const status = STATUS_CONFIG[state];
  const ccParts = parseCacheControl(cacheControl);

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800">
        <Archive className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">HTTP Cache</span>
        <span className="text-[10px] font-mono text-zinc-400">GET {resource}</span>
        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full uppercase", status.cls)}>{status.label}</span>
      </div>

      <div className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        Browsers cache responses locally — a HIT skips the network entirely.
      </div>

      <div className="min-h-[260px] p-4 flex flex-col justify-center gap-4">
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-center gap-1 w-16">
            <div className="w-full h-10 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center">
              <Monitor className="size-4 text-zinc-500" />
            </div>
            <span className="text-[9px] font-semibold text-zinc-500">Browser</span>
          </div>

          <div className="flex-1 relative h-12 flex items-center">
            <div className="absolute inset-y-1/2 left-0 right-0 h-px bg-zinc-200 dark:bg-zinc-700" />
            <div className={cn(
              "absolute left-1/2 -translate-x-1/2 -top-1 w-14 h-10 rounded-lg border flex flex-col items-center justify-center transition-all duration-500",
              state === "cached" ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/30" :
              state === "stale" ? "border-amber-400 bg-amber-50 dark:bg-amber-900/30" :
              "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
            )}>
              <Zap className="size-3.5 text-zinc-500" />
              <span className="text-[8px] font-semibold text-zinc-500">Cache</span>
            </div>
            <div
              className={cn(
                "absolute top-1/2 -translate-y-1/2 h-0.5 bg-blue-500 transition-all duration-700 origin-left",
                arrowState === "to-server" ? "w-full" : arrowState === "to-cache" ? "w-1/2" : "w-0"
              )}
            />
            {arrowState !== "none" && (
              <ArrowRight
                className="absolute top-1/2 -translate-y-1/2 size-3.5 text-blue-500 transition-all duration-500"
                style={{ left: arrowState === "to-cache" ? "calc(50% - 8px)" : "calc(100% - 14px)" }}
              />
            )}
          </div>

          <div className="flex flex-col items-center gap-1 w-16">
            <div className={cn(
              "w-full h-10 rounded-lg border flex items-center justify-center transition-all duration-500",
              arrowState === "to-server" ? "border-blue-400 bg-blue-50 dark:bg-blue-900/30" : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
            )}>
              <Server className="size-4 text-zinc-500" />
            </div>
            <span className="text-[9px] font-semibold text-zinc-500">Server</span>
          </div>
        </div>

        <div className="text-[11px] text-zinc-500 bg-zinc-50 dark:bg-zinc-800/60 rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-2 min-h-[36px] transition-all duration-500">
          {lastEvent}
        </div>

        <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
          <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-400 bg-zinc-50 dark:bg-zinc-800/80 border-b border-zinc-200 dark:border-zinc-700">
            Cache-Control
          </div>
          <div className="px-3 py-2 font-mono text-[11px] flex flex-wrap gap-x-1">
            {ccParts.map((part, i) => (
              <span key={i} className={part.color}>{part.text}{i < ccParts.length - 1 ? "," : ""}</span>
            ))}
          </div>
        </div>

        <div className="min-h-[28px]">
          {(state === "cached" || state === "stale") && (
            <div className="transition-all duration-500">
              <div className="flex justify-between text-[10px] mb-1">
                <span className="text-zinc-400">TTL remaining</span>
                <span className={cn("font-mono font-semibold", state === "stale" ? "text-amber-600" : "text-emerald-600")}>{ttlRemaining}s</span>
              </div>
              <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                <div className={cn("h-full rounded-full transition-all duration-500", state === "stale" ? "bg-amber-500" : "bg-emerald-500")} style={{ width: `${ttlPct}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-3">
        <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1 font-mono truncate">{url}</span>
        <button
          onClick={makeRequest}
          disabled={state === "fetching" || state === "revalidating"}
          className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0"
        >
          {buttonLabel()}
        </button>
      </div>
    </div>
  );
}
