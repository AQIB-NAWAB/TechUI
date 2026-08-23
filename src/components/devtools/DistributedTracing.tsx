"use client";

import { useState, useEffect, useRef } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { GitBranch, RefreshCw, Play, AlertTriangle, Clock } from "lucide-react";

export const DistributedTracingSchema = z.object({
  traceId: z.string().default("abc123"),
  totalMs: z.number().default(342),
  spans: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        service: z.string(),
        startMs: z.number(),
        durationMs: z.number(),
        parentId: z.string().optional(),
        status: z.enum(["ok", "error", "slow"]).optional().default("ok"),
      })
    )
    .default([
      { id: "1", name: "HTTP GET /checkout", service: "api-gateway", startMs: 0, durationMs: 342, status: "ok" },
      { id: "2", name: "auth.verify", service: "auth-service", startMs: 5, durationMs: 23, parentId: "1", status: "ok" },
      { id: "3", name: "cart.getItems", service: "cart-service", startMs: 30, durationMs: 89, parentId: "1", status: "ok" },
      { id: "4", name: "db.query orders", service: "cart-service", startMs: 35, durationMs: 78, parentId: "3", status: "slow" },
      { id: "5", name: "payment.charge", service: "payment-service", startMs: 125, durationMs: 189, parentId: "1", status: "ok" },
      { id: "6", name: "stripe.createCharge", service: "payment-service", startMs: 130, durationMs: 178, parentId: "5", status: "ok" },
      { id: "7", name: "email.sendReceipt", service: "email-service", startMs: 315, durationMs: 22, parentId: "1", status: "ok" },
    ]),
});

export type DistributedTracingProps = z.infer<typeof DistributedTracingSchema>;

type SpanDef = {
  id: string;
  name: string;
  service: string;
  startMs: number;
  durationMs: number;
  parentId?: string;
  status?: "ok" | "error" | "slow";
};

