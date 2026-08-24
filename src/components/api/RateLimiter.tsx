"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Zap, RefreshCw } from "lucide-react";

export const RateLimiterSchema = z.object({
  name: z.string().optional().default("API Rate Limiter"),
  algorithm: z.enum(["token-bucket", "sliding-window", "fixed-window"]).optional().default("token-bucket"),
  limit: z.number().int().min(1).max(20).optional().default(8),
  windowSeconds: z.number().optional().default(60),
  refillRate: z.number().optional().default(1),
  interactive: z.boolean().optional().default(true),
});

export type RateLimiterProps = z.infer<typeof RateLimiterSchema>;

type RequestDot = { id: number; allowed: boolean; age: number };
type RefillIndicator = { id: number };

let _id = 0;
let _refillId = 0;

export function RateLimiter({
  name = "API Rate Limiter",
  algorithm = "token-bucket",
  limit = 8,
  windowSeconds = 60,
  refillRate = 1,
  interactive = true,
}: RateLimiterProps) {
  const [tokens, setTokens] = useState(limit);
  const [dots, setDots] = useState<RequestDot[]>([]);
  const [flash, setFlash] = useState<"allowed" | "blocked" | null>(null);
  const [refillIndicators, setRefillIndicators] = useState<RefillIndicator[]>([]);
  const [shake, setShake] = useState(false);
  useEffect(() => {
    if (!interactive) return;
    const id = setInterval(() => {
      setTokens((t) => {
        const next = Math.min(limit, +(t + refillRate).toFixed(2));
        if (next > t) {
          const rid = ++_refillId;
          setRefillIndicators((prev) => [...prev, { id: rid }]);
          setTimeout(() => {
            setRefillIndicators((prev) => prev.filter((r) => r.id !== rid));
          }, 1000);
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [limit, refillRate, interactive]);

  function makeRequest() {
    const allowed = tokens >= 1;
    const dotId = ++_id;
    setDots((prev) => {
      const aged = prev.map((d) => ({ ...d, age: d.age + 1 }));
      return [{ id: dotId, allowed, age: 0 }, ...aged].slice(0, 8);
    });
    setFlash(allowed ? "allowed" : "blocked");
    setTimeout(() => setFlash(null), 700);
    if (allowed) {
      setTokens((t) => +(t - 1).toFixed(2));
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  }

  function reset() {
    setTokens(limit);
    setDots([]);
    setFlash(null);
    setShake(false);
  }

  const fillPct = (tokens / limit) * 100;
  const isEmpty = tokens < 1;
  const fillColor = isEmpty ? "bg-red-500" : fillPct > 60 ? "bg-emerald-500" : fillPct > 30 ? "bg-amber-500" : "bg-red-500";
  const fillLabel = isEmpty ? "text-red-600 dark:text-red-400" : fillPct > 60 ? "text-emerald-600 dark:text-emerald-400" : fillPct > 30 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400";

  return (
    <>
      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20% { transform: translateX(-4px); }
          40% { transform: translateX(4px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        @keyframes floatUp {
          0% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-20px); }
        }
      `}</style>
      <div className={cn(
        "rounded-xl border bg-white dark:bg-zinc-950 overflow-hidden transition-all duration-500",
        flash === "blocked" ? "border-red-300 dark:border-red-800" : "border-zinc-200 dark:border-zinc-800"
      )}>
        {/* Header */}
        <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/50">
          <Zap className="size-4 text-zinc-400 shrink-0" />
          <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">{name}</span>
          <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">{algorithm}</span>
          {interactive && (
            <button onClick={reset} className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all duration-500">
              <RefreshCw className="size-3.5" />
            </button>
          )}
        </div>

        <p className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-900">
          Limits how many requests a client can make — when the bucket runs dry, extra requests get rejected until tokens refill.
        </p>

        <div className="p-4 min-h-[220px] flex gap-5 items-start">
          {/* Token bucket visual */}
          <div className="flex flex-col items-center gap-2 shrink-0 relative">
            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide">Tokens</span>

            {/* Refill indicators */}
            {refillIndicators.map((r) => (
              <div
                key={r.id}
                className="absolute top-6 left-1/2 -translate-x-1/2 text-emerald-500 text-[10px] font-bold pointer-events-none"
                style={{ animation: "floatUp 1s ease-out forwards" }}
              >
                +1
              </div>
            ))}

            <div
              className={cn(
                "relative w-14 h-20 rounded-b-xl border-2 border-t-0 border-zinc-200 dark:border-zinc-700 overflow-hidden bg-zinc-50 dark:bg-zinc-900 transition-all duration-500",
                refillIndicators.length > 0 && "ring-2 ring-emerald-400 ring-offset-1 dark:ring-offset-zinc-950"
              )}
              style={shake ? { animation: "shake 0.4s ease-in-out" } : undefined}
            >
              <div
                className={cn("absolute bottom-0 left-0 right-0 transition-all duration-500", fillColor)}
                style={{ height: `${fillPct}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-base font-bold font-mono text-white mix-blend-overlay drop-shadow">
                  {Math.floor(tokens)}
                </span>
              </div>
            </div>
            <span className={cn("text-xs font-bold font-mono", fillLabel)}>{tokens.toFixed(1)}/{limit}</span>
          </div>

          {/* Stats and log */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Config */}
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg px-3 py-2">
                <div className="text-zinc-400">Limit</div>
                <div className="font-mono font-bold text-zinc-700 dark:text-zinc-300 mt-0.5">
                  {limit} req / {windowSeconds}s
                </div>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg px-3 py-2">
                <div className="text-zinc-400">Refill rate</div>
                <div className="font-mono font-bold text-zinc-700 dark:text-zinc-300 mt-0.5">{refillRate} token/s</div>
              </div>
            </div>

            {/* Fill bar */}
            <div>
              <div className="flex justify-between text-[10px] mb-1">
                <span className="text-zinc-400">Bucket fill</span>
                <span className={cn("font-mono font-semibold", fillLabel)}>{Math.round(fillPct)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                <div className={cn("h-full rounded-full transition-all duration-500", fillColor)} style={{ width: `${fillPct}%` }} />
              </div>
            </div>

            {/* Request history dots */}
            <div>
              <div className="text-[10px] text-zinc-400 mb-1.5">Request history</div>
              <div className="flex gap-1.5 items-center">
                {dots.length === 0 && (
                  <span className="text-[10px] text-zinc-400">No requests yet — click below</span>
                )}
                {dots.map((dot) => {
                  const opacity = Math.max(0.25, 1 - dot.age * 0.1);
                  return (
                    <span
                      key={dot.id}
                      title={dot.allowed ? "Allowed" : "Rate limited"}
                      className={cn(
                        "size-3.5 rounded-full transition-all duration-500",
                        dot.allowed ? "bg-emerald-500" : "bg-red-500"
                      )}
                      style={{ opacity }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        {interactive && (
          <div className="border-t border-zinc-100 dark:border-zinc-900 px-4 py-3 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/30 min-h-[52px]">
            <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">
              {flash === "blocked"
                ? "Rate limited! Bucket is empty — wait for tokens to refill."
                : "Click to consume a token. Tokens refill automatically each second."}
            </span>
            <button
              onClick={makeRequest}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-500 shrink-0 hover:opacity-90",
                flash === "blocked"
                  ? "bg-red-500 text-white"
                  : "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
              )}
            >
              Make Request
            </button>
          </div>
        )}
      </div>
    </>
  );
}
