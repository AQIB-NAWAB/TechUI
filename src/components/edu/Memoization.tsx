"use client";

import { useState, useEffect, useRef } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Zap, RotateCcw } from "lucide-react";

export const MemoizationSchema = z.object({
  example: z.enum(["fibonacci", "factorial", "api-call"]).default("fibonacci"),
});

export type MemoizationProps = z.infer<typeof MemoizationSchema>;

interface CallEntry {
  label: string;
  key: string;
  isHit: boolean;
  result: string;
  time: string;
}

interface CacheEntry {
  key: string;
  value: string;
}

interface ExampleConfig {
  title: string;
  calls: CallEntry[];
  insightWithout: string;
  insightWith: string;
}

const EXAMPLES: Record<string, ExampleConfig> = {
  fibonacci: {
    title: "fib(n)",
    calls: [
      { label: "fib(5)", key: "n=5", isHit: false, result: "5", time: "~12ms" },
      { label: "fib(3)", key: "n=3", isHit: false, result: "2", time: "~3ms" },
      { label: "fib(5)", key: "n=5", isHit: true, result: "5", time: "0ms" },
      { label: "fib(4)", key: "n=4", isHit: false, result: "3", time: "~8ms" },
      { label: "fib(3)", key: "n=3", isHit: true, result: "2", time: "0ms" },
      { label: "fib(7)", key: "n=7", isHit: false, result: "13", time: "~20ms" },
      { label: "fib(7)", key: "n=7", isHit: true, result: "13", time: "0ms" },
    ],
    insightWithout: "fib(10) = 177 calls",
    insightWith: "fib(10) = 10 calls",
  },
  factorial: {
    title: "fact(n)",
    calls: [
      { label: "fact(5)", key: "n=5", isHit: false, result: "120", time: "~5ms" },
      { label: "fact(3)", key: "n=3", isHit: false, result: "6", time: "~2ms" },
      { label: "fact(5)", key: "n=5", isHit: true, result: "120", time: "0ms" },
      { label: "fact(8)", key: "n=8", isHit: false, result: "40320", time: "~8ms" },
      { label: "fact(3)", key: "n=3", isHit: true, result: "6", time: "0ms" },
      { label: "fact(10)", key: "n=10", isHit: false, result: "3628800", time: "~11ms" },
      { label: "fact(8)", key: "n=8", isHit: true, result: "40320", time: "0ms" },
    ],
    insightWithout: "fact(10) = 10 recursive calls",
    insightWith: "fact(10) = 1 lookup",
  },
  "api-call": {
    title: "fetchUser(id)",
    calls: [
      { label: 'fetchUser("alice")', key: 'id="alice"', isHit: false, result: '{ name: "Alice" }', time: "312ms" },
      { label: 'fetchUser("bob")', key: 'id="bob"', isHit: false, result: '{ name: "Bob" }', time: "287ms" },
      { label: 'fetchUser("alice")', key: 'id="alice"', isHit: true, result: '{ name: "Alice" }', time: "0ms" },
      { label: 'fetchUser("carol")', key: 'id="carol"', isHit: false, result: '{ name: "Carol" }', time: "341ms" },
      { label: 'fetchUser("bob")', key: 'id="bob"', isHit: true, result: '{ name: "Bob" }', time: "0ms" },
      { label: 'fetchUser("alice")', key: 'id="alice"', isHit: true, result: '{ name: "Alice" }', time: "0ms" },
    ],
    insightWithout: "6 calls = 6 server round-trips",
    insightWith: "6 calls = 3 server round-trips",
  },
};

