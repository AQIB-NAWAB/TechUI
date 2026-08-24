"use client";

import { useState, useEffect, useRef } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Radio, Monitor, Server, Webhook, RefreshCw } from "lucide-react";

export const PollingVsWebhooksSchema = z.object({
  pattern: z.enum(["polling", "long-polling", "webhook", "sse"]).default("polling"),
  eventInterval: z.number().default(8),
  pollInterval: z.number().default(2),
});

export type PollingVsWebhooksProps = z.infer<typeof PollingVsWebhooksSchema>;

type Pattern = "polling" | "long-polling" | "webhook" | "sse";

interface TimelineStep {
  time: string;
  client: string;
  server: string;
  useful: boolean;
  type: "request" | "response" | "event" | "idle" | "heartbeat";
}

const TIMELINE: Record<Pattern, TimelineStep[]> = {
  polling: [
    { time: "0s",  client: "GET /status →",  server: "← 204 no change",       useful: false, type: "request" },
    { time: "2s",  client: "GET /status →",  server: "← 204 no change",       useful: false, type: "request" },
    { time: "4s",  client: "GET /status →",  server: "← 204 no change",       useful: false, type: "request" },
    { time: "6s",  client: "GET /status →",  server: "← 204 no change",       useful: false, type: "request" },
    { time: "8s",  client: "GET /status →",  server: "← 200 EVENT! ✓",        useful: true,  type: "event"   },
    { time: "10s", client: "GET /status →",  server: "← 204 no change",       useful: false, type: "request" },
  ],
  "long-polling": [
    { time: "0s",  client: "GET /wait →",    server: "(holding...)",             useful: false, type: "idle"    },
    { time: "8s",  client: "",               server: "← 200 EVENT ✓",            useful: true,  type: "event"   },
    { time: "8s",  client: "GET /wait →",    server: "(reconnects)",             useful: false, type: "idle"   },
    { time: "16s", client: "",               server: "← 200 EVENT ✓",            useful: true,  type: "event"   },
  ],
  webhook: [
    { time: "0s",  client: "(listening...)", server: "",                              useful: false, type: "idle"     },
    { time: "8s",  client: "",               server: "POST /webhook →",               useful: true,  type: "event"    },
    { time: "8s",  client: "← 200 OK",       server: "",                              useful: true,  type: "response" },
    { time: "16s", client: "",               server: "POST /webhook →",               useful: true,  type: "event"    },
    { time: "16s", client: "← 200 OK",       server: "",                              useful: true,  type: "response" },
  ],
  sse: [
    { time: "0s",  client: "GET /stream →",  server: "200 (open)",                    useful: false, type: "request"   },
    { time: "2s",  client: "",               server: "heartbeat",                     useful: false, type: "heartbeat" },
    { time: "4s",  client: "",               server: "heartbeat",                     useful: false, type: "heartbeat" },
    { time: "8s",  client: "",               server: 'ORDER_CREATED {"id":123}',      useful: true, type: "event"   },
    { time: "10s", client: "",               server: "heartbeat",                     useful: false, type: "heartbeat" },
  ],
};

const INSIGHTS: Record<Pattern, string> = {
  polling:       "Simple but wasteful — most requests find no new data",
  "long-polling":"Server holds request open — fewer wasted calls",
  webhook:       "Server pushes to you — zero wasted calls, needs public endpoint",
  sse:           "Single connection, server streams events — great for dashboards",
};

const OVERHEAD: Record<Pattern, { label: string; value: number; color: string }> = {
  polling:       { label: "High",   value: 90, color: "bg-red-500"    },
  "long-polling":{ label: "Medium", value: 50, color: "bg-amber-500"  },
  webhook:       { label: "Low",    value: 15, color: "bg-emerald-500" },
  sse:           { label: "Low",    value: 15, color: "bg-emerald-500" },
};

const TABS: Array<{ key: Pattern; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { key: "polling",      label: "Polling",       icon: RefreshCw },
  { key: "long-polling", label: "Long Poll",     icon: Monitor   },
  { key: "webhook",      label: "Webhook",       icon: Webhook   },
  { key: "sse",          label: "SSE",           icon: Radio     },
];

