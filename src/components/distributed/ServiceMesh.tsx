"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Server, Cpu, Shield, Lock, XCircle, CheckCircle } from "lucide-react";

const ServiceSchema = z.object({
  id: z.string(),
  name: z.string(),
  replicas: z.number().optional().default(1),
  healthy: z.boolean().optional().default(true),
});

const TrafficFlowSchema = z.object({
  from: z.string(),
  to: z.string(),
  rps: z.number().optional(),
  errorRate: z.number().optional().default(0),
  latencyMs: z.number().optional(),
});

export const ServiceMeshSchema = z.object({
  title: z.string().optional().default("Service Mesh"),
  services: z.array(ServiceSchema),
  flows: z.array(TrafficFlowSchema),
  mtls: z.boolean().optional().default(true),
  interactive: z.boolean().optional().default(true),
});

export type ServiceMeshProps = z.infer<typeof ServiceMeshSchema>;

type TrafficEntry = {
  id: string;
  from: string;
  to: string;
  ok: boolean;
  ms: number;
};

let _seq = 0;
function uid() { return String(++_seq); }

function latencyColor(ms: number) {
  if (ms < 50) return "text-emerald-600 dark:text-emerald-400";
  if (ms < 200) return "text-amber-500 dark:text-amber-400";
  return "text-red-500 dark:text-red-400";
}

function rpsToStroke(rps?: number) {
  if (!rps) return 1;
  if (rps < 50) return 1;
  if (rps < 150) return 2;
  return 3;
}

