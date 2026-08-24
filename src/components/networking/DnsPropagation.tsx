"use client";

import { useState, useCallback } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Globe, CheckCircle, XCircle, Loader2 } from "lucide-react";

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
  const [timeAdvanced, setTimeAdvanced] = useState(0);

  const propagated = resolvers.filter((r) => r.status === "propagated").length;
  const total = resolvers.length;
  const pct = total > 0 ? Math.round((propagated / total) * 100) : 0;

  const simulateTime = useCallback(
    (advanceSeconds: number) => {
      if (simulating) return;
      setSimulating(true);

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
      }, 1000);
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
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800">
        <Globe className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">DNS Propagation</span>
        <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">{domain}</span>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800 rounded-md px-2 py-0.5">
          {recordType}
        </span>
      </div>

      <p className="text-sm text-zinc-500 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        DNS changes spread slowly — resolvers cache old values until TTL expires.
      </p>

      <div className="min-h-[280px] px-4 py-3 flex flex-col gap-3">
        <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 px-3 py-2">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-1">Record Changed</div>
          <div className="flex items-center gap-1.5 text-xs font-mono flex-wrap">
            <span className="text-red-600 dark:text-red-400 font-semibold line-through">{oldValue}</span>
            <span className="text-zinc-400">→</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{newValue}</span>
            <span className="ml-auto text-zinc-400 dark:text-zinc-500">TTL: {formatTime(ttl)}</span>
          </div>
          {timeAdvanced > 0 && (
            <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">
              Time simulated: +{formatTime(timeAdvanced)}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto space-y-1.5 max-h-[180px]">
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
                    ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                    : isChecking
                    ? "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                    : "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-100 dark:border-zinc-800"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base leading-none">{resolver.flag}</span>
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 w-24 shrink-0">
                    {resolver.location}
                  </span>
                  <span className={cn(
                    "text-xs font-mono font-bold flex-1",
                    isNew ? "text-emerald-600 dark:text-emerald-400"
                      : isChecking ? "text-amber-600 dark:text-amber-400"
                      : "text-red-600 dark:text-red-400"
                  )}>
                    {isChecking ? "querying…" : resolver.cachedValue}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400 shrink-0">
                    TTL: {resolver.ttlRemaining}s
                  </span>
                  <div className="shrink-0">
                    {isNew ? (
                      <CheckCircle className="size-4 text-emerald-500" />
                    ) : isChecking ? (
                      <Loader2 className="size-4 text-amber-500 animate-spin" />
                    ) : (
                      <XCircle className="size-4 text-red-400" />
                    )}
                  </div>
                </div>
                <div className="h-1 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      isNew ? "bg-emerald-400"
                        : resolver.ttlRemaining < ttl * 0.1 ? "bg-red-400"
                        : resolver.ttlRemaining < ttl * 0.3 ? "bg-amber-400"
                        : "bg-zinc-400 dark:bg-zinc-500"
                    )}
                    style={{ width: `${ttlPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 shrink-0">
            {propagated}/{total} ({pct}%)
          </span>
        </div>
      </div>

      <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-3">
        <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">
          {simulating
            ? "Resolvers with expired TTL are re-querying…"
            : propagated === total
            ? "Fully propagated across all resolvers"
            : `${total - propagated} resolver${total - propagated !== 1 ? "s" : ""} still cached`}
        </span>
        <button
          onClick={handleReset}
          className="px-3 py-2 text-sm font-semibold rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all duration-500"
        >
          Reset
        </button>
        <button
          onClick={() => simulateTime(3600)}
          disabled={simulating || propagated === total}
          className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {simulating ? "Simulating…" : "Simulate +1h"}
        </button>
      </div>
    </div>
  );
}
