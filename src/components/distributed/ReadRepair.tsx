"use client";

import { useState, useRef, useEffect } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Database, RefreshCw, Search, Wrench } from "lucide-react";

export const ReadRepairSchema = z.object({
  name: z.string().optional().default("Read Repair"),
  key: z.string().optional().default("user:42:profile"),
  quorum: z.number().int().min(1).max(3).optional().default(2),
  replicaCount: z.number().int().min(2).max(3).optional().default(3),
  staleReplica: z.number().int().min(0).max(2).optional().default(1),
  interactive: z.boolean().optional().default(true),
});

export type ReadRepairProps = z.infer<typeof ReadRepairSchema>;

type ReplicaState = "idle" | "reading" | "stale" | "repairing" | "repaired";
type Phase = "idle" | "reading" | "repairing" | "done";

interface Replica {
  id: string;
  label: string;
  version: number;
  state: ReplicaState;
}

const COLOR_MAP = {
  idle: "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900",
  reading: "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/20 ring-2 ring-blue-300 dark:ring-blue-700",
  stale: "border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/20 ring-2 ring-amber-400",
  repairing: "border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-950/20 ring-2 ring-violet-400",
  repaired: "border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 ring-2 ring-emerald-400",
};

function buildReplicas(count: number, staleIdx: number): Replica[] {
  const latestVersion = 5;
  return Array.from({ length: count }, (_, i) => ({
    id: `r${i + 1}`,
    label: `Replica ${i + 1}`,
    version: i === staleIdx ? latestVersion - 2 : latestVersion,
    state: "idle" as ReplicaState,
  }));
}

