"use client";

import { useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Network, ArrowRight } from "lucide-react";

const ContainerColorEnum = z.enum(["blue", "emerald", "violet", "amber"]);
const PortSchema = z.object({ host: z.number(), container: z.number() });
const ContainerSchema = z.object({
  name: z.string(),
  image: z.string(),
  ports: z.array(PortSchema).optional().default([]),
  color: ContainerColorEnum.optional().default("blue"),
});

export const ContainerNetworkingSchema = z.object({
  networkName: z.string().default("freshmarket-network"),
  containers: z.array(ContainerSchema).default([
    { name: "api",   image: "node:18-alpine",  ports: [{ host: 3000, container: 3000 }], color: "blue"    },
    { name: "db",    image: "mongo:7",          ports: [],                                color: "emerald" },
    { name: "redis", image: "redis:7-alpine",   ports: [],                                color: "violet"  },
    { name: "nginx", image: "nginx:alpine",     ports: [{ host: 80, container: 80 }],    color: "amber"   },
  ]),
});

export type ContainerNetworkingProps = z.infer<typeof ContainerNetworkingSchema>;

type ContainerDef = {
  name: string;
  image: string;
  ports: { host: number; container: number }[];
  color: "blue" | "emerald" | "violet" | "amber";
};

const COLOR_CFG = {
  blue:    { badge: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700",    dot: "bg-blue-500",    ring: "ring-blue-400 dark:ring-blue-600"    },
  emerald: { badge: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700", dot: "bg-emerald-500", ring: "ring-emerald-400 dark:ring-emerald-600" },
  violet:  { badge: "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-700",  dot: "bg-violet-500",  ring: "ring-violet-400 dark:ring-violet-600"  },
  amber:   { badge: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700",    dot: "bg-amber-500",   ring: "ring-amber-400 dark:ring-amber-600"   },
};

function containerIp(index: number) {
  return `172.18.0.${index + 2}`;
}

function ContainerBox({
  container,
  index,
  selected,
  onClick,
}: {
  container: ContainerDef;
  index: number;
  selected: boolean;
  onClick: () => void;
}) {
  const cfg = COLOR_CFG[container.color ?? "blue"];
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-lg border-2 p-2 text-left transition-all duration-300 w-full",
        selected
          ? `${cfg.ring} ring-2 border-transparent bg-white dark:bg-zinc-800`
          : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600"
      )}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span className={cn("size-2 rounded-full shrink-0", cfg.dot)} />
        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 font-mono">{container.name}</span>
      </div>
      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono block truncate">{container.image}</span>
      {(container.ports ?? []).length > 0 && (
        <div className="mt-1 flex flex-wrap gap-0.5">
          {(container.ports ?? []).map((p) => (
            <span key={p.host} className={cn("text-[9px] font-mono px-1 rounded border", cfg.badge)}>
              :{p.host}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}

// Simulate a "ping" animation — a dot travels from selected to target
function PingAnimation({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "inline-block size-2 rounded-full bg-blue-500 transition-all duration-700",
        active ? "opacity-100 translate-x-4 scale-100" : "opacity-0 scale-50 translate-x-0"
      )}
    />
  );
}

export function ContainerNetworking({
  networkName = "freshmarket-network",
  containers = [
    { name: "api",   image: "node:18-alpine",  ports: [{ host: 3000, container: 3000 }], color: "blue"    },
    { name: "db",    image: "mongo:7",          ports: [],                                color: "emerald" },
    { name: "redis", image: "redis:7-alpine",   ports: [],                                color: "violet"  },
    { name: "nginx", image: "nginx:alpine",     ports: [{ host: 80, container: 80 }],    color: "amber"   },
  ] as ContainerDef[],
}: ContainerNetworkingProps) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [pingTarget, setPingTarget] = useState<number | null>(null);
  const [pinging, setPinging] = useState(false);

  const typedContainers = containers as ContainerDef[];

  function handleSelect(idx: number) {
    if (selectedIdx === idx) {
      setSelectedIdx(null);
      setPingTarget(null);
    } else {
      setSelectedIdx(idx);
      setPingTarget(null);
    }
  }

  function handlePing(targetIdx: number) {
    if (pinging) return;
    setPingTarget(targetIdx);
    setPinging(true);
    setTimeout(() => setPinging(false), 1400);
  }

  const selected = selectedIdx !== null ? typedContainers[selectedIdx] : null;

  // Exposed ports on host
  const exposedPorts = typedContainers.flatMap((c, i) =>
    (c.ports ?? []).map((p) => ({ ...p, containerName: c.name, containerIdx: i, color: c.color ?? "blue" }))
  );

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden text-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <Network className="size-4 text-zinc-600 dark:text-zinc-400" />
          <span className="font-semibold text-zinc-800 dark:text-zinc-200">Container Networking</span>
        </div>
        <span className="text-xs font-mono text-zinc-400 dark:text-zinc-500">{networkName}</span>
      </div>

      {/* Body */}
      <div className="min-h-[280px] p-3 space-y-3">
        {/* Host machine outer box */}
        <div className="rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-600 p-3">
          <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-2">
            Host Machine (your computer / server)
          </p>

          {/* Exposed ports row */}
          {exposedPorts.length > 0 && (
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {exposedPorts.map((ep) => {
                const cfg = COLOR_CFG[ep.color as keyof typeof COLOR_CFG] ?? COLOR_CFG.blue;
                return (
                  <span key={`${ep.containerName}-${ep.host}`} className={cn(
                    "text-[11px] font-mono px-2 py-0.5 rounded border flex items-center gap-1",
                    cfg.badge
                  )}>
                    :{ep.host}
                    <ArrowRight className="size-2.5" />
                    {ep.containerName}:{ep.container}
                  </span>
                );
              })}
            </div>
          )}

          {/* Docker bridge network inner box */}
          <div className="rounded-lg border-2 border-dashed border-blue-300 dark:border-blue-700 bg-blue-50/30 dark:bg-blue-950/10 p-3">
            <p className="text-[10px] font-semibold text-blue-500 dark:text-blue-400 mb-2">
              Docker Bridge Network: {networkName}
            </p>

            {/* Container grid */}
            <div className={cn(
              "grid gap-2",
              typedContainers.length <= 2 ? "grid-cols-2" : typedContainers.length <= 4 ? "grid-cols-4" : "grid-cols-3"
            )}>
              {typedContainers.map((c, i) => (
                <ContainerBox
                  key={c.name}
                  container={c}
                  index={i}
                  selected={selectedIdx === i}
                  onClick={() => handleSelect(i)}
                />
              ))}
            </div>

            <p className="mt-2 text-[10px] text-blue-400 dark:text-blue-500 text-center">
              Click a container to inspect it
            </p>
          </div>
        </div>

        {/* Detail panel */}
        {selected !== null && selectedIdx !== null && (
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 p-3 space-y-2 transition-all duration-500">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 font-mono">{selected.name}</span>
              <span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500">{containerIp(selectedIdx)}</span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">{selected.image}</p>

            {(selected.ports ?? []).length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Exposed:</span>
                {(selected.ports ?? []).map((p) => (
                  <span key={p.host} className="text-[11px] font-mono bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 px-1.5 py-0.5 rounded">
                    {p.host}→{p.container}
                  </span>
                ))}
              </div>
            )}

            <div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">
                Can reach by name:
              </p>
              <div className="flex gap-1.5 flex-wrap">
                {typedContainers
                  .filter((_, i) => i !== selectedIdx)
                  .map((c) => (
                    <button
                      key={c.name}
                      onClick={() => handlePing(typedContainers.indexOf(c))}
                      className={cn(
                        "text-[11px] font-mono px-2 py-0.5 rounded border transition-all duration-300",
                        "border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300",
                        "hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400"
                      )}
                    >
                      ping {c.name}
                    </button>
                  ))}
              </div>
            </div>

            {pingTarget !== null && (
              <div className="flex items-center gap-2 text-[11px] text-blue-600 dark:text-blue-400">
                <span className="font-mono">{selected.name}</span>
                <div className="flex items-center gap-1 relative">
                  <span className="h-px w-12 bg-blue-400 dark:bg-blue-600" />
                  <PingAnimation active={pinging} />
                </div>
                <span className="font-mono">{typedContainers[pingTarget]?.name}</span>
                {!pinging && <span className="text-emerald-500 font-semibold">PONG ✓</span>}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 text-center">
          Containers talk by name · isolated bridge network · ports exposed to host only if mapped
        </p>
      </div>
    </div>
  );
}
