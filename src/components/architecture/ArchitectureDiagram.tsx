"use client";

import { useState } from "react";
import {
  Server, Database, Globe, Shield, Zap, HardDrive,
  Cpu, Cloud, Monitor, GitBranch, Mail, Network, RefreshCw
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
  client:       Monitor,
  server:       Server,
  database:     Database,
  cache:        Zap,
  queue:        Mail,
  gateway:      Shield,
  loadbalancer: GitBranch,
  worker:       Cpu,
  service:      Server,
  cdn:          Globe,
  storage:      HardDrive,
  external:     Globe,
  function:     Cloud,
};

const NODE_BORDER: Record<NodeType["type"], string> = {
  client:       "border-blue-300 dark:border-blue-700",
  server:       "border-emerald-300 dark:border-emerald-700",
  database:     "border-amber-300 dark:border-amber-700",
  cache:        "border-violet-300 dark:border-violet-700",
  queue:        "border-cyan-300 dark:border-cyan-700",
  gateway:      "border-zinc-400 dark:border-zinc-500",
  loadbalancer: "border-cyan-300 dark:border-cyan-600",
  worker:       "border-emerald-300 dark:border-emerald-700",
  service:      "border-emerald-300 dark:border-emerald-700",
  cdn:          "border-blue-300 dark:border-blue-700",
  storage:      "border-amber-300 dark:border-amber-700",
  external:     "border-zinc-400 dark:border-zinc-500",
  function:     "border-violet-300 dark:border-violet-700",
};

const STATUS_DOT_BY_TYPE: Record<NodeType["type"], string> = {
  client:       "bg-blue-500",
  server:       "bg-emerald-500",
  database:     "bg-amber-500",
  cache:        "bg-violet-500",
  queue:        "bg-cyan-500",
  gateway:      "bg-zinc-500",
  loadbalancer: "bg-cyan-500",
  worker:       "bg-emerald-500",
  service:      "bg-emerald-500",
  cdn:          "bg-blue-500",
  storage:      "bg-amber-500",
  external:     "bg-zinc-500",
  function:     "bg-violet-500",
};

const STATUS_DOT: Record<string, string> = {
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
  const dot =
    node.status === "active"
      ? STATUS_DOT_BY_TYPE[node.type]
      : node.status
      ? STATUS_DOT[node.status]
      : null;
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
  const isAnimated = connection.animated !== false;

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
  const [cycleIdx, setCycleIdx] = useState(0);

  const selected = nodes.find((n) => n.id === selectedId);

  function exploreNext() {
    const next = nodes[cycleIdx % nodes.length];
    if (next) {
      setSelectedId(next.id);
      setCycleIdx((i) => (i + 1) % nodes.length);
    }
  }

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
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

      <div className="px-4 h-12 flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800">
        <Network className="size-4 text-zinc-400 shrink-0" />
        <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">
          {title ?? "Architecture Diagram"}
        </p>
        <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
          {nodes.length} nodes
        </span>
        <button
          onClick={() => { setSelectedId(null); setCycleIdx(0); }}
          className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all duration-500"
          title="Reset"
        >
          <RefreshCw className="size-3.5" />
        </button>
      </div>

      <div className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        A map of system parts and how data flows between them — click any node to inspect it.
      </div>

      <div className="min-h-[220px] flex flex-col justify-center px-6 py-5">
        <div
          className={cn(
            layout === "vertical"
              ? "flex flex-col items-center justify-center gap-2"
              : layout === "grid"
              ? "grid grid-cols-2 sm:grid-cols-3 gap-4 place-items-center justify-items-center mx-auto max-w-3xl"
              : "flex flex-row items-center justify-center flex-wrap gap-y-4"
          )}
        >
          {nodes.map((node, i) => {
            const conn = connections?.[i - 1];
            return (
              <div
                key={node.id}
                className={cn(
                  "flex items-center",
                  layout === "vertical" && "flex-col",
                  layout === "grid" && "contents"
                )}
              >
                {i > 0 && conn && layout !== "grid" && <FlowConnector connection={conn} />}
                {i > 0 && !conn && layout !== "grid" && (
                  <div className="flex items-center" style={{ minWidth: 44 }}>
                    <div className="flex-1 relative" style={{ height: 2 }}>
                      <svg className="absolute inset-0 w-full" height="2" style={{ overflow: "visible" }}>
                        <line x1="0" y1="1" x2="100%" y2="1" strokeWidth={2} className="stroke-zinc-300 dark:stroke-zinc-700 flow-line" />
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

        <div className="min-h-[72px] mt-4 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 px-3 py-2.5">
          {selected ? (
            <div className="flex items-start gap-3 transition-all duration-500">
              <div className={cn("size-2 rounded-full mt-1 shrink-0 animate-pulse", selected.status === "active" ? STATUS_DOT_BY_TYPE[selected.type] : selected.status ? STATUS_DOT[selected.status] : "bg-zinc-300")} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{selected.label}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 font-mono uppercase">
                    {selected.type}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {selected.type === "client" && "Entry point — users and browsers connect here"}
                  {selected.type === "gateway" && "Routes and authenticates incoming API traffic"}
                  {selected.type === "loadbalancer" && "Distributes requests across healthy backends"}
                  {selected.type === "service" && "Runs business logic and handles requests"}
                  {selected.type === "database" && "Persistent data storage — SQL or NoSQL"}
                  {selected.type === "cache" && "Fast in-memory store for frequently accessed data"}
                  {selected.type === "queue" && "Buffers messages between producers and consumers"}
                  {selected.type === "worker" && "Background processor for async jobs"}
                  {selected.type === "cdn" && "Edge cache serving static assets globally"}
                  {selected.type === "function" && "Serverless function — runs on demand"}
                  {!["client","gateway","loadbalancer","service","database","cache","queue","worker","cdn","function"].includes(selected.type) && "Part of the system architecture"}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-zinc-400 text-center py-2">Click a node or use Explore Next to inspect its role</p>
          )}
        </div>
      </div>

      <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/30">
        <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">
          {selected
            ? `${selected.label} (${selected.type}) — ${selected.sublabel ?? "part of the system"}`
            : "Click any node to see what it does in the system"}
        </span>
        <button
          onClick={exploreNext}
          className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-all duration-500 shrink-0"
        >
          Explore Next
        </button>
      </div>
    </div>
  );
}