export function ReadRepair({
  name = "Read Repair",
  key = "user:42:profile",
  quorum = 2,
  replicaCount = 3,
  staleReplica = 1,
  interactive = true,
}: ReadRepairProps) {
  const count = Math.min(Math.max(replicaCount, 2), 3);
  const staleIdx = Math.min(staleReplica, count - 1);

  const [replicas, setReplicas] = useState<Replica[]>(() => buildReplicas(count, staleIdx));
  const [phase, setPhase] = useState<Phase>("idle");
  const [log, setLog] = useState<string[]>([]);
  const [resolvedVersion, setResolvedVersion] = useState<number | null>(null);
  const [flash, setFlash] = useState<"stale" | "ok" | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    reset();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, staleIdx]);

  const clearTimer = () => { if (timerRef.current) clearTimeout(timerRef.current); };

  const addLog = (msg: string) => setLog((prev) => [msg, ...prev].slice(0, 6));

  const reset = () => {
    clearTimer();
    setReplicas(buildReplicas(count, staleIdx));
    setPhase("idle");
    setLog([]);
    setResolvedVersion(null);
    setFlash(null);
  };

  const runReadRepair = () => {
    if (phase === "reading" || phase === "repairing") return;
    clearTimer();
    const initial = buildReplicas(count, staleIdx);
    setReplicas(initial.map((r) => ({ ...r, state: "reading" as ReplicaState })));
    setPhase("reading");
    setLog([]);
    setResolvedVersion(null);
    setFlash(null);
    addLog(`READ ${key} — contacting ${count} replicas (quorum=${quorum})`);

    timerRef.current = setTimeout(() => {
      const versions = initial.map((r) => r.version);
      const maxVersion = Math.max(...versions);
      const staleNodes = initial.filter((r) => r.version < maxVersion);

      initial.forEach((r) => {
        addLog(`${r.label}: v${r.version}${r.version < maxVersion ? " (stale)" : ""}`);
      });

      setResolvedVersion(maxVersion);

      if (staleNodes.length > 0) {
        setFlash("stale");
        setReplicas((prev) =>
          prev.map((r) => ({
            ...r,
            state: r.version < maxVersion ? "stale" : "idle",
          }))
        );
        addLog(`Quorum reached — latest v${maxVersion}, ${staleNodes.length} stale replica(s) detected`);

        timerRef.current = setTimeout(() => {
          setPhase("repairing");
          addLog("Initiating read repair — pushing latest value to stale nodes");
          setReplicas((prev) =>
            prev.map((r) => ({
              ...r,
              state: r.version < maxVersion ? "repairing" : "idle",
            }))
          );

          timerRef.current = setTimeout(() => {
            setReplicas((prev) =>
              prev.map((r) => ({
                ...r,
                version: maxVersion,
                state: "repaired",
              }))
            );
            staleNodes.forEach((r) => addLog(`${r.label}: repaired → v${maxVersion}`));
            setPhase("done");
            setFlash("ok");
            addLog("Read repair complete — all replicas consistent");
            setTimeout(() => setFlash(null), 700);
          }, 1200);
        }, 1000);
      } else {
        setPhase("done");
        setFlash("ok");
        addLog("All replicas consistent — no repair needed");
        setReplicas((prev) => prev.map((r) => ({ ...r, state: "idle" })));
        setTimeout(() => setFlash(null), 700);
      }
    }, 1000);
  };

  const phaseLabel =
    phase === "idle" ? "Ready"
    : phase === "reading" ? "Reading replicas…"
    : phase === "repairing" ? "Repairing stale data…"
    : "Consistent ✓";

  return (
    <>
      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20% { transform: translateX(-3px); }
          40% { transform: translateX(3px); }
          60% { transform: translateX(-3px); }
          80% { transform: translateX(3px); }
        }
      `}</style>
      <div className={cn(
        "rounded-xl border bg-white dark:bg-zinc-900 overflow-hidden transition-all duration-500",
        flash === "stale" ? "border-amber-300 dark:border-amber-800" : flash === "ok" ? "border-emerald-300 dark:border-emerald-800" : "border-zinc-200 dark:border-zinc-800"
      )}>
        <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
          <Database className="size-4 text-zinc-400 shrink-0" />
          <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">{name}</span>
          <span className={cn(
            "text-[10px] font-mono font-semibold",
            phase === "done" ? "text-emerald-600 dark:text-emerald-400" : phase === "idle" ? "text-zinc-400" : "text-amber-600 dark:text-amber-400"
          )}>{phaseLabel}</span>
          {interactive && (
            <button type="button" onClick={reset} className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all duration-500">
              <RefreshCw className="size-3.5" />
            </button>
          )}
        </div>

        <div className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
          A read contacts multiple replicas — stale copies are detected and repaired in the background.
        </div>

        <div className="p-4 min-h-[240px] space-y-4">
          <div className="flex items-center gap-2 text-[10px]">
            <span className="text-zinc-400">Key</span>
            <span className="font-mono font-semibold text-zinc-700 dark:text-zinc-300">{key}</span>
            <span className="text-zinc-400 ml-2">Quorum</span>
            <span className="font-mono font-bold text-violet-600 dark:text-violet-400">{quorum}/{count}</span>
          </div>

          {/* Replicas */}
          <div className={cn("grid gap-3", count === 2 ? "grid-cols-2" : "grid-cols-3")}>
            {replicas.map((r) => (
              <div
                key={r.id}
                className={cn(
                  "rounded-lg border px-3 py-3 transition-all duration-500",
                  COLOR_MAP[r.state],
                  r.state === "stale" && flash === "stale" ? { animation: "shake 0.4s ease-in-out" } : undefined
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Database className="size-3.5 opacity-70" />
                  <span className="text-[11px] font-semibold">{r.label}</span>
                </div>
                <div className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
                  version: <span className={cn(
                    "font-bold",
                    r.state === "stale" ? "text-amber-600 dark:text-amber-400" : "text-zinc-700 dark:text-zinc-300"
                  )}>v{r.version}</span>
                </div>
                <div className="text-[9px] mt-1 capitalize text-zinc-400">{r.state}</div>
              </div>
            ))}
          </div>

          {resolvedVersion !== null && (
            <div className="flex items-center gap-2 text-[10px] bg-zinc-50 dark:bg-zinc-900 rounded-lg px-3 py-2">
              <Search className="size-3 text-zinc-400" />
              <span className="text-zinc-400">Resolved value:</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">v{resolvedVersion}</span>
            </div>
          )}

          {/* Log */}
          <div>
            <div className="text-[10px] text-zinc-400 mb-1.5">Protocol log</div>
            <div className="rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 px-3 py-2 space-y-1 min-h-[72px]">
              {log.length === 0 && (
                <span className="text-[10px] text-zinc-400">No activity yet — trigger a read below</span>
              )}
              {log.map((line, i) => (
                <div key={i} className="text-[10px] font-mono text-zinc-600 dark:text-zinc-400">{line}</div>
              ))}
            </div>
          </div>
        </div>

        {interactive && (
          <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/30 min-h-[52px]">
            <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">
              {phase === "done"
                ? "All replicas now hold the latest version."
                : phase === "repairing"
                ? "Background repair syncing stale replicas…"
                : phase === "reading"
                ? "Reading replicas to find the latest version…"
                : `Replica ${staleIdx + 1} is stale — read triggers quorum check and repair.`}
            </span>
            <button
              type="button"
              onClick={phase === "done" ? reset : runReadRepair}
              disabled={phase === "reading" || phase === "repairing"}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-500 shrink-0 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2",
                "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
              )}
            >
              <Wrench className="size-3.5" />
              {phase === "reading" || phase === "repairing" ? "Running…" : phase === "done" ? "Run Again" : "Read & Repair"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
