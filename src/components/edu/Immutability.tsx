"use client";

import { useState, useEffect, useRef } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";

export const ImmutabilitySchema = z.object({
  example: z.enum(["mutation-bug", "immutable-solution", "array-patterns"]).default("mutation-bug"),
});

export type ImmutabilityProps = z.infer<typeof ImmutabilitySchema>;

// ── Mutation Bug Demo ──────────────────────────────────────────────────────────

type MutationStep =
  | { phase: "initial" }
  | { phase: "refs-assigned" }
  | { phase: "mutated" }
  | { phase: "revealed" };

const MUTATION_STEPS: MutationStep[] = [
  { phase: "initial" },
  { phase: "refs-assigned" },
  { phase: "mutated" },
  { phase: "revealed" },
];

function MutationBugDemo() {
  const [stepIdx, setStepIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const totalSteps = MUTATION_STEPS.length;
  const isDone = stepIdx >= totalSteps - 1;
  const phase = MUTATION_STEPS[stepIdx].phase;

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setStepIdx((p) => {
          if (p >= totalSteps - 1) { setPlaying(false); return p; }
          return p + 1;
        });
      }, 1300);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [playing, totalSteps]);

  function handlePlay() {
    if (isDone) { setStepIdx(0); setPlaying(true); }
    else setPlaying((p) => !p);
  }

  const userScore = phase === "mutated" || phase === "revealed" ? 100 : 0;
  const ref1Score = phase === "mutated" || phase === "revealed" ? 100 : 0;
  const ref2Score = phase === "mutated" || phase === "revealed" ? 100 : 0;
  const showRef2Surprise = phase === "revealed";

  return (
    <div className="flex flex-col gap-3">
      {/* Diagram */}
      <div className="bg-zinc-50 dark:bg-zinc-800/40 rounded-lg p-3 min-h-[160px] flex flex-col gap-2">
        {/* Object box */}
        <div className="flex justify-center mb-1">
          <div className={cn(
            "border-2 rounded-lg px-4 py-2 text-center transition-all duration-500",
            userScore > 0
              ? "border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-900/20"
              : "border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20"
          )}>
            <div className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 mb-0.5">Shared Object</div>
            <div className="font-mono text-xs">
              <span className="text-zinc-500 dark:text-zinc-400">{"{"} </span>
              <span className="text-blue-600 dark:text-blue-300">name</span>
              <span className="text-zinc-400">: </span>
              <span className="text-emerald-600 dark:text-emerald-300">&quot;Alice&quot;</span>
              <span className="text-zinc-400">, </span>
              <span className="text-blue-600 dark:text-blue-300">score</span>
              <span className="text-zinc-400">: </span>
              <span className={cn("font-bold transition-all duration-500",
                userScore > 0 ? "text-red-500 dark:text-red-400" : "text-amber-600 dark:text-amber-300"
              )}>{userScore}</span>
              <span className="text-zinc-500 dark:text-zinc-400"> {"}"}</span>
            </div>
          </div>
        </div>

        {/* References */}
        {(phase === "refs-assigned" || phase === "mutated" || phase === "revealed") && (
          <div className="flex justify-center gap-8 transition-all duration-500">
            {/* ref1 */}
            <div className="flex flex-col items-center gap-1">
              <div className="font-mono text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1">
                <span className="text-violet-600 dark:text-violet-400">ref1</span>
              </div>
              <div className="text-zinc-400 text-xs">↑</div>
              <div className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                .score = <span className={cn("font-bold", ref1Score > 0 ? "text-red-500" : "text-amber-600")}>{ref1Score}</span>
                {phase === "mutated" && <span className="ml-1 text-[10px] text-green-600 dark:text-green-400">✓ expected</span>}
              </div>
            </div>
            {/* ref2 */}
            <div className="flex flex-col items-center gap-1">
              <div className={cn(
                "font-mono text-xs border rounded px-2 py-1 transition-all duration-500",
                showRef2Surprise
                  ? "bg-red-50 dark:bg-red-900/20 border-red-400 dark:border-red-500"
                  : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700"
              )}>
                <span className="text-violet-600 dark:text-violet-400">ref2</span>
              </div>
              <div className="text-zinc-400 text-xs">↑</div>
              <div className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                .score = <span className={cn("font-bold", ref2Score > 0 ? "text-red-500" : "text-amber-600")}>{ref2Score}</span>
                {showRef2Surprise && <span className="ml-1 text-[10px] text-red-500 font-bold">✗ SURPRISE!</span>}
              </div>
            </div>
          </div>
        )}

        {/* Step description */}
        <div className="mt-auto text-center text-[11px] font-mono">
          {phase === "initial" && <span className="text-zinc-400">const user = {"{"} name: &quot;Alice&quot;, score: 0 {"}"}</span>}
          {phase === "refs-assigned" && <span className="text-blue-500 dark:text-blue-400">ref1 = user &nbsp;|&nbsp; ref2 = user — same object!</span>}
          {phase === "mutated" && <span className="text-amber-600 dark:text-amber-400">ref1.score = 100 — mutating shared object...</span>}
          {phase === "revealed" && <span className="text-red-500 dark:text-red-400">ref2.score is also 100 — unintended mutation!</span>}
        </div>
      </div>

      {/* Problem callout */}
      {phase === "revealed" && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2 text-[11px] text-red-700 dark:text-red-300 transition-all duration-500">
          <strong>Problem:</strong> shared mutable state = unpredictable bugs. Any reference can silently change the object.
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-2">
        <button onClick={() => setStepIdx((p) => Math.max(0, p - 1))} disabled={stepIdx === 0}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-30 transition-all duration-200 disabled:cursor-not-allowed">
          ← Step
        </button>
        <button onClick={() => setStepIdx((p) => Math.min(totalSteps - 1, p + 1))} disabled={isDone}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-30 transition-all duration-200 disabled:cursor-not-allowed">
          Step →
        </button>
        <button onClick={handlePlay}
          className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-1.5 text-xs font-semibold hover:opacity-90 transition-opacity">
          {playing ? "Pause" : isDone ? "Replay" : "▶ Demo"}
        </button>
        <button onClick={() => { setStepIdx(0); setPlaying(false); }}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all duration-200">
          Reset
        </button>
      </div>
    </div>
  );
}

