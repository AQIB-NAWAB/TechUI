"use client";

import { useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import {
  Play,
  CheckCircle,
  XCircle,
  Clock,
  Circle,
  RefreshCw,
  GitBranch,
  Package,
  TestTube,
  Hammer,
  Rocket,
  Workflow,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

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
  pending: {
    icon: (sz = "size-3.5") => <Clock className={cn(sz, "text-zinc-400")} />,
    text: "text-zinc-400 dark:text-zinc-600",
    bg: "",
  },
  running: {
    icon: (sz = "size-3.5") => <RefreshCw className={cn(sz, "text-amber-500 animate-spin")} />,
    text: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    ring: "border-amber-200 dark:border-amber-800",
  },
  success: {
    icon: (sz = "size-3.5") => <CheckCircle className={cn(sz, "text-emerald-500")} />,
    text: "text-emerald-600 dark:text-emerald-400",
    bg: "",
  },
  failed: {
    icon: (sz = "size-3.5") => <XCircle className={cn(sz, "text-red-500")} />,
    text: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/30",
    ring: "border-red-200 dark:border-red-800",
  },
  skipped: {
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

function getStageIcon(name: string): LucideIcon {
  const n = name.toLowerCase();
  if (n.includes("install") || n.includes("deps") || n.includes("setup")) return Package;
  if (n.includes("test") || n.includes("lint")) return TestTube;
  if (n.includes("build") || n.includes("compile")) return Hammer;
  if (n.includes("deploy") || n.includes("release") || n.includes("publish")) return Rocket;
  return Workflow;
}

function overallStatus(stages: CiPipelineProps["stages"]): StageStatus {
  if (stages.some((s) => s.status === "failed")) return "failed";
  if (stages.some((s) => s.status === "running")) return "running";
  if (stages.every((s) => s.status === "success")) return "success";
  if (stages.some((s) => s.status === "success" || s.status === "running")) return "running";
  return "pending";
}

function progressPercent(stages: CiPipelineProps["stages"]): number {
  const done = stages.filter((s) => s.status === "success" || s.status === "failed" || s.status === "skipped").length;
  return stages.length ? (done / stages.length) * 100 : 0;
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
  const progress = progressPercent(stages);
  const totalDuration = stages
    .filter((s) => s.duration)
    .reduce((acc, s) => acc + parseDuration(s.duration!), 0);

  const failedLog = stages
    .flatMap((s) => s.steps)
    .find((s) => s.log && (s.status === "failed" || s.status === "running"))?.log;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800">
        <Workflow className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1 truncate">{name}</span>
        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-all duration-500", cfg.text,
          overall === "success" ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800" :
          overall === "failed" ? "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800" :
          overall === "running" ? "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800" :
          "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700"
        )}>
          {overall}
        </span>
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        Automated build steps that run on every code push — install, test, build, then deploy.
      </p>

      <div className="px-4 pt-3 pb-2 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-3 text-[10px] text-zinc-400 mb-2 flex-wrap">
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
        <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-700",
              overall === "failed" ? "bg-red-500" : overall === "success" ? "bg-emerald-500" : "bg-blue-500"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="min-h-[240px] flex flex-col">
        <div className="px-4 pt-3 pb-2 flex items-center gap-2 overflow-x-auto shrink-0">
          {stages.map((stage, i) => {
            const sc = STATUS_CFG[stage.status ?? "pending"];
            const StageIcon = getStageIcon(stage.name);
            return (
              <div key={i} className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition-all duration-500",
                    expanded.has(i)
                      ? "border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800/50"
                      : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700",
                    sc.text
                  )}
                  onClick={() => toggle(i)}
                >
                  <StageIcon className="size-3.5 text-zinc-500 shrink-0" />
                  {sc.icon("size-3")}
                  <span className="text-zinc-700 dark:text-zinc-300 font-semibold">{stage.name}</span>
                  {stage.duration && (
                    <span className="text-zinc-400 dark:text-zinc-600 text-[10px]">{stage.duration}</span>
                  )}
                </button>
                {i < stages.length - 1 && (
                  <div className="h-px w-4 bg-zinc-200 dark:bg-zinc-800 shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-3 min-h-[140px]">
          {stages.map((stage, si) => {
            if (!expanded.has(si)) return null;
            return (
              <div key={si} className="mb-3 last:mb-0 border border-zinc-100 dark:border-zinc-800 rounded-lg p-3">
                <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2">
                  {stage.name}
                </div>
                <div className="space-y-1">
                  {stage.steps.map((step, stepi) => {
                    const sc = STATUS_CFG[step.status ?? "pending"];
                    return (
                      <div key={stepi} className={cn("flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-all duration-500", sc.bg)}>
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
                {stage.steps.some((s) => s.log && s.status === "failed") && (
                  <div className="mt-2 rounded-lg border border-red-200 dark:border-red-800 border-l-4 border-l-red-500 bg-red-50 dark:bg-red-950/30 p-3 font-mono text-[11px] text-red-700 dark:text-red-400 leading-5 max-h-28 overflow-y-auto">
                    {stage.steps.find((s) => s.log && s.status === "failed")?.log}
                  </div>
                )}
              </div>
            );
          })}
          {expanded.size === 0 && (
            <p className="text-xs text-zinc-400 text-center py-8">Click a stage above to see its steps</p>
          )}
        </div>
      </div>

      <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
        <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1 truncate">
          {failedLog ? "Pipeline failed — check the error log above" : `${Math.round(progress)}% complete`}
        </span>
        {interactive && (
          <button className="flex items-center gap-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity shrink-0">
            <Play className="size-3.5" />
            Re-run
          </button>
        )}
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
