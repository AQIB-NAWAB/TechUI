"use client";

import { useState, useEffect } from "react";
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
type ReplicaViewProps = { oldVersion: string; newVersion: string; replicas: number };

type FooterConfig = {
  status: string;
  actionLabel: string;
  onAction: () => void;
  actionDisabled: boolean;
  done: boolean;
  onReset: () => void;
};

function StrategyTraits({ traits }: { traits: { color: string; label: string }[] }) {
  return (
    <div className="flex gap-2 flex-wrap text-[10px] text-zinc-500 dark:text-zinc-400">
      {traits.map((t) => (
        <span key={t.label} className="flex items-center gap-1">
          <span className={cn("size-1.5 rounded-full inline-block", t.color)} />{t.label}
        </span>
      ))}
    </div>
  );
}

function DeployStatus({ status }: { status: string }) {
  return (
    <div className="min-h-[32px] flex items-center pt-1">
      <span className="text-[10px] text-zinc-400">{status}</span>
    </div>
  );
}

function PodTile({ version, label, className }: { version: string; label: string; className: string }) {
  return (
    <div className={cn("flex flex-col items-center gap-1 px-3 py-2 rounded-lg border-2 text-[10px] font-bold font-mono transition-all duration-700 min-w-[56px]", className)}>
      <span>{version}</span>
      <span className="text-[8px] font-normal opacity-70">{label}</span>
    </div>
  );
}

