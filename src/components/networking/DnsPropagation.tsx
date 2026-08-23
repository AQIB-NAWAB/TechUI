"use client";

import { useState, useCallback } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Globe, CheckCircle2, XCircle, Loader2 } from "lucide-react";

export const DnsPropagationSchema = z.object({
  domain: z.string().default("freshmarket.com"),
  recordType: z.enum(["A", "CNAME", "MX", "TXT"]).default("A"),
  oldValue: z.string().default("192.168.1.100"),
  newValue: z.string().default("10.0.0.50"),
  ttl: z.number().default(3600),
  resolvers: z.array(z.object({
    location: z.string(),
    flag: z.string(),
    cachedValue: z.string(),
    ttlRemaining: z.number(),
    status: z.enum(["old", "propagated", "checking"]).optional().default("old"),
  })).default([
    { location: "New York",  flag: "🇺🇸", cachedValue: "192.168.1.100", ttlRemaining: 3200, status: "old"        },
    { location: "London",    flag: "🇬🇧", cachedValue: "192.168.1.100", ttlRemaining: 800,  status: "old"        },
    { location: "Singapore", flag: "🇸🇬", cachedValue: "10.0.0.50",     ttlRemaining: 3600, status: "propagated" },
    { location: "São Paulo", flag: "🇧🇷", cachedValue: "192.168.1.100", ttlRemaining: 100,  status: "old"        },
    { location: "Tokyo",     flag: "🇯🇵", cachedValue: "10.0.0.50",     ttlRemaining: 2800, status: "propagated" },
    { location: "Sydney",    flag: "🇦🇺", cachedValue: "192.168.1.100", ttlRemaining: 450,  status: "old"        },
  ]),
});

export type DnsPropagationProps = z.infer<typeof DnsPropagationSchema>;

interface ResolverState {
  location: string;
  flag: string;
  cachedValue: string;
  ttlRemaining: number;
  status: "old" | "propagated" | "checking";
}

