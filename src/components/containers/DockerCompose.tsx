"use client";

import { useState, useEffect, useRef } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Layers, Heart, HardDrive, ArrowRight, Play, ChevronDown, ChevronUp } from "lucide-react";

const ServiceSchema = z.object({
  name: z.string(),
  image: z.string(),
  ports: z.array(z.string()).optional().default([]),
  dependsOn: z.array(z.string()).optional().default([]),
  volumes: z.array(z.string()).optional().default([]),
  healthcheck: z.boolean().optional().default(false),
  color: z.enum(["blue", "emerald", "violet", "amber", "rose"]).optional().default("blue"),
});

export const DockerComposeSchema = z.object({
  projectName: z.string().default("freshmarket"),
  services: z.array(ServiceSchema).default([
    { name: "nginx",  image: "nginx:alpine",   ports: ["80:80", "443:443"],  dependsOn: ["api"],          volumes: ["./nginx.conf:/etc/nginx/nginx.conf"], healthcheck: true,  color: "amber"   },
    { name: "api",    image: "node:18-alpine",  ports: ["3000:3000"],         dependsOn: ["db", "redis"],  volumes: ["./src:/app/src"],                    healthcheck: true,  color: "blue"    },
    { name: "db",     image: "postgres:15",     ports: [],                    dependsOn: [],               volumes: ["pgdata:/var/lib/postgresql/data"],    healthcheck: true,  color: "emerald" },
    { name: "redis",  image: "redis:7-alpine",  ports: [],                    dependsOn: [],               volumes: [],                                     healthcheck: false, color: "violet"  },
  ]),
});

export type DockerComposeProps = z.infer<typeof DockerComposeSchema>;

type Service = z.infer<typeof ServiceSchema>;

const COLOR_MAP: Record<string, { border: string; bg: string; badge: string; dot: string }> = {
  blue:    { border: "border-blue-200 dark:border-blue-800",    bg: "bg-blue-50 dark:bg-blue-950/30",    badge: "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300",    dot: "bg-blue-500"    },
  emerald: { border: "border-emerald-200 dark:border-emerald-800", bg: "bg-emerald-50 dark:bg-emerald-950/30", badge: "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300", dot: "bg-emerald-500" },
  violet:  { border: "border-violet-200 dark:border-violet-800", bg: "bg-violet-50 dark:bg-violet-950/30",  badge: "bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300",  dot: "bg-violet-500"  },
  amber:   { border: "border-amber-200 dark:border-amber-800",   bg: "bg-amber-50 dark:bg-amber-950/30",   badge: "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300",   dot: "bg-amber-500"   },
  rose:    { border: "border-rose-200 dark:border-rose-800",     bg: "bg-rose-50 dark:bg-rose-950/30",     badge: "bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300",     dot: "bg-rose-500"    },
};

// Topological sort → returns groups (each group can start in parallel)
function topoSort(services: Service[]): string[][] {
  const nameSet = new Set(services.map((s) => s.name));
  const inDeg: Record<string, number> = {};
  const adj: Record<string, string[]> = {};
  for (const s of services) {
    inDeg[s.name] = 0;
    adj[s.name] = [];
  }
  for (const s of services) {
    for (const dep of (s.dependsOn ?? [])) {
      if (nameSet.has(dep)) {
        adj[dep]!.push(s.name);
        inDeg[s.name]!++;
      }
    }
  }
  const groups: string[][] = [];
  let queue = Object.keys(inDeg).filter((k) => inDeg[k] === 0);
  while (queue.length > 0) {
    groups.push(queue);
    const next: string[] = [];
    for (const node of queue) {
      for (const dep of adj[node]!) {
        inDeg[dep]!--;
        if (inDeg[dep] === 0) next.push(dep);
      }
    }
    queue = next;
  }
  return groups;
}

type StartState = "idle" | "starting" | "running";

