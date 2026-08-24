"use client";

import { useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Layers, ArrowDown, RefreshCw } from "lucide-react";

export const PriorityQueueSchema = z.object({
  name: z.string().optional().default("Priority Queue"),
  interactive: z.boolean().optional().default(true),
});

export type PriorityQueueProps = z.infer<typeof PriorityQueueSchema>;

type Job = { id: number; label: string; priority: number };

const PRESETS: Array<{ label: string; priority: number }> = [
  { label: "User login", priority: 1 },
  { label: "Payment", priority: 9 },
  { label: "Analytics ping", priority: 2 },
  { label: "Critical alert", priority: 10 },
  { label: "Email digest", priority: 3 },
  { label: "Backup job", priority: 4 },
];

let jobId = 0;

function sortByPriority(jobs: Job[]): Job[] {
  return [...jobs].sort((a, b) => b.priority - a.priority);
}

function priorityColor(p: number) {
  if (p >= 9) return "bg-red-500";
  if (p >= 6) return "bg-amber-500";
  if (p >= 4) return "bg-blue-500";
  return "bg-zinc-400";
}

export function PriorityQueue({ name = "Priority Queue", interactive = true }: PriorityQueueProps) {
  const [queue, setQueue] = useState<Job[]>([
    { id: ++jobId, label: "Payment", priority: 9 },
    { id: ++jobId, label: "Analytics ping", priority: 2 },
    { id: ++jobId, label: "Email digest", priority: 3 },
  ]);
  const [presetIdx, setPresetIdx] = useState(0);
  const [lastDequeued, setLastDequeued] = useState<Job | null>(null);
  const [flash, setFlash] = useState<"enqueue" | "dequeue" | null>(null);

  const sorted = sortByPriority(queue);
  const next = sorted[0] ?? null;

  function enqueue() {
    const preset = PRESETS[presetIdx % PRESETS.length];
    setQueue((q) => [...q, { id: ++jobId, label: preset.label, priority: preset.priority }]);
    setPresetIdx((i) => i + 1);
    setFlash("enqueue");
    setTimeout(() => setFlash(null), 700);
  }

  function dequeue() {
    if (sorted.length === 0) return;
    const top = sorted[0];
    setLastDequeued(top);
    setQueue((q) => q.filter((j) => j.id !== top.id));
    setFlash("dequeue");
    setTimeout(() => setFlash(null), 700);
  }

  function reset() {
    setQueue([
      { id: ++jobId, label: "Payment", priority: 9 },
      { id: ++jobId, label: "Analytics ping", priority: 2 },
      { id: ++jobId, label: "Email digest", priority: 3 },
    ]);
    setPresetIdx(0);
    setLastDequeued(null);
    setFlash(null);
  }

  const statusText =
    flash === "dequeue" && lastDequeued
      ? `Dequeued "${lastDequeued.label}" (priority ${lastDequeued.priority}) — highest priority first.`
      : flash === "enqueue"
      ? "Job added — queue re-sorted by priority."
      : next
      ? `Next up: "${next.label}" with priority ${next.priority}. Lower numbers wait.`
      : "Queue is empty — enqueue jobs to see priority ordering.";

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800">
        <Layers className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">{name}</span>
        <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
          {queue.length} jobs
        </span>
        {interactive && (
          <button
            type="button"
            onClick={reset}
            className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all duration-500"
            title="Reset"
          >
            <RefreshCw className="size-3.5" />
          </button>
        )}
      </div>

      <div className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        Jobs with higher priority numbers are served first — like an ER triage line, not a FIFO queue.
      </div>

      <div className="min-h-[220px] p-4 flex gap-5 items-start">
        <div className="flex flex-col items-center gap-2 shrink-0">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Next out</span>
          <div
            className={cn(
              "relative w-16 h-16 rounded-xl border-2 flex flex-col items-center justify-center transition-all duration-500",
              next
                ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30"
                : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900",
              flash === "dequeue" && "scale-95 opacity-60"
            )}
          >
            {next ? (
              <>
                <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{next.priority}</span>
                <span className="text-[9px] text-zinc-500 dark:text-zinc-400 truncate max-w-[56px]">{next.label}</span>
              </>
            ) : (
              <span className="text-xs text-zinc-400">empty</span>
            )}
          </div>
          <ArrowDown className={cn("size-4 text-zinc-300 dark:text-zinc-600 transition-all duration-500", flash === "dequeue" && "text-emerald-500")} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              Queue (sorted high → low)
            </div>
            {interactive && (
              <button
                type="button"
                onClick={enqueue}
                className="text-[10px] font-semibold px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-500"
              >
                + Enqueue
              </button>
            )}
          </div>
          <div className="rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30 p-2 min-h-[140px] space-y-1.5">
            {sorted.length === 0 && (
              <div className="h-[120px] flex items-center justify-center text-xs text-zinc-400">No jobs waiting</div>
            )}
            {sorted.map((job, i) => (
              <div
                key={job.id}
                className={cn(
                  "flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs transition-all duration-500",
                  i === 0
                    ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20"
                    : "border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                )}
              >
                <span className={cn("size-2 rounded-full shrink-0", priorityColor(job.priority))} />
                <span className="font-mono font-bold w-5 text-zinc-600 dark:text-zinc-300">{job.priority}</span>
                <span className="text-zinc-700 dark:text-zinc-300 truncate flex-1">{job.label}</span>
                {i === 0 && (
                  <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">HEAD</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {interactive && (
        <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/30">
          <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">{statusText}</span>
          <button
            type="button"
            onClick={dequeue}
            disabled={queue.length === 0}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-500 hover:opacity-90 shrink-0",
              queue.length === 0
                ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
                : "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
            )}
          >
            Dequeue
          </button>
        </div>
      )}
    </div>
  );
}