export function Memoization({ example = "fibonacci" }: MemoizationProps) {
  const [activeTab, setActiveTab] = useState<"fibonacci" | "factorial" | "api-call">(example);
  const [callIndex, setCallIndex] = useState(0);
  const [visibleCalls, setVisibleCalls] = useState<CallEntry[]>([]);
  const [cache, setCache] = useState<CacheEntry[]>([]);
  const prevTab = useRef(activeTab);

  const config = EXAMPLES[activeTab];
  const allCalls = config.calls;

  useEffect(() => {
    if (prevTab.current !== activeTab) {
      prevTab.current = activeTab;
      setCallIndex(0);
      setVisibleCalls([]);
      setCache([]);
    }
  }, [activeTab]);

  function executeNext() {
    if (callIndex >= allCalls.length) return;
    const call = allCalls[callIndex];
    setVisibleCalls((prev) => [...prev, call]);
    if (!call.isHit) {
      setCache((prev) => {
        const exists = prev.find((c) => c.key === call.key);
        if (exists) return prev;
        return [...prev, { key: call.key, value: call.result }];
      });
    }
    setCallIndex((i) => i + 1);
  }

  function reset() {
    setCallIndex(0);
    setVisibleCalls([]);
    setCache([]);
  }

  const hits = visibleCalls.filter((c) => c.isHit).length;
  const misses = visibleCalls.filter((c) => !c.isHit).length;
  const hitRate = visibleCalls.length > 0 ? Math.round((hits / visibleCalls.length) * 100) : 0;
  const isDone = callIndex >= allCalls.length;

  const TABS: Array<{ key: "fibonacci" | "factorial" | "api-call"; label: string }> = [
    { key: "fibonacci", label: "Fibonacci" },
    { key: "factorial", label: "Factorial" },
    { key: "api-call", label: "API Call" },
  ];

  const footerStatus = isDone
    ? `${config.insightWithout} → ${config.insightWith}`
    : visibleCalls.length === 0
    ? "Press Next Call to see cache hits save time"
    : `${hits} cache hit${hits !== 1 ? "s" : ""}, ${misses} miss${misses !== 1 ? "es" : ""} — ${hitRate}% hit rate`;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800">
        <Zap className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">Memoization</span>
        <span className="text-xs font-mono text-zinc-500">
          hits: <span className="text-emerald-600 font-bold">{hits}</span>
        </span>
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        Store results you've already computed — repeat calls return instantly from cache.
      </p>

      <div className="min-h-[220px] px-4 pt-3 pb-2 flex flex-col gap-3">
        <div className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-500",
                activeTab === tab.key
                  ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 flex-1">
          <div className="flex flex-col gap-1">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-1">Call history</div>
            <div className="border border-zinc-100 dark:border-zinc-800 rounded-lg p-2 bg-zinc-50 dark:bg-zinc-800/50 min-h-[140px] flex flex-col gap-1">
              {allCalls.map((call, idx) => {
                const visible = idx < callIndex;
                return (
                  <div
                    key={idx}
                    className={cn(
                      "flex items-center gap-2 px-2 py-1 rounded-lg text-xs transition-all duration-500 min-h-[24px]",
                      visible
                        ? call.isHit
                          ? "bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800"
                          : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700"
                        : "opacity-0"
                    )}
                  >
                    <span className="font-mono text-[10px] flex-1 truncate">{call.label}</span>
                    <span className={cn("text-[9px] font-bold shrink-0", call.isHit ? "text-emerald-600" : "text-amber-600")}>
                      {call.isHit ? "HIT" : "MISS"}
                    </span>
                    <span className="text-[9px] font-mono text-zinc-400 shrink-0">{call.time}</span>
                  </div>
                );
              })}
              {visibleCalls.length === 0 && (
                <div className="text-xs text-zinc-400 italic pt-2">Waiting for first call…</div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-1">Cache table</div>
            <div className="border border-zinc-100 dark:border-zinc-800 rounded-lg p-2 bg-zinc-50 dark:bg-zinc-800/50 min-h-[140px] flex flex-col gap-1">
              {cache.map((entry) => (
                <div
                  key={entry.key}
                  className="flex items-center gap-2 px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 transition-all duration-500"
                >
                  <span className="font-mono text-[10px] text-zinc-600 shrink-0">{entry.key}</span>
                  <span className="text-[10px] text-zinc-400">→</span>
                  <span className="font-mono text-[10px] text-emerald-700 flex-1 truncate">{entry.value}</span>
                </div>
              ))}
              {cache.length === 0 && (
                <div className="text-xs text-zinc-400 italic pt-2">Cache is empty</div>
              )}
            </div>
          </div>
        </div>

        {visibleCalls.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-zinc-500">Hit rate</span>
              <span className="text-[10px] font-bold text-emerald-600">{hitRate}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
              <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${hitRate}%` }} />
            </div>
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
        <button
          onClick={reset}
          className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all duration-500"
          title="Reset"
        >
          <RotateCcw className="size-3.5" />
        </button>
        <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1 truncate">{footerStatus}</span>
        <button
          onClick={executeNext}
          disabled={isDone}
          className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-30 shrink-0"
        >
          {isDone ? "All done" : "Next Call"}
        </button>
      </div>
    </div>
  );
}
