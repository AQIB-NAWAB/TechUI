"use client";

import { useState, useEffect, useRef } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Lock, ChevronLeft, RotateCcw } from "lucide-react";

export const ImmutabilitySchema = z.object({
  example: z.enum(["mutation-bug", "immutable-solution", "array-patterns"]).default("mutation-bug"),
});

export type ImmutabilityProps = z.infer<typeof ImmutabilitySchema>;

type MutationPhase = "initial" | "refs-assigned" | "mutated" | "revealed";
type ImmutablePhase = "initial" | "ref1-assigned" | "ref2-spread" | "result";

const MUTATION_PHASES: MutationPhase[] = ["initial", "refs-assigned", "mutated", "revealed"];
const IMMUTABLE_PHASES: ImmutablePhase[] = ["initial", "ref1-assigned", "ref2-spread", "result"];

const ARRAY_PATTERNS = [
  { mutable: "arr.push(4)", immutable: "[...arr, 4]", label: "Add to end" },
  { mutable: "arr.pop()", immutable: "arr.slice(0, -1)", label: "Remove last" },
  { mutable: "arr.sort()", immutable: "[...arr].sort()", label: "Sort" },
  { mutable: "arr.splice(…)", immutable: "arr.filter(…)", label: "Remove item" },
];

function MutationVisual({ phase }: { phase: MutationPhase }) {
  const userScore = phase === "mutated" || phase === "revealed" ? 100 : 0;
  const showRef2Surprise = phase === "revealed";

  return (
    <div className="border border-zinc-100 dark:border-zinc-800 rounded-lg p-3 bg-zinc-50 dark:bg-zinc-800/50 min-h-[180px] flex flex-col gap-2">
      <div className="flex justify-center mb-1">
        <div className={cn(
          "border-2 rounded-lg px-4 py-2 text-center transition-all duration-500",
          userScore > 0
            ? "border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-900/20"
            : "border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20"
        )}>
          <div className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 mb-0.5">Shared Object</div>
          <div className="font-mono text-xs">
            <span className="text-zinc-500">{"{ "}</span>
            <span className="text-blue-600 dark:text-blue-300">score</span>
            <span className="text-zinc-400">: </span>
            <span className={cn("font-bold transition-all duration-500", userScore > 0 ? "text-red-500" : "text-amber-600")}>{userScore}</span>
            <span className="text-zinc-500"> {"}"}</span>
          </div>
        </div>
      </div>

      {(phase === "refs-assigned" || phase === "mutated" || phase === "revealed") && (
        <div className="flex justify-center gap-8 transition-all duration-500">
          <div className="flex flex-col items-center gap-1">
            <div className="font-mono text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1">
              <span className="text-violet-600">ref1</span>
            </div>
            <div className="font-mono text-[11px] text-zinc-500">
              .score = <span className="font-bold text-red-500">{userScore}</span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className={cn(
              "font-mono text-xs border rounded px-2 py-1 transition-all duration-500",
              showRef2Surprise ? "bg-red-50 border-red-400" : "bg-white dark:bg-zinc-900 border-zinc-200"
            )}>
              <span className="text-violet-600">ref2</span>
            </div>
            <div className="font-mono text-[11px] text-zinc-500">
              .score = <span className="font-bold text-red-500">{userScore}</span>
              {showRef2Surprise && <span className="ml-1 text-[10px] text-red-500 font-bold">SURPRISE!</span>}
            </div>
          </div>
        </div>
      )}

      <div className="mt-auto text-center text-[11px] font-mono min-h-[16px]">
        {phase === "initial" && <span className="text-zinc-400">ref1 = user, ref2 = user — same object</span>}
        {phase === "refs-assigned" && <span className="text-blue-500">Both refs point to the same object</span>}
        {phase === "mutated" && <span className="text-amber-600">ref1.score = 100 — mutating shared object</span>}
        {phase === "revealed" && <span className="text-red-500">ref2.score is also 100 — unintended side effect!</span>}
      </div>
    </div>
  );
}

function ImmutableVisual({ phase }: { phase: ImmutablePhase }) {
  const showRef1 = phase !== "initial";
  const showRef2 = phase === "ref2-spread" || phase === "result";
  const showResult = phase === "result";

  return (
    <div className="border border-zinc-100 dark:border-zinc-800 rounded-lg p-3 bg-zinc-50 dark:bg-zinc-800/50 min-h-[180px] flex flex-col gap-2">
      <div className="flex flex-col gap-2">
        {showRef1 && (
          <div className="flex items-center gap-2 transition-all duration-500">
            <div className="font-mono text-xs border border-violet-300 rounded px-2 py-1 shrink-0">
              <span className="text-violet-600">ref1</span>
            </div>
            <span className="text-zinc-400 text-sm">→</span>
            <div className="border-2 border-blue-300 bg-blue-50 dark:bg-blue-900/20 rounded-lg px-3 py-1">
              <span className="font-mono text-xs">{"{ score: "}<span className="text-emerald-600">0</span>{" }"}</span>
              {showResult && <span className="ml-2 text-[11px] text-green-600 font-semibold">unchanged</span>}
            </div>
          </div>
        )}
        {showRef2 && (
          <div className="flex items-center gap-2 transition-all duration-500">
            <div className="font-mono text-xs border border-violet-300 rounded px-2 py-1 shrink-0">
              <span className="text-violet-600">ref2</span>
            </div>
            <span className="text-zinc-400 text-sm">→</span>
            <div className="border-2 border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg px-3 py-1">
              <span className="font-mono text-xs">{"{ score: "}<span className="text-amber-600 font-bold">100</span>{" }"}</span>
              {showResult && <span className="ml-2 text-[11px] text-green-600 font-semibold">new object</span>}
            </div>
          </div>
        )}
      </div>

      <div className="mt-auto text-center text-[11px] font-mono min-h-[16px]">
        {phase === "initial" && <span className="text-zinc-400">Start with user = {"{ score: 0 }"}</span>}
        {phase === "ref1-assigned" && <span className="text-blue-500">ref1 = user — points to original</span>}
        {phase === "ref2-spread" && <span className="text-emerald-600">ref2 = {"{ ...user, score: 100 }"} — new object!</span>}
        {phase === "result" && <span className="text-green-600">ref1 safe, ref2 has new value</span>}
      </div>
    </div>
  );
}

