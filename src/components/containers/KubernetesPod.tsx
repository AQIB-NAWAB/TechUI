"use client";

import { z } from "zod";
import { cn } from "@/lib/utils";
import { Box, Shield, FolderOpen, Network, Server } from "lucide-react";

const PodPhaseEnum = z.enum(["Pending", "Running", "Succeeded", "Failed", "Unknown"]);
const ContainerStateEnum = z.enum(["waiting", "running", "terminated"]);

export const KubernetesPodSchema = z.object({
  name: z.string().optional().default("myapp-7d4b9c8f6-xkp2m"),
  namespace: z.string().optional().default("default"),
  phase: PodPhaseEnum.optional().default("Running"),
  node: z.string().optional().default("worker-node-1"),
  ip: z.string().optional().default("10.244.1.42"),
  startTime: z.string().optional(),
  restarts: z.number().optional().default(0),
  labels: z.record(z.string(), z.string()).optional(),
  containers: z.array(
    z.object({
      name: z.string(),
      image: z.string(),
      state: ContainerStateEnum.optional().default("running"),
      ready: z.boolean().optional().default(true),
      restarts: z.number().optional().default(0),
      cpu: z.string().optional(),
      memory: z.string().optional(),
      cpuLimit: z.string().optional(),
      memoryLimit: z.string().optional(),
      ports: z.array(z.number()).optional(),
    })
  ).optional().default([]),
  volumes: z.array(z.object({ name: z.string(), type: z.string() })).optional(),
  serviceAccount: z.string().optional().default("default"),
});

export type KubernetesPodProps = z.infer<typeof KubernetesPodSchema>;

