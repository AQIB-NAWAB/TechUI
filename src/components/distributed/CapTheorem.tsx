"use client";

import { useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Network, RefreshCw, Database, Zap, Shield } from "lucide-react";

export const CapTheoremSchema = z.object({
  title: z.string().optional().default("CAP Theorem"),
  choice: z.enum(["cp", "ap", "ca"]).optional().default("cp"),
  interactive: z.boolean().optional().default(true),
});

export type CapTheoremProps = z.infer<typeof CapTheoremSchema>;

type Choice = "cp" | "ap" | "ca";

const CHOICES: Record<
  Choice,
  {
    label: string;
    pick: [boolean, boolean, boolean];
    example: string;
    system: string;
    partitionBehavior: string[];
    icon: typeof Shield;
  }
> = {
  cp: {
    label: "CP",
    pick: [true, false, true],
    example: "Bank ledger during network split",
    system: "ZooKeeper, etcd, HBase",
    partitionBehavior: [
      "Network partition detected between US and EU nodes",
      "Minority partition rejects writes to stay consistent",
      "Majority partition continues — data stays correct",
    ],
    icon: Shield,
  },
  ap: {
    label: "AP",
    pick: [false, true, true],
    example: "Shopping cart across regions",
    system: "Cassandra, DynamoDB, CouchDB",
    partitionBehavior: [
      "Network partition splits east and west clusters",
      "Both sides accept reads and writes independently",
      "Carts may diverge briefly — merged when partition heals",
    ],
    icon: Zap,
  },
  ca: {
    label: "CA",
    pick: [true, true, false],
    example: "Single-datacenter Postgres cluster",
    system: "PostgreSQL, MySQL (single region)",
    partitionBehavior: [
      "All nodes in one datacenter — no WAN partition",
      "Full consistency and availability within the cluster",
      "Trade-off: cannot survive a datacenter-wide network split",
    ],
    icon: Database,
  },
};

const VERTICES = [
  { key: "C", label: "Consistency", pos: "top-[8%] left-1/2 -translate-x-1/2", color: "text-blue-600 dark:text-blue-400" },
  { key: "A", label: "Availability", pos: "bottom-[12%] left-[8%]", color: "text-emerald-600 dark:text-emerald-400" },
  { key: "P", label: "Partition tolerance", pos: "bottom-[12%] right-[8%]", color: "text-violet-600 dark:text-violet-400" },
] as const;

export function CapTheorem({
  title = "CAP Theorem",
  choice: initialChoice = "cp",
  interactive = true,
}: CapTheoremProps) {
  const [choice, setChoice] = useState<Choice>(initialChoice);
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);

  const config = CHOICES[choice];
  const maxSteps = config.partitionBehavior.length;

  function simulate() {
    if (running) return;
    setStep(0);
    setRunning(true);
    let i = 0;
    const advance = () => {
      i++;
      setStep(i);
      if (i < maxSteps) {
        setTimeout(advance, 1200);
      } else {
        setTimeout(() => setRunning(false), 500);
      }
    };
    setTimeout(advance, 1200);
  }

  function reset() {
    setStep(0);
    setRunning(false);
  }

  function select(c: Choice) {
    setChoice(c);
    reset();
  }

  const statusText =
    step === 0
      ? `Pick a trade-off, then Simulate to see what happens during a network partition.`
      : step < maxSteps
      ? config.partitionBehavior[step - 1]
      : `${config.label} systems prioritize ${choice === "cp" ? "correctness over uptime" : choice === "ap" ? "uptime over instant consistency" : "consistency + availability in one region"}.`;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="h-12 px-4 flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <Network className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">{title}</span>
        <div className="flex rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
          {(["cp", "ap", "ca"] as Choice[]).map((c) => (
            <button
              key={c}
              onClick={() => interactive && select(c)}
              className={cn(
                "px-2.5 py-1 text-[10px] font-semibold uppercase transition-all duration-500",
                choice === c
                  ? c === "cp"
                    ? "bg-blue-600 text-white"
                    : c === "ap"
                    ? "bg-emerald-600 text-white"
                    : "bg-violet-600 text-white"
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              )}
            >
              {c.toUpperCase()}
            </button>
          ))}
        </div>
        {interactive && (
          <button onClick={reset} className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all duration-500">
            <RefreshCw className="size-3.5" />
          </button>
        )}
      </div>

      <div className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        During a network partition you can only guarantee two of three: Consistency, Availability, or Partition tolerance.
      </div>

      <div className="min-h-[220px] px-4 py-4 flex gap-4">
        <div className="relative w-36 shrink-0">
          <svg viewBox="0 0 120 110" className="w-full h-[130px]">
            <polygon
              points="60,8 8,102 112,102"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-zinc-200 dark:text-zinc-700"
            />
            {VERTICES.map((v, i) => {
              const active = config.pick[i];
              const coords = [
                [60, 12],
                [14, 98],
                [106, 98],
              ][i];
              return (
                <g key={v.key}>
                  <circle
                    cx={coords[0]}
                    cy={coords[1]}
                    r={active ? 14 : 10}
                    className={cn(
                      "transition-all duration-500",
                      active ? "fill-current opacity-100" : "fill-zinc-100 dark:fill-zinc-800 opacity-50"
                    )}
                    style={{ color: active ? (i === 0 ? "#2563eb" : i === 1 ? "#059669" : "#7c3aed") : undefined }}
                  />
                  <text
                    x={coords[0]}
                    y={coords[1] + 4}
                    textAnchor="middle"
                    className={cn("text-[11px] font-bold", active ? "fill-white" : "fill-zinc-400")}
                  >
                    {v.key}
                  </text>
                </g>
              );
            })}
            <text x="60" y="72" textAnchor="middle" className="fill-zinc-400 text-[8px] font-semibold">
              pick 2
            </text>
          </svg>
          <div className="text-center mt-1">
            <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400">{config.label}</span>
          </div>
        </div>

        <div className="flex-1 min-w-0 space-y-3">
          <div className="rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 p-3">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-1">Example</div>
            <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{config.example}</div>
            <div className="text-[10px] text-zinc-500 mt-1">Systems: {config.system}</div>
          </div>

          <div className="space-y-1.5">
            {config.partitionBehavior.map((s, i) => (
              <div
                key={s}
                className={cn(
                  "flex items-start gap-2 rounded-lg border px-2.5 py-2 transition-all duration-500",
                  step > i
                    ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20"
                    : step === i + 1 && running
                    ? "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20"
                    : "border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 opacity-50"
                )}
              >
                <span
                  className={cn(
                    "size-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-all duration-500",
                    step > i
                      ? "bg-emerald-500 text-white"
                      : "bg-zinc-200 dark:bg-zinc-700 text-zinc-500"
                  )}
                >
                  {step > i ? "✓" : i + 1}
                </span>
                <span className="text-[11px] text-zinc-600 dark:text-zinc-400">{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {interactive && (
        <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/30">
          <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">{statusText}</span>
          <button
            onClick={simulate}
            disabled={running}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-500 shrink-0 hover:opacity-90",
              running
                ? "bg-blue-500 text-white"
                : "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
            )}
          >
            {running ? "Simulating…" : "Simulate Partition"}
          </button>
        </div>
      )}
    </div>
  );
}