export function PollingVsWebhooks({
  pattern: initialPattern = "polling",
}: PollingVsWebhooksProps) {
  const [pattern, setPattern] = useState<Pattern>(initialPattern);
  const [visibleSteps, setVisibleSteps] = useState(0);
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const steps = TIMELINE[pattern];
  const isDone = visibleSteps >= steps.length;

  useEffect(() => {
    setVisibleSteps(0);
    setPlaying(false);
  }, [pattern]);

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setVisibleSteps((prev) => {
          if (prev >= steps.length) {
            setPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1200);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [playing, steps.length]);

  function handlePlay() {
    if (isDone) {
      setVisibleSteps(0);
      setPlaying(true);
    } else if (!playing) {
      setPlaying(true);
    }
  }

  const useful = steps.slice(0, visibleSteps).filter((s) => s.useful).length;
  const total = visibleSteps;
  const overhead = OVERHEAD[pattern];

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800">
        <Radio className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">Polling vs Webhooks</span>
        {total > 0 && (
          <span className="text-xs text-zinc-400 font-mono">
            useful: <span className={cn("font-bold", useful === total ? "text-emerald-600" : "text-amber-600")}>{useful}/{total}</span>
          </span>
        )}
      </div>

      <div className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        How does your app learn about new events? Each pattern trades simplicity for efficiency.
      </div>

      <div className="flex gap-1 px-4 pt-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setPattern(tab.key)}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-500",
                pattern === tab.key
                  ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
              )}
            >
              <Icon className="size-3" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="min-h-[260px] px-4 py-3 flex flex-col gap-3">
        <div className="grid grid-cols-[40px_1fr_1fr] gap-2">
          <div className="text-[9px] font-semibold text-zinc-400 uppercase">Time</div>
          <div className="text-[9px] font-semibold text-zinc-400 uppercase flex items-center gap-1">
            <Monitor className="size-3" /> Client
          </div>
          <div className="text-[9px] font-semibold text-zinc-400 uppercase flex items-center gap-1">
            <Server className="size-3" /> Server
          </div>

          {steps.map((step, idx) => {
            const visible = idx < visibleSteps;
            const isEvent = step.useful && step.type === "event";
            const isWasted = !step.useful && step.type === "request";

            return (
              <div key={idx} className="contents">
                <div className={cn("text-[10px] font-mono text-zinc-400 transition-opacity duration-500", visible ? "opacity-100" : "opacity-0")}>{step.time}</div>
                <div className={cn(
                  "text-[10px] font-mono truncate rounded px-1 py-0.5 transition-all duration-500",
                  visible ? "opacity-100" : "opacity-0",
                  isEvent ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300" :
                  isWasted ? "bg-red-50/50 dark:bg-red-950/10 text-red-500" :
                  "text-zinc-600 dark:text-zinc-400"
                )}>
                  {step.client || "·"}
                  {isWasted && step.client && <span className="ml-1 text-[8px] text-red-400">wasted</span>}
                </div>
                <div className={cn(
                  "text-[10px] font-mono truncate rounded px-1 py-0.5 transition-all duration-500",
                  visible ? "opacity-100" : "opacity-0",
                  isEvent ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 font-semibold" :
                  "text-zinc-600 dark:text-zinc-400"
                )}>
                  {step.server || "·"}
                </div>
              </div>
            );
          })}
        </div>

        {visibleSteps === 0 && (
          <p className="text-xs text-zinc-400 italic text-center py-2">Press Play to animate the timeline</p>
        )}

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-400 w-20">{overhead.label} overhead</span>
          <div className="flex-1 h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
            <div className={cn("h-full rounded-full transition-all duration-500", overhead.color)} style={{ width: `${overhead.value}%` }} />
          </div>
        </div>

        <div className="text-[10px] text-zinc-500 bg-zinc-50 dark:bg-zinc-800/40 rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-2">
          <strong className="text-zinc-600 dark:text-zinc-300">{TABS.find((t) => t.key === pattern)?.label}:</strong>{" "}
          {INSIGHTS[pattern]}
        </div>
      </div>

      <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
        <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">
          {playing ? `Step ${visibleSteps}/${steps.length}…` : isDone ? "Timeline complete" : INSIGHTS[pattern]}
        </span>
        <button
          onClick={handlePlay}
          disabled={playing}
          className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isDone ? "Replay" : "Play"}
        </button>
      </div>
    </div>
  );
}