const PHASE_CFG = {
  Running:   { dot: "bg-emerald-500 animate-pulse", text: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800" },
  Pending:   { dot: "bg-amber-500",                 text: "text-amber-700 dark:text-amber-400",     bg: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800"         },
  Succeeded: { dot: "bg-blue-500",                  text: "text-blue-700 dark:text-blue-400",       bg: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800"             },
  Failed:    { dot: "bg-red-500",                   text: "text-red-700 dark:text-red-400",         bg: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"                 },
  Unknown:   { dot: "bg-zinc-400",                  text: "text-zinc-500 dark:text-zinc-400",       bg: "bg-zinc-50 dark:bg-zinc-900/30 border-zinc-200 dark:border-zinc-700"             },
};

const STATE_CFG = {
  running:    { border: "border-l-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/20",  text: "text-emerald-700 dark:text-emerald-400", label: "running"    },
  waiting:    { border: "border-l-amber-500",   bg: "bg-amber-50 dark:bg-amber-950/20",      text: "text-amber-700 dark:text-amber-400",     label: "waiting"    },
  terminated: { border: "border-l-red-400",     bg: "bg-red-50 dark:bg-red-950/20",          text: "text-zinc-500 dark:text-zinc-400",       label: "terminated" },
};

function parseMilli(s: string): number {
  if (!s) return 0;
  const m = s.match(/^([\d.]+)m?i?$/);
  if (!m) return 0;
  return parseFloat(m[1]!);
}

function ResourceBar({ used, limit, color }: { used?: string; limit?: string; color: string }) {
  if (!used) return null;
  const u = parseMilli(used);
  const l = limit ? parseMilli(limit) : 0;
  const pct = l > 0 ? Math.min(100, (u / l) * 100) : 0;
  const barColor = pct > 80 ? "bg-red-500" : pct > 50 ? "bg-amber-500" : color;
  const label = limit ? `${used}/${limit}` : used;

  return (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      <span className="font-mono text-[10px] text-zinc-500 dark:text-zinc-400 shrink-0 w-20">{label}</span>
      {l > 0 && (
        <div className="flex-1 h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
          <div className={cn("h-full rounded-full transition-all duration-500", barColor)} style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}

export function KubernetesPod({
  name = "myapp-7d4b9c8f6-xkp2m",
  namespace = "default",
  phase = "Running",
  node = "worker-node-1",
  ip = "10.244.1.42",
  restarts = 0,
  labels,
  containers = [],
  volumes,
  serviceAccount = "default",
}: KubernetesPodProps) {
  const pc = PHASE_CFG[phase];
  const readyCount = containers.filter((c) => c.ready).length;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
      {/* Outer header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/40">
        <Shield className="size-3.5 text-violet-500 shrink-0" />
        <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">Kubernetes Pod</span>
        <span className="ml-auto text-[10px] font-mono text-violet-500 dark:text-violet-400">{namespace}</span>
      </div>

      {/* Pod outer box */}
      <div className="p-4">
        <div className="border-2 border-dashed border-zinc-300 dark:border-zinc-600 rounded-xl overflow-hidden">
          {/* Pod header */}
          <div className={cn("px-4 py-3 border-b-2 border-dashed border-zinc-200 dark:border-zinc-700 flex items-center gap-3 flex-wrap", pc.bg)}>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-mono font-bold text-zinc-800 dark:text-zinc-100 truncate block">{name}</span>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className={cn("size-1.5 rounded-full shrink-0", pc.dot)} />
                  <span className={cn("text-[10px] font-semibold", pc.text)}>{phase}</span>
                </div>
                {ip && (
                  <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-mono">
                    <Network className="size-3" />
                    <span>{ip}</span>
                  </div>
                )}
                {node && (
                  <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-mono">
                    <Server className="size-3" />
                    <span>{node}</span>
                  </div>
                )}
                <span className="text-[10px] text-zinc-400 ml-auto">
                  {readyCount}/{containers.length} ready
                </span>
              </div>
            </div>
          </div>

          {/* Containers inside pod */}
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {containers.map((c, i) => {
              const sc = STATE_CFG[c.state ?? "running"];
              return (
                <div
                  key={i}
                  className={cn("px-4 py-3 border-l-4", sc.border, sc.bg)}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Box className="size-3.5 text-blue-500 shrink-0" />
                    <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{c.name}</span>
                    <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded", sc.text, "bg-white/60 dark:bg-black/20")}>
                      {sc.label}
                    </span>
                    <span className={cn("ml-auto text-[10px] font-bold", c.ready ? "text-emerald-600 dark:text-emerald-400" : "text-red-500")}>
                      {c.ready ? "✓ Ready" : "✗ Not ready"}
                    </span>
                  </div>
                  <code className="block text-[10px] font-mono text-zinc-500 dark:text-zinc-400 mb-2 truncate">{c.image}</code>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    {(c.cpu || c.cpuLimit) && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] text-zinc-400 uppercase tracking-wide w-6 shrink-0">CPU</span>
                        <ResourceBar used={c.cpu} limit={c.cpuLimit} color="bg-blue-500" />
                      </div>
                    )}
                    {(c.memory || c.memoryLimit) && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] text-zinc-400 uppercase tracking-wide w-6 shrink-0">Mem</span>
                        <ResourceBar used={c.memory} limit={c.memoryLimit} color="bg-violet-500" />
                      </div>
                    )}
                  </div>
                  {c.restarts > 0 && (
                    <div className="mt-1.5 text-[10px] text-amber-600 dark:text-amber-400">
                      ⚠ {c.restarts} restart{c.restarts !== 1 ? "s" : ""}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Labels */}
      {labels && Object.keys(labels).length > 0 && (
        <div className="px-4 pb-3 flex flex-wrap gap-1.5">
          {Object.entries(labels).map(([k, v]) => (
            <span key={k} className="text-[10px] font-mono bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-800 px-2 py-0.5 rounded-full">
              {k}={v}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-zinc-100 dark:border-zinc-900 px-4 py-2 flex items-center gap-3 text-[10px] text-zinc-400 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Shield className="size-3" />
          <span>{serviceAccount}</span>
        </div>
        {volumes && volumes.length > 0 && (
          <div className="flex items-center gap-1.5">
            <FolderOpen className="size-3" />
            <span>{volumes.map((v) => `${v.name} (${v.type})`).join(", ")}</span>
          </div>
        )}
        {restarts > 0 && (
          <span className="text-amber-500 ml-auto">{restarts} pod restart{restarts !== 1 ? "s" : ""}</span>
        )}
      </div>
    </div>
  );
}
