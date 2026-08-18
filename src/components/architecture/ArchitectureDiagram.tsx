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

const NODE_CONFIG: Record<
  NodeType["type"],
  { icon: React.ElementType; bg: string; border: string; text: string; label: string }
> = {
  client:       { icon: Globe,    bg: "bg-blue-50 dark:bg-blue-950/30",    border: "border-blue-200 dark:border-blue-900",    text: "text-blue-700 dark:text-blue-400",    label: "Client" },
  server:       { icon: Server,   bg: "bg-zinc-50 dark:bg-zinc-900",       border: "border-zinc-200 dark:border-zinc-800",    text: "text-zinc-700 dark:text-zinc-300",    label: "Server" },
  database:     { icon: Database, bg: "bg-violet-50 dark:bg-violet-950/30",border: "border-violet-200 dark:border-violet-900",text: "text-violet-700 dark:text-violet-400",label: "Database" },
  cache:        { icon: Zap,      bg: "bg-amber-50 dark:bg-amber-950/30",  border: "border-amber-200 dark:border-amber-900",  text: "text-amber-700 dark:text-amber-400",  label: "Cache" },
  queue:        { icon: Activity, bg: "bg-orange-50 dark:bg-orange-950/30",border: "border-orange-200 dark:border-orange-900",text: "text-orange-700 dark:text-orange-400",label: "Queue" },
  gateway:      { icon: Shield,   bg: "bg-emerald-50 dark:bg-emerald-950/30",border: "border-emerald-200 dark:border-emerald-900",text: "text-emerald-700 dark:text-emerald-400",label: "Gateway" },
  loadbalancer: { icon: Router,   bg: "bg-cyan-50 dark:bg-cyan-950/30",    border: "border-cyan-200 dark:border-cyan-900",    text: "text-cyan-700 dark:text-cyan-400",    label: "Load Balancer" },
  worker:       { icon: Cpu,      bg: "bg-pink-50 dark:bg-pink-950/30",    border: "border-pink-200 dark:border-pink-900",    text: "text-pink-700 dark:text-pink-400",    label: "Worker" },
  service:      { icon: Box,      bg: "bg-indigo-50 dark:bg-indigo-950/30",border: "border-indigo-200 dark:border-indigo-900",text: "text-indigo-700 dark:text-indigo-400",label: "Service" },
  cdn:          { icon: Cloud,    bg: "bg-sky-50 dark:bg-sky-950/30",      border: "border-sky-200 dark:border-sky-900",      text: "text-sky-700 dark:text-sky-400",      label: "CDN" },
  storage:      { icon: HardDrive,bg: "bg-teal-50 dark:bg-teal-950/30",   border: "border-teal-200 dark:border-teal-900",    text: "text-teal-700 dark:text-teal-400",    label: "Storage" },
  external:     { icon: Globe,    bg: "bg-zinc-50 dark:bg-zinc-900",       border: "border-zinc-300 dark:border-zinc-700 border-dashed",text: "text-zinc-500 dark:text-zinc-500",label: "External" },
  function:     { icon: Lock,     bg: "bg-rose-50 dark:bg-rose-950/30",    border: "border-rose-200 dark:border-rose-900",    text: "text-rose-700 dark:text-rose-400",    label: "Function" },
};

const STATUS_RING: Record<string, string> = {
  active:  "ring-2 ring-emerald-400/60 dark:ring-emerald-500/40",
  idle:    "",
  error:   "ring-2 ring-red-400/60 dark:ring-red-500/40",
  warning: "ring-2 ring-amber-400/60 dark:ring-amber-500/40",
};

const STATUS_DOT: Record<string, string> = {
  active:  "bg-emerald-500",
  idle:    "bg-zinc-400",
  error:   "bg-red-500",
  warning: "bg-amber-500",
};

