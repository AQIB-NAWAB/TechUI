"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Zap, X, RefreshCw, Search } from "lucide-react";

export const CacheVisualizerSchema = z.object({
  name: z.string().optional().default("Redis Cache"),
  capacity: z.number().int().min(1).max(12).optional().default(6),
  policy: z.enum(["lru", "lfu", "fifo"]).optional().default("lru"),
  ttl: z.number().optional(),
  entries: z
    .array(
      z.object({
        key: z.string(),
        value: z.string(),
        ttl: z.number().optional(),
        hits: z.number().optional().default(0),
      })
    )
    .optional(),
  interactive: z.boolean().optional().default(true),
});

export type CacheVisualizerProps = z.infer<typeof CacheVisualizerSchema>;

type Entry = {
  key: string;
  value: string;
  ttl?: number;
  ttlMax?: number;
  hits: number;
  order: number;
  flashHit?: boolean;
  flashMiss?: boolean;
  animateIn?: boolean;
  evicting?: boolean;
  hitsAnimating?: boolean;
};

type AccessResult = { key: string; hit: boolean } | null;

const DEMO_ENTRIES: Entry[] = [
  { key: "user:42",     value: '{"id":42,"name":"Alice"}',    hits: 14, order: 0 },
  { key: "session:abc", value: "tok_eyJ0eXAiOiJKV1QiL...",   hits: 3,  order: 1, ttl: 55, ttlMax: 55 },
  { key: "product:7",   value: '{"id":7,"price":29.99}',      hits: 27, order: 2 },
  { key: "rate:ip:1.2", value: "47",                          hits: 2,  order: 3, ttl: 12, ttlMax: 30 },
];

const LOOKUP_KEYS = [
  "user:42", "user:99", "session:abc", "session:xyz",
  "product:7", "product:3", "rate:ip:1.2", "rate:ip:9.9",
];

let _orderCounter = 100;

