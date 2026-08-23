"use client";

import { z } from "zod";
import { useState, useEffect, useRef } from "react";
import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";

export const KubernetesHpaSchema = z.object({
  deploymentName: z.string().default("api-deployment"),
  minReplicas: z.number().default(2),
  maxReplicas: z.number().default(10),
  targetCpuPercent: z.number().default(70),
  currentCpuPercent: z.number().default(35),
  currentReplicas: z.number().default(2),
});

export type KubernetesHpaProps = z.infer<typeof KubernetesHpaSchema>;

type HistoryEntry = { pods: number; label: string };

function cpuBarColor(cpu: number, target: number) {
  if (cpu > target) return "bg-red-500";
  if (cpu > 60) return "bg-amber-500";
  return "bg-emerald-500";
}

export function KubernetesHpa({
  deploymentName = "api-deployment",
  minReplicas = 2,
  maxReplicas = 10,
  targetCpuPercent = 70,
  currentCpuPercent = 35,
  currentReplicas = 2,
}: KubernetesHpaProps) {
  const [cpu, setCpu] = useState(currentCpuPercent);
  const [replicas, setReplicas] = useState(currentReplicas);
  const [scaling, setScaling] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([
    { pods: 2, label: "t-5" },
    { pods: 2, label: "t-4" },
    { pods: 4, label: "t-3" },
    { pods: 8, label: "t-2" },
    { pods: 4, label: "t-1" },
    { pods: currentReplicas, label: "now" },
  ]);
  const animRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setCpu(currentCpuPercent);
    setReplicas(currentReplicas);
  }, [currentCpuPercent, currentReplicas]);

  function desired(currentPods: number, actualCpu: number) {
    return Math.min(maxReplicas, Math.max(minReplicas, Math.ceil(currentPods * (actualCpu / targetCpuPercent))));
  }

  function animatePods(from: number, to: number, finalCpu: number) {
    if (animRef.current) clearTimeout(animRef.current);
    setScaling(true);
    const step = to > from ? 1 : -1;
    let current = from;
    function next() {
      current += step;
      setReplicas(current);
      if (current !== to) {
        animRef.current = setTimeout(next, 600);
      } else {
        setHistory(prev => {
          const next6 = [...prev.slice(-5), { pods: to, label: "now" }].map((h, i, arr) =>
            i === arr.length - 1 ? h : { ...h, label: `t-${arr.length - 1 - i}` }
          );
          return next6;
        });
        setScaling(false);
        setCpu(finalCpu);
      }
    }
    animRef.current = setTimeout(next, 600);
  }

  function handleSpike() {
    if (scaling) return;
    const newCpu = 140;
    setCpu(newCpu);
    const target = desired(replicas, newCpu);
    if (target !== replicas) {
      animatePods(replicas, target, newCpu);
    } else {
      setHistory(prev => {
        const next6 = [...prev.slice(-5), { pods: replicas, label: "now" }].map((h, i, arr) =>
          i === arr.length - 1 ? h : { ...h, label: `t-${arr.length - 1 - i}` }
        );
        return next6;
      });
    }
  }

  function handleScaleDown() {
    if (scaling) return;
    const newCpu = 25;
    setCpu(newCpu);
    const target = desired(replicas, newCpu);
    if (target !== replicas) {
      animatePods(replicas, target, newCpu);
    } else {
      setHistory(prev => {
        const next6 = [...prev.slice(-5), { pods: replicas, label: "now" }].map((h, i, arr) =>
          i === arr.length - 1 ? h : { ...h, label: `t-${arr.length - 1 - i}` }
        );
        return next6;
      });
    }
  }

  const desiredReplicas = desired(replicas, cpu);
  const formulaResult = desiredReplicas;
  const noChange = desiredReplicas === replicas;

  const historyMax = Math.max(...history.map(h => h.pods), maxReplicas / 2);

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-500" />
          <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">Kubernetes HPA</span>
        </div>
        <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">{deploymentName}</span>
      </div>

      {/* Body */}
      <div className="px-4 py-4 min-h-[280px] flex flex-col gap-4">
        {/* CPU Bar */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 w-28 shrink-0">
            CPU: <span className={cn("font-bold", cpu > targetCpuPercent ? "text-red-500" : cpu > 60 ? "text-amber-500" : "text-emerald-600 dark:text-emerald-400")}>{Math.round(cpu)}%</span>
          </span>
          <div className="flex-1 h-3 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-500", cpuBarColor(cpu, targetCpuPercent))}
              style={{ width: `${Math.min(100, (cpu / 200) * 100)}%` }}
            />
          </div>
          <span className="text-xs text-zinc-500 dark:text-zinc-400 shrink-0">Target: {targetCpuPercent}%</span>
        </div>

        {/* Pod Grid */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 w-28 shrink-0">Pods:</span>
          <div className="flex flex-wrap gap-1.5 flex-1">
            {Array.from({ length: maxReplicas }).map((_, i) => {
              const active = i < replicas;
              return (
                <div
                  key={i}
                  className={cn(
                    "w-6 h-6 rounded border-2 transition-all duration-500",
                    active
                      ? "bg-emerald-500 border-emerald-500 dark:bg-emerald-500 dark:border-emerald-500"
                      : "bg-transparent border-zinc-200 dark:border-zinc-700"
                  )}
                />
              );
            })}
          </div>
          <span className="text-xs text-zinc-500 dark:text-zinc-400 shrink-0 font-mono">{replicas} / {maxReplicas}</span>
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleSpike}
            disabled={scaling}
            className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            Spike Traffic →
          </button>
          <button
            onClick={handleScaleDown}
            disabled={scaling}
            className="border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg px-4 py-2 text-sm font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all duration-500 disabled:opacity-40"
          >
            Scale Down ←
          </button>
        </div>

        {/* Formula */}
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/50 px-3 py-2 text-xs font-mono text-zinc-600 dark:text-zinc-400">
          <span className="text-zinc-400 dark:text-zinc-500">Formula: </span>
          desired = ceil(current × actual/target)<br />
          <span className="text-zinc-900 dark:text-zinc-100">
            = ceil({replicas} × {Math.round(cpu)}/{targetCpuPercent}) = ceil({(replicas * cpu / targetCpuPercent).toFixed(1)}) = {formulaResult}
            {" "}
            <span className={noChange ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}>
              {noChange ? "✓ no change" : `→ scaling to ${formulaResult}`}
            </span>
          </span>
        </div>

        {/* History Bar */}
        <div className="mt-auto">
          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3">
            <div className="flex items-end gap-1.5">
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 mr-1 shrink-0">History:</span>
              {history.map((h, i) => (
                <div key={i} className="flex flex-col items-center gap-0.5 flex-1">
                  <div
                    className="w-full rounded-sm bg-blue-400 dark:bg-blue-500 transition-all duration-500"
                    style={{ height: `${Math.max(4, (h.pods / historyMax) * 28)}px` }}
                  />
                  <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-mono">{h.pods}p</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
