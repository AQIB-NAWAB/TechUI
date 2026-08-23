"use client";

import { useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Radio, Plus, Users, RefreshCw } from "lucide-react";

export const KafkaTopicSchema = z.object({
  topic: z.string().default("user-events"),
  partitions: z.number().int().min(1).max(8).default(3),
  replicationFactor: z.number().int().min(1).max(3).default(2),
  producerLabel: z.string().optional().default("Producer"),
  consumerGroups: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        color: z
          .enum(["blue", "emerald", "violet", "amber"])
          .optional()
          .default("blue"),
      })
    )
    .optional(),
  interactive: z.boolean().optional().default(true),
});

export type KafkaTopicProps = z.infer<typeof KafkaTopicSchema>;

const GROUP_COLORS = [
  { dot: "bg-blue-500", ring: "ring-blue-400", text: "text-blue-600 dark:text-blue-400", bar: "bg-blue-500" },
  { dot: "bg-emerald-500", ring: "ring-emerald-400", text: "text-emerald-600 dark:text-emerald-400", bar: "bg-emerald-500" },
  { dot: "bg-violet-500", ring: "ring-violet-400", text: "text-violet-600 dark:text-violet-400", bar: "bg-violet-500" },
  { dot: "bg-amber-500", ring: "ring-amber-400", text: "text-amber-600 dark:text-amber-400", bar: "bg-amber-500" },
];

const EVENT_LABELS = [
  "user.login", "order.placed", "page.view", "click.cta",
  "user.signup", "payment.done", "cart.add", "session.end",
];

const PILL_COLORS = [
  "bg-blue-100 dark:bg-blue-950/60 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300",
  "bg-emerald-100 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300",
  "bg-violet-100 dark:bg-violet-950/60 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300",
  "bg-amber-100 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300",
  "bg-rose-100 dark:bg-rose-950/60 border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300",
];

type Pill = { id: number; label: string; colorIdx: number; fresh: boolean };

let _pillId = 0;
let _colorIdx = 0;

const DEFAULT_GROUPS = [
  { id: "cg1", label: "Analytics Consumer", color: "blue" as const },
  { id: "cg2", label: "Notification Service", color: "emerald" as const },
];

