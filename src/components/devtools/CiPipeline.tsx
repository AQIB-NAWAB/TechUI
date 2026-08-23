"use client";

import { useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Play, CheckCircle2, XCircle, Clock, Circle, RefreshCw, GitBranch } from "lucide-react";

const StepStatusEnum = z.enum(["pending", "running", "success", "failed", "skipped", "cancelled"]);
const StageStatusEnum = z.enum(["pending", "running", "success", "failed", "skipped"]);

export const CiPipelineSchema = z.object({
  name: z.string().optional().default("CI/CD Pipeline"),
  branch: z.string().optional().default("main"),
  commit: z.string().optional().default("a1b2c3d4"),
  triggeredBy: z.string().optional(),
  stages: z.array(
    z.object({
      name: z.string(),
      status: StageStatusEnum.optional().default("pending"),
      duration: z.string().optional(),
      steps: z.array(
        z.object({
          name: z.string(),
          status: StepStatusEnum.optional().default("pending"),
          duration: z.string().optional(),
          log: z.string().optional(),
        })
      ),
    })
  ),
  interactive: z.boolean().optional().default(false),
});

export type CiPipelineProps = z.infer<typeof CiPipelineSchema>;

type StepStatus = z.infer<typeof StepStatusEnum>;
type StageStatus = z.infer<typeof StageStatusEnum>;

const STATUS_CFG: Record<StepStatus | StageStatus, {
  icon: (sz?: string) => React.ReactNode;
  text: string;
  bg: string;
  ring?: string;
}> = {
  pending:   {
    icon: (sz = "size-3.5") => <Circle className={cn(sz, "text-zinc-400")} />,
    text: "text-zinc-400 dark:text-zinc-600",
    bg: "",
  },
  running:   {
    icon: (sz = "size-3.5") => <RefreshCw className={cn(sz, "text-blue-500 animate-spin")} />,
    text: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/10",
    ring: "border-blue-200 dark:border-blue-900/40",
  },
  success:   {
    icon: (sz = "size-3.5") => <CheckCircle2 className={cn(sz, "text-emerald-500")} />,
    text: "text-emerald-600 dark:text-emerald-400",
    bg: "",
  },
  failed:    {
    icon: (sz = "size-3.5") => <XCircle className={cn(sz, "text-red-500")} />,
    text: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/10",
    ring: "border-red-200 dark:border-red-900/30",
  },
  skipped:   {
    icon: (sz = "size-3.5") => <Circle className={cn(sz, "text-zinc-300 dark:text-zinc-700")} />,
    text: "text-zinc-400 dark:text-zinc-600",
    bg: "",
  },
  cancelled: {
    icon: (sz = "size-3.5") => <XCircle className={cn(sz, "text-zinc-400")} />,
    text: "text-zinc-500 dark:text-zinc-500",
    bg: "",
  },
};

function overallStatus(stages: CiPipelineProps["stages"]): StageStatus {
  if (stages.some((s) => s.status === "failed")) return "failed";
  if (stages.some((s) => s.status === "running")) return "running";
  if (stages.every((s) => s.status === "success")) return "success";
  if (stages.some((s) => s.status === "success" || s.status === "running")) return "running";
  return "pending";
}

export function CiPipeline({
  name = "CI/CD Pipeline",
  branch = "main",
  commit = "a1b2c3d4",
  triggeredBy,
  stages,
  interactive = false,
}: CiPipelineProps) {
  const [expanded, setExpanded] = useState<Set<number>>(
    () => new Set(stages.map((_, i) => i).filter((i) => stages[i]?.status === "failed" || stages[i]?.status === "running"))
  );

  function toggle(i: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  const overall = overallStatus(stages);
  const cfg = STATUS_CFG[overall];
  const totalDuration = stages
    .filter((s) => s.duration)
    .reduce((acc, s) => {
      const secs = parseDuration(s.duration!);
      return acc + secs;
    }, 0);

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
      {/* Header */}
      <div className={cn("flex items-center gap-3 px-4 py-3 border-b border-zinc-100 dark:border-zinc-900", cfg.bg, cfg.ring && `border-b ${cfg.ring}`)}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {cfg.icon("size-4")}
            <span className="text-sm font-bold text-zinc-800 dark:text-zinc-100">{name}</span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-[10px] text-zinc-400 flex-wrap">
            <span className="flex items-center gap-1">
              <GitBranch className="size-3" />
              <span className="font-mono">{branch}</span>
            </span>
            <span className="font-mono">{commit.slice(0, 8)}</span>
            {triggeredBy && <span>by {triggeredBy}</span>}
            {totalDuration > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="size-3" />
                {formatDuration(totalDuration)}
              </span>
            )}
          </div>
        </div>

        {interactive && (
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors">
            <Play className="size-3" fill="currentColor" />
            Re-run
          </button>
        )}
      </div>

      {/* Pipeline flow */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-2 overflow-x-auto">
        {stages.map((stage, i) => {
          const sc = STATUS_CFG[stage.status ?? "pending"];
          return (
            <div key={i} className="flex items-center gap-2 shrink-0">
              <div className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium cursor-pointer transition-all",
                expanded.has(i)
                  ? "border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900"
                  : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700",
                sc.text
              )} onClick={() => toggle(i)}>
                {sc.icon("size-3.5")}
                <span className="text-zinc-700 dark:text-zinc-300 font-semibold">{stage.name}</span>
                {stage.duration && (
                  <span className="text-zinc-400 dark:text-zinc-600 text-[10px]">{stage.duration}</span>
                )}
              </div>
              {i < stages.length - 1 && (
                <div className="h-px w-4 bg-zinc-200 dark:bg-zinc-800 shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {/* Stage details */}
      <div className="divide-y divide-zinc-50 dark:divide-zinc-900">
        {stages.map((stage, si) => {
          if (!expanded.has(si)) return null;
          return (
            <div key={si} className="px-4 py-3">
              <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide mb-2">{stage.name}</div>
              <div className="space-y-1">
                {stage.steps.map((step, stepi) => {
                  const sc = STATUS_CFG[step.status ?? "pending"];
                  return (
                    <div key={stepi} className={cn("flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs", sc.bg)}>
                      {sc.icon()}
                      <span className={cn("flex-1 font-medium", sc.text === "text-zinc-400 dark:text-zinc-600" ? "text-zinc-600 dark:text-zinc-400" : sc.text)}>
                        {step.name}
                      </span>
                      {step.duration && (
                        <span className="text-[10px] font-mono text-zinc-400">{step.duration}</span>
                      )}
                    </div>
                  );
                })}
              </div>
              {stage.steps.find((s) => s.log && (s.status === "failed" || s.status === "running")) && (
                <div className="mt-2 rounded-lg bg-zinc-950 border border-zinc-800 p-3 font-mono text-[11px] text-zinc-400 leading-5 max-h-32 overflow-y-auto">
                  {stage.steps.find((s) => s.log)?.log}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function parseDuration(d: string): number {
  const m = d.match(/(\d+)m\s*(\d+)?s?/);
  if (m) return parseInt(m[1]!) * 60 + (parseInt(m[2] ?? "0") || 0);
  const s = d.match(/(\d+)s/);
  if (s) return parseInt(s[1]!);
  return 0;
}

function formatDuration(secs: number): string {
  if (secs < 60) return `${secs}s`;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}
