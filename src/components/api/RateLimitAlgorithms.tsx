"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Activity } from "lucide-react";

export const RateLimitAlgorithmsSchema = z.object({
  algorithm: z.enum(["token-bucket", "fixed-window", "sliding-window"]).default("token-bucket"),
  rps: z.number().int().min(1).max(20).default(5),
  windowMs: z.number().default(1000),
  burstAllowed: z.boolean().default(true),
});

export type RateLimitAlgorithmsProps = z.infer<typeof RateLimitAlgorithmsSchema>;

type Tab = "token-bucket" | "fixed-window" | "sliding-window";

type ReqDot = { id: number; allowed: boolean };

type TabActions = {
  makeRequest: () => void;
  status: string;
  limited: boolean;
};

let _uid = 1000;

function TokenBucketTab({
  capacity,
  onActionsChange,
}: {
  capacity: number;
  onActionsChange: (actions: TabActions) => void;
}) {
  const [tokens, setTokens] = useState(capacity);
  const [history, setHistory] = useState<ReqDot[]>([]);
  const [limited, setLimited] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setTokens((t) => Math.min(capacity, t + 1));
    }, 1000);
    return () => clearInterval(id);
  }, [capacity]);

  const makeRequest = useCallback(() => {
    setTokens((current) => {
      const allowed = current >= 1;
      const id = ++_uid;
      setHistory((prev) => [{ id, allowed }, ...prev].slice(0, 8));
      if (allowed) {
        return current - 1;
      }
      setLimited(true);
      setTimeout(() => setLimited(false), 1000);
      return current;
    });
  }, []);

  useEffect(() => {
    onActionsChange({
      makeRequest,
      status: limited
        ? "Rate limited! Bucket empty — wait for refill."
        : "Allows burst up to bucket size",
      limited,
    });
  }, [limited, makeRequest, onActionsChange]);

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
            Bucket capacity: {capacity} tokens
          </span>
          <span
            className={cn(
              "text-[11px] font-bold font-mono transition-all duration-500",
              tokens === 0 ? "text-red-500" : tokens < capacity * 0.4 ? "text-amber-500" : "text-emerald-500"
            )}
          >
            {tokens}/{capacity}
          </span>
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: capacity }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-7 flex-1 rounded transition-all duration-500",
                i < tokens
                  ? "bg-emerald-500 shadow-sm shadow-emerald-200 dark:shadow-emerald-900"
                  : "bg-zinc-100 dark:bg-zinc-800"
              )}
            />
          ))}
        </div>
        <div className="mt-1 text-[10px] text-zinc-400">Refill rate: 1 token/sec</div>
      </div>

      <div>
        <div className="text-[10px] text-zinc-400 mb-1.5">Last requests:</div>
        <div className="flex gap-1.5 items-center min-h-[20px]">
          {history.length === 0 ? (
            <span className="text-[10px] text-zinc-400">No requests yet</span>
          ) : (
            history.map((d) => (
              <span
                key={d.id}
                className={cn(
                  "size-4 rounded-full transition-all duration-500",
                  d.allowed ? "bg-emerald-500" : "bg-red-500"
                )}
                title={d.allowed ? "Allowed" : "Blocked"}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

const WINDOW_DURATION = 4000;

function FixedWindowTab({
  limit,
  onActionsChange,
}: {
  limit: number;
  onActionsChange: (actions: TabActions) => void;
}) {
  const [count, setCount] = useState(0);
  const [progress, setProgress] = useState(0);
  const [limited, setLimited] = useState(false);
  const startRef = useRef(Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      const elapsed = (Date.now() - startRef.current) % WINDOW_DURATION;
      setProgress((elapsed / WINDOW_DURATION) * 100);
      const frac = elapsed / WINDOW_DURATION;
      if (frac < 0.05) {
        setCount((c) => (c > 0 ? 0 : c));
      }
    }, 50);
    return () => clearInterval(id);
  }, []);

  const makeRequest = useCallback(() => {
    setCount((current) => {
      if (current >= limit) {
        setLimited(true);
        setTimeout(() => setLimited(false), 1000);
        return current;
      }
      return current + 1;
    });
  }, [limit]);

  useEffect(() => {
    onActionsChange({
      makeRequest,
      status: limited
        ? "Rate limited! Window full."
        : "Simple to implement, but allows boundary bursts",
      limited,
    });
  }, [limited, makeRequest, onActionsChange]);

  const pct = (count / limit) * 100;
  const timeLeft = (((100 - progress) / 100) * WINDOW_DURATION) / 1000;

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">Current window</span>
          <span className="text-[11px] font-mono text-zinc-400">{timeLeft.toFixed(1)}s left</span>
        </div>
        <div className="h-3 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
          <div className="h-full rounded-full bg-blue-500 transition-all duration-500" style={{ width: `${100 - progress}%` }} />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">Requests this window</span>
          <span
            className={cn(
              "text-[11px] font-bold font-mono transition-all duration-500",
              count >= limit ? "text-red-500" : count >= limit * 0.7 ? "text-amber-500" : "text-emerald-500"
            )}
          >
            {count} / {limit}
          </span>
        </div>
        <div className="h-3 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              count >= limit ? "bg-red-500" : count >= limit * 0.7 ? "bg-amber-500" : "bg-emerald-500"
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2 text-[11px] text-amber-700 dark:text-amber-400">
        Spike possible at window boundary — {limit} requests can arrive right before + after reset!
      </div>
    </div>
  );
}

