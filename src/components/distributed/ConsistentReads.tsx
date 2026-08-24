"use client";

import { useState, useRef } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Database, RefreshCw, Shield, Clock } from "lucide-react";

export const ConsistentReadsSchema = z.object({
  name: z.string().optional().default("Consistent Reads"),
  key: z.string().optional().default("balance:acct-42"),
  consistency: z.enum(["strong", "eventual"]).optional().default("strong"),
  replicaCount: z.number().int().min(2).max(3).optional().default(3),
  staleReplica: z.number().int().min(0).max(2).optional().default(2),
  latestVersion: z.number().int().min(1).max(99).optional().default(5),
  interactive: z.boolean().optional().default(true),
});

export type ConsistentReadsProps = z.infer<typeof ConsistentReadsSchema>;

type ReplicaState = "idle" | "reading" | "hit" | "stale";
type Phase = "idle" | "reading" | "done";

interface Replica {
  id: string;
  label: string;
  version: number;
  state: ReplicaState;
}

const STATE_STYLE: Record<ReplicaState, string> = {
  idle: "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900",
  reading: "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/30 ring-2 ring-blue-300 dark:ring-blue-700",
  hit: "border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 ring-2 ring-emerald-400",
  stale: "border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 ring-2 ring-amber-400",
};

function buildReplicas(
  count: number,
  staleIdx: number,
  latest: number
): Replica[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `r${i + 1}`,
    label: `Replica ${i + 1}`,
    version: i === staleIdx ? latest - 2 : latest,
    state: "idle" as ReplicaState,
  }));
}