export function DockerCompose({
  projectName = "freshmarket",
  services = [],
}: DockerComposeProps) {
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [startStates, setStartStates] = useState<Record<string, StartState>>({});
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const groups = topoSort(services);

  function handlePlay() {
    if (isPlaying) return;
    setIsPlaying(true);
    setStartStates({});
    const timers: ReturnType<typeof setTimeout>[] = [];
    let delay = 0;
    for (const group of groups) {
      const d = delay;
      const t1 = setTimeout(() => {
        setStartStates((prev) => {
          const next = { ...prev };
          for (const name of group) next[name] = "starting";
          return next;
        });
      }, d);
      timers.push(t1);
      const t2 = setTimeout(() => {
        setStartStates((prev) => {
          const next = { ...prev };
          for (const name of group) next[name] = "running";
          return next;
        });
      }, d + 900);
      timers.push(t2);
      delay += 1300;
    }
    const tDone = setTimeout(() => setIsPlaying(false), delay + 200);
    timers.push(tDone);
    timerRef.current = timers;
  }

  function handleReset() {
    for (const t of timerRef.current) clearTimeout(t);
    setStartStates({});
    setIsPlaying(false);
  }

  useEffect(() => () => { for (const t of timerRef.current) clearTimeout(t); }, []);

  const selected = services.find((s) => s.name === selectedService) ?? null;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
        <Layers className="size-3.5 text-blue-500 shrink-0" />
        <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex-1">Docker Compose</span>
        <span className="text-[10px] font-mono text-zinc-400">{projectName}</span>
        <button
          onClick={handleReset}
          disabled={isPlaying}
          className="text-[10px] text-zinc-400 hover:text-zinc-600 transition-colors px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700"
        >
          Reset
        </button>
        <button
          onClick={handlePlay}
          disabled={isPlaying}
          className={cn(
            "flex items-center gap-1 px-3 py-1 rounded-lg text-[11px] font-semibold transition-all duration-300",
            isPlaying
              ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
              : "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90"
          )}
        >
          <Play className="size-3" />
          {isPlaying ? "Starting…" : "docker compose up"}
        </button>
      </div>

      {/* Startup order */}
      <div className="px-4 pt-3 pb-1">
        <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
          <span className="text-zinc-400 font-medium">Startup order:</span>
          {groups.map((group, gi) => (
            <span key={gi} className="flex items-center gap-1">
              {gi > 0 && <ArrowRight className="size-3 text-zinc-300 dark:text-zinc-600" />}
              <span className="font-medium text-zinc-600 dark:text-zinc-400">
                {gi + 1}. {group.join(", ")}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Services grid */}
      <div className="min-h-[300px] p-4">
        <div className="grid grid-cols-2 gap-3">
          {services.map((svc) => {
            const colors = COLOR_MAP[svc.color ?? "blue"]!;
            const state = startStates[svc.name] ?? "idle";
            const isSelected = selectedService === svc.name;

            return (
              <button
                key={svc.name}
                onClick={() => setSelectedService(isSelected ? null : svc.name)}
                className={cn(
                  "text-left rounded-lg border px-3 py-2.5 transition-all duration-500 relative",
                  colors.border,
                  state === "running" ? colors.bg : "bg-white dark:bg-zinc-900",
                  state === "idle" && Object.keys(startStates).length > 0 && "opacity-40",
                  isSelected && "ring-2 ring-zinc-400 dark:ring-zinc-500",
                  "hover:shadow-sm"
                )}
              >
                {/* Service name + status dot */}
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn(
                    "size-1.5 rounded-full shrink-0 transition-all duration-500",
                    state === "running" ? `${colors.dot} shadow-sm` :
                    state === "starting" ? `${colors.dot} animate-pulse` :
                    "bg-zinc-300 dark:bg-zinc-600"
                  )} />
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{svc.name}</span>
                  {isSelected ? <ChevronUp className="size-3 text-zinc-400 ml-auto" /> : <ChevronDown className="size-3 text-zinc-400 ml-auto" />}
                </div>

                {/* Image */}
                <div className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 truncate mb-1.5">
                  {svc.image}
                </div>

                {/* Icons row */}
                <div className="flex items-center gap-2 flex-wrap">
                  {(svc.ports ?? []).length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {(svc.ports ?? []).map((p) => (
                        <span key={p} className={cn("text-[9px] font-mono px-1.5 py-0.5 rounded", colors.badge)}>
                          :{p.split(":")[0]}
                        </span>
                      ))}
                    </div>
                  )}
                  {svc.healthcheck && (
                    <span title="healthcheck" className="text-emerald-500 dark:text-emerald-400">
                      <Heart className="size-3" />
                    </span>
                  )}
                  {(svc.volumes ?? []).length > 0 && (
                    <span title="volumes" className="text-zinc-400">
                      <HardDrive className="size-3" />
                    </span>
                  )}
                </div>

                {/* Expanded details */}
                {isSelected && (
                  <div className="mt-2.5 pt-2.5 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
                    {(svc.dependsOn ?? []).length > 0 && (
                      <div>
                        <div className="text-[9px] font-semibold text-zinc-400 uppercase tracking-wide mb-1">depends on</div>
                        <div className="flex gap-1 flex-wrap">
                          {(svc.dependsOn ?? []).map((d) => (
                            <span key={d} className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-1.5 py-0.5 rounded font-mono">
                              {d}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {(svc.ports ?? []).length > 0 && (
                      <div>
                        <div className="text-[9px] font-semibold text-zinc-400 uppercase tracking-wide mb-1">ports</div>
                        <div className="space-y-0.5">
                          {(svc.ports ?? []).map((p) => (
                            <div key={p} className="text-[10px] font-mono text-zinc-600 dark:text-zinc-300">
                              <span className="text-blue-500">{p.split(":")[0]}</span>:{p.split(":")[1]} (host:container)
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {(svc.volumes ?? []).length > 0 && (
                      <div>
                        <div className="text-[9px] font-semibold text-zinc-400 uppercase tracking-wide mb-1">volumes</div>
                        <div className="space-y-0.5">
                          {(svc.volumes ?? []).map((v) => (
                            <div key={v} className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 truncate">{v}</div>
                          ))}
                        </div>
                      </div>
                    )}
                    {svc.healthcheck && (
                      <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400">
                        <Heart className="size-3" />
                        healthcheck enabled
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {!selected && services.length > 0 && (
          <p className="text-center text-[10px] text-zinc-400 mt-3">
            Click a service card to see its ports, volumes &amp; dependencies
          </p>
        )}
      </div>
    </div>
  );
}