export function ServiceMesh({
  title = "Service Mesh",
  services,
  flows,
  mtls = true,
  interactive = true,
}: ServiceMeshProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [log, setLog] = useState<TrafficEntry[]>([]);
  const [simulating, setSimulating] = useState(false);
  const [activeFlowIdx, setActiveFlowIdx] = useState<number | null>(null);
  const [dotProgress, setDotProgress] = useState(0);
  const boxRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<{ from: string; to: string; x1: number; y1: number; x2: number; y2: number }[]>([]);

  const measureLines = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const newLines = flows.map((flow) => {
      const fromEl = boxRefs.current[flow.from];
      const toEl = boxRefs.current[flow.to];
      if (!fromEl || !toEl) return null;
      const fr = fromEl.getBoundingClientRect();
      const tr = toEl.getBoundingClientRect();
      return {
        from: flow.from,
        to: flow.to,
        x1: fr.right - rect.left,
        y1: (fr.top + fr.height / 2) - rect.top,
        x2: tr.left - rect.left,
        y2: (tr.top + tr.height / 2) - rect.top,
      };
    }).filter(Boolean) as typeof lines;
    setLines(newLines);
  }, [flows]);

  useEffect(() => {
    const timer = setTimeout(measureLines, 50);
    const observer = new ResizeObserver(measureLines);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => { clearTimeout(timer); observer.disconnect(); };
  }, [measureLines, services]);

  const selectedFlows = selected
    ? flows.filter((f) => f.from === selected || f.to === selected)
    : [];

  async function simulate() {
    if (simulating) return;
    setSimulating(true);
    for (let i = 0; i < flows.length; i++) {
      const flow = flows[i]!;
      setActiveFlowIdx(i);
      setDotProgress(0);
      await new Promise((r) => setTimeout(r, 100));
      setDotProgress(50);
      await new Promise((r) => setTimeout(r, 1200));
      setDotProgress(100);

      const errorRate = flow.errorRate ?? 0;
      const ok = Math.random() > errorRate;
      const latency = flow.latencyMs
        ? Math.round(flow.latencyMs * (0.8 + Math.random() * 0.4))
        : Math.round(5 + Math.random() * 40);
      setLog((prev) => [
        { id: uid(), from: flow.from, to: flow.to, ok, ms: latency },
        ...prev,
      ].slice(0, 16));
      await new Promise((r) => setTimeout(r, 1200));
    }
    setActiveFlowIdx(null);
    setDotProgress(0);
    setSimulating(false);
  }

  const svc = (id: string) => services.find((s) => s.id === id);

  const svgWidth = containerRef.current?.offsetWidth ?? 600;
  const svgHeight = containerRef.current?.offsetHeight ?? 300;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden text-sm">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/40">
        <Server className="size-3.5 text-zinc-400 shrink-0" />
        <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex-1">{title}</span>
        {mtls && (
          <span className="flex items-center gap-1 text-[10px] font-mono text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.5 rounded">
            <Lock className="size-2.5" />
            mTLS
          </span>
        )}
        {interactive && (
          <button
            onClick={simulate}
            disabled={simulating}
            className={cn(
              "text-[11px] px-2.5 py-1 rounded font-semibold transition-colors",
              simulating
                ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
                : "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-90"
            )}
          >
            {simulating ? "Sending…" : "Send traffic"}
          </button>
        )}
      </div>

      <div className="grid grid-cols-[1fr_auto] divide-x divide-zinc-100 dark:divide-zinc-900">
        {/* Service grid + SVG overlay */}
        <div className="p-4 relative min-h-[240px]" ref={containerRef}>
          {/* SVG connection lines */}
          {lines.length > 0 && (
            <svg
              className="absolute inset-0 pointer-events-none"
              width={svgWidth}
              height={svgHeight}
              style={{ zIndex: 0 }}
            >
              <defs>
                <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 z" className="fill-zinc-300 dark:fill-zinc-700" />
                </marker>
                <marker id="arrow-active" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 z" className="fill-blue-400" />
                </marker>
                <marker id="arrow-unhealthy" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 z" className="fill-red-400" />
                </marker>
              </defs>
              {lines.map((line, i) => {
                const flow = flows[i];
                if (!flow) return null;
                const fromSvc = svc(flow.from);
                const toSvc = svc(flow.to);
                const isUnhealthy = !fromSvc?.healthy || !toSvc?.healthy;
                const isSelected = selected && (flow.from === selected || flow.to === selected);
                const isActive = activeFlowIdx === i;
                const strokeW = rpsToStroke(flow.rps);
                const cx1 = line.x1 + (line.x2 - line.x1) * 0.4;
                const cx2 = line.x1 + (line.x2 - line.x1) * 0.6;
                const pathD = `M ${line.x1} ${line.y1} C ${cx1} ${line.y1} ${cx2} ${line.y2} ${line.x2} ${line.y2}`;
                const t = dotProgress / 100;
                const dotX = (1 - t) ** 3 * line.x1 + 3 * (1 - t) ** 2 * t * cx1 + 3 * (1 - t) * t ** 2 * cx2 + t ** 3 * line.x2;
                const dotY = (1 - t) ** 3 * line.y1 + 3 * (1 - t) ** 2 * t * line.y1 + 3 * (1 - t) * t ** 2 * line.y2 + t ** 3 * line.y2;

                return (
                  <g key={i}>
                    <path
                      d={pathD}
                      fill="none"
                      strokeWidth={strokeW}
                      strokeDasharray={isUnhealthy ? "4 3" : undefined}
                      className={cn(
                        "transition-all duration-500",
                        isActive
                          ? "stroke-blue-400 dark:stroke-blue-500"
                          : isSelected
                          ? "stroke-blue-400 dark:stroke-blue-500"
                          : isUnhealthy
                          ? "stroke-red-300 dark:stroke-red-700"
                          : mtls
                          ? "stroke-amber-400 dark:stroke-amber-600"
                          : !selected ? "stroke-zinc-300 dark:stroke-zinc-700" : "stroke-zinc-200 dark:stroke-zinc-800 opacity-30"
                      )}
                      markerEnd={isActive || isSelected ? "url(#arrow-active)" : isUnhealthy ? "url(#arrow-unhealthy)" : "url(#arrow)"}
                    />
                    {isActive && (
                      <circle cx={dotX} cy={dotY} r="4" className="fill-blue-500 transition-all duration-500" />
                    )}
                    {mtls && !isUnhealthy && (
                      <circle cx={(line.x1 + line.x2) / 2} cy={(line.y1 + line.y2) / 2 - 8} r="6" className="fill-white dark:fill-zinc-950 stroke-amber-400" strokeWidth="1" />
                    )}
                  </g>
                );
              })}
            </svg>
          )}

          {/* Service boxes */}
          <div className="flex flex-wrap gap-3 relative z-10">
            {services.map((svcItem) => {
              const isSelected = selected === svcItem.id;
              const relatedFlow = selectedFlows.some((f) => f.from === svcItem.id || f.to === svcItem.id);
              const isWorker = svcItem.replicas > 1;

              return (
                <button
                  key={svcItem.id}
                  ref={(el) => { boxRefs.current[svcItem.id] = el as HTMLDivElement | null; }}
                  onClick={() => setSelected(isSelected ? null : svcItem.id)}
                  className={cn(
                    "flex flex-col items-start gap-1.5 rounded-xl border-2 px-3 py-2.5 text-left transition-all duration-500 min-w-[120px] relative bg-white dark:bg-zinc-950",
                    isSelected
                      ? "border-blue-400 dark:border-blue-600 bg-blue-50 dark:bg-blue-950/20 shadow-md"
                      : relatedFlow
                      ? "border-zinc-300 dark:border-zinc-700"
                      : !svcItem.healthy
                      ? "border-red-300 dark:border-red-700 bg-red-50/30 dark:bg-red-950/10"
                      : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                  )}
                >
                  {/* Shield badge (sidecar proxy) */}
                  <div className="absolute -top-1.5 -right-1.5 size-4 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center">
                    <Shield className="size-2.5 text-zinc-400 dark:text-zinc-500" />
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isWorker
                      ? <Cpu className={cn("size-4", svcItem.healthy ? "text-emerald-500" : "text-red-500")} />
                      : <Server className={cn("size-4", svcItem.healthy ? "text-emerald-500" : "text-red-500")} />
                    }
                    {!svcItem.healthy && (
                      <XCircle className="size-3 text-red-500 shrink-0" />
                    )}
                    {svcItem.healthy && isSelected && (
                      <CheckCircle className="size-3 text-emerald-500 shrink-0" />
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className={cn(
                      "size-1.5 rounded-full shrink-0",
                      svcItem.healthy ? "bg-emerald-500" : "bg-red-500 animate-pulse"
                    )} />
                    <span className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200">{svcItem.name}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    {(svcItem.replicas ?? 1) > 1 && (
                      <span className="text-[9px] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1 rounded">
                        ×{svcItem.replicas}
                      </span>
                    )}
                    {!svcItem.healthy && (
                      <span className="text-[9px] font-semibold text-red-600 dark:text-red-400">unhealthy</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected service flows */}
          {selected && selectedFlows.length > 0 && (
            <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-900">
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider mb-2">
                Traffic flows — {svc(selected)?.name}
              </div>
              <div className="space-y-1.5">
                {selectedFlows.map((flow, i) => {
                  const direction = flow.from === selected ? "outbound" : "inbound";
                  const peer = direction === "outbound" ? flow.to : flow.from;
                  const peerSvc = svc(peer);
                  return (
                    <div key={i} className="flex items-center gap-2 text-[11px]">
                      <span className={cn(
                        "text-[9px] font-mono px-1.5 py-0.5 rounded border",
                        direction === "outbound"
                          ? "text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                          : "text-zinc-500 border-zinc-200 dark:border-zinc-700"
                      )}>
                        {direction === "outbound" ? "→ out" : "← in"}
                      </span>
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">{peerSvc?.name ?? peer}</span>
                      {flow.rps !== undefined && <span className="text-zinc-400">{flow.rps} rps</span>}
                      {flow.errorRate !== undefined && flow.errorRate > 0 && (
                        <span className="text-amber-600 dark:text-amber-400">{(flow.errorRate * 100).toFixed(0)}% err</span>
                      )}
                      {flow.latencyMs !== undefined && <span className="text-zinc-400">{flow.latencyMs}ms</span>}
                      {mtls && <Lock className="size-2.5 text-amber-500 shrink-0" />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Flows summary */}
          {!selected && (
            <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-900">
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider mb-1.5">All flows</div>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {flows.map((flow, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">{svc(flow.from)?.name ?? flow.from}</span>
                    <span className="text-zinc-300 dark:text-zinc-600">→</span>
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">{svc(flow.to)?.name ?? flow.to}</span>
                    {flow.rps !== undefined && <span className="text-zinc-400">{flow.rps}rps</span>}
                    {flow.errorRate !== undefined && flow.errorRate > 0 && (
                      <span className="text-red-500">{(flow.errorRate * 100).toFixed(0)}%err</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Traffic log */}
        <div className="w-48 p-3 flex flex-col gap-0">
          <div className="text-[10px] text-zinc-400 uppercase tracking-wider mb-2 font-semibold">Request log</div>
          {log.length === 0 ? (
            <div className="text-[11px] text-zinc-300 dark:text-zinc-700 italic">No traffic yet</div>
          ) : (
            <div className="space-y-1 overflow-y-auto max-h-52">
              {log.map((entry) => (
                <div key={entry.id} className="flex items-center gap-1.5 text-[10px]">
                  <span className={cn("size-1.5 rounded-full shrink-0", entry.ok ? "bg-emerald-500" : "bg-red-500")} />
                  <span className="text-zinc-500 dark:text-zinc-400 truncate flex-1 min-w-0">
                    {svc(entry.from)?.name ?? entry.from} → {svc(entry.to)?.name ?? entry.to}
                  </span>
                  <span className={cn("ml-auto shrink-0 font-mono text-[9px]", latencyColor(entry.ms))}>
                    {entry.ms}ms
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
