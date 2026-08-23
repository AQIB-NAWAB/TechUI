"use client";

import { useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { RefreshCw, ChevronDown, ChevronRight, Box } from "lucide-react";

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
  opacity: number;
  scale: number;
};

const STATUS_CFG: Record<PodStatus, { border: string; bg: string; dot: string; label: string }> = {
  running:     { border: "border-emerald-300 dark:border-emerald-700", bg: "bg-emerald-50 dark:bg-emerald-950/30", dot: "bg-emerald-500", label: "Running"     },
  ready:       { border: "border-emerald-300 dark:border-emerald-700", bg: "bg-emerald-50 dark:bg-emerald-950/30", dot: "bg-emerald-500", label: "Ready"       },
  pending:     { border: "border-amber-300 dark:border-amber-700",     bg: "bg-amber-50 dark:bg-amber-950/30",     dot: "bg-amber-500",   label: "Pending"     },
  terminating: { border: "border-red-300 dark:border-red-700",         bg: "bg-red-50 dark:bg-red-950/30",         dot: "bg-red-400",     label: "Terminating" },
};

function makePods(name: string, count: number, version: string): Pod[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${Math.random().toString(36).slice(2, 7)}-${i}`,
    name: `${name}-${Math.random().toString(36).slice(2, 7)}`,
    status: "running" as PodStatus,
    version,
    opacity: 1,
    scale: 1,
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
  maxSurge = 1,
  maxUnavailable = 0,
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
      setPods((prev) => prev.map((p) => ({ ...p, status: "terminating" as PodStatus })));
      await delay(700);
      setPods([]);
      await delay(400);
      const newPods = makePods(name, replicas, newTag).map((p) => ({ ...p, status: "pending" as PodStatus }));
      setPods(newPods);
      await delay(600);
      setPods((prev) => prev.map((p) => ({ ...p, status: "running" as PodStatus })));
      setUpdatedCount(replicas);
    } else {
      const initialPods = makePods(name, replicas, currentTag);
      setPods(initialPods);

      for (let i = replicas - 1; i >= 0; i--) {
        await delay(200);

        setPods((prev) => {
          const updated = [...prev];
          if (updated[i]) {
            updated[i] = { ...updated[i]!, status: "terminating" };
          }
          return updated;
        });

        await delay(500);

        const newPod: Pod = {
          id: `new-${Math.random().toString(36).slice(2, 7)}`,
          name: `${name}-${Math.random().toString(36).slice(2, 7)}`,
          status: "pending",
          version: newTag,
          opacity: 1,
          scale: 1,
        };

        setPods((prev) => {
          const updated = [...prev];
          updated[i] = newPod;
          return updated;
        });

        await delay(400);

        setPods((prev) => {
          const updated = [...prev];
          if (updated[i]) {
            updated[i] = { ...updated[i]!, status: "running" };
          }
          return updated;
        });

        setUpdatedCount((c) => c + 1);
        await delay(300);
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
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden text-sm">

      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900/40 border-b border-zinc-100 dark:border-zinc-900">
        <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide">Deployment</span>
        <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex-1">{name}</span>
        <span className="text-[10px] font-mono text-zinc-400 border border-zinc-200 dark:border-zinc-700 px-1.5 py-0.5 rounded">{namespace}</span>
        {interactive && (
          <div className="flex items-center gap-1.5">
            {rolledOut && (
              <button onClick={reset} className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors" title="Reset">
                <RefreshCw className="size-3.5" />
              </button>
            )}
            {!rolledOut && (
              <button
                onClick={rollout}
                disabled={rolling}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors disabled:opacity-40"
              >
                {rolling && <RefreshCw className="size-3 animate-spin" />}
                {rolling ? "Updating…" : "Roll out"}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Strategy selector */}
      <div className="px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-900 flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => !rolling && setActiveStrategy("RollingUpdate")}
            className={cn(
              "text-[11px] px-2.5 py-1 rounded font-semibold transition-all duration-300",
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
              "text-[11px] px-2.5 py-1 rounded font-semibold transition-all duration-300",
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

      {/* Rolling update progress */}
      {rolling && (
        <div className="px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-900">
          <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1.5">
            <span>Update progress</span>
            <span className="font-semibold">{updatedCount}/{replicas} replicas updated</span>
          </div>
          <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-500"
              style={{ width: `${(updatedCount / replicas) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* ReplicaSet label */}
      <div className="px-4 py-2 flex items-center gap-2 bg-zinc-50/30 dark:bg-zinc-900/10 border-b border-zinc-50 dark:border-zinc-900/50">
        <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wide">ReplicaSet</span>
        <span className="text-[10px] font-mono text-zinc-500">{name}-{currentTag.replace(/\./g, "")}</span>
        <span className="ml-auto text-[10px] text-zinc-400">{readyCount}/{pods.length} ready</span>
      </div>

      {/* Pod cards */}
      <div className="px-4 py-3 flex flex-wrap gap-2">
        {pods.map((pod, i) => {
          const sc = STATUS_CFG[pod.status];
          const isNew = pod.version === newTag;
          return (
            <div
              key={pod.id}
              style={{ transitionDelay: `${i * 100}ms` }}
              className={cn(
                "flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-all duration-700",
                sc.border, sc.bg,
                pod.status === "terminating" && "opacity-30 scale-95",
              )}
            >
              <Box className={cn(
                "size-3 shrink-0",
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
                  <span className={cn("size-1 rounded-full", sc.dot, pod.status === "pending" && "animate-pulse")} />
                  <span className={cn("text-[9px]", isNew ? "text-blue-500" : "text-zinc-400")}>{pod.version}</span>
                </div>
              </div>
            </div>
          );
        })}
        {pods.length === 0 && (
          <span className="text-[11px] text-zinc-400 italic">All pods terminated…</span>
        )}
      </div>

      {/* Spec accordion */}
      <div className="border-t border-zinc-100 dark:border-zinc-900">
        <button
          onClick={() => setShowSpec((v) => !v)}
          className="w-full flex items-center gap-2 px-4 py-2 text-left text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
        >
          {showSpec ? <ChevronDown className="size-3 shrink-0" /> : <ChevronRight className="size-3 shrink-0" />}
          Labels &amp; selector
        </button>
        {showSpec && (
          <div className="px-4 pb-3 flex flex-wrap gap-1.5">
            {Object.entries(effectiveLabels).map(([k, v]) => (
              <span key={k} className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-2 py-0.5 rounded">
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
