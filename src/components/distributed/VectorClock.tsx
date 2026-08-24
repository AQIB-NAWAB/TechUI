"use client";

import { useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Clock, Server, ArrowRight } from "lucide-react";

export const VectorClockSchema = z.object({
  title: z.string().optional().default("Vector Clock"),
  nodeCount: z.number().int().min(2).max(4).optional().default(3),
  interactive: z.boolean().optional().default(true),
});

export type VectorClockProps = z.infer<typeof VectorClockSchema>;

type Event = {
  id: number;
  node: number;
  clock: number[];
  label: string;
  kind: "local" | "send" | "receive";
};

type Relation = "before" | "after" | "concurrent" | null;

function compare(a: number[], b: number[]): Relation {
  let aLess = false;
  let bLess = false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] < b[i]) aLess = true;
    if (b[i] < a[i]) bLess = true;
  }
  if (aLess && !bLess) return "before";
  if (bLess && !aLess) return "after";
  if (!aLess && !bLess) return null;
  return "concurrent";
}

function merge(a: number[], b: number[]): number[] {
  return a.map((v, i) => Math.max(v, b[i]));
}

const NODE_STYLES = [
  { bg: "bg-blue-50 dark:bg-blue-950/40", border: "border-blue-300 dark:border-blue-700", text: "text-blue-700 dark:text-blue-300", dot: "bg-blue-500" },
  { bg: "bg-violet-50 dark:bg-violet-950/40", border: "border-violet-300 dark:border-violet-700", text: "text-violet-700 dark:text-violet-300", dot: "bg-violet-500" },
  { bg: "bg-emerald-50 dark:bg-emerald-950/40", border: "border-emerald-300 dark:border-emerald-700", text: "text-emerald-700 dark:text-emerald-300", dot: "bg-emerald-500" },
  { bg: "bg-amber-50 dark:bg-amber-950/40", border: "border-amber-300 dark:border-amber-700", text: "text-amber-700 dark:text-amber-300", dot: "bg-amber-500" },
];

const RELATION_STYLES = {
  before: { bg: "bg-emerald-50 dark:bg-emerald-950", border: "border-emerald-200 dark:border-emerald-800", text: "text-emerald-700 dark:text-emerald-400", label: "A happened first", icon: "→" },
  after: { bg: "bg-emerald-50 dark:bg-emerald-950", border: "border-emerald-200 dark:border-emerald-800", text: "text-emerald-700 dark:text-emerald-400", label: "B happened first", icon: "←" },
  concurrent: { bg: "bg-amber-50 dark:bg-amber-950", border: "border-amber-200 dark:border-amber-800", text: "text-amber-700 dark:text-amber-400", label: "Neither caused the other", icon: "⟂" },
  none: { bg: "bg-blue-50 dark:bg-blue-950", border: "border-blue-200 dark:border-blue-800", text: "text-blue-700 dark:text-blue-400", label: "Run another event to compare", icon: "—" },
};

let _eventId = 0;
let _step = 0;

