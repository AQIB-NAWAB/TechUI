"use client";

import { useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Box, Cpu, HardDrive, ArrowRight, FolderOpen } from "lucide-react";

const ContainerStatusEnum = z.enum(["running", "stopped", "paused", "exited", "created", "restarting"]);

export const DockerContainerSchema = z.object({
  name: z.string().optional().default("myapp"),
  image: z.string().optional().default("registry.example.com/myapp:v2.1.0"),
  status: ContainerStatusEnum.optional().default("running"),
  id: z.string().optional().default("a3f8b2c1d4e5"),
  ports: z
    .array(z.object({ host: z.number(), container: z.number(), protocol: z.enum(["tcp", "udp"]).optional().default("tcp") }))
    .optional(),
  env: z
    .array(z.object({ key: z.string(), value: z.string() }))
    .optional(),
  volumes: z
    .array(z.object({ host: z.string(), container: z.string(), readOnly: z.boolean().optional().default(false) }))
    .optional(),
  cpu: z.string().optional(),
  memory: z.string().optional(),
  uptime: z.string().optional(),
  command: z.string().optional(),
  network: z.string().optional().default("bridge"),
});

export type DockerContainerProps = z.infer<typeof DockerContainerSchema>;

const STATUS_CFG = {
  running:    { dot: "bg-emerald-500 animate-pulse", text: "text-emerald-600 dark:text-emerald-400", label: "Running",    dotStatic: "bg-emerald-500" },
  stopped:    { dot: "bg-zinc-400",                  text: "text-zinc-500 dark:text-zinc-500",       label: "Stopped",    dotStatic: "bg-zinc-400"    },
  paused:     { dot: "bg-amber-500",                 text: "text-amber-600 dark:text-amber-400",     label: "Paused",     dotStatic: "bg-amber-500"   },
  exited:     { dot: "bg-red-500",                   text: "text-red-600 dark:text-red-400",         label: "Exited",     dotStatic: "bg-red-500"     },
  created:    { dot: "bg-blue-500",                  text: "text-blue-600 dark:text-blue-400",       label: "Created",    dotStatic: "bg-blue-500"    },
  restarting: { dot: "bg-violet-500 animate-pulse",  text: "text-violet-600 dark:text-violet-400",   label: "Restarting", dotStatic: "bg-violet-500"  },
};

type TabType = "ports" | "volumes" | "environment";

const SECRET_PATTERNS = /secret|key|password|token/i;

function maskValue(key: string, value: string): string {
  if (SECRET_PATTERNS.test(key)) return "•••••••••";
  return value;
}

function parseCpuPct(cpu: string): number {
  const n = parseFloat(cpu);
  if (isNaN(n)) return 0;
  return Math.min(100, n);
}

function parseMemory(mem: string): { used: number; total: number; label: string } {
  const m = mem.match(/^([\d.]+)\s*(\w+)\s*\/\s*([\d.]+)\s*(\w+)/);
  if (!m) return { used: 0, total: 100, label: mem };
  const used = parseFloat(m[1]!);
  const total = parseFloat(m[3]!);
  return { used, total, label: mem };
}