// ── Immutable Solution Demo ────────────────────────────────────────────────────

type ImmutableStep =
  | { phase: "initial" }
  | { phase: "ref1-assigned" }
  | { phase: "ref2-spread" }
  | { phase: "result" };

const IMMUTABLE_STEPS: ImmutableStep[] = [
  { phase: "initial" },
  { phase: "ref1-assigned" },
  { phase: "ref2-spread" },
  { phase: "result" },
];

function ImmutableSolutionDemo() {
  const [stepIdx, setStepIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const totalSteps = IMMUTABLE_STEPS.length;
  const isDone = stepIdx >= totalSteps - 1;
  const phase = IMMUTABLE_STEPS[stepIdx].phase;

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setStepIdx((p) => {
          if (p >= totalSteps - 1) { setPlaying(false); return p; }
          return p + 1;
        });
      }, 1300);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [playing, totalSteps]);

  function handlePlay() {
    if (isDone) { setStepIdx(0); setPlaying(true); }
    else setPlaying((p) => !p);
  }

  const showRef1 = phase !== "initial";
  const showRef2 = phase === "ref2-spread" || phase === "result";
  const showResult = phase === "result";

  return (
    <div className="flex flex-col gap-3">
      {/* Diagram */}
      <div className="bg-zinc-50 dark:bg-zinc-800/40 rounded-lg p-3 min-h-[160px] flex flex-col gap-2">
        <div className="flex flex-col gap-2">
          {/* ref1 → object1 */}
          {showRef1 && (
            <div className="flex items-center gap-2 transition-all duration-500">
              <div className="font-mono text-xs bg-white dark:bg-zinc-900 border border-violet-300 dark:border-violet-600 rounded px-2 py-1 shrink-0">
                <span className="text-violet-600 dark:text-violet-400">ref1</span>
              </div>
              <span className="text-zinc-400 text-sm">──→</span>
              <div className="border-2 border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20 rounded-lg px-3 py-1">
                <span className="font-mono text-xs text-zinc-600 dark:text-zinc-300">
                  {"{"} <span className="text-blue-600 dark:text-blue-300">score</span>: <span className="text-emerald-600 dark:text-emerald-300">0</span> {"}"}
                </span>
                {showResult && <span className="ml-2 text-[11px] text-green-600 dark:text-green-400 font-semibold">✓ unchanged</span>}
              </div>
            </div>
          )}
          {/* ref2 → object2 */}
          {showRef2 && (
            <div className="flex items-center gap-2 transition-all duration-500">
              <div className="font-mono text-xs bg-white dark:bg-zinc-900 border border-violet-300 dark:border-violet-600 rounded px-2 py-1 shrink-0">
                <span className="text-violet-600 dark:text-violet-400">ref2</span>
              </div>
              <span className="text-zinc-400 text-sm">──→</span>
              <div className="border-2 border-emerald-300 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg px-3 py-1">
                <span className="font-mono text-xs text-zinc-600 dark:text-zinc-300">
                  {"{"} <span className="text-blue-600 dark:text-blue-300">score</span>: <span className="text-amber-600 dark:text-amber-300 font-bold">100</span> {"}"}
                </span>
                {showResult && <span className="ml-2 text-[11px] text-green-600 dark:text-green-400 font-semibold">✓ new value</span>}
              </div>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 ml-1 font-semibold">(new object!)</span>
            </div>
          )}
        </div>

        {/* Step description */}
        <div className="mt-auto text-center text-[11px] font-mono">
          {phase === "initial" && <span className="text-zinc-400">const user = {"{"} name: &quot;Alice&quot;, score: 0 {"}"}</span>}
          {phase === "ref1-assigned" && <span className="text-blue-500 dark:text-blue-400">ref1 = user — points to original object</span>}
          {phase === "ref2-spread" && <span className="text-emerald-600 dark:text-emerald-400">ref2 = {"{ ...user, score: 100 }"} — NEW object!</span>}
          {phase === "result" && <span className="text-green-600 dark:text-green-400">✓ ref1 unchanged, ref2 has new value — safe!</span>}
        </div>
      </div>

      {/* Success callout */}
      {phase === "result" && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-2 text-[11px] text-emerald-700 dark:text-emerald-300 transition-all duration-500">
          <strong>Solution:</strong> Spread operator creates a new object. Original is safe — you can share it without fear.
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-2">
        <button onClick={() => setStepIdx((p) => Math.max(0, p - 1))} disabled={stepIdx === 0}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-30 transition-all duration-200 disabled:cursor-not-allowed">
          ← Step
        </button>
        <button onClick={() => setStepIdx((p) => Math.min(totalSteps - 1, p + 1))} disabled={isDone}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-30 transition-all duration-200 disabled:cursor-not-allowed">
          Step →
        </button>
        <button onClick={handlePlay}
          className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-1.5 text-xs font-semibold hover:opacity-90 transition-opacity">
          {playing ? "Pause" : isDone ? "Replay" : "▶ Demo"}
        </button>
        <button onClick={() => { setStepIdx(0); setPlaying(false); }}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all duration-200">
          Reset
        </button>
      </div>
    </div>
  );
}