export function KafkaTopic({
  topic = "user-events",
  partitions: numPartitions = 3,
  replicationFactor = 2,
  producerLabel = "Producer",
  consumerGroups,
  interactive = true,
}: KafkaTopicProps) {
  const groups = consumerGroups ?? DEFAULT_GROUPS;

  const [partPills, setPartPills] = useState<Pill[][]>(() =>
    Array.from({ length: numPartitions }, (_, p) =>
      Array.from({ length: 4 }, (_, i) => ({
        id: p * 10 + i,
        label: EVENT_LABELS[(p * 4 + i) % EVENT_LABELS.length]!,
        colorIdx: (p * 4 + i) % PILL_COLORS.length,
        fresh: false,
      }))
    )
  );

  const [groupOffsets, setGroupOffsets] = useState<Record<string, number[]>>(
    () => {
      const init: Record<string, number[]> = {};
      for (const g of groups) {
        init[g.id] = Array.from({ length: numPartitions }, (_, p) =>
          Math.max(0, 4 - 2)
        );
      }
      return init;
    }
  );

  const [producing, setProducing] = useState(false);
  const [producingAnim, setProducingAnim] = useState(false);

  function produce() {
    if (producing) return;
    setProducing(true);
    setProducingAnim(true);
    setTimeout(() => setProducingAnim(false), 800);

    const partition = Math.floor(Math.random() * numPartitions);
    const label = EVENT_LABELS[Math.floor(Math.random() * EVENT_LABELS.length)]!;
    const colorIdx = _colorIdx++ % PILL_COLORS.length;
    const id = ++_pillId;

    setPartPills((prev) => {
      const next = prev.map((p) => [...p]);
      next[partition] = [...(next[partition] ?? []), { id, label, colorIdx, fresh: true }];
      return next;
    });

    setTimeout(() => {
      setPartPills((prev) =>
        prev.map((pills) => pills.map((p) => (p.id === id ? { ...p, fresh: false } : p)))
      );
      setProducing(false);
    }, 500);
  }

  function consume(groupId: string) {
    setGroupOffsets((prev) => {
      const offsets = [...(prev[groupId] ?? [])];
      let maxLag = 0;
      let targetP = -1;
      for (let p = 0; p < numPartitions; p++) {
        const pills = partPills[p] ?? [];
        const lag = pills.length - 1 - (offsets[p] ?? 0);
        if (lag > maxLag) { maxLag = lag; targetP = p; }
      }
      if (targetP === -1) return prev;
      offsets[targetP] = Math.min(
        (offsets[targetP] ?? 0) + 1,
        (partPills[targetP]?.length ?? 1) - 1
      );
      return { ...prev, [groupId]: offsets };
    });
  }

  const VISIBLE = 5;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/50">
        <Radio className="size-4 text-violet-500 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold font-mono text-zinc-900 dark:text-zinc-100 truncate">{topic}</span>
            <span className="shrink-0 text-[9px] px-1.5 py-0.5 rounded border font-semibold uppercase tracking-wider bg-violet-100 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800 text-violet-600 dark:text-violet-400">
              TOPIC
            </span>
          </div>
          <div className="text-[10px] text-zinc-400 mt-0.5">
            {numPartitions} partitions · replication {replicationFactor}
          </div>
        </div>
        {interactive && (
          <button
            onClick={produce}
            disabled={producing}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0"
          >
            <Plus className="size-3" />
            {producing ? "Producing…" : "+ Produce"}
          </button>
        )}
      </div>

      {/* Producer + Partition lanes */}
      <div className="px-4 pt-4 pb-3">
        {/* Producer box with broadcast rings */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex items-center justify-center shrink-0">
            <div className={cn(
              "size-10 rounded-xl bg-violet-50 dark:bg-violet-950/30 border-2 border-violet-200 dark:border-violet-800 flex items-center justify-center transition-all duration-500",
              producingAnim && "border-violet-400 dark:border-violet-600"
            )}>
              <Radio className={cn("size-4 text-violet-500", producingAnim && "animate-pulse")} />
            </div>
            {producingAnim && (
              <>
                <span className="absolute size-14 rounded-full border-2 border-violet-300 dark:border-violet-700 animate-ping opacity-60" />
                <span className="absolute size-18 rounded-full border border-violet-200 dark:border-violet-800 animate-ping opacity-30" style={{ animationDelay: "150ms" }} />
              </>
            )}
          </div>
          <div className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 shrink-0">{producerLabel}</div>
          <div className="flex-1 flex items-center gap-1">
            <div className="flex-1 border-t-2 border-dashed border-zinc-300 dark:border-zinc-700" />
            <div className="border-l-[6px] border-t-[4px] border-b-[4px] border-l-zinc-300 dark:border-l-zinc-700 border-t-transparent border-b-transparent" />
          </div>
        </div>

        {/* Partition lanes */}
        <div className="space-y-2">
          {Array.from({ length: numPartitions }, (_, p) => {
            const pills = partPills[p] ?? [];
            const visible = pills.slice(-VISIBLE);

            return (
              <div key={p} className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-semibold text-zinc-400 w-6 shrink-0 text-right">P{p}</span>
                <div className="flex-1 flex items-center gap-1.5 h-10 overflow-hidden bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800 px-2">
                  {pills.length === 0 ? (
                    <span className="text-[10px] text-zinc-400 italic mx-auto">empty</span>
                  ) : (
                    <div className="flex items-center gap-1.5 ml-auto">
                      {visible.map((pill) => (
                        <div
                          key={pill.id}
                          className={cn(
                            "flex items-center h-6 px-2 rounded-full border text-[9px] font-mono font-medium whitespace-nowrap shrink-0 transition-all duration-500",
                            PILL_COLORS[pill.colorIdx % PILL_COLORS.length],
                            pill.fresh && "translate-x-2 opacity-0"
                          )}
                          style={pill.fresh ? {} : { transform: "translateX(0)", opacity: 1 }}
                        >
                          {pill.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Consumer position indicators */}
                <div className="flex items-center gap-1 shrink-0">
                  {groups.map((g, gi) => {
                    const color = GROUP_COLORS[gi % GROUP_COLORS.length]!;
                    const off = groupOffsets[g.id]?.[p] ?? 0;
                    const lag = Math.max(0, (partPills[p]?.length ?? 0) - 1 - off);
                    return (
                      <div key={g.id} className="flex flex-col items-center gap-0.5" title={`${g.label}: lag ${lag}`}>
                        <div className={cn("size-2 rounded-full shrink-0", color.dot)} />
                        <span className={cn(
                          "text-[8px] font-mono leading-none",
                          lag > 0 ? "text-amber-500" : "text-transparent"
                        )}>
                          {lag > 0 ? lag : "·"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Consumer groups */}
      <div className="px-4 pb-4 border-t border-zinc-100 dark:border-zinc-900 pt-3">
        <div className="flex items-center gap-1.5 mb-2">
          <Users className="size-3 text-zinc-400" />
          <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Consumer Groups</span>
        </div>
        <div className="space-y-1.5">
          {groups.map((g, gi) => {
            const color = GROUP_COLORS[gi % GROUP_COLORS.length]!;
            const gOff = groupOffsets[g.id] ?? [];
            const totalLag = partPills.reduce(
              (a, pills, p) => a + Math.max(0, pills.length - 1 - (gOff[p] ?? 0)),
              0
            );
            return (
              <div key={g.id} className="flex items-center gap-3 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40">
                <div className={cn("size-2 rounded-full shrink-0", color.dot)} />
                <span className="text-xs font-medium flex-1 truncate text-zinc-700 dark:text-zinc-300">{g.label}</span>
                {totalLag > 0 ? (
                  <span className="text-[10px] font-mono shrink-0 px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                    lag {totalLag}
                  </span>
                ) : (
                  <span className="text-[10px] font-mono shrink-0 text-zinc-400">up to date</span>
                )}
                {interactive && totalLag > 0 && (
                  <button
                    onClick={() => consume(g.id)}
                    className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 hover:opacity-90 transition-opacity shrink-0"
                  >
                    <RefreshCw className="size-2.5" />
                    Consume
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Explanation */}
      <div className="border-t border-zinc-100 dark:border-zinc-900 px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900/30">
        <p className="text-[10px] text-zinc-400 leading-relaxed">
          Produce adds a message to a random partition. Each consumer group tracks its own read position (offset) independently.
        </p>
      </div>
    </div>
  );
}
