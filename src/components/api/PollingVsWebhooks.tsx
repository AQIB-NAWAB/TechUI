"use client";

import { useState, useEffect, useRef } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Radio } from "lucide-react";

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
    { time: "0s",  client: "GET /wait-for-event →", server: "(holding...)",             useful: false, type: "idle"    },
    { time: "8s",  client: "",                       server: "← 200 EVENT data ✓",      useful: true,  type: "event"   },
    { time: "8s",  client: "GET /wait-for-event →",  server: "(reconnects immediately)", useful: false, type: "idle"   },
    { time: "16s", client: "",                        server: "← 200 EVENT data ✓",     useful: true,  type: "event"   },
  ],
  webhook: [
    { time: "0s",  client: "(listening...)",          server: "",                              useful: false, type: "idle"     },
    { time: "8s",  client: "",                        server: "POST /webhook { event } →",     useful: true,  type: "event"    },
    { time: "8s",  client: "← 200 OK",               server: "",                              useful: true,  type: "response" },
    { time: "16s", client: "",                        server: "POST /webhook { event } →",     useful: true,  type: "event"    },
    { time: "16s", client: "← 200 OK",               server: "",                              useful: true,  type: "response" },
  ],
  sse: [
    { time: "0s",  client: "GET /stream →",     server: "200 (connection open)",         useful: false, type: "request"   },
    { time: "2s",  client: "",                   server: "event: heartbeat",              useful: false, type: "heartbeat" },
    { time: "4s",  client: "",                   server: "event: heartbeat",              useful: false, type: "heartbeat" },
    { time: "6s",  client: "",                   server: "event: heartbeat",              useful: false, type: "heartbeat" },
    { time: "8s",  client: "",                   server: 'event: ORDER_CREATED {"id":123}', useful: true, type: "event"   },
    { time: "10s", client: "",                   server: "event: heartbeat",              useful: false, type: "heartbeat" },
  ],
};

const INSIGHTS: Record<Pattern, string> = {
  polling:       "Simple but wasteful — most requests find no new data",
  "long-polling":"Server holds request open — reduces wasted calls but still HTTP overhead",
  webhook:       "Server pushes to you — zero wasted calls but you need a public endpoint",
  sse:           "Single connection, server streams events — great for dashboards",
};

const OVERHEAD: Record<Pattern, { label: string; value: number; color: string }> = {
  polling:       { label: "High",   value: 90, color: "bg-red-500"    },
  "long-polling":{ label: "Medium", value: 50, color: "bg-amber-500"  },
  webhook:       { label: "Low",    value: 15, color: "bg-emerald-500" },
  sse:           { label: "Low",    value: 15, color: "bg-emerald-500" },
};

