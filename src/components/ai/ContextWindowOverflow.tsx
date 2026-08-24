"use client";

import { useState, useMemo } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { AlertTriangle, RefreshCw, Scissors, Layers } from "lucide-react";

export const ContextWindowOverflowSchema = z.object({
  title: z.string().optional().default("Context Window Overflow"),
  contextWindow: z.number().int().min(100).max(200000).optional().default(4096),
  strategy: z.enum(["truncate-oldest", "truncate-middle", "summarize"]).optional().default("truncate-oldest"),
  systemTokens: z.number().int().min(0).optional().default(120),
  interactive: z.boolean().optional().default(true),
});

export type ContextWindowOverflowProps = z.infer<typeof ContextWindowOverflowSchema>;

type Segment = { id: string; label: string; tokens: number; type: "system" | "user" | "assistant" | "tool" };

const DEFAULT_MESSAGES: Segment[] = [
  { id: "sys", label: "System prompt", tokens: 120, type: "system" },
  { id: "u1", label: "User: project overview", tokens: 340, type: "user" },
  { id: "a1", label: "Assistant: architecture summary", tokens: 520, type: "assistant" },
  { id: "u2", label: "User: API design questions", tokens: 280, type: "user" },
  { id: "a2", label: "Assistant: REST vs GraphQL", tokens: 610, type: "assistant" },
  { id: "u3", label: "User: database schema", tokens: 410, type: "user" },
  { id: "a3", label: "Assistant: ER diagram walkthrough", tokens: 780, type: "assistant" },
  { id: "u4", label: "User: auth flow details", tokens: 350, type: "user" },
  { id: "a4", label: "Assistant: OAuth + JWT", tokens: 690, type: "assistant" },
  { id: "u5", label: "User: deployment checklist", tokens: 290, type: "user" },
];

const TYPE_COLORS = {
  system: "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-600",
  user: "bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  assistant: "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  tool: "bg-violet-100 dark:bg-violet-950/50 text-violet-800 dark:text-violet-300 border-violet-200 dark:border-violet-800",
};

const STRATEGY_LABELS = {
  "truncate-oldest": "Truncate oldest",
  "truncate-middle": "Truncate middle",
  summarize: "Summarize & compress",
};

function applyStrategy(segments: Segment[], limit: number, strategy: ContextWindowOverflowProps["strategy"]): {
  kept: Segment[];
  dropped: Segment[];
  summarized: boolean;
} {
  const total = segments.reduce((s, seg) => s + seg.tokens, 0);
  if (total <= limit) return { kept: segments, dropped: [], summarized: false };

  if (strategy === "summarize") {
    const system = segments.filter((s) => s.type === "system");
    const rest = segments.filter((s) => s.type !== "system");
    const systemTokens = system.reduce((s, seg) => s + seg.tokens, 0);
    const budget = limit - systemTokens - 200;
    let used = 0;
    const kept: Segment[] = [...system];
    const dropped: Segment[] = [];
    for (let i = rest.length - 1; i >= 0; i--) {
      if (used + rest[i].tokens <= budget) {
        kept.unshift(rest[i]);
        used += rest[i].tokens;
      } else {
        dropped.unshift(rest[i]);
      }
    }
    if (dropped.length > 0) {
      const summaryTokens = Math.min(200, dropped.reduce((s, seg) => s + seg.tokens, 0));
      kept.splice(system.length, 0, {
        id: "summary",
        label: `Summary of ${dropped.length} earlier turns`,
        tokens: summaryTokens,
        type: "tool",
      });
    }
    return { kept, dropped, summarized: dropped.length > 0 };
  }

  if (strategy === "truncate-middle") {
    const system = segments.filter((s) => s.type === "system");
    const rest = segments.filter((s) => s.type !== "system");
    const systemTokens = system.reduce((s, seg) => s + seg.tokens, 0);
    let budget = limit - systemTokens;
    const kept: Segment[] = [...system];
    const dropped: Segment[] = [];
    const fromStart: Segment[] = [];
    const fromEnd: Segment[] = [];
    let startIdx = 0;
    let endIdx = rest.length - 1;
    while (startIdx <= endIdx && budget > 0) {
      if (fromStart.length <= fromEnd.length && rest[startIdx].tokens <= budget) {
        fromStart.push(rest[startIdx]);
        budget -= rest[startIdx].tokens;
        startIdx++;
      } else if (rest[endIdx].tokens <= budget) {
        fromEnd.unshift(rest[endIdx]);
        budget -= rest[endIdx].tokens;
        endIdx--;
      } else {
        break;
      }
    }
    for (let i = startIdx; i <= endIdx; i++) dropped.push(rest[i]);
    kept.push(...fromStart, ...fromEnd);
    return { kept, dropped, summarized: false };
  }

  // truncate-oldest (keep system + newest)
  const system = segments.filter((s) => s.type === "system");
  const rest = segments.filter((s) => s.type !== "system");
  const systemTokens = system.reduce((s, seg) => s + seg.tokens, 0);
  let budget = limit - systemTokens;
  const kept: Segment[] = [...system];
  const dropped: Segment[] = [];
  for (let i = rest.length - 1; i >= 0; i--) {
    if (rest[i].tokens <= budget) {
      kept.unshift(rest[i]);
      budget -= rest[i].tokens;
    } else {
      dropped.unshift(rest[i]);
    }
  }
  return { kept, dropped, summarized: false };
}

