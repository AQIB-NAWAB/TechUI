"use client";

import { useState, useRef } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { GitCommitHorizontal, RefreshCw, Database, Server } from "lucide-react";

export const TwoPhaseCommitSchema = z.object({
  transactionName: z.string().optional().default("Transfer $500 (A → B)"),
  participants: z.array(z.object({
    id: z.string(),
    label: z.string(),
    color: z.enum(["blue", "emerald", "violet", "amber"]).optional().default("blue"),
  })).optional().default([
    { id: "db-a", label: "Account DB (Shard A)", color: "blue" },
    { id: "db-b", label: "Ledger DB (Shard B)", color: "emerald" },
  ]),
  simulateFailure: z.boolean().optional().default(false),
  failAtParticipant: z.number().int().min(0).max(3).optional().default(1),
  interactive: z.boolean().optional().default(true),
});

export type TwoPhaseCommitProps = z.infer<typeof TwoPhaseCommitSchema>;

type Phase = "idle" | "prepare" | "vote" | "commit" | "abort";
type ParticipantState = "idle" | "preparing" | "prepared" | "aborted" | "committed" | "voting-no";

const COLOR_MAP = {
  blue:    "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-200",
  emerald: "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200",
  violet:  "border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/30 text-violet-800 dark:text-violet-200",
  amber:   "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200",
};

const STATE_LABEL: Record<ParticipantState, string> = {
  idle: "Idle",
  preparing: "Preparing…",
  prepared: "Prepared ✓",
  aborted: "Aborted ✗",
  committed: "Committed ✓",
  "voting-no": "Vote NO ✗",
};