const TABS: Array<{ key: Pattern; label: string }> = [
  { key: "polling",      label: "Polling"       },
  { key: "long-polling", label: "Long Polling"  },
  { key: "webhook",      label: "Webhook"       },
  { key: "sse",          label: "SSE"           },
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

  // Reset when pattern changes
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
      }, 800);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [playing, steps.length]);

  function handlePlayPause() {
    if (isDone) {
      setVisibleSteps(0);
      setPlaying(true);
    } else {
      setPlaying((p) => !p);
    }
  }

  const useful = steps.slice(0, visibleSteps).filter((s) => s.useful).length;
  const total = visibleSteps;
  const usefulPct = total > 0 ? Math.round((useful / total) * 100) : 0;
  const overhead = OVERHEAD[pattern];

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <Radio className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">Polling vs Webhooks</span>
        {total > 0 && (
          <span className="text-xs text-zinc-400 font-mono">
            useful: <span className={cn("font-bold", useful === total ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400")}>{useful}/{total}</span>
            <span className="text-zinc-300 dark:text-zinc-600 ml-1">({usefulPct}%)</span>
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 pt-3">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setPattern(tab.key)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300",
              pattern === tab.key
                ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Interactive area */}
      <div className="min-h-[300px] px-4 pt-3 pb-3 flex flex-col gap-3">

        {/* Timeline */}
        <div className="flex flex-col gap-0 flex-1">
          {/* Column headers */}
          <div className="grid grid-cols-[40px_1fr_1fr] gap-2 mb-1">
            <div className="text-[9px] font-semibold text-zinc-400 uppercase tracking-wide">Time</div>
            <div className="text-[9px] font-semibold text-zinc-400 uppercase tracking-wide">Client</div>
            <div className="text-[9px] font-semibold text-zinc-400 uppercase tracking-wide">Server</div>
          </div>

          {steps.map((step, idx) => {
            const visible = idx < visibleSteps;
            const isEvent = step.useful && step.type === "event";
            const isWasted = !step.useful && step.type === "request";
            const isHeartbeat = step.type === "heartbeat";

            return (
              <div
                key={idx}
                className={cn(
                  "grid grid-cols-[40px_1fr_1fr] gap-2 px-1 py-1 rounded transition-all duration-500",
                  visible ? "opacity-100" : "opacity-0",
                  isEvent   ? "bg-emerald-50 dark:bg-emerald-950/20"  : "",
                  isWasted  ? "bg-red-50/50 dark:bg-red-950/10"        : "",
                  isHeartbeat ? "bg-zinc-50/50 dark:bg-zinc-800/20"   : "",
                )}
              >
                <div className="text-[10px] font-mono text-zinc-400 shrink-0">{step.time}</div>
                <div className={cn(
                  "text-[10px] font-mono truncate",
                  step.client
                    ? isEvent
                      ? "text-emerald-700 dark:text-emerald-300"
                      : isWasted
                      ? "text-red-500 dark:text-red-400"
                      : "text-zinc-600 dark:text-zinc-400"
                    : "text-transparent"
                )}>
                  {step.client || "."}
                  {isWasted && step.client && (
                    <span className="ml-1 text-[8px] text-red-400">← wasted</span>
                  )}
                </div>
                <div className={cn(
                  "text-[10px] font-mono truncate",
                  step.server
                    ? isEvent
                      ? "text-emerald-700 dark:text-emerald-300 font-semibold"
                      : isHeartbeat
                      ? "text-zinc-400 dark:text-zinc-600"
                      : "text-zinc-600 dark:text-zinc-400"
                    : "text-transparent"
                )}>
                  {step.server || "."}
                </div>
              </div>
            );
          })}

          {visibleSteps === 0 && (
            <div className="text-xs text-zinc-400 dark:text-zinc-600 italic py-4 text-center">
              Press Play to animate the timeline...
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePlayPause}
            className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            {playing ? "⏸ Pause" : isDone ? "↺ Replay" : "▶ Play"}
          </button>
          <button
            onClick={() => { setVisibleSteps(0); setPlaying(false); }}
            className="px-3 py-2 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all duration-200"
          >
            Reset
          </button>
        </div>

        {/* Network overhead comparison */}
        <div className="grid grid-cols-4 gap-2">
          {TABS.map((tab) => {
            const oh = OVERHEAD[tab.key];
            return (
              <div key={tab.key} className={cn("flex flex-col gap-1", pattern === tab.key ? "" : "opacity-50")}>
                <div className="text-[9px] text-zinc-400 font-medium truncate">{tab.label}</div>
                <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-500", oh.color)}
                    style={{ width: `${oh.value}%` }}
                  />
                </div>
                <div className={cn("text-[9px] font-semibold", oh.color.replace("bg-", "text-").replace("-500", "-600"))}>
                  {oh.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Key insight */}
        <div className="text-[10px] text-zinc-400 dark:text-zinc-500 bg-zinc-50 dark:bg-zinc-800/40 rounded-lg px-3 py-2">
          <strong className="text-zinc-600 dark:text-zinc-300">{TABS.find((t) => t.key === pattern)?.label}:</strong>{" "}
          {INSIGHTS[pattern]}
        </div>
      </div>
    </div>
  );
}
