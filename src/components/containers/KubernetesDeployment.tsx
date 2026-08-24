"use client";

import { useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { RefreshCw, ChevronDown, ChevronRight, Box, Layers } from "lucide-react";

export const KubernetesDeploymentSchema = z.object({
  name: z.string().default("api-server"),
  namespace: z.string().optional().default("default"),
  image: z.string().default("registry.example.com/api-server:v2.1.0"),
  replicas: z.number().int().min(1).max(10).default(3),
  labels: z.record(z.string(), z.string()).optional(),
  strategy: z.enum(["RollingUpdate", "Recreate"]).optional().default("RollingUpdate"),
  maxSurge: z.number().optional().default(1),
  maxUnavailable: z.number().optional().default(0),
  interactive: z.boolean().optional().default(true),
});

export type KubernetesDeploymentProps = z.infer<typeof KubernetesDeploymentSchema>;

type PodStatus = "running" | "pending" | "terminating" | "ready";

type Pod = {
  id: string;
  name: string;
  status: PodStatus;
  version: string;
  fading: "in" | "out" | "none";
};

const STATUS_CFG: Record<PodStatus, { border: string; bg: string; dot: string; label: string }> = {
  running:     { border: "border-emerald-300 dark:border-emerald-700", bg: "bg-emerald-50 dark:bg-emerald-950/30", dot: "bg-emerald-500", label: "Running"     },
  ready:       { border: "border-emerald-300 dark:border-emerald-700", bg: "bg-emerald-50 dark:bg-emerald-950/30", dot: "bg-emerald-500", label: "Ready"       },
  pending:     { border: "border-amber-300 dark:border-amber-700",     bg: "bg-amber-50 dark:bg-amber-950/30",     dot: "bg-amber-500",   label: "Pending"     },
  terminating: { border: "border-red-300 dark:border-red-700",         bg: "bg-red-50 dark:bg-red-950/30",         dot: "bg-red-400",     label: "Terminating" },
};

const STRATEGY_COPY = {
  RollingUpdate: "Replaces pods one at a time — old pods fade out while new ones fade in. Zero downtime.",
  Recreate: "Terminates all old pods first, then creates new ones. Brief downtime, but simpler.",
};

function makePods(name: string, count: number, version: string): Pod[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${Math.random().toString(36).slice(2, 7)}-${i}`,
    name: `${name}-${Math.random().toString(36).slice(2, 7)}`,
    status: "running" as PodStatus,
    version,
    fading: "none" as const,
  }));
}

function imageTag(image: string) {
  return image.split(":").pop() ?? "latest";
}

function nextTag(tag: string) {
  const m = tag.match(/^(v?)(\d+)\.(\d+)\.(\d+)$/);
  if (!m) return tag + "-new";
  return `${m[1]}${m[2]}.${m[3]}.${parseInt(m[4]!) + 1}`;
}

export function KubernetesDeployment({
  name = "api-server",
  namespace = "default",
  image = "registry.example.com/api-server:v2.1.0",
  replicas = 3,
  labels,
  strategy = "RollingUpdate",
  interactive = true,
}: KubernetesDeploymentProps) {
  const currentTag = imageTag(image);
  const newTag = nextTag(currentTag);

  const [pods, setPods] = useState<Pod[]>(() => makePods(name, replicas, currentTag));
  const [rolling, setRolling] = useState(false);
  const [rolledOut, setRolledOut] = useState(false);
  const [showSpec, setShowSpec] = useState(false);
  const [updatedCount, setUpdatedCount] = useState(0);
  const [activeStrategy, setActiveStrategy] = useState(strategy);

  const readyCount = pods.filter((p) => p.status === "running" || p.status === "ready").length;

  async function rollout() {
    if (rolling) return;
    setRolling(true);
    setRolledOut(false);
    setUpdatedCount(0);

    if (activeStrategy === "Recreate") {
      setPods((prev) => prev.map((p) => ({ ...p, status: "terminating" as PodStatus, fading: "out" as const })));
      await delay(1200);
      setPods([]);
      await delay(800);
      const newPods = makePods(name, replicas, newTag).map((p) => ({ ...p, status: "pending" as PodStatus, fading: "in" as const }));
      setPods(newPods);
      await delay(1200);
      setPods((prev) => prev.map((p) => ({ ...p, status: "running" as PodStatus, fading: "none" as const })));
      setUpdatedCount(replicas);
    } else {
      const initialPods = makePods(name, replicas, currentTag);
      setPods(initialPods);

      for (let i = replicas - 1; i >= 0; i--) {
        setPods((prev) => {
          const updated = [...prev];
          if (updated[i]) {
            updated[i] = { ...updated[i]!, status: "terminating", fading: "out" };
          }
          return updated;
        });

        await delay(1200);

        const newPod: Pod = {
          id: `new-${Math.random().toString(36).slice(2, 7)}`,
          name: `${name}-${Math.random().toString(36).slice(2, 7)}`,
          status: "pending",
          version: newTag,
          fading: "in",
        };

        setPods((prev) => {
          const updated = [...prev];
          updated[i] = newPod;
          return updated;
        });

        await delay(1200);

        setPods((prev) => {
          const updated = [...prev];
          if (updated[i]) {
            updated[i] = { ...updated[i]!, status: "running", fading: "none" };
          }
          return updated;
        });

        setUpdatedCount((c) => c + 1);
      }
    }

    setRolling(false);
    setRolledOut(true);
  }

  function reset() {
    setPods(makePods(name, replicas, currentTag));
    setRolling(false);
    setRolledOut(false);
    setUpdatedCount(0);
  }

  const effectiveLabels = labels ?? { app: name, env: namespace === "default" ? "staging" : namespace };

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden text-sm">

      <div className="flex items-center gap-2 h-12 px-4 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800">
        <Layers className="size-4 text-violet-500 shrink-0" />
        <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">Deployment</span>
        <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex-1">{name}</span>
        <span className="text-[10px] font-mono text-zinc-400 border border-zinc-200 dark:border-zinc-700 px-1.5 py-0.5 rounded">{namespace}</span>
        {interactive && (
          <div className="flex items-center gap-1.5">
            {rolledOut && (
              <button onClick={reset} className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all duration-500" title="Reset">
                <RefreshCw className="size-3.5" />
              </button>
            )}
            {!rolledOut && (
              <button
                onClick={rollout}
                disabled={rolling}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 transition-all duration-500 disabled:opacity-40"
              >
                {rolling && <RefreshCw className="size-3 animate-spin" />}
                {rolling ? "Updating…" : "Roll out"}
              </button>
            )}
          </div>
        )}
      </div>

      <div className={cn(
        "px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800 text-[11px] leading-relaxed transition-all duration-500",
        activeStrategy === "RollingUpdate"
          ? "bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400"
          : "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400"
      )}>
        <span className="font-semibold">{activeStrategy === "RollingUpdate" ? "Rolling Update" : "Recreate"}:</span>{" "}
        {STRATEGY_COPY[activeStrategy]}
      </div>

      <div className="px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => !rolling && setActiveStrategy("RollingUpdate")}
            className={cn(
              "text-[11px] px-2.5 py-1 rounded font-semibold transition-all duration-500",
              activeStrategy === "RollingUpdate"
                ? "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
                : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
            )}
          >
            Rolling Update
          </button>
          <button
            onClick={() => !rolling && setActiveStrategy("Recreate")}
            className={cn(
              "text-[11px] px-2.5 py-1 rounded font-semibold transition-all duration-500",
              activeStrategy === "Recreate"
                ? "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
            )}
          >
            Recreate
          </button>
        </div>
        <code className="text-[11px] font-mono text-zinc-500 ml-auto truncate">
          <span className="text-zinc-400">{image.split(":")[0]}:</span>
          <span className={cn("font-semibold", rolledOut ? "text-blue-600 dark:text-blue-400" : "text-zinc-700 dark:text-zinc-300")}>
            {rolledOut ? newTag : currentTag}
          </span>
        </code>
      </div>

      {(rolling || rolledOut) && (
        <div className="px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1.5">
            <span className="font-semibold uppercase tracking-widest">Update progress</span>
            <span className="font-semibold">{updatedCount}/{replicas} replicas updated</span>
          </div>
          <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-700"
              style={{ width: `${(updatedCount / replicas) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="px-4 py-2 flex items-center gap-2 bg-zinc-50/30 dark:bg-zinc-800/30 border-b border-zinc-100 dark:border-zinc-800">
        <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-widest">ReplicaSet</span>
        <span className="text-[10px] font-mono text-zinc-500">{name}-{currentTag.replace(/\./g, "")}</span>
        <span className="ml-auto text-[10px] text-zinc-400">{readyCount}/{pods.length} ready</span>
      </div>

      <div className="px-4 py-4 min-h-[88px] flex flex-wrap gap-2 items-start">
        {pods.map((pod, i) => {
          const sc = STATUS_CFG[pod.status];
          const isNew = pod.version === newTag;
          return (
            <div
              key={pod.id}
              style={{ transitionDelay: `${i * 200}ms` }}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-700",
                sc.border, sc.bg,
                pod.fading === "out" && "opacity-20 scale-95 -translate-x-1",
                pod.fading === "in" && "opacity-100 scale-100 translate-x-0",
                pod.status === "terminating" && pod.fading === "none" && "opacity-40",
              )}
            >
              <Box className={cn(
                "size-4 shrink-0 transition-all duration-500",
                isNew ? "text-blue-500" : "text-zinc-400",
                pod.status === "pending" && "animate-pulse"
              )} />
              <div className="min-w-0">
                <code className={cn(
                  "text-[10px] font-mono block truncate max-w-[80px]",
                  isNew ? "text-blue-600 dark:text-blue-400" : "text-zinc-600 dark:text-zinc-400"
                )}>
                  {pod.name.split("-").slice(-1)[0]}
                </code>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className={cn("size-1.5 rounded-full", sc.dot, pod.status === "pending" && "animate-pulse")} />
                  <span className={cn("text-[9px] font-mono", isNew ? "text-blue-500" : "text-zinc-400")}>{pod.version}</span>
                </div>
              </div>
            </div>
          );
        })}
        {pods.length === 0 && rolling && (
          <span className="text-[11px] text-zinc-400 italic transition-opacity duration-700">All pods terminated…</span>
        )}
      </div>

      <div className="border-t border-zinc-100 dark:border-zinc-800">
        <button
          onClick={() => setShowSpec((v) => !v)}
          className="w-full flex items-center gap-2 px-4 py-2 text-left text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all duration-500"
        >
          {showSpec ? <ChevronDown className="size-3 shrink-0" /> : <ChevronRight className="size-3 shrink-0" />}
          Labels &amp; selector
        </button>
        {showSpec && (
          <div className="px-4 pb-3 flex flex-wrap gap-1.5">
            {Object.entries(effectiveLabels).map(([k, v]) => (
              <span key={k} className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2 py-0.5 rounded">
                {k}={String(v)}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}