function NodeCard({ node, selected, onClick }: { node: NodeType; selected: boolean; onClick: () => void }) {
  const cfg = NODE_CONFIG[node.type];
  const Icon = cfg.icon;
  const ring = node.status ? STATUS_RING[node.status] : "";
  const dot = node.status ? STATUS_DOT[node.status] : null;

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center gap-2 px-4 py-3 rounded-xl border transition-all",
        "min-w-[96px] max-w-[120px] cursor-pointer",
        cfg.bg, cfg.border,
        ring,
        selected ? "scale-105 shadow-md" : "hover:scale-102 hover:shadow-sm",
        node.highlight ? "shadow-lg" : ""
      )}
    >
      {dot && (
        <span className={cn("absolute -top-1 -right-1 size-2.5 rounded-full border-2 border-white dark:border-zinc-950", dot)} />
      )}
      <div className={cn("size-9 flex items-center justify-center rounded-lg", cfg.bg, cfg.text)}>
        <Icon className="size-5" />
      </div>
      <div className="text-center">
        <p className="text-[11px] font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">{node.label}</p>
        {node.sublabel && (
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5 leading-tight">{node.sublabel}</p>
        )}
      </div>
      <span className={cn("text-[9px] uppercase tracking-widest font-semibold opacity-50", cfg.text)}>
        {cfg.label}
      </span>
    </button>
  );
}

function Arrow({ connection, index }: { connection: Connection; index: number }) {
  const isAnimated = connection.animated;
  return (
    <div className="flex flex-col items-center justify-center gap-1 min-w-[48px]">
      {connection.label && (
        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 whitespace-nowrap px-1 font-mono">
          {connection.label}
        </span>
      )}
      <div className="relative flex items-center w-12">
        <div
          className={cn(
            "h-px flex-1",
            connection.style === "dashed"
              ? "border-t border-dashed border-zinc-300 dark:border-zinc-700"
              : "bg-zinc-300 dark:bg-zinc-700"
          )}
        />
        {connection.direction !== "backward" && (
          <svg width="8" height="8" viewBox="0 0 8 8" className="text-zinc-400 dark:text-zinc-600 shrink-0">
            <path d="M0 0 L8 4 L0 8" fill="currentColor" />
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
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  if (layout === "horizontal") {
    return (
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 overflow-x-auto">
        {title && (
          <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-5">
            {title}
          </p>
        )}
        <div className="flex items-center gap-0 justify-start min-w-max">
          {nodes.map((node, i) => {
            const conn = connections?.[i - 1];
            return (
              <div key={node.id} className="flex items-center">
                {i > 0 && conn && <Arrow connection={conn} index={i} />}
                {i > 0 && !conn && (
                  <div className="w-10 flex items-center justify-center">
                    <div className="h-px w-full bg-zinc-200 dark:bg-zinc-800" />
                    <svg width="8" height="8" viewBox="0 0 8 8" className="text-zinc-300 dark:text-zinc-700 shrink-0">
                      <path d="M0 0 L8 4 L0 8" fill="currentColor" />
                    </svg>
                  </div>
                )}
                <NodeCard
                  node={node}
                  selected={selectedNode === node.id}
                  onClick={() => setSelectedNode(selectedNode === node.id ? null : node.id)}
                />
              </div>
            );
          })}
        </div>
        {selectedNode && (
          <div className="mt-4 px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 font-mono">
            Node: <span className="text-zinc-900 dark:text-zinc-100">{selectedNode}</span>
            {" · "}Type: <span className="text-zinc-900 dark:text-zinc-100">{nodes.find(n => n.id === selectedNode)?.type}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6">
      {title && (
        <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-5">
          {title}
        </p>
      )}
      <div className="flex flex-wrap gap-4">
        {nodes.map((node) => (
          <NodeCard
            key={node.id}
            node={node}
            selected={selectedNode === node.id}
            onClick={() => setSelectedNode(selectedNode === node.id ? null : node.id)}
          />
        ))}
      </div>
    </div>
  );
}