function ProgressBar({ label, current, total }: { label: string; current: number; total: number }) {
  const pct = total > 0 ? (current / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-[10px] mb-1">
        <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
        <span className="font-mono font-bold text-zinc-700 dark:text-zinc-300">{current} / {total} updated</span>
      </div>
      <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
        <div className="h-full rounded-full bg-emerald-500 transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function RollingView({ oldVersion, newVersion, replicas, onFooterUpdate }: ReplicaViewProps & { onFooterUpdate: (c: FooterConfig) => void }) {
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

  const status =
    done
      ? "All pods updated successfully"
      : deploying
      ? `Updating pod ${updatedCount + 1}/${replicas}…`
      : updatedCount === 0
      ? "Ready to deploy"
      : "In progress…";

  useEffect(() => {
    onFooterUpdate({
      status,
      actionLabel: done ? "Reset" : "Deploy",
      onAction: done ? reset : deploy,
      actionDisabled: deploying,
      done,
      onReset: reset,
    });
  }, [status, deploying, done, updatedCount, replicas, onFooterUpdate]);

  return (
    <div className="space-y-4">
      <p className="text-xs text-zinc-500 dark:text-zinc-400">Rolling: Replace pods one at a time — zero downtime throughout</p>

      <div className="flex gap-2 flex-wrap">
        {Array.from({ length: replicas }).map((_, i) => {
          const isNew = i < updatedCount;
          const isActive = i === updatedCount && deploying;
          return (
            <PodTile
              key={i}
              version={isNew ? newVersion : oldVersion}
              label={isNew ? "new" : isActive ? "updating…" : "old"}
              className={
                isNew
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                  : isActive
                  ? "border-blue-400 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 animate-pulse"
                  : "border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
              }
            />
          );
        })}
      </div>

      <ProgressBar label="Progress" current={updatedCount} total={replicas} />

      <StrategyTraits
        traits={[
          { color: "bg-emerald-500", label: "No downtime" },
          { color: "bg-blue-400", label: "Gradual" },
          { color: "bg-amber-400", label: "Rollback: instant" },
        ]}
      />

      <DeployStatus status={status} />
    </div>
  );
}

const ENV_PALETTE = {
  blue: {
    live: { border: "border-blue-400 bg-blue-50 dark:bg-blue-900/20", label: "text-blue-600 dark:text-blue-400", badge: "bg-blue-500", chip: "bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-300" },
    idle: { border: "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 opacity-60", label: "text-blue-600 dark:text-blue-400", badge: "bg-blue-500", chip: "bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-300" },
  },
  emerald: {
    live: { border: "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20", label: "text-emerald-600 dark:text-emerald-400", badge: "bg-emerald-500", chip: "bg-emerald-200 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-300" },
    ready: { border: "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20", label: "text-emerald-600 dark:text-emerald-400", badge: "bg-emerald-500", chip: "bg-emerald-200 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-300" },
    idle: { border: "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50", label: "text-emerald-600 dark:text-emerald-400", badge: "bg-emerald-500", chip: "bg-zinc-200 dark:bg-zinc-700 text-zinc-400" },
  },
} as const;

function EnvSlot({ name, color, live, status, replicas, version, ready }: {
  name: string; color: "blue" | "emerald"; live: boolean; status?: string; replicas: number; version: string; ready?: boolean;
}) {
  const palette = color === "blue"
    ? ENV_PALETTE.blue[live ? "live" : "idle"]
    : ENV_PALETTE.emerald[live ? "live" : ready ? "ready" : "idle"];
  return (
    <div className={cn("rounded-lg border-2 p-3 transition-all duration-700", palette.border)}>
      <div className="flex items-center justify-between mb-2">
        <span className={cn("text-[10px] font-bold uppercase tracking-wide", palette.label)}>{name}</span>
        {live ? <span className={cn("text-[10px] text-white px-1.5 py-0.5 rounded-full font-bold", palette.badge)}>LIVE</span> : status ? <span className="text-[10px] text-zinc-400">{status}</span> : null}
      </div>
      <div className="flex gap-1 flex-wrap">
        {Array.from({ length: replicas }).map((_, i) => (
          <div key={i} className={cn("px-1.5 py-1 rounded text-[9px] font-mono font-bold transition-all duration-700", palette.chip)}>{version}</div>
        ))}
      </div>
    </div>
  );
}

function TrafficSplitBar({ oldVersion, newVersion, trafficOld, trafficNew }: {
  oldVersion: string; newVersion: string; trafficOld: number; trafficNew: number;
}) {
  return (
    <div>
      <div className="flex justify-between text-[10px] mb-1">
        <span className="text-zinc-500 dark:text-zinc-400">Traffic split</span>
        <span className="font-mono font-bold text-zinc-700 dark:text-zinc-300">
          {trafficOld}% old · {trafficNew}% new
        </span>
      </div>
      <div className="h-3 rounded-full overflow-hidden flex transition-all duration-700 bg-zinc-200 dark:bg-zinc-700">
        <div className="h-full bg-zinc-400 dark:bg-zinc-500 transition-all duration-700" style={{ width: `${trafficOld}%` }} />
        <div className="h-full bg-emerald-500 transition-all duration-700" style={{ width: `${trafficNew}%` }} />
      </div>
      <div className="flex justify-between text-[9px] mt-0.5">
        <span className="text-zinc-400">{oldVersion}</span>
        <span className="text-emerald-600 dark:text-emerald-400">{newVersion}</span>
      </div>
    </div>
  );
}

function RouterIndicator({ trafficOnGreen, switching }: { trafficOnGreen: boolean; switching: boolean }) {
  return (
    <div className="flex items-center gap-2 text-[10px] justify-center">
      <span className={cn("px-2 py-1 rounded font-bold transition-all duration-700", !trafficOnGreen ? "bg-blue-500 text-white" : "bg-zinc-200 dark:bg-zinc-700 text-zinc-400")}>Blue</span>
      <span className="text-zinc-400 font-mono">← router {switching ? "(switching…)" : "→"}</span>
      <span className={cn("px-2 py-1 rounded font-bold transition-all duration-700", trafficOnGreen ? "bg-emerald-500 text-white" : "bg-zinc-200 dark:bg-zinc-700 text-zinc-400")}>Green</span>
    </div>
  );
}

function BlueGreenView({ oldVersion, newVersion, replicas, onFooterUpdate }: ReplicaViewProps & { onFooterUpdate: (c: FooterConfig) => void }) {
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

  const status =
    phase === "idle"
      ? "Ready — Green env is standby"
      : phase === "deploying"
      ? "Deploying to Green…"
      : phase === "switching"
      ? "Flipping router to Green…"
      : "Deployment complete — traffic on Green";

  useEffect(() => {
    onFooterUpdate({
      status,
      actionLabel: phase === "done" ? "Reset" : "Deploy",
      onAction: phase === "done" ? reset : deploy,
      actionDisabled: phase === "deploying" || phase === "switching",
      done: phase === "done",
      onReset: reset,
    });
  }, [status, phase, onFooterUpdate]);

  return (
    <div className="space-y-4">
      <p className="text-xs text-zinc-500 dark:text-zinc-400">Blue-Green: Deploy new version alongside old, then flip traffic instantly</p>

      <div className="grid grid-cols-2 gap-3">
        <EnvSlot name="Blue" color="blue" live={!trafficOnGreen} status={trafficOnGreen ? "standby" : undefined} replicas={replicas} version={oldVersion} />
        <EnvSlot
          name="Green"
          color="emerald"
          live={trafficOnGreen}
          status={phase === "deploying" ? "deploying…" : phase === "idle" ? "standby" : undefined}
          replicas={replicas}
          version={greenReady ? newVersion : "---"}
          ready={greenReady}
        />
      </div>

      <RouterIndicator trafficOnGreen={trafficOnGreen} switching={phase === "switching"} />

      <StrategyTraits
        traits={[
          { color: "bg-emerald-500", label: "Zero downtime" },
          { color: "bg-blue-400", label: "Instant cutover" },
          { color: "bg-amber-400", label: "2× resources needed" },
        ]}
      />

      <DeployStatus status={status} />
    </div>
  );
}

function CanaryView({ oldVersion, newVersion, replicas, canaryPercent, onFooterUpdate }: ReplicaViewProps & { canaryPercent: number; onFooterUpdate: (c: FooterConfig) => void }) {
  const [canaryStep, setCanaryStep] = useState(0);
  const [deploying, setDeploying] = useState(false);

  const canarySteps = [0, Math.max(1, Math.round(replicas * (canaryPercent / 100))), Math.ceil(replicas / 2), replicas];
  const currentCanaryCount = canarySteps[canaryStep] ?? 0;
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

  const status =
    done
      ? "Full rollout complete — 100% on new version"
      : canaryStep === 0
      ? "No canary yet — click Deploy to start"
      : canaryStep === 1
      ? `${currentCanaryCount} pod canary (${trafficNew}% traffic)`
      : "50% canary — watching metrics…";

  useEffect(() => {
    onFooterUpdate({
      status,
      actionLabel: done ? "Reset" : canaryStep === 0 ? "Deploy" : canaryStep === 1 ? "Increase Canary" : "Full Rollout",
      onAction: done ? reset : advance,
      actionDisabled: deploying,
      done,
      onReset: reset,
    });
  }, [status, done, canaryStep, deploying, currentCanaryCount, trafficNew, onFooterUpdate]);

  return (
    <div className="space-y-4">
      <p className="text-xs text-zinc-500 dark:text-zinc-400">Canary: Send a small percentage of traffic to the new version first</p>

      <div className="flex gap-2 flex-wrap">
        {Array.from({ length: replicas }).map((_, i) => {
          const isCanary = i < currentCanaryCount;
          return (
            <PodTile
              key={i}
              version={isCanary ? newVersion : oldVersion}
              label={isCanary ? "canary" : "stable"}
              className={
                isCanary
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                  : "border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
              }
            />
          );
        })}
      </div>

      <TrafficSplitBar oldVersion={oldVersion} newVersion={newVersion} trafficOld={trafficOld} trafficNew={trafficNew} />

      <StrategyTraits
        traits={[
          { color: "bg-emerald-500", label: "Safe rollout" },
          { color: "bg-blue-400", label: "A/B comparison" },
          { color: "bg-amber-400", label: "Instant rollback" },
        ]}
      />

      <DeployStatus status={status} />
    </div>
  );
}

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
  const [footer, setFooter] = useState<FooterConfig>({
    status: "Ready to deploy",
    actionLabel: "Deploy",
    onAction: () => {},
    actionDisabled: false,
    done: false,
    onReset: () => {},
  });

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
            onFooterUpdate={setFooter}
          />
        )}
        {activeTab === "blue-green" && (
          <BlueGreenView
            key="blue-green"
            oldVersion={oldVersion}
            newVersion={newVersion}
            replicas={replicas}
            onFooterUpdate={setFooter}
          />
        )}
        {activeTab === "canary" && (
          <CanaryView
            key="canary"
            oldVersion={oldVersion}
            newVersion={newVersion}
            replicas={replicas}
            canaryPercent={canaryPercent}
            onFooterUpdate={setFooter}
          />
        )}
      </div>

      <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/30">
        <span className={cn(
          "text-sm flex-1 transition-all duration-500",
          footer.done ? "text-emerald-700 dark:text-emerald-400" : "text-zinc-500 dark:text-zinc-400"
        )}>
          {footer.done ? `✓ ${footer.status}` : footer.status}
        </span>
        <button
          onClick={footer.onAction}
          disabled={footer.actionDisabled}
          className={cn(
            "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-all duration-500 shrink-0",
            footer.actionDisabled && "opacity-50 cursor-not-allowed"
          )}
        >
          {footer.actionLabel}
        </button>
      </div>
    </div>
  );
}
