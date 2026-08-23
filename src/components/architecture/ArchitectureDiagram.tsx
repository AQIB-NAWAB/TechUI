"use client";

import { useState } from "react";
import {
  Server, Database, Globe, Shield, Zap, Box, HardDrive,
  Cpu, Cloud, Router, Lock, Activity
} from "lucide-react";
import { cn } from "@/lib/utils";
import { z } from "zod";

export const NodeSchema = z.object({
  id: z.string(),
  type: z.enum([
    "client", "server", "database", "cache", "queue",
    "gateway", "loadbalancer", "worker", "service",
    "cdn", "storage", "external", "function"
  ]),
  label: z.string(),
  sublabel: z.string().optional(),
  highlight: z.boolean().optional(),
  status: z.enum(["active", "idle", "error", "warning"]).optional(),
});

export const ConnectionSchema = z.object({
  from: z.string(),
  to: z.string(),
  label: z.string().optional(),
  direction: z.enum(["forward", "backward", "both"]).default("forward"),
  style: z.enum(["solid", "dashed"]).default("solid"),
  animated: z.boolean().default(false),
});

export const ArchitectureDiagramSchema = z.object({
  title: z.string().optional(),
  nodes: z.array(NodeSchema),
  connections: z.array(ConnectionSchema).optional(),
  layout: z.enum(["horizontal", "vertical", "grid"]).default("horizontal"),
});

export type ArchitectureDiagramProps = z.infer<typeof ArchitectureDiagramSchema>;
type NodeType = z.infer<typeof NodeSchema>;
type Connection = z.infer<typeof ConnectionSchema>;

const NODE_ICON: Record<NodeType["type"], React.ElementType> = {
  client:       Globe,
  server:       Server,
  database:     Database,
  cache:        Zap,
  queue:        Activity,
  gateway:      Shield,
  loadbalancer: Router,
  worker:       Cpu,
  service:      Box,
  cdn:          Cloud,
  storage:      HardDrive,
  external:     Globe,
  function:     Lock,
};

const NODE_BORDER: Record<NodeType["type"], string> = {
  client:       "border-blue-200 dark:border-blue-800",
  server:       "border-emerald-200 dark:border-emerald-800",
  database:     "border-amber-200 dark:border-amber-800",
  cache:        "border-violet-200 dark:border-violet-800",
  queue:        "border-cyan-200 dark:border-cyan-800",
  gateway:      "border-zinc-300 dark:border-zinc-600",
  loadbalancer: "border-cyan-200 dark:border-cyan-800",
  worker:       "border-emerald-200 dark:border-emerald-800",
  service:      "border-emerald-200 dark:border-emerald-800",
  cdn:          "border-blue-200 dark:border-blue-800",
  storage:      "border-amber-200 dark:border-amber-800",
  external:     "border-zinc-300 dark:border-zinc-600",
  function:     "border-violet-200 dark:border-violet-800",
};

const STATUS_DOT: Record<string, string> = {
  active:  "bg-emerald-500",
  idle:    "bg-zinc-300 dark:bg-zinc-600",
  error:   "bg-red-500",
  warning: "bg-amber-500",
};

function NodeCard({
  node,
  selected,
  onClick,
}: {
  node: NodeType;
  selected: boolean;
  onClick: () => void;
}) {
  const Icon = NODE_ICON[node.type];
  const dot = node.status ? STATUS_DOT[node.status] : null;
  const borderColor = NODE_BORDER[node.type];

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center gap-1.5 px-4 py-3 rounded-lg border-2 transition-all duration-500 text-left cursor-pointer",
        "min-w-[88px] max-w-[112px]",
        selected
          ? "border-blue-500 bg-blue-600 text-white shadow-md scale-105"
          : node.highlight
          ? "border-zinc-400 dark:border-zinc-500 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
          : cn(borderColor, "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:scale-105 hover:shadow-sm")
      )}
    >
      {dot && (
        <span
          className={cn(
            "absolute -top-1 -right-1 size-2 rounded-full",
            dot,
            node.status === "active" && !selected && "animate-pulse",
            selected ? "ring-2 ring-blue-600" : "ring-2 ring-white dark:ring-zinc-950"
          )}
        />
      )}
      <Icon
        className={cn(
          "size-5 shrink-0",
          selected ? "text-white" : "text-zinc-400 dark:text-zinc-500"
        )}
      />
      <div className="text-center">
        <p className={cn(
          "text-[12px] font-semibold leading-tight",
          selected ? "text-white" : "text-zinc-800 dark:text-zinc-200"
        )}>
          {node.label}
        </p>
        {node.sublabel && (
          <p className={cn(
            "text-[10px] mt-0.5 leading-tight",
            selected ? "text-blue-200" : "text-zinc-400 dark:text-zinc-500"
          )}>
            {node.sublabel}
          </p>
        )}
      </div>
    </button>
  );
}