const SLIDE_WINDOW = 5000;

type TimestampedReq = { id: number; ts: number; allowed: boolean };

function SlidingWindowTab({
  limit,
  onActionsChange,
}: {
  limit: number;
  onActionsChange: (actions: TabActions) => void;
}) {
  const [reqs, setReqs] = useState<TimestampedReq[]>([]);
  const [now, setNow] = useState(Date.now());
  const [limited, setLimited] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, []);

  const visible = reqs.filter((r) => now - r.ts < SLIDE_WINDOW);
  const inWindow = visible.filter((r) => r.allowed).length;

  const makeRequest = useCallback(() => {
    setReqs((prev) => {
      const allowed = prev.filter((r) => Date.now() - r.ts < SLIDE_WINDOW && r.allowed).length < limit;
      const id = ++_uid;
      const entry: TimestampedReq = { id, ts: Date.now(), allowed };
      if (!allowed) {
        setLimited(true);
        setTimeout(() => setLimited(false), 1000);
      }
      return [...prev, entry].slice(-50);
    });
  }, [limit]);

  useEffect(() => {
    onActionsChange({
      makeRequest,
      status: limited
        ? "Rate limited! Too many recent requests."
        : "More fair than fixed window",
      limited,
    });
  }, [limited, makeRequest, onActionsChange]);

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
            Last {SLIDE_WINDOW / 1000}s rolling window
          </span>
          <span
            className={cn(
              "text-[11px] font-bold font-mono transition-all duration-500",
              inWindow >= limit ? "text-red-500" : inWindow >= limit * 0.7 ? "text-amber-500" : "text-emerald-500"
            )}
          >
            {inWindow} / {limit} in window
          </span>
        </div>

        <div className="relative h-8 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-100 dark:border-zinc-800 overflow-hidden">
          <div className="absolute right-2 top-0 bottom-0 w-px bg-zinc-300 dark:bg-zinc-600" />
          <span className="absolute right-3 top-0.5 text-[9px] text-zinc-400">now</span>
          {visible.map((r) => {
            const age = now - r.ts;
            const x = 100 - (age / SLIDE_WINDOW) * 88;
            return (
              <div
                key={r.id}
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 size-3 rounded-full transition-all duration-500",
                  r.allowed ? "bg-emerald-500" : "bg-red-500"
                )}
                style={{ left: `${x}%`, opacity: Math.max(0.3, 1 - age / SLIDE_WINDOW) }}
              />
            );
          })}
          {visible.length === 0 && (
            <span className="absolute inset-0 flex items-center justify-center text-[10px] text-zinc-400">
              No requests yet — click Make Request
            </span>
          )}
        </div>
      </div>

      <div className="bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-2 text-[11px] text-emerald-700 dark:text-emerald-400">
        No boundary burst — old requests age out gradually.
      </div>
    </div>
  );
}

export function RateLimitAlgorithms({
  algorithm = "token-bucket",
  rps = 5,
}: RateLimitAlgorithmsProps) {
  const [tab, setTab] = useState<Tab>(algorithm);
  const [actions, setActions] = useState<TabActions>({
    makeRequest: () => {},
    status: "Click Make Request to simulate traffic",
    limited: false,
  });

  const tabs: { id: Tab; label: string }[] = [
    { id: "token-bucket", label: "Token Bucket" },
    { id: "fixed-window", label: "Fixed Window" },
    { id: "sliding-window", label: "Sliding Window" },
  ];

  const handleActionsChange = useCallback((next: TabActions) => {
    setActions(next);
  }, []);

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <Activity className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">Rate Limit Algorithms</span>
        <div className="flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all duration-500",
                tab === t.id
                  ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                  : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        Different strategies to cap how many requests a client can make in a time window.
      </p>

      <div className="p-4 min-h-[220px]">
        {tab === "token-bucket" && (
          <TokenBucketTab key="token-bucket" capacity={rps} onActionsChange={handleActionsChange} />
        )}
        {tab === "fixed-window" && (
          <FixedWindowTab key="fixed-window" limit={rps} onActionsChange={handleActionsChange} />
        )}
        {tab === "sliding-window" && (
          <SlidingWindowTab key="sliding-window" limit={rps} onActionsChange={handleActionsChange} />
        )}
      </div>

      <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/30 min-h-[52px]">
        <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">{actions.status}</span>
        <button
          onClick={actions.makeRequest}
          className={cn(
            "rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-500 shrink-0 hover:opacity-90",
            actions.limited
              ? "bg-red-500 text-white"
              : "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
          )}
        >
          Make Request
        </button>
      </div>
    </div>
  );
}