export function Immutability({ example = "mutation-bug" }: ImmutabilityProps) {
  const [tab, setTab] = useState<"mutation-bug" | "immutable-solution" | "array-patterns">(example);
  const [stepIdx, setStepIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [patternIdx, setPatternIdx] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const tabs = [
    { id: "mutation-bug" as const, label: "Bug" },
    { id: "immutable-solution" as const, label: "Fix" },
    { id: "array-patterns" as const, label: "Arrays" },
  ];

  const totalSteps = tab === "array-patterns" ? ARRAY_PATTERNS.length : tab === "mutation-bug" ? MUTATION_PHASES.length : IMMUTABLE_PHASES.length;
  const isDone = tab !== "array-patterns" && stepIdx >= totalSteps - 1;

  useEffect(() => {
    setStepIdx(0);
    setPlaying(false);
    setPatternIdx(0);
  }, [tab]);

  useEffect(() => {
    if (playing && tab !== "array-patterns") {
      intervalRef.current = setInterval(() => {
        setStepIdx((p) => {
          if (p >= totalSteps - 1) {
            setPlaying(false);
            return p;
          }
          return p + 1;
        });
      }, 1300);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [playing, totalSteps, tab]);

  function handlePrimary() {
    if (tab === "array-patterns") {
      setPatternIdx((p) => (p + 1) % ARRAY_PATTERNS.length);
      return;
    }
    if (isDone) {
      setStepIdx(0);
      setPlaying(true);
    } else {
      setPlaying((p) => !p);
    }
  }

  function handleReset() {
    setStepIdx(0);
    setPlaying(false);
    setPatternIdx(0);
  }

  const mutationPhase = MUTATION_PHASES[stepIdx] ?? "initial";
  const immutablePhase = IMMUTABLE_PHASES[stepIdx] ?? "initial";

  const footerStatus =
    tab === "array-patterns"
      ? `Pattern: ${ARRAY_PATTERNS[patternIdx].label}`
      : tab === "mutation-bug"
      ? mutationPhase === "revealed"
        ? "Shared mutable state causes surprise bugs"
        : `Step ${stepIdx + 1}/${totalSteps}: watch what happens to ref2`
      : immutablePhase === "result"
      ? "Spread creates a new object — original stays safe"
      : `Step ${stepIdx + 1}/${totalSteps}: immutable update in action`;

  const primaryLabel =
    tab === "array-patterns"
      ? "Next Pattern"
      : playing
      ? "Pause"
      : isDone
      ? "Replay"
      : "Run Demo";

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800">
        <Lock className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">Immutability</span>
        <div className="flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "px-2 py-1 rounded text-[11px] font-semibold transition-all duration-500",
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

      <p className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        Never mutate shared data — create a new copy instead so nothing changes unexpectedly.
      </p>

      <div className="min-h-[220px] px-4 pt-4 pb-2">
        {tab === "mutation-bug" && <MutationVisual phase={mutationPhase} />}
        {tab === "immutable-solution" && <ImmutableVisual phase={immutablePhase} />}
        {tab === "array-patterns" && (
          <div className="border border-zinc-100 dark:border-zinc-800 rounded-lg p-3 bg-zinc-50 dark:bg-zinc-800/50 min-h-[180px] flex flex-col gap-2">
            <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center text-[11px] font-semibold">
              <div className="text-center py-1 bg-red-100 dark:bg-red-900/30 text-red-700 rounded">Mutable</div>
              <div />
              <div className="text-center py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 rounded">Immutable</div>
            </div>
            {ARRAY_PATTERNS.map((row, i) => (
              <div
                key={i}
                className={cn(
                  "grid grid-cols-[1fr_auto_1fr] gap-2 items-center rounded-lg transition-all duration-500 p-1",
                  patternIdx === i ? "bg-zinc-100 dark:bg-zinc-800 ring-1 ring-zinc-300 dark:ring-zinc-600" : "opacity-40"
                )}
              >
                <div className="font-mono text-xs text-center py-1.5 px-2 rounded border bg-red-50 border-red-200 text-red-700">{row.mutable}</div>
                <div className="text-[10px] text-zinc-400 whitespace-nowrap">{row.label}</div>
                <div className="font-mono text-xs text-center py-1.5 px-2 rounded border bg-emerald-50 border-emerald-200 text-emerald-700">{row.immutable}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
        {tab !== "array-patterns" && (
          <>
            <button
              onClick={() => setStepIdx((p) => Math.max(0, p - 1))}
              disabled={stepIdx === 0}
              className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-30 transition-all duration-500"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              onClick={handleReset}
              className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all duration-500"
            >
              <RotateCcw className="size-3.5" />
            </button>
          </>
        )}
        <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1 truncate">{footerStatus}</span>
        <button
          onClick={handlePrimary}
          className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity shrink-0"
        >
          {primaryLabel}
        </button>
      </div>
    </div>
  );
}