export function VectorClock({
  title = "Vector Clock",
  nodeCount = 3,
  interactive = true,
}: VectorClockProps) {
  const [clocks, setClocks] = useState<number[][]>(() =>
    Array.from({ length: nodeCount }, () => Array(nodeCount).fill(0))
  );
  const [events, setEvents] = useState<Event[]>([]);
  const [animating, setAnimating] = useState(false);
  const [activeNode, setActiveNode] = useState<number | null>(null);

  const labels = Array.from({ length: nodeCount }, (_, i) => String.fromCharCode(65 + i));

  const lastTwo = events.slice(-2);
  let relation: Relation = null;
  if (lastTwo.length >= 2) {
    relation = compare(lastTwo[0].clock, lastTwo[1].clock);
  }

  const relStyle = relation === "before" || relation === "after"
    ? RELATION_STYLES[relation]
    : relation === "concurrent"
      ? RELATION_STYLES.concurrent
      : RELATION_STYLES.none;

  function simulateNext() {
    if (animating || !interactive) return;
    setAnimating(true);

    const step = _step % (nodeCount * 2);
    _step += 1;

    if (step < nodeCount) {
      const nodeIdx = step;
      setActiveNode(nodeIdx);
      setClocks((prev) => {
        const next = prev.map((c) => [...c]);
        next[nodeIdx][nodeIdx] += 1;
        setEvents((evts) => [
          ...evts,
          { id: ++_eventId, node: nodeIdx, clock: [...next[nodeIdx]], label: `Node ${labels[nodeIdx]} did something locally`, kind: "local" },
        ]);
        return next;
      });
      setTimeout(() => {
        setActiveNode(null);
        setAnimating(false);
      }, 1200);
    } else {
      const from = (step - nodeCount) % nodeCount;
      const to = (from + 1) % nodeCount;
      setActiveNode(from);
      setTimeout(() => setActiveNode(to), 600);

      setClocks((prev) => {
        const next = prev.map((c) => [...c]);
        next[from][from] += 1;
        const sent = [...next[from]];
        next[to] = merge(next[to], sent);
        next[to][to] += 1;
        const recv = [...next[to]];

        setEvents((evts) => [
          ...evts,
          { id: ++_eventId, node: from, clock: sent, label: `Node ${labels[from]} sent a message`, kind: "send" },
          { id: ++_eventId, node: to, clock: recv, label: `Node ${labels[to]} received it`, kind: "receive" },
        ]);
        return next;
      });

      setTimeout(() => {
        setActiveNode(null);
        setAnimating(false);
      }, 1200);
    }
  }

  const lastEvent = events[events.length - 1];

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <Clock className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">{title}</span>
        <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
          {nodeCount} servers
        </span>
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        Servers track who did what — green means one event caused another, amber means they happened independently.
      </p>

      <div className="p-4 min-h-[240px] flex flex-col gap-4">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {labels.map((label, i) => {
            const style = NODE_STYLES[i % NODE_STYLES.length];
            const isActive = activeNode === i;
            const maxTick = Math.max(...clocks[i]);
            return (
              <div key={label} className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-lg border p-3 min-w-[88px] transition-all duration-700",
                    style.bg, style.border,
                    isActive && "scale-110 ring-2 ring-zinc-400 dark:ring-zinc-500 shadow-md"
                  )}
                >
                  <Server className={cn("size-5", style.text)} />
                  <span className={cn("text-[10px] font-semibold", style.text)}>Server {label}</span>
                  <div className="flex gap-1">
                    {clocks[i].map((tick, j) => (
                      <span
                        key={j}
                        className={cn(
                          "size-2.5 rounded-full transition-all duration-500",
                          tick > 0 ? style.dot : "bg-zinc-200 dark:bg-zinc-700",
                          tick === maxTick && tick > 0 && isActive && "scale-150"
                        )}
                        title={`${labels[j]}: ${tick}`}
                      />
                    ))}
                  </div>
                  <span className="text-[9px] text-zinc-400 font-mono">{clocks[i].join("·")}</span>
                </div>
                {i < nodeCount - 1 && (
                  <ArrowRight className={cn(
                    "size-4 shrink-0 transition-all duration-500",
                    activeNode === i ? "text-emerald-500" : "text-zinc-300 dark:text-zinc-600"
                  )} />
                )}
              </div>
            );
          })}
        </div>

        <div className={cn(
          "rounded-lg border p-4 min-h-[100px] transition-all duration-700 flex flex-col items-center justify-center text-center",
          relStyle.bg, relStyle.border
        )}>
          <div className={cn("text-2xl font-bold mb-1 transition-all duration-500", relStyle.text)}>
            {relStyle.icon}
          </div>
          <div className={cn("text-sm font-semibold mb-1", relStyle.text)}>
            {relation === "before"
              ? "Event A caused Event B"
              : relation === "after"
                ? "Event B caused Event A"
                : relation === "concurrent"
                  ? "Events happened at the same time"
                  : "Waiting for events…"}
          </div>
          <p className={cn("text-xs opacity-80", relStyle.text)}>{relStyle.label}</p>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-100 dark:border-zinc-800 p-3 min-h-[56px]">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-1.5">Latest event</div>
          {lastEvent ? (
            <div className={cn(
              "text-xs font-medium transition-all duration-500",
              NODE_STYLES[lastEvent.node % NODE_STYLES.length].text
            )}>
              {lastEvent.label}
            </div>
          ) : (
            <span className="text-xs text-zinc-400 italic">No events yet — click below to simulate</span>
          )}
        </div>
      </div>

      {interactive && (
        <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/30 min-h-[52px]">
          <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">
            {animating
              ? "Simulating event across servers…"
              : events.length === 0
                ? "Each click simulates a local action or message between servers"
                : `${events.length} events recorded — keep going to see causality change`}
          </span>
          <button
            type="button"
            onClick={simulateNext}
            disabled={animating}
            className={cn(
              "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-all duration-500 shrink-0",
              animating && "opacity-60 cursor-not-allowed"
            )}
          >
            {animating ? "Running…" : "Simulate Event"}
          </button>
        </div>
      )}
    </div>
  );
}