export function DnsPropagation({
  domain = "freshmarket.com",
  recordType = "A",
  oldValue = "192.168.1.100",
  newValue = "10.0.0.50",
  ttl = 3600,
  resolvers: initialResolvers = [
    { location: "New York",  flag: "🇺🇸", cachedValue: "192.168.1.100", ttlRemaining: 3200, status: "old"        as const },
    { location: "London",    flag: "🇬🇧", cachedValue: "192.168.1.100", ttlRemaining: 800,  status: "old"        as const },
    { location: "Singapore", flag: "🇸🇬", cachedValue: "10.0.0.50",     ttlRemaining: 3600, status: "propagated" as const },
    { location: "São Paulo", flag: "🇧🇷", cachedValue: "192.168.1.100", ttlRemaining: 100,  status: "old"        as const },
    { location: "Tokyo",     flag: "🇯🇵", cachedValue: "10.0.0.50",     ttlRemaining: 2800, status: "propagated" as const },
    { location: "Sydney",    flag: "🇦🇺", cachedValue: "192.168.1.100", ttlRemaining: 450,  status: "old"        as const },
  ],
}: DnsPropagationProps) {
  const [resolvers, setResolvers] = useState<ResolverState[]>(
    initialResolvers.map((r) => ({
      ...r,
      status: (r.status ?? "old") as "old" | "propagated" | "checking",
    }))
  );
  const [simulating, setSimulating] = useState(false);
  const [timeAdvanced, setTimeAdvanced] = useState(0); // seconds

  const propagated = resolvers.filter((r) => r.status === "propagated").length;
  const total = resolvers.length;
  const pct = total > 0 ? Math.round((propagated / total) * 100) : 0;

  const simulateTime = useCallback(
    (advanceSeconds: number) => {
      if (simulating) return;
      setSimulating(true);

      // First: mark resolvers that will expire as "checking"
      const nextResolvers = resolvers.map((r) => {
        if (r.status === "propagated") return r;
        const newTtl = Math.max(0, r.ttlRemaining - advanceSeconds);
        if (newTtl === 0) {
          return { ...r, ttlRemaining: newTtl, status: "checking" as const };
        }
        return { ...r, ttlRemaining: newTtl };
      });
      setResolvers(nextResolvers);
      setTimeAdvanced((t) => t + advanceSeconds);

      setTimeout(() => {
        // Resolve checking → propagated
        setResolvers((prev) =>
          prev.map((r) => {
            if (r.status === "checking") {
              return {
                ...r,
                cachedValue: newValue,
                ttlRemaining: ttl,
                status: "propagated" as const,
              };
            }
            return r;
          })
        );
        setSimulating(false);
      }, 900);
    },
    [resolvers, simulating, newValue, ttl]
  );

  const handleReset = useCallback(() => {
    setResolvers(
      initialResolvers.map((r) => ({
        ...r,
        status: (r.status ?? "old") as "old" | "propagated" | "checking",
      }))
    );
    setTimeAdvanced(0);
  }, [initialResolvers]);

  const formatTime = (secs: number): string => {
    if (secs < 60) return `${secs}s`;
    if (secs < 3600) return `${Math.round(secs / 60)}m`;
    return `${Math.round(secs / 3600)}h`;
  };

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <Globe className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">DNS Propagation</span>
        <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">{domain}</span>
      </div>

      {/* Interactive area */}
      <div className="min-h-[300px] flex flex-col px-4 pt-3 pb-3 gap-3">

        {/* DNS Change Banner */}
        <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-3 py-2">
          <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold uppercase tracking-wide mb-0.5">Record Changed</div>
          <div className="flex items-center gap-1.5 text-xs font-mono flex-wrap">
            <span className="text-zinc-500 dark:text-zinc-400">{recordType}</span>
            <span className="text-red-600 dark:text-red-400 font-semibold line-through">{oldValue}</span>
            <span className="text-zinc-400">→</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{newValue}</span>
            <span className="ml-auto text-zinc-400 dark:text-zinc-500">TTL: {ttl}s ({formatTime(ttl)})</span>
          </div>
          {timeAdvanced > 0 && (
            <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">
              Time simulated: +{formatTime(timeAdvanced)}
            </div>
          )}
        </div>

        {/* Resolver List */}
        <div className="flex flex-col gap-1.5">
          {resolvers.map((resolver, i) => {
            const isNew = resolver.status === "propagated";
            const isChecking = resolver.status === "checking";
            const ttlPct = Math.min(100, (resolver.ttlRemaining / ttl) * 100);

            return (
              <div
                key={i}
                className={cn(
                  "rounded-lg border px-3 py-2 transition-all duration-500",
                  isNew
                    ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800"
                    : isChecking
                    ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
                    : "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base leading-none">{resolver.flag}</span>
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 w-24 shrink-0">
                    {resolver.location}
                  </span>
                  <span className={cn(
                    "text-xs font-mono font-bold flex-1",
                    isNew
                      ? "text-emerald-600 dark:text-emerald-400"
                      : isChecking
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-red-600 dark:text-red-400"
                  )}>
                    {isChecking ? "querying…" : resolver.cachedValue}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 shrink-0">
                    TTL: {resolver.ttlRemaining}s
                  </span>
                  <div className="shrink-0">
                    {isNew ? (
                      <CheckCircle2 className="size-4 text-emerald-500" />
                    ) : isChecking ? (
                      <Loader2 className="size-4 text-amber-500 animate-spin" />
                    ) : (
                      <XCircle className="size-4 text-red-400" />
                    )}
                  </div>
                </div>

                {/* TTL bar */}
                <div className="h-1 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      isNew
                        ? "bg-emerald-400"
                        : resolver.ttlRemaining < ttl * 0.1
                        ? "bg-red-400"
                        : resolver.ttlRemaining < ttl * 0.3
                        ? "bg-amber-400"
                        : "bg-zinc-400 dark:bg-zinc-500"
                    )}
                    style={{ width: `${ttlPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 shrink-0">
            Propagated: {propagated}/{total} ({pct}%)
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 mt-auto flex-wrap">
          <button
            onClick={() => simulateTime(3600)}
            disabled={simulating || propagated === total}
            className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Simulate +1h
          </button>
          <button
            onClick={() => simulateTime(21600)}
            disabled={simulating || propagated === total}
            className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Simulate +6h
          </button>
          <button
            onClick={handleReset}
            className="px-3 py-2 text-sm font-semibold rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all duration-200 cursor-pointer"
          >
            Reset
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[10px] text-zinc-400 dark:text-zinc-500">
          <span className="flex items-center gap-1"><XCircle className="size-3 text-red-400" /> old cached value</span>
          <span className="flex items-center gap-1"><Loader2 className="size-3 text-amber-400" /> TTL expired, re-querying</span>
          <span className="flex items-center gap-1"><CheckCircle2 className="size-3 text-emerald-400" /> new value</span>
        </div>

        {/* Key insight */}
        <div className="text-[10px] text-zinc-400 dark:text-zinc-500 bg-zinc-50 dark:bg-zinc-800/40 rounded-lg px-3 py-2">
          DNS propagation is slow because old values are cached for TTL seconds.
          <strong className="text-zinc-600 dark:text-zinc-300"> Lower TTL before migrating</strong> = faster propagation.
          Resolvers with low TTL remaining will update first.
        </div>
      </div>
    </div>
  );
}