function FlowConnector({ connection }: { connection: Connection }) {
  const isDashed = connection.style === "dashed";
  const isAnimated = connection.animated || true;

  return (
    <div className="flex flex-col items-center justify-center gap-1 px-1" style={{ minWidth: 44 }}>
      {connection.label && (
        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 whitespace-nowrap font-mono">
          {connection.label}
        </span>
      )}
      <div className="flex items-center w-full">
        {connection.direction === "backward" && (
          <svg width="6" height="8" viewBox="0 0 6 8" className="text-zinc-300 dark:text-zinc-700 shrink-0">
            <path d="M6 0 L0 4 L6 8" fill="currentColor" />
          </svg>
        )}
        <div className="flex-1 relative overflow-hidden" style={{ height: 2 }}>
          {isDashed || isAnimated ? (
            <svg
              className="absolute inset-0 w-full"
              height="2"
              style={{ overflow: "visible" }}
            >
              <line
                x1="0" y1="1" x2="100%" y2="1"
                strokeWidth={2}
                className={cn(
                  "stroke-zinc-300 dark:stroke-zinc-700",
                  isAnimated && "flow-line"
                )}
              />
            </svg>
          ) : (
            <div className="h-full bg-zinc-300 dark:bg-zinc-700" />
          )}
        </div>
        {connection.direction !== "backward" && (
          <svg width="6" height="8" viewBox="0 0 6 8" className="text-zinc-300 dark:text-zinc-700 shrink-0">
            <path d="M0 0 L6 4 L0 8" fill="currentColor" />
          </svg>
        )}
      </div>
    </div>
  );
}

export function ArchitectureDiagram({
  title,
  nodes,
  connections,
  layout = "horizontal",
}: ArchitectureDiagramProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = nodes.find((n) => n.id === selectedId);

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 overflow-x-auto">
      <style>{`
        @keyframes flow {
          from { stroke-dashoffset: 20; }
          to   { stroke-dashoffset: 0; }
        }
        .flow-line {
          animation: flow 1s linear infinite;
          stroke-dasharray: 6 4;
        }
      `}</style>

      {title && (
        <p className="text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-5 font-medium">
          {title}
        </p>
      )}

      <div
        className={cn(
          "flex items-center justify-start",
          layout === "vertical" ? "flex-col" : layout === "grid" ? "flex-wrap gap-4" : "flex-row"
        )}
        style={{ minWidth: layout === "horizontal" ? "max-content" : undefined }}
      >
        {nodes.map((node, i) => {
          const conn = connections?.[i - 1];
          return (
            <div
              key={node.id}
              className={cn(
                "flex items-center",
                layout === "vertical" && "flex-col"
              )}
            >
              {i > 0 && conn && <FlowConnector connection={conn} />}
              {i > 0 && !conn && (
                <div className="flex items-center" style={{ minWidth: 44 }}>
                  <div className="flex-1 relative" style={{ height: 2 }}>
                    <svg className="absolute inset-0 w-full" height="2" style={{ overflow: "visible" }}>
                      <line x1="0" y1="1" x2="100%" y2="1" strokeWidth={2} className="stroke-zinc-200 dark:stroke-zinc-800 flow-line" />
                    </svg>
                  </div>
                  <svg width="6" height="8" viewBox="0 0 6 8" className="text-zinc-300 dark:text-zinc-700 shrink-0">
                    <path d="M0 0 L6 4 L0 8" fill="currentColor" />
                  </svg>
                </div>
              )}
              <NodeCard
                node={node}
                selected={selectedId === node.id}
                onClick={() => setSelectedId(selectedId === node.id ? null : node.id)}
              />
            </div>
          );
        })}
      </div>

      {/* Selected node detail popover */}
      {selected && (
        <div className="mt-4 flex items-start gap-3 px-3 py-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[12px] transition-all duration-500">
          <div className={cn("size-2 rounded-full mt-1 shrink-0", selected.status ? STATUS_DOT[selected.status] : "bg-zinc-300 dark:bg-zinc-600")} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">{selected.label}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 font-mono">
                {selected.type}
              </span>
              {selected.status && (
                <span className={cn(
                  "text-[10px] font-medium",
                  selected.status === "active" ? "text-emerald-600 dark:text-emerald-400" :
                  selected.status === "error" ? "text-red-600 dark:text-red-400" :
                  selected.status === "warning" ? "text-amber-600 dark:text-amber-400" :
                  "text-zinc-400"
                )}>
                  {selected.status}
                </span>
              )}
            </div>
            {selected.sublabel && (
              <p className="text-zinc-400 dark:text-zinc-500 mt-0.5">{selected.sublabel}</p>
            )}
          </div>
          <button
            onClick={() => setSelectedId(null)}
            className="text-zinc-300 dark:text-zinc-600 hover:text-zinc-500 transition-colors text-xs shrink-0"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