export function ContextWindowOverflow({
  title = "Context Window Overflow",
  contextWindow = 4096,
  strategy = "truncate-oldest",
  systemTokens = 120,
  interactive = true,
}: ContextWindowOverflowProps) {
  const [extraTurns, setExtraTurns] = useState(0);
  const [flash, setFlash] = useState<"overflow" | "ok" | null>(null);

  const segments = useMemo(() => {
    const base = DEFAULT_MESSAGES.map((s) =>
      s.type === "system" ? { ...s, tokens: systemTokens } : s
    );
    const extras: Segment[] = [];
    for (let i = 0; i < extraTurns; i++) {
      extras.push(
        { id: `eu${i}`, label: `User: follow-up #${i + 1}`, tokens: 320 + (i % 3) * 80, type: "user" },
        { id: `ea${i}`, label: `Assistant: detailed reply #${i + 1}`, tokens: 540 + (i % 4) * 100, type: "assistant" }
      );
    }
    return [...base, ...extras];
  }, [extraTurns, systemTokens]);

  const totalTokens = segments.reduce((s, seg) => s + seg.tokens, 0);
  const { kept, dropped, summarized } = applyStrategy(segments, contextWindow, strategy);
  const usedTokens = kept.reduce((s, seg) => s + seg.tokens, 0);
  const fillPct = Math.min(100, (totalTokens / contextWindow) * 100);
  const isOverflow = totalTokens > contextWindow;

  const barColor = fillPct >= 100 ? "bg-red-500" : fillPct >= 85 ? "bg-amber-500" : fillPct >= 70 ? "bg-yellow-500" : "bg-emerald-500";
  const fillLabel = fillPct >= 100 ? "text-red-600 dark:text-red-400" : fillPct >= 85 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400";

  function addTurn() {
    setExtraTurns((n) => n + 1);
    const nextTotal = totalTokens + 320 + 540;
    setFlash(nextTotal > contextWindow ? "overflow" : "ok");
    setTimeout(() => setFlash(null), 700);
  }

  function reset() {
    setExtraTurns(0);
    setFlash(null);
  }

  return (
    <div
      className={cn(
        "rounded-xl border bg-white dark:bg-zinc-950 overflow-hidden transition-all duration-500",
        flash === "overflow" ? "border-red-300 dark:border-red-800" : "border-zinc-200 dark:border-zinc-800"
      )}
    >
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/50">
        <Layers className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">{title}</span>
        <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
          {STRATEGY_LABELS[strategy]}
        </span>
        {interactive && (
          <button onClick={reset} className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all duration-500">
            <RefreshCw className="size-3.5" />
          </button>
        )}
      </div>

      <div className="p-4 min-h-[220px] space-y-4">
        {/* Context bar */}
        <div>
          <div className="flex justify-between text-[10px] mb-1">
            <span className="text-zinc-400">Context usage</span>
            <span className={cn("font-mono font-semibold", fillLabel)}>
              {totalTokens.toLocaleString()} / {contextWindow.toLocaleString()} tokens
              {isOverflow && " — OVERFLOW"}
            </span>
          </div>
          <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden relative">
            <div
              className={cn("h-full rounded-full transition-all duration-500", barColor)}
              style={{ width: `${Math.min(100, fillPct)}%` }}
            />
            {isOverflow && (
              <div
                className="absolute top-0 h-full bg-red-500/30 border-l-2 border-red-500"
                style={{ left: `${(contextWindow / totalTokens) * 100}%`, width: `${100 - (contextWindow / totalTokens) * 100}%` }}
              />
            )}
          </div>
          <div className="flex justify-between text-[9px] text-zinc-400 mt-1">
            <span>0</span>
            <span>{Math.round(contextWindow * 0.7).toLocaleString()} (70%)</span>
            <span>{Math.round(contextWindow * 0.85).toLocaleString()} (85%)</span>
            <span>{contextWindow.toLocaleString()}</span>
          </div>
        </div>

        {/* Segments */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-3">
            <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide mb-2">
              Kept ({usedTokens.toLocaleString()} tokens)
            </div>
            <div className="space-y-1 max-h-[120px] overflow-y-auto">
              {kept.map((seg) => (
                <div
                  key={seg.id}
                  className={cn(
                    "text-[10px] px-2 py-1 rounded border truncate transition-all duration-500",
                    TYPE_COLORS[seg.type]
                  )}
                >
                  {seg.label} · {seg.tokens}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-3">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-wide mb-2">
              {dropped.length > 0 ? (
                <>
                  <Scissors className="size-3 text-red-400" />
                  Dropped ({dropped.reduce((s, seg) => s + seg.tokens, 0).toLocaleString()} tokens)
                </>
              ) : (
                "Nothing dropped"
              )}
            </div>
            <div className="space-y-1 max-h-[120px] overflow-y-auto">
              {dropped.length === 0 && (
                <div className="text-[10px] text-zinc-400 italic">All messages fit in the window.</div>
              )}
              {dropped.map((seg) => (
                <div
                  key={seg.id}
                  className="text-[10px] px-2 py-1 rounded border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 truncate line-through opacity-70 transition-all duration-500"
                >
                  {seg.label} · {seg.tokens}
                </div>
              ))}
              {summarized && (
                <div className="text-[10px] px-2 py-1 rounded border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400">
                  Earlier turns compressed into summary block
                </div>
              )}
            </div>
          </div>
        </div>

        {isOverflow && (
          <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40">
            <AlertTriangle className="size-3.5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-700 dark:text-amber-400">
              Input exceeds {contextWindow.toLocaleString()}-token limit. Strategy <strong>{STRATEGY_LABELS[strategy]}</strong> removes{" "}
              {dropped.length} segment{dropped.length !== 1 ? "s" : ""} before the model call.
            </p>
          </div>
        )}
      </div>

      {interactive && (
        <div className="border-t border-zinc-100 dark:border-zinc-900 px-4 py-3 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/30">
          <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">
            {flash === "overflow"
              ? "Context overflow! Older messages are evicted per strategy."
              : "Add conversation turns until the context window overflows."}
          </span>
          <button
            onClick={addTurn}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-500 shrink-0 hover:opacity-90",
              flash === "overflow"
                ? "bg-red-500 text-white"
                : "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
            )}
          >
            Add Turn
          </button>
        </div>
      )}
    </div>
  );
}