export function ConsistentReads({
  name = "Consistent Reads",
  key = "balance:acct-42",
  consistency = "strong",
  replicaCount = 3,
  staleReplica = 2,
  latestVersion = 5,
  interactive = true,
}: ConsistentReadsProps) {
  const count = Math.min(Math.max(replicaCount, 2), 3);
  const staleIdx = Math.min(staleReplica, count - 1);

  const [replicas, setReplicas] = useState<Replica[]>(() =>
    buildReplicas(count, staleIdx, latestVersion)
  );
  const [phase, setPhase] = useState<Phase>("idle");
  const [readVersion, setReadVersion] = useState<number | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const addLog = (msg: string) => setLog((prev) => [msg, ...prev].slice(0, 5));

  const reset = () => {
    clearTimer();
    setReplicas(buildReplicas(count, staleIdx, latestVersion));
    setPhase("idle");
    setReadVersion(null);
    setIsStale(false);
    setLog([]);
  };

  const runRead = () => {
    if (phase === "reading") return;
    clearTimer();
    const initial = buildReplicas(count, staleIdx, latestVersion);
    setPhase("reading");
    setReadVersion(null);
    setIsStale(false);
    setLog([]);
    addLog(`READ ${key} — ${consistency} consistency`);

    if (consistency === "strong") {
      setReplicas(initial.map((r) => ({ ...r, state: "reading" as ReplicaState })));
      addLog(`Contacting ${count} replicas — need quorum for latest value`);

      timerRef.current = setTimeout(() => {
        const maxVersion = Math.max(...initial.map((r) => r.version));
        setReplicas(
          initial.map((r) => ({
            ...r,
            state: r.version === maxVersion ? ("hit" as ReplicaState) : ("idle" as ReplicaState),
          }))
        );
        setReadVersion(maxVersion);
        setIsStale(false);
        setPhase("done");
        addLog(`Quorum reached — returned v${maxVersion} (latest)`);
      }, 900);
    } else {
      const targetIdx = staleIdx;
      setReplicas(
        initial.map((r, i) => ({
          ...r,
          state: i === targetIdx ? ("reading" as ReplicaState) : r.state,
        }))
      );
      addLog(`Reading from nearest replica (${initial[targetIdx].label})`);

      timerRef.current = setTimeout(() => {
        const version = initial[targetIdx].version;
        const stale = version < latestVersion;
        setReplicas(
          initial.map((r, i) => ({
            ...r,
            state: i === targetIdx ? (stale ? ("stale" as ReplicaState) : ("hit" as ReplicaState)) : r.state,
          }))
        );
        setReadVersion(version);
        setIsStale(stale);
        setPhase("done");
        addLog(stale ? `Returned v${version} — stale (latest is v${latestVersion})` : `Returned v${version}`);
      }, 700);
    }
  };

  const readLabel =
    readVersion === null
      ? "—"
      : isStale
        ? `v${readVersion}`
        : `v${readVersion}`;

  const readColor =
    readVersion === null
      ? "text-zinc-400"
      : isStale
        ? "text-amber-600 dark:text-amber-400"
        : "text-emerald-600 dark:text-emerald-400";

  const readBg =
    readVersion === null
      ? "bg-zinc-100 dark:bg-zinc-800"
      : isStale
        ? "bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800"
        : "bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800";

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <Database className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">{name}</span>
        <span
          className={cn(
            "text-[10px] font-mono px-2 py-0.5 rounded flex items-center gap-1",
            consistency === "strong"
              ? "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
              : "bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
          )}
        >
          {consistency === "strong" ? <Shield className="size-2.5" /> : <Clock className="size-2.5" />}
          {consistency}
        </span>
        {interactive && (
          <button
            onClick={reset}
            className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all duration-500"
          >
            <RefreshCw className="size-3.5" />
          </button>
        )}
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        {consistency === "strong"
          ? "Strong reads ask multiple replicas and return the latest value — slower but always fresh."
          : "Eventual reads hit the nearest replica — fast, but you might see an older value."}
      </p>

      <div className="p-4 min-h-[220px] flex gap-4">
        <div className="flex flex-col items-center gap-2 shrink-0">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Value read</span>
          <div
            className={cn(
              "w-20 h-20 rounded-xl border-2 flex items-center justify-center transition-all duration-500",
              readBg
            )}
          >
            <span className={cn("text-2xl font-bold font-mono transition-all duration-500", readColor)}>
              {readLabel}
            </span>
          </div>
          {isStale && (
            <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
              Stale read
            </span>
          )}
          {readVersion !== null && !isStale && (
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
              Latest
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-3">
          <div className="text-[10px] font-mono text-zinc-400 bg-zinc-50 dark:bg-zinc-900 rounded-lg px-3 py-1.5 truncate">
            key: {key}
          </div>

          <div className="grid grid-cols-3 gap-2">
            {replicas.map((r) => (
              <div
                key={r.id}
                className={cn(
                  "rounded-lg border px-2 py-2 text-center transition-all duration-500",
                  STATE_STYLE[r.state]
                )}
              >
                <div className="text-[10px] text-zinc-400">{r.label}</div>
                <div className="text-sm font-bold font-mono text-zinc-700 dark:text-zinc-300 mt-0.5">
                  v{r.version}
                </div>
              </div>
            ))}
          </div>

          <div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-1.5">Read log</div>
            <div className="space-y-0.5 min-h-[52px]">
              {log.length === 0 && (
                <span className="text-[10px] text-zinc-400">No reads yet — click below</span>
              )}
              {log.map((line, i) => (
                <div key={i} className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 truncate">
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {interactive && (
        <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/30 min-h-[52px]">
          <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">
            {phase === "reading"
              ? consistency === "strong"
                ? "Waiting for quorum across replicas…"
                : "Reading from nearest replica…"
              : isStale
                ? "Got a stale value — replication hasn't caught up yet."
                : readVersion !== null
                  ? `Read complete — value v${readVersion} is the latest.`
                  : "Click to read the key and see which replica responds."}
          </span>
          <button
            onClick={runRead}
            disabled={phase === "reading"}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-500 shrink-0 hover:opacity-90",
              phase === "reading"
                ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-400 cursor-not-allowed"
                : isStale
                  ? "bg-amber-500 text-white"
                  : "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
            )}
          >
            Read Data
          </button>
        </div>
      )}
    </div>
  );
}