export function CacheVisualizer({
  name = "Redis Cache",
  capacity = 6,
  policy = "lru",
  entries: entriesProp,
  interactive = true,
}: CacheVisualizerProps) {
  const initEntries = (): Entry[] => {
    if (entriesProp) {
      return entriesProp.map((e, i) => ({
        key: e.key, value: e.value, hits: e.hits ?? 0, ttl: e.ttl,
        ttlMax: e.ttl, order: i,
      }));
    }
    return DEMO_ENTRIES.slice(0, capacity);
  };

  const [entries, setEntries] = useState<Entry[]>(initEntries);
  const [lastAccess, setLastAccess] = useState<AccessResult>(null);
  const [lookupKey, setLookupKey] = useState(LOOKUP_KEYS[0]!);
  const [stats, setStats] = useState({ hits: 0, misses: 0 });
  const [searchFlash, setSearchFlash] = useState<"hit" | "miss" | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setEntries((prev) =>
        prev.map((e) =>
          e.ttl !== undefined && e.ttl > 0 ? { ...e, ttl: e.ttl - 1 } : e
        )
      );
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const evict = useCallback((current: Entry[]): { evicted: Entry | null; remaining: Entry[] } => {
    if (current.length <= 0) return { evicted: null, remaining: current };
    let sorted: Entry[];
    if (policy === "lru") sorted = current.slice().sort((a, b) => a.order - b.order);
    else if (policy === "lfu") sorted = current.slice().sort((a, b) => a.hits - b.hits);
    else sorted = current.slice();
    return { evicted: sorted[0] ?? null, remaining: sorted.slice(1) };
  }, [policy]);

  function access(key: string) {
    const idx = entries.findIndex((e) => e.key === key);
    const hit = idx !== -1;
    setLastAccess({ key, hit });
    setStats((s) => hit ? { ...s, hits: s.hits + 1 } : { ...s, misses: s.misses + 1 });
    setSearchFlash(hit ? "hit" : "miss");
    setTimeout(() => setSearchFlash(null), 700);

    if (hit) {
      const order = ++_orderCounter;
      setEntries((prev) =>
        prev.map((e, i) =>
          i === idx
            ? { ...e, hits: e.hits + 1, order, flashHit: true, hitsAnimating: true }
            : e
        )
      );
      setTimeout(() => {
        setEntries((prev) => prev.map((e) => ({ ...e, flashHit: false, hitsAnimating: false })));
      }, 800);
    } else {
      const newEntry: Entry = {
        key,
        value: `<computed at ${new Date().toLocaleTimeString()}>`,
        hits: 1,
        order: ++_orderCounter,
        animateIn: true,
      };

      setEntries((prev) => {
        if (prev.length >= capacity) {
          const { evicted, remaining } = evict(prev);
          if (evicted) {
            setEntries((p) =>
              p.map((e) => e.key === evicted.key ? { ...e, evicting: true } : e)
            );
            setTimeout(() => {
              setEntries((p) => {
                const filtered = p.filter((e) => e.key !== evicted.key);
                return [...filtered, newEntry];
              });
              setTimeout(() => {
                setEntries((p) => p.map((e) => e.key === key ? { ...e, animateIn: false } : e));
              }, 400);
            }, 600);
            return prev;
          }
          return [...remaining, newEntry];
        }
        setTimeout(() => {
          setEntries((p) => p.map((e) => e.key === key ? { ...e, animateIn: false } : e));
        }, 400);
        return [...prev, newEntry];
      });
    }
  }

  function remove(key: string) {
    setEntries((prev) => prev.filter((e) => e.key !== key));
  }

  function reset() {
    setEntries(initEntries());
    setLastAccess(null);
    setStats({ hits: 0, misses: 0 });
    _orderCounter = 100;
  }

  const total = stats.hits + stats.misses;
  const hitRate = total > 0 ? Math.round((stats.hits / total) * 100) : null;
  const displayed = [...entries].sort((a, b) => b.order - a.order);

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/50">
        <Zap className="size-3.5 text-amber-500 shrink-0" />
        <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex-1">{name}</span>
        <span className="text-[10px] font-medium text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full uppercase tracking-wide">
          {policy}
        </span>
        <span className="text-[10px] text-zinc-400">{entries.length}/{capacity} keys</span>
        {interactive && (
          <button onClick={reset} className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
            <RefreshCw className="size-3.5" />
          </button>
        )}
      </div>

      {/* Stats bar */}
      {total > 0 && (
        <div className="flex items-center gap-4 px-4 py-2 border-b border-zinc-50 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/20">
          <div className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">{stats.hits} hits</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-amber-500" />
            <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">{stats.misses} misses</span>
          </div>
          {hitRate !== null && (
            <div className="ml-auto flex items-center gap-1.5">
              <div className="w-20 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${hitRate}%` }}
                />
              </div>
              <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">{hitRate}% hit</span>
            </div>
          )}
        </div>
      )}

      {/* Last access banner */}
      {lastAccess && (
        <div className={cn(
          "flex items-center gap-2 px-4 py-2 border-b text-[11px] font-medium transition-all duration-500",
          lastAccess.hit
            ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400"
            : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400"
        )}>
          <span className={cn(
            "font-bold text-[10px] px-1.5 py-0.5 rounded",
            lastAccess.hit
              ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
              : "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"
          )}>
            {lastAccess.hit ? "✓ HIT" : "✗ MISS"}
          </span>
          <code className="font-mono text-[11px]">{lastAccess.key}</code>
          {!lastAccess.hit && (
            <span className="text-[10px] font-normal opacity-70">— fetching from DB and caching</span>
          )}
        </div>
      )}

      {/* Entries list */}
      <div className="min-h-[160px] divide-y divide-zinc-50 dark:divide-zinc-900/60">
        {displayed.length === 0 && (
          <div className="flex items-center justify-center h-40 text-xs text-zinc-400 border-2 border-dashed border-zinc-200 dark:border-zinc-800 m-4 rounded-lg">
            Cache is empty
          </div>
        )}
        {displayed.map((entry, i) => {
          const ttlPct = entry.ttlMax && entry.ttl !== undefined
            ? Math.max(0, (entry.ttl / entry.ttlMax) * 100)
            : null;

          return (
            <div
              key={entry.key}
              className={cn(
                "group flex items-start gap-3 px-4 py-2.5 transition-all duration-500 relative overflow-hidden",
                entry.flashHit && "ring-2 ring-inset ring-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/10",
                entry.flashMiss && "ring-2 ring-inset ring-red-400 bg-red-50/50 dark:bg-red-950/10",
                entry.animateIn && "-translate-y-2 opacity-0",
                !entry.animateIn && "translate-y-0 opacity-100",
                entry.evicting && "-translate-x-full opacity-0",
              )}
            >
              <span className="text-[10px] font-mono text-zinc-300 dark:text-zinc-700 w-4 text-right shrink-0 mt-0.5">{i + 1}</span>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono font-semibold text-sky-600 dark:text-sky-400 truncate">{entry.key}</code>
                  {entry.ttl !== undefined && (
                    <span className={cn(
                      "text-[10px] font-mono shrink-0",
                      entry.ttl < 10 ? "text-red-500 dark:text-red-400" : entry.ttl < 20 ? "text-amber-500 dark:text-amber-400" : "text-zinc-400 dark:text-zinc-600"
                    )}>
                      TTL {entry.ttl}s
                    </span>
                  )}
                </div>
                <code className="block text-[11px] font-mono text-zinc-500 dark:text-zinc-500 truncate mt-0.5">{entry.value}</code>
                {ttlPct !== null && (
                  <div className="h-0.5 bg-zinc-200 dark:bg-zinc-700 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-1000",
                        ttlPct > 50 ? "bg-emerald-400" : ttlPct > 20 ? "bg-amber-400" : "bg-red-400"
                      )}
                      style={{ width: `${ttlPct}%` }}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className={cn(
                  "text-[10px] text-zinc-400 tabular-nums transition-transform duration-200",
                  entry.hitsAnimating && "scale-125 text-emerald-500"
                )}>
                  {entry.hits}×
                </span>
                {interactive && (
                  <button
                    onClick={() => remove(entry.key)}
                    className="p-1 rounded text-zinc-300 hover:text-red-500 dark:text-zinc-700 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive lookup */}
      {interactive && (
        <div className={cn(
          "border-t border-zinc-100 dark:border-zinc-900 px-4 py-3 flex items-center gap-2 transition-all duration-500",
          searchFlash === "hit" && "bg-emerald-50 dark:bg-emerald-950/20",
          searchFlash === "miss" && "bg-red-50 dark:bg-red-950/20",
          !searchFlash && "bg-zinc-50 dark:bg-zinc-900/30"
        )}>
          <Search className="size-3.5 text-zinc-400 shrink-0" />
          <select
            value={lookupKey}
            onChange={(e) => setLookupKey(e.target.value)}
            className="flex-1 bg-transparent text-xs font-mono text-zinc-700 dark:text-zinc-300 outline-none cursor-pointer"
          >
            {LOOKUP_KEYS.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
          <button
            onClick={() => access(lookupKey)}
            className="px-3 py-1 rounded-md bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition-colors shrink-0"
          >
            GET
          </button>
        </div>
      )}
    </div>
  );
}
