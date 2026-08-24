"use client";

import { useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Rocket } from "lucide-react";

export const DeploymentStrategySchema = z.object({
  strategy: z.enum(["blue-green", "canary", "rolling"]).default("rolling"),
  oldVersion: z.string().default("v1.2.0"),
  newVersion: z.string().default("v1.3.0"),
  replicas: z.number().int().min(2).max(6).default(4),
  canaryPercent: z.number().min(0).max(100).default(20),
});

export type DeploymentStrategyProps = z.infer<typeof DeploymentStrategySchema>;

type Strategy = "blue-green" | "canary" | "rolling";

// ─── Rolling strategy ────────────────────────────────────────────────────────

function RollingView({
  oldVersion,
  newVersion,
  replicas,
}: {
  oldVersion: string;
  newVersion: string;
  replicas: number;
}) {
  const [updatedCount, setUpdatedCount] = useState(0);
  const [deploying, setDeploying] = useState(false);
  const [done, setDone] = useState(false);

  function deploy() {
    if (deploying || done) return;
    setDeploying(true);

    let count = 0;
    const step = () => {
      count++;
      setUpdatedCount(count);
      if (count < replicas) {
        setTimeout(step, 1000);
      } else {
        setDeploying(false);
        setDone(true);
      }
    };
    setTimeout(step, 1000);
  }

  function reset() {
    setUpdatedCount(0);
    setDeploying(false);
    setDone(false);
  }

  const progressPct = replicas > 0 ? (updatedCount / replicas) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Description */}
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Rolling: Replace pods one at a time — zero downtime throughout
      </p>

      {/* Pods */}
      <div className="flex gap-2 flex-wrap">
        {Array.from({ length: replicas }).map((_, i) => {
          const isNew = i < updatedCount;
          const isActive = i === updatedCount && deploying;
          return (
            <div
              key={i}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-lg border-2 text-[10px] font-bold font-mono transition-all duration-700 min-w-[56px]",
                isNew
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                  : isActive
                  ? "border-blue-400 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 animate-pulse"
                  : "border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
              )}
            >
              <span>{isNew ? newVersion : oldVersion}</span>
              <span className="text-[8px] font-normal opacity-70">
                {isNew ? "new" : isActive ? "updating…" : "old"}
              </span>
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-[10px] mb-1">
          <span className="text-zinc-500 dark:text-zinc-400">Progress</span>
          <span className="font-mono font-bold text-zinc-700 dark:text-zinc-300">
            {updatedCount} / {replicas} updated
          </span>
        </div>
        <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-700"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Properties */}
      <div className="flex gap-2 flex-wrap text-[10px] text-zinc-500 dark:text-zinc-400">
        <span className="flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-emerald-500 inline-block" />
          No downtime
        </span>
        <span className="flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-blue-400 inline-block" />
          Gradual
        </span>
        <span className="flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-amber-400 inline-block" />
          Rollback: instant
        </span>
      </div>

      {/* Status + button — fixed height footer slot inside view */}
      <div className="flex items-center justify-between pt-1 min-h-[40px]">
        <span className="text-[10px] text-zinc-400">
          {done
            ? "All pods updated successfully"
            : deploying
            ? `Updating pod ${updatedCount + 1}/${replicas}…`
            : updatedCount === 0
            ? "Ready to deploy"
            : "In progress…"}
        </span>
        {done ? (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              ✓ Deployment complete
            </span>
            <button
              onClick={reset}
              className="text-[10px] px-2.5 py-1 rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all duration-500"
            >
              Reset
            </button>
          </div>
        ) : (
          <button
            onClick={deploy}
            disabled={deploying}
            className={cn(
              "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity",
              deploying && "opacity-50 cursor-not-allowed"
            )}
          >
            Deploy
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Blue-Green strategy ─────────────────────────────────────────────────────

function BlueGreenView({
  oldVersion,
  newVersion,
  replicas,
}: {
  oldVersion: string;
  newVersion: string;
  replicas: number;
}) {
  // phases: idle -> deploying-green -> switching -> done
  const [phase, setPhase] = useState<"idle" | "deploying" | "switching" | "done">("idle");
  const [trafficOnGreen, setTrafficOnGreen] = useState(false);

  function deploy() {
    if (phase !== "idle") return;
    setPhase("deploying");
    setTimeout(() => {
      setPhase("switching");
      setTimeout(() => {
        setTrafficOnGreen(true);
        setPhase("done");
      }, 1200);
    }, 1400);
  }

  function reset() {
    setPhase("idle");
    setTrafficOnGreen(false);
  }

  const greenReady = phase === "switching" || phase === "done";

  return (
    <div className="space-y-4">
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Blue-Green: Deploy new version alongside old, then flip traffic instantly
      </p>

      {/* Two environments side by side */}
      <div className="grid grid-cols-2 gap-3">
        {/* Blue env */}
        <div
          className={cn(
            "rounded-lg border-2 p-3 transition-all duration-700",
            !trafficOnGreen
              ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20"
              : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 opacity-60"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
              Blue
            </span>
            {!trafficOnGreen && (
              <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded-full font-bold">
                LIVE
              </span>
            )}
            {trafficOnGreen && (
              <span className="text-[10px] text-zinc-400">standby</span>
            )}
          </div>
          <div className="flex gap-1 flex-wrap">
            {Array.from({ length: replicas }).map((_, i) => (
              <div
                key={i}
                className="px-1.5 py-1 rounded text-[9px] font-mono font-bold bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-300"
              >
                {oldVersion}
              </div>
            ))}
          </div>
        </div>

        {/* Green env */}
        <div
          className={cn(
            "rounded-lg border-2 p-3 transition-all duration-700",
            trafficOnGreen
              ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
              : greenReady
              ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
              : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
              Green
            </span>
            {trafficOnGreen && (
              <span className="text-[10px] bg-emerald-500 text-white px-1.5 py-0.5 rounded-full font-bold">
                LIVE
              </span>
            )}
            {phase === "deploying" && (
              <span className="text-[10px] text-blue-500 animate-pulse">
                deploying…
              </span>
            )}
            {phase === "idle" && (
              <span className="text-[10px] text-zinc-400">standby</span>
            )}
          </div>
          <div className="flex gap-1 flex-wrap">
            {Array.from({ length: replicas }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "px-1.5 py-1 rounded text-[9px] font-mono font-bold transition-all duration-700",
                  greenReady
                    ? "bg-emerald-200 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-300"
                    : "bg-zinc-200 dark:bg-zinc-700 text-zinc-400"
                )}
              >
                {greenReady ? newVersion : "---"}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Traffic router indicator */}
      <div className="flex items-center gap-2 text-[10px] justify-center">
        <span
          className={cn(
            "px-2 py-1 rounded font-bold transition-all duration-700",
            !trafficOnGreen
              ? "bg-blue-500 text-white"
              : "bg-zinc-200 dark:bg-zinc-700 text-zinc-400"
          )}
        >
          Blue
        </span>
        <span className="text-zinc-400 font-mono">
          ← router {phase === "switching" ? "(switching…)" : "→"}
        </span>
        <span
          className={cn(
            "px-2 py-1 rounded font-bold transition-all duration-700",
            trafficOnGreen
              ? "bg-emerald-500 text-white"
              : "bg-zinc-200 dark:bg-zinc-700 text-zinc-400"
          )}
        >
          Green
        </span>
      </div>

      {/* Properties */}
      <div className="flex gap-2 flex-wrap text-[10px] text-zinc-500 dark:text-zinc-400">
        <span className="flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-emerald-500 inline-block" />
          Zero downtime
        </span>
        <span className="flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-blue-400 inline-block" />
          Instant cutover
        </span>
        <span className="flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-amber-400 inline-block" />
          2× resources needed
        </span>
      </div>

      {/* Status + button */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-[10px] text-zinc-400">
          {phase === "idle" && "Ready — Green env is standby"}
          {phase === "deploying" && "Deploying to Green…"}
          {phase === "switching" && "Flipping router to Green…"}
        </span>
        {phase === "done" ? (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              ✓ Deployment complete
            </span>
            <button
              onClick={reset}
              className="text-[10px] px-2.5 py-1 rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all duration-500"
            >
              Reset
            </button>
          </div>
        ) : (
          <button
            onClick={deploy}
            disabled={phase !== "idle"}
            className={cn(
              "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity",
              phase !== "idle" && "opacity-50 cursor-not-allowed"
            )}
          >
            Deploy
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Canary strategy ─────────────────────────────────────────────────────────

function CanaryView({
  oldVersion,
  newVersion,
  replicas,
  canaryPercent,
}: {
  oldVersion: string;
  newVersion: string;
  replicas: number;
  canaryPercent: number;
}) {
  // canaryStep: 0=none, 1=one canary, 2=half, 3=full
  const [canaryStep, setCanaryStep] = useState(0);
  const [deploying, setDeploying] = useState(false);

  const canarySteps = [0, Math.max(1, Math.round(replicas * (canaryPercent / 100))), Math.ceil(replicas / 2), replicas];
  const currentCanaryCount = canarySteps[canaryStep] ?? 0;
  const oldCount = replicas - currentCanaryCount;
  const trafficNew = canaryStep === 3 ? 100 : Math.round((currentCanaryCount / replicas) * 100);
  const trafficOld = 100 - trafficNew;

  function advance() {
    if (deploying || canaryStep >= 3) return;
    setDeploying(true);
    setTimeout(() => {
      setCanaryStep((s) => Math.min(3, s + 1));
      setDeploying(false);
    }, 1200);
  }

  function reset() {
    setCanaryStep(0);
    setDeploying(false);
  }

  const done = canaryStep === 3;

  return (
    <div className="space-y-4">
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Canary: Send a small percentage of traffic to the new version first
      </p>

      {/* Pods */}
      <div className="flex gap-2 flex-wrap">
        {Array.from({ length: replicas }).map((_, i) => {
          const isCanary = i < currentCanaryCount;
          return (
            <div
              key={i}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-lg border-2 text-[10px] font-bold font-mono transition-all duration-700 min-w-[56px]",
                isCanary
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                  : "border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
              )}
            >
              <span>{isCanary ? newVersion : oldVersion}</span>
              <span className="text-[8px] font-normal opacity-70">
                {isCanary ? "canary" : "stable"}
              </span>
            </div>
          );
        })}
      </div>

      {/* Traffic split bar */}
      <div>
        <div className="flex justify-between text-[10px] mb-1">
          <span className="text-zinc-500 dark:text-zinc-400">Traffic split</span>
          <span className="font-mono font-bold text-zinc-700 dark:text-zinc-300">
            {trafficOld}% old · {trafficNew}% new
          </span>
        </div>
        <div className="h-3 rounded-full overflow-hidden flex transition-all duration-700 bg-zinc-200 dark:bg-zinc-700">
          <div
            className="h-full bg-zinc-400 dark:bg-zinc-500 transition-all duration-700"
            style={{ width: `${trafficOld}%` }}
          />
          <div
            className="h-full bg-emerald-500 transition-all duration-700"
            style={{ width: `${trafficNew}%` }}
          />
        </div>
        <div className="flex justify-between text-[9px] mt-0.5">
          <span className="text-zinc-400">{oldVersion}</span>
          <span className="text-emerald-600 dark:text-emerald-400">{newVersion}</span>
        </div>
      </div>

      {/* Properties */}
      <div className="flex gap-2 flex-wrap text-[10px] text-zinc-500 dark:text-zinc-400">
        <span className="flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-emerald-500 inline-block" />
          Safe rollout
        </span>
        <span className="flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-blue-400 inline-block" />
          A/B comparison
        </span>
        <span className="flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-amber-400 inline-block" />
          Instant rollback
        </span>
      </div>

      {/* Status + button */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-[10px] text-zinc-400">
          {canaryStep === 0 && "No canary yet — click Deploy to start"}
          {canaryStep === 1 && `${currentCanaryCount} pod canary (${trafficNew}% traffic)`}
          {canaryStep === 2 && `50% canary — watching metrics…`}
        </span>
        {done ? (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              ✓ Deployment complete
            </span>
            <button
              onClick={reset}
              className="text-[10px] px-2.5 py-1 rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all duration-500"
            >
              Reset
            </button>
          </div>
        ) : (
          <button
            onClick={advance}
            disabled={deploying}
            className={cn(
              "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity",
              deploying && "opacity-50 cursor-not-allowed"
            )}
          >
            {canaryStep === 0 ? "Deploy" : canaryStep === 1 ? "Increase Canary" : "Full Rollout"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const TAB_LABELS: { key: Strategy; label: string }[] = [
  { key: "blue-green", label: "Blue-Green" },
  { key: "canary", label: "Canary" },
  { key: "rolling", label: "Rolling" },
];

export function DeploymentStrategy({
  strategy = "rolling",
  oldVersion = "v1.2.0",
  newVersion = "v1.3.0",
  replicas = 4,
  canaryPercent = 20,
}: DeploymentStrategyProps) {
  const [activeTab, setActiveTab] = useState<Strategy>(strategy);

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
        <Rocket className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 flex-1">
          Deployment Strategy
        </span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-100 dark:border-zinc-800 px-4 pt-2 gap-1">
        {TAB_LABELS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "text-[10px] font-semibold px-2.5 py-1.5 rounded-t-md transition-all duration-500",
              activeTab === tab.key
                ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Different ways to roll out a new version without breaking production for your users.
        </p>
      </div>

      {/* Content */}
      <div className="min-h-[280px] px-4 py-4">
        {activeTab === "rolling" && (
          <RollingView
            key="rolling"
            oldVersion={oldVersion}
            newVersion={newVersion}
            replicas={replicas}
          />
        )}
        {activeTab === "blue-green" && (
          <BlueGreenView
            key="blue-green"
            oldVersion={oldVersion}
            newVersion={newVersion}
            replicas={replicas}
          />
        )}
        {activeTab === "canary" && (
          <CanaryView
            key="canary"
            oldVersion={oldVersion}
            newVersion={newVersion}
            replicas={replicas}
            canaryPercent={canaryPercent}
          />
        )}
      </div>
    </div>
  );
}