function ResourceBar({ value, max, className }: { value: number; max: number; className?: string }) {
  const pct = Math.min(100, max > 0 ? (value / max) * 100 : 0);
  const color = pct > 80 ? "bg-red-500" : pct > 50 ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div className="flex-1 h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
      <div className={cn("h-full rounded-full transition-all duration-500", color, className)} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function DockerContainer({
  name = "myapp",
  image = "registry.example.com/myapp:v2.1.0",
  status = "running",
  id = "a3f8b2c1d4e5",
  ports,
  env,
  volumes,
  cpu,
  memory,
  command,
  network = "bridge",
}: DockerContainerProps) {
  const sc = STATUS_CFG[status];
  const shortId = id.slice(0, 12);
  const [activeTab, setActiveTab] = useState<TabType>("ports");

  const cpuPct = cpu ? parseCpuPct(cpu) : null;
  const memParsed = memory ? parseMemory(memory) : null;
  const hasTabs = (ports && ports.length > 0) || (volumes && volumes.length > 0) || (env && env.length > 0);

  const tabs: { id: TabType; label: string }[] = [
    ...(ports && ports.length > 0 ? [{ id: "ports" as TabType, label: `Ports (${ports.length})` }] : []),
    ...(volumes && volumes.length > 0 ? [{ id: "volumes" as TabType, label: `Volumes (${volumes.length})` }] : []),
    ...(env && env.length > 0 ? [{ id: "environment" as TabType, label: `Env (${env.length})` }] : []),
  ];

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/40">
        <Box className="size-4 text-blue-500 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-zinc-800 dark:text-zinc-100">{name}</span>
            <div className="flex items-center gap-1.5">
              <span className={cn("size-1.5 rounded-full shrink-0", sc.dot)} />
              <span className={cn("text-[10px] font-semibold", sc.text)}>{sc.label}</span>
            </div>
          </div>
          <code className="text-[11px] font-mono text-zinc-400 block truncate mt-0.5">{shortId}</code>
        </div>
      </div>

      {/* Container visual */}
      <div className="px-4 py-4 border-b border-zinc-100 dark:border-zinc-900">
        {/* Host machine */}
        <div className="border border-dashed border-zinc-300 dark:border-zinc-600 rounded-lg p-3">
          <div className="text-[9px] text-zinc-400 font-semibold uppercase tracking-widest mb-2">Host machine</div>
          {/* Container box */}
          <div className="border border-zinc-300 dark:border-zinc-600 rounded-md p-3 bg-zinc-50 dark:bg-zinc-900/50">
            <div className="flex items-center gap-2 mb-1.5">
              <Box className="size-3.5 text-blue-500 shrink-0" />
              <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">{name}</span>
              <span className={cn("size-1.5 rounded-full shrink-0", sc.dotStatic)} />
              <span className={cn("text-[10px] font-semibold", sc.text)}>{sc.label}</span>
            </div>
            {command && (
              <code className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 block truncate mb-1.5">
                {command}
              </code>
            )}
            <code className="text-[10px] font-mono text-zinc-400 block truncate">{image}</code>
          </div>
        </div>

        {/* Resource bars */}
        {(cpuPct !== null || memParsed !== null) && (
          <div className="mt-3 space-y-2">
            {cpuPct !== null && (
              <div className="flex items-center gap-3">
                <Cpu className="size-3 text-zinc-400 shrink-0" />
                <span className="text-[10px] text-zinc-400 w-8 shrink-0">CPU</span>
                <ResourceBar value={cpuPct} max={100} />
                <span className="text-[10px] font-mono text-zinc-600 dark:text-zinc-400 w-12 text-right shrink-0">{cpu}</span>
              </div>
            )}
            {memParsed !== null && (
              <div className="flex items-center gap-3">
                <HardDrive className="size-3 text-zinc-400 shrink-0" />
                <span className="text-[10px] text-zinc-400 w-8 shrink-0">Mem</span>
                <ResourceBar value={memParsed.used} max={memParsed.total} />
                <span className="text-[10px] font-mono text-zinc-600 dark:text-zinc-400 text-right shrink-0" style={{ minWidth: "6rem" }}>{memParsed.label}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      {hasTabs && (
        <>
          <div className="flex border-b border-zinc-100 dark:border-zinc-900">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={cn(
                  "px-4 py-2 text-[11px] font-semibold transition-all duration-300 border-b-2",
                  activeTab === t.id
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="px-4 py-3 min-h-[80px]">
            {activeTab === "ports" && ports && ports.length > 0 && (
              <div className="space-y-2">
                <div className="text-[10px] text-zinc-400 mb-1">host → container</div>
                {ports.map((p, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-semibold bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-900/40">
                      {p.host}
                    </span>
                    <ArrowRight className="size-3 text-zinc-400 shrink-0" />
                    <span className="text-[11px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded">
                      {p.container}/{p.protocol ?? "tcp"}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "volumes" && volumes && volumes.length > 0 && (
              <div className="space-y-2">
                {volumes.map((v, i) => (
                  <div key={i} className="flex items-center gap-2 text-[11px] font-mono">
                    <FolderOpen className="size-3 text-zinc-400 shrink-0" />
                    <span className="text-zinc-500 dark:text-zinc-400 truncate">{v.host}</span>
                    <ArrowRight className="size-3 text-zinc-400 shrink-0" />
                    <span className="text-zinc-700 dark:text-zinc-300 truncate">{v.container}</span>
                    {v.readOnly && (
                      <span className="text-[9px] text-amber-600 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950/30 px-1 rounded shrink-0">RO</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === "environment" && env && env.length > 0 && (
              <div className="space-y-1">
                {env.map((e, i) => (
                  <div key={i} className="flex items-center gap-2 text-[11px] font-mono">
                    <span className="text-sky-600 dark:text-sky-400 font-semibold shrink-0">{e.key}</span>
                    <span className="text-zinc-400">=</span>
                    <span className="text-emerald-600 dark:text-emerald-400 truncate">{maskValue(e.key, e.value)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Footer */}
      <div className="border-t border-zinc-100 dark:border-zinc-900 px-4 py-2 flex items-center gap-3 text-[10px] text-zinc-400">
        <span>network: <span className="font-mono text-zinc-500">{network}</span></span>
      </div>
    </div>
  );
}
