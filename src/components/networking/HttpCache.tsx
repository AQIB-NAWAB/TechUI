"use client";

import { useState, useEffect, useRef } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Archive } from "lucide-react";

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
  const [lastEvent, setLastEvent] = useState<string>("Click 'First Request' to begin.");
  const [arrowState, setArrowState] = useState<"none" | "to-server" | "to-cache">("none");
  const [requestCount, setRequestCount] = useState(0);
  const [response, setResponse] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

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
    }, 100); // fast for demo
  }

  function handleFirstRequest() {
    if (state === "fetching" || state === "revalidating") return;
    setRequestCount((n) => n + 1);
    setState("fetching");
    setArrowState("to-server");
    setLastEvent("Request #" + (requestCount + 1) + ": Cache MISS — fetching from origin...");
    setResponse(null);

    setTimeout(() => {
      setState("cached");
      setArrowState("none");
      setResponse(`HTTP/1.1 200 OK\nCache-Control: ${cacheControl}\nETag: ${etag ?? '"abc123"'}\nContent-Type: application/json\n\n{ "products": [...] }`);
      setLastEvent("Response: 200 OK · 124ms — stored in cache.");
      startTtlCountdown(maxAge);
    }, 900);
  }

  function handleCachedRequest() {
    if (state === "fetching" || state === "revalidating") return;
    setRequestCount((n) => n + 1);

    if (state === "stale" || ttlRemaining === 0) {
      setState("revalidating");
      setArrowState("to-server");
      setLastEvent("Stale — sending conditional request: If-None-Match: " + (etag ?? '""'));

      setTimeout(() => {
        setState("cached");
        setArrowState("none");
        setResponse(`HTTP/1.1 304 Not Modified\nETag: ${etag ?? '"abc123"'}\nCache-Control: ${cacheControl}`);
        setLastEvent("304 Not Modified — cache revalidated, TTL reset.");
        startTtlCountdown(maxAge);
      }, 900);
      return;
    }

    if (state === "idle") {
      setLastEvent("No cache yet — make a First Request first.");
      return;
    }

    setArrowState("to-cache");
    setLastEvent("Cache HIT — served locally · 2ms");
    setTimeout(() => setArrowState("none"), 700);
  }

  function handleExpireCache() {
    if (timerRef.current) clearInterval(timerRef.current);
    setTtlRemaining(0);
    setState("stale");
    setLastEvent("Cache expired — TTL drained to 0. Next request will revalidate.");
  }

  const ttlPct = ttlMax > 0 ? (ttlRemaining / ttlMax) * 100 : 0;
  const status = STATUS_CONFIG[state];
  const ccParts = parseCacheControl(cacheControl);

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
        <Archive className="size-3.5 text-zinc-400 shrink-0" />
        <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex-1">HTTP Cache</span>
        <span className="text-[10px] font-mono text-zinc-400">GET {resource}</span>
        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide", status.cls)}>
          {status.label}
        </span>
      </div>

      <div className="p-4 space-y-4 min-h-[260px]">
        {/* Request flow visualization */}
        <div className="flex items-center gap-2 text-xs">
          {/* Browser */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-16 h-9 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-semibold text-zinc-600 dark:text-zinc-300">
              Browser
            </div>
          </div>

          {/* Arrow to cache/server */}
          <div className="flex-1 flex flex-col items-center gap-1 relative">
            <div className="relative w-full h-4 flex items-center">
              {/* Arrow track */}
              <div className="absolute inset-y-1/2 left-0 right-0 h-px bg-zinc-200 dark:bg-zinc-700" />
              {/* Animated arrow */}
              <div
                className={cn(
                  "absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-blue-500 origin-left transition-all duration-700",
                  arrowState !== "none" ? "scale-x-100" : "scale-x-0"
                )}
                style={{ width: arrowState === "to-cache" ? "50%" : "100%" }}
              />
              {/* Arrowhead */}
              <div
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-l-4 border-t-transparent border-b-transparent border-l-blue-500 transition-all duration-700",
                  arrowState !== "none" ? "opacity-100" : "opacity-0"
                )}
                style={{ left: arrowState === "to-cache" ? "calc(50% - 4px)" : "calc(100% - 4px)" }}
              />
            </div>
            {/* Cache box in middle */}
            <div className={cn(
              "absolute left-1/2 -translate-x-1/2 -top-1 w-14 h-9 rounded-lg border flex items-center justify-center text-[10px] font-semibold transition-all duration-500",
              state === "cached" ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300" :
              state === "stale"  ? "border-amber-400 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300" :
              "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
            )}>
              Cache
            </div>
          </div>

          {/* Server */}
          <div className="flex flex-col items-center gap-1">
            <div className={cn(
              "w-16 h-9 rounded-lg border flex items-center justify-center text-[10px] font-semibold transition-all duration-500",
              arrowState === "to-server" ? "border-blue-400 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" :
              "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
            )}>
              Server
            </div>
          </div>
        </div>

        {/* Event log */}
        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/60 rounded-lg px-3 py-2 min-h-[28px] transition-all duration-500">
          {lastEvent}
        </div>

        {/* Cache-Control header */}
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
          <div className="px-3 py-1.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-wide bg-zinc-50 dark:bg-zinc-800/80 border-b border-zinc-200 dark:border-zinc-700">
            Cache-Control
          </div>
          <div className="px-3 py-2 font-mono text-[11px] flex flex-wrap gap-x-1 gap-y-0.5">
            {ccParts.map((part, i) => (
              <span key={i} className={part.color}>
                {part.text}{i < ccParts.length - 1 ? "," : ""}
              </span>
            ))}
          </div>
          {etag && (
            <div className="px-3 py-1.5 font-mono text-[11px] border-t border-zinc-100 dark:border-zinc-800">
              <span className="text-zinc-400">ETag: </span>
              <span className="text-violet-600 dark:text-violet-400">{etag}</span>
            </div>
          )}
        </div>

        {/* TTL bar — only when cached or stale */}
        {(state === "cached" || state === "stale") && (
          <div className="transition-all duration-500">
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-zinc-400">TTL remaining</span>
              <span className={cn("font-mono font-semibold", state === "stale" ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400")}>
                {ttlRemaining}s
              </span>
            </div>
            <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-[100ms]", state === "stale" ? "bg-amber-500" : "bg-emerald-500")}
                style={{ width: `${ttlPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Response preview */}
        {response && (
          <div className="rounded-lg bg-zinc-950 dark:bg-zinc-950 border border-zinc-800 overflow-hidden transition-all duration-500">
            <pre className="text-[10px] font-mono text-emerald-400 px-3 py-2 leading-relaxed overflow-x-auto whitespace-pre-wrap">{response}</pre>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900/40 flex items-center gap-2 flex-wrap">
        <button
          onClick={handleFirstRequest}
          disabled={state === "fetching" || state === "revalidating"}
          className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          First Request
        </button>
        <button
          onClick={handleCachedRequest}
          disabled={state === "fetching" || state === "revalidating" || state === "idle"}
          className="border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg px-4 py-2 text-sm font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-300 disabled:opacity-40"
        >
          Cached Request
        </button>
        <button
          onClick={handleExpireCache}
          disabled={state !== "cached"}
          className="border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 rounded-lg px-4 py-2 text-sm font-semibold hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-all duration-300 disabled:opacity-40"
        >
          Expire Cache
        </button>
        <span className="text-[10px] text-zinc-400 ml-auto hidden sm:block font-mono">{url}</span>
      </div>
    </div>
  );
}