export function TwoPhaseCommit({
  transactionName = "Transfer $500 (A → B)",
  participants = [
    { id: "db-a", label: "Account DB (Shard A)", color: "blue" as const },
    { id: "db-b", label: "Ledger DB (Shard B)", color: "emerald" as const },
  ],
  simulateFailure = false,
  failAtParticipant = 1,
  interactive = true,
}: TwoPhaseCommitProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [states, setStates] = useState<ParticipantState[]>(() => participants.map(() => "idle"));
  const [log, setLog] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => { if (timerRef.current) clearTimeout(timerRef.current); };

  const addLog = (msg: string) => setLog((prev) => [msg, ...prev].slice(0, 6));

  const reset = () => {
    clearTimer();
    setPhase("idle");
    setStates(participants.map(() => "idle"));
    setLog([]);
    setRunning(false);
  };

  const runTransaction = () => {
    if (running) return;
    reset();
    setRunning(true);
    addLog("Coordinator: BEGIN transaction");

    // Phase 1 — Prepare
    setPhase("prepare");
    addLog("Phase 1: PREPARE sent to all participants");
    setStates(participants.map(() => "preparing"));

    timerRef.current = setTimeout(() => {
      const willFail = simulateFailure;
      const newStates: ParticipantState[] = participants.map((_, i) => {
        if (willFail && i === failAtParticipant) return "voting-no";
        return "prepared";
      });
      setStates(newStates);
      setPhase("vote");

      participants.forEach((p, i) => {
        addLog(`${p.label}: ${newStates[i] === "voting-no" ? "VOTE NO" : "VOTE YES (prepared)"}`);
      });

      timerRef.current = setTimeout(() => {
        const anyNo = newStates.some((s) => s === "voting-no");
        if (anyNo) {
          setPhase("abort");
          addLog("Coordinator: ABORT — not all participants voted YES");
          setStates((prev) =>
            prev.map((s) => (s === "prepared" || s === "voting-no" ? "aborted" : s))
          );
          participants.forEach((p) => addLog(`${p.label}: ROLLBACK`));
        } else {
          setPhase("commit");
          addLog("Phase 2: COMMIT sent to all participants");
          setStates(participants.map(() => "committed"));
          participants.forEach((p) => addLog(`${p.label}: COMMIT applied`));
        }
        setRunning(false);
      }, 1200);
    }, 1200);
  };

  const phaseLabel =
    phase === "idle" ? "Ready"
    : phase === "prepare" ? "Phase 1: Prepare"
    : phase === "vote" ? "Collecting votes"
    : phase === "commit" ? "Phase 2: Commit ✓"
    : "Aborted ✗";

  const phaseColor =
    phase === "commit" ? "text-emerald-600 dark:text-emerald-400"
    : phase === "abort" ? "text-red-600 dark:text-red-400"
    : phase === "idle" ? "text-zinc-400"
    : "text-amber-600 dark:text-amber-400";

  return (
    <div className={cn(
      "rounded-xl border bg-white dark:bg-zinc-900 overflow-hidden transition-all duration-500",
      phase === "abort" ? "border-red-300 dark:border-red-800" : "border-zinc-200 dark:border-zinc-800"
    )}>
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <GitCommitHorizontal className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">Two-Phase Commit</span>
        <span className={cn("text-[10px] font-mono font-semibold", phaseColor)}>{phaseLabel}</span>
        {interactive && (
          <button type="button" onClick={reset} className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all duration-500">
            <RefreshCw className="size-3.5" />
          </button>
        )}
      </div>

      <div className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        A coordinator asks every database to prepare, then commits only if all participants vote yes.
      </div>

      <div className="p-4 min-h-[240px] space-y-4">
        <div className="text-[10px] text-zinc-400 uppercase tracking-wide">Transaction</div>
        <div className="font-mono text-sm font-semibold text-zinc-700 dark:text-zinc-300">{transactionName}</div>

        {/* Coordinator + participants */}
        <div className="flex flex-col items-center gap-3">
          <div className={cn(
            "flex items-center gap-2 rounded-lg border px-4 py-2 transition-all duration-500",
            phase !== "idle" ? "border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-950/20" : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900"
          )}>
            <Server className="size-4 text-violet-500" />
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Coordinator</span>
          </div>

          <div className="flex gap-1 h-6 items-center">
            <div className={cn("w-px h-full transition-colors duration-500", phase !== "idle" ? "bg-violet-300 dark:bg-violet-700" : "bg-zinc-200 dark:bg-zinc-700")} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
            {participants.map((p, i) => (
              <div
                key={p.id}
                className={cn(
                  "rounded-lg border px-3 py-3 transition-all duration-500",
                  COLOR_MAP[p.color ?? "blue"],
                  states[i] === "preparing" && "ring-2 ring-amber-400 ring-offset-1 dark:ring-offset-zinc-950",
                  states[i] === "committed" && "ring-2 ring-emerald-400 ring-offset-1 dark:ring-offset-zinc-950",
                  (states[i] === "aborted" || states[i] === "voting-no") && "ring-2 ring-red-400 ring-offset-1 dark:ring-offset-zinc-950",
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Database className="size-3.5 opacity-70" />
                  <span className="text-[11px] font-semibold">{p.label}</span>
                </div>
                <span className="text-[10px] font-mono opacity-80">{STATE_LABEL[states[i]]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Protocol log */}
        <div>
          <div className="text-[10px] text-zinc-400 mb-1.5">Protocol log</div>
          <div className="rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 px-3 py-2 space-y-1 min-h-[72px]">
            {log.length === 0 && (
              <span className="text-[10px] text-zinc-400">No messages yet — run the transaction below</span>
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
            {phase === "idle"
              ? simulateFailure
                ? `Failure mode: participant ${failAtParticipant + 1} will vote NO.`
                : "Run a 2PC transaction — prepare, vote, then commit or abort."
              : phase === "commit"
              ? "All participants committed — transaction is durable."
              : phase === "abort"
              ? "Transaction aborted — all participants rolled back."
              : "Coordinator is coordinating the distributed transaction…"}
          </span>
          <button
            type="button"
            onClick={runTransaction}
            disabled={running}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-500 shrink-0 hover:opacity-90 disabled:opacity-50",
              simulateFailure
                ? "bg-red-500 text-white"
                : "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
            )}
          >
            {running ? "Running…" : "Run Transaction"}
          </button>
        </div>
      )}
    </div>
  );
}