const STATUS_COLORS: Record<string, { bar: string; badge: string; text: string }> = {
  ok:    { bar: "bg-blue-500",  badge: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",  text: "text-blue-600 dark:text-blue-400" },
  slow:  { bar: "bg-amber-500", badge: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300", text: "text-amber-600 dark:text-amber-400" },
  error: { bar: "bg-red-500",   badge: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",   text: "text-red-600 dark:text-red-400" },
};

function buildDepthMap(spans: SpanDef[]): Map<string, number> {
  const depthMap = new Map<string, number>();
  function getDepth(id: string): number {
    if (depthMap.has(id)) return depthMap.get(id)!;
    const span = spans.find((s) => s.id === id);
    if (!span || !span.parentId) { depthMap.set(id, 0); return 0; }
    const d = getDepth(span.parentId) + 1;
    depthMap.set(id, d);
    return d;
  }
  spans.forEach((s) => getDepth(s.id));
  return depthMap;
}

export function DistributedTracing({
  traceId = "abc123",
  totalMs = 342,
  spans = [
    { id: "1", name: "HTTP GET /checkout", service: "api-gateway", startMs: 0, durationMs: 342, status: "ok" as const },
    { id: "2", name: "auth.verify", service: "auth-service", startMs: 5, durationMs: 23, parentId: "1", status: "ok" as const },
    { id: "3", name: "cart.getItems", service: "cart-service", startMs: 30, durationMs: 89, parentId: "1", status: "ok" as const },
    { id: "4", name: "db.query orders", service: "cart-service", startMs: 35, durationMs: 78, parentId: "3", status: "slow" as const },
    { id: "5", name: "payment.charge", service: "payment-service", startMs: 125, durationMs: 189, parentId: "1", status: "ok" as const },
    { id: "6", name: "stripe.createCharge", service: "payment-service", startMs: 130, durationMs: 178, parentId: "5", status: "ok" as const },
    { id: "7", name: "email.sendReceipt", service: "email-service", startMs: 315, durationMs: 22, parentId: "1", status: "ok" as const },
  ],
}: DistributedTracingProps) {
  const [visibleCount, setVisibleCount] = useState(spans.length);
  const [replaying, setReplaying] = useState(false);
  const [selectedSpan, setSelectedSpan] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sort spans by startMs for replay
  const sortedSpans = [...spans].sort((a, b) => a.startMs - b.startMs);
  const depthMap = buildDepthMap(spans);
  const visibleSpans = sortedSpans.slice(0, visibleCount);

  function replay() {
    if (replaying) return;
    setVisibleCount(0);
    setSelectedSpan(null);
    setReplaying(true);
  }

  useEffect(() => {
    if (!replaying) return;
    if (visibleCount >= sortedSpans.length) {
      setReplaying(false);
      return;
    }
    intervalRef.current = setTimeout(() => {
      setVisibleCount((c) => c + 1);
    }, 400);
    return () => { if (intervalRef.current) clearTimeout(intervalRef.current); };
  }, [replaying, visibleCount, sortedSpans.length]);

  function reset() {
    if (intervalRef.current) clearTimeout(intervalRef.current);
    setVisibleCount(spans.length);
    setReplaying(false);
    setSelectedSpan(null);
  }

  const shortTraceId = traceId.length > 12 ? traceId.slice(0, 12) + "…" : traceId;
  const selectedSpanDef = spans.find((s) => s.id === selectedSpan);

  const ticks = [0, 0.25, 0.5, 0.75, 1.0];

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <GitBranch className="size-3.5 text-zinc-400 shrink-0" />
        <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex-1">Distributed Tracing</span>
        <span className="text-[10px] font-mono text-zinc-400">trace: {shortTraceId}</span>
        <span className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-300 ml-2">{totalMs}ms total</span>
        <button onClick={reset} className="p-1 ml-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
          <RefreshCw className="size-3.5" />
        </button>
      </div>

      {/* Waterfall */}
      <div className="p-4 min-h-[280px]">
        {/* Column headers */}
        <div className="flex items-center gap-2 mb-2 text-[10px] text-zinc-400 font-semibold uppercase tracking-wide">
          <div className="w-24 shrink-0">Service</div>
          <div className="w-32 shrink-0">Span</div>
          <div className="flex-1" />
          <div className="w-10 text-right">ms</div>
        </div>

        {/* Spans */}
        <div className="space-y-1">
          {sortedSpans.map((span) => {
            const isVisible = visibleSpans.some((vs) => vs.id === span.id);
            const depth = depthMap.get(span.id) ?? 0;
            const leftPct = (span.startMs / totalMs) * 100;
            const widthPct = Math.max((span.durationMs / totalMs) * 100, 1.5);
            const status = span.status ?? "ok";
            const colors = STATUS_COLORS[status] ?? STATUS_COLORS.ok;
            const isSelected = selectedSpan === span.id;

            return (
              <button
                key={span.id}
                onClick={() => setSelectedSpan(isSelected ? null : span.id)}
                className={cn(
                  "w-full flex items-center gap-2 rounded-lg px-2 py-1.5 transition-all duration-300 text-left",
                  isVisible ? "opacity-100" : "opacity-0 pointer-events-none",
                  isSelected
                    ? "bg-zinc-100 dark:bg-zinc-800"
                    : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                )}
              >
                {/* Service label */}
                <div className="w-24 shrink-0">
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate block">{span.service}</span>
                </div>

                {/* Span name */}
                <div className="w-32 shrink-0" style={{ paddingLeft: `${depth * 8}px` }}>
                  <span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-200 truncate block">{span.name}</span>
                </div>

                {/* Waterfall bar */}
                <div className="flex-1 relative h-4 rounded overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className={cn("absolute top-0 h-full rounded transition-all duration-500", colors.bar)}
                    style={{
                      left: `${leftPct}%`,
                      width: `${widthPct}%`,
                    }}
                  />
                  {status === "slow" && (
                    <div
                      className="absolute top-0 h-full flex items-center"
                      style={{ left: `${leftPct + widthPct / 2}%`, transform: "translateX(-50%)" }}
                    >
                      <AlertTriangle className="size-2.5 text-amber-300" />
                    </div>
                  )}
                  {status === "error" && (
                    <div
                      className="absolute top-0 h-full flex items-center"
                      style={{ left: `${leftPct + widthPct / 2}%`, transform: "translateX(-50%)" }}
                    >
                      <span className="text-[9px] text-red-200 font-bold">✗</span>
                    </div>
                  )}
                </div>

                {/* Duration */}
                <div className={cn("w-10 text-right text-[10px] font-mono shrink-0", colors.text)}>
                  {span.durationMs}ms
                </div>
              </button>
            );
          })}
        </div>

        {/* Tick marks */}
        <div className="mt-2 flex items-center gap-2">
          <div className="w-24 shrink-0" />
          <div className="w-32 shrink-0" />
          <div className="flex-1 flex justify-between text-[9px] font-mono text-zinc-400">
            {ticks.map((t) => (
              <span key={t}>{Math.round(t * totalMs)}ms</span>
            ))}
          </div>
          <div className="w-10" />
        </div>

        {/* Selected span detail */}
        {selectedSpanDef && (
          <div className="mt-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/40 p-3 transition-all duration-300">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-200">{selectedSpanDef.name}</span>
              <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-semibold", STATUS_COLORS[selectedSpanDef.status ?? "ok"].badge)}>
                {selectedSpanDef.status ?? "ok"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[10px]">
              <div className="text-zinc-500">Service</div>
              <div className="font-mono text-zinc-700 dark:text-zinc-300">{selectedSpanDef.service}</div>
              <div className="text-zinc-500">Start</div>
              <div className="font-mono text-zinc-700 dark:text-zinc-300">{selectedSpanDef.startMs}ms</div>
              <div className="text-zinc-500">Duration</div>
              <div className="font-mono text-zinc-700 dark:text-zinc-300">{selectedSpanDef.durationMs}ms</div>
              <div className="text-zinc-500">End</div>
              <div className="font-mono text-zinc-700 dark:text-zinc-300">{selectedSpanDef.startMs + selectedSpanDef.durationMs}ms</div>
              {selectedSpanDef.parentId && (
                <>
                  <div className="text-zinc-500">Parent</div>
                  <div className="font-mono text-zinc-700 dark:text-zinc-300">
                    {spans.find((s) => s.id === selectedSpanDef.parentId)?.name ?? selectedSpanDef.parentId}
                  </div>
                </>
              )}
            </div>
            {selectedSpanDef.status === "slow" && (
              <div className="mt-2 flex items-center gap-1.5 text-[10px] text-amber-600 dark:text-amber-400">
                <Clock className="size-3" />
                This span is slow — likely a bottleneck. Check database query plans or indexes.
              </div>
            )}
            {selectedSpanDef.status === "error" && (
              <div className="mt-2 flex items-center gap-1.5 text-[10px] text-red-600 dark:text-red-400">
                <AlertTriangle className="size-3" />
                Error span — check service logs for this trace ID.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900/30 flex items-center gap-3">
        <button
          onClick={replay}
          disabled={replaying}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200",
            replaying
              ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
              : "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90"
          )}
        >
          <Play className="size-3" />
          {replaying ? "Replaying…" : "Replay"}
        </button>
        <div className="flex gap-3 text-[10px] text-zinc-400">
          <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-blue-500 inline-block" /> ok</span>
          <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-amber-500 inline-block" /> slow</span>
          <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-red-500 inline-block" /> error</span>
        </div>
        <span className="ml-auto text-[10px] text-zinc-400">click a span for details</span>
      </div>
    </div>
  );
}