// ── Array Patterns ─────────────────────────────────────────────────────────────

const ARRAY_PATTERNS = [
  { mutable: "arr.push(4)",    immutable: "[...arr, 4]",      label: "Add to end" },
  { mutable: "arr.pop()",      immutable: "arr.slice(0, -1)", label: "Remove last" },
  { mutable: "arr.sort()",     immutable: "[...arr].sort()",  label: "Sort" },
  { mutable: "arr.splice(…)",  immutable: "arr.filter(…)",    label: "Remove item" },
];

function ArrayPatternsDemo() {
  const [highlighted, setHighlighted] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center text-[11px] font-semibold">
        <div className="text-center py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded">Mutable ✗</div>
        <div />
        <div className="text-center py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded">Immutable ✓</div>
      </div>
      <div className="flex flex-col gap-1.5">
        {ARRAY_PATTERNS.map((row, i) => (
          <div
            key={i}
            className={cn(
              "grid grid-cols-[1fr_auto_1fr] gap-2 items-center rounded-lg transition-all duration-300 cursor-pointer p-1",
              highlighted === i ? "bg-zinc-100 dark:bg-zinc-800" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
            )}
            onClick={() => setHighlighted(highlighted === i ? null : i)}
          >
            <div className={cn(
              "font-mono text-xs text-center py-1.5 px-2 rounded border transition-all duration-300",
              highlighted === i
                ? "bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-600 text-red-700 dark:text-red-300"
                : "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"
            )}>
              {row.mutable}
            </div>
            <div className="text-[10px] text-zinc-400 text-center whitespace-nowrap">{row.label}</div>
            <div className={cn(
              "font-mono text-xs text-center py-1.5 px-2 rounded border transition-all duration-300",
              highlighted === i
                ? "bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-600 text-emerald-700 dark:text-emerald-300"
                : "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"
            )}>
              {row.immutable}
            </div>
          </div>
        ))}
      </div>
      <div className="text-[10px] text-zinc-400 dark:text-zinc-500">Click a row to highlight mutable vs immutable pair.</div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function Immutability({ example = "mutation-bug" }: ImmutabilityProps) {
  const [tab, setTab] = useState<"mutation-bug" | "immutable-solution" | "array-patterns">(example);

  const tabs = [
    { id: "mutation-bug"        as const, label: "Bug" },
    { id: "immutable-solution"  as const, label: "Fix" },
    { id: "array-patterns"      as const, label: "Arrays" },
  ];

  const insights: Record<string, string> = {
    "mutation-bug":
      "Shared mutable state = unpredictable bugs. Any reference can modify the object, causing surprise side-effects.",
    "immutable-solution":
      "Spread { ...obj } creates a new object. React state MUST be immutable — never mutate state directly.",
    "array-patterns":
      "Mutable methods (push/pop/sort/splice) change the original array. Immutable patterns return new arrays — safe to share.",
  };

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <Lock className="size-4 text-violet-500 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">Immutability</span>
        <div className="flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "px-2 py-1 rounded text-[11px] font-semibold transition-all duration-200",
                tab === t.id
                  ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                  : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive area */}
      <div className="min-h-[280px] px-4 pt-4 pb-3 flex flex-col gap-3">
        {tab === "mutation-bug" && <MutationBugDemo />}
        {tab === "immutable-solution" && <ImmutableSolutionDemo />}
        {tab === "array-patterns" && <ArrayPatternsDemo />}

        {/* Key insight */}
        <div className="text-[10px] text-zinc-400 dark:text-zinc-500 bg-zinc-50 dark:bg-zinc-800/40 rounded-lg px-3 py-2 mt-auto">
          {insights[tab]}
        </div>
      </div>
    </div>
  );
}
