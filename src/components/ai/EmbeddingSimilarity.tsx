"use client";

import { useState, useMemo } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Sparkles, RefreshCw, ArrowLeftRight } from "lucide-react";

const PairSchema = z.object({
  textA: z.string(),
  textB: z.string(),
  vectorA: z.array(z.number()),
  vectorB: z.array(z.number()),
});

export const EmbeddingSimilaritySchema = z.object({
  name: z.string().optional().default("Embedding Similarity"),
  pairs: z.array(PairSchema).optional().default([
    { textA: "king", textB: "queen", vectorA: [0.8, 0.6, 0.1, 0.3, 0.9, 0.2, 0.4, 0.7], vectorB: [0.75, 0.65, 0.15, 0.28, 0.85, 0.22, 0.42, 0.68] },
    { textA: "king", textB: "car", vectorA: [0.8, 0.6, 0.1, 0.3, 0.9, 0.2, 0.4, 0.7], vectorB: [0.1, 0.2, 0.9, 0.85, 0.05, 0.7, 0.6, 0.15] },
    { textA: "happy", textB: "joyful", vectorA: [0.7, 0.85, 0.2, 0.1, 0.3, 0.9, 0.15, 0.4], vectorB: [0.68, 0.88, 0.18, 0.12, 0.28, 0.92, 0.14, 0.38] },
    { textA: "python", textB: "javascript", vectorA: [0.5, 0.3, 0.9, 0.85, 0.2, 0.7, 0.95, 0.4], vectorB: [0.48, 0.32, 0.88, 0.82, 0.22, 0.68, 0.92, 0.42] },
  ]),
  interactive: z.boolean().optional().default(true),
});

export type EmbeddingSimilarityProps = z.infer<typeof EmbeddingSimilaritySchema>;

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    magA += a[i]! * a[i]!;
    magB += b[i]! * b[i]!;
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

function scoreColor(score: number) {
  if (score >= 0.75) return { bar: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400", label: "Very similar" };
  if (score >= 0.5) return { bar: "bg-amber-500", text: "text-amber-600 dark:text-amber-400", label: "Somewhat similar" };
  return { bar: "bg-red-500", text: "text-red-600 dark:text-red-400", label: "Not similar" };
}

export function EmbeddingSimilarity({
  name = "Embedding Similarity",
  pairs = [],
  interactive = true,
}: EmbeddingSimilarityProps) {
  const [pairIdx, setPairIdx] = useState(0);
  const [animating, setAnimating] = useState(false);

  const pair = pairs[pairIdx % pairs.length] ?? pairs[0];
  const score = useMemo(
    () => (pair ? cosineSimilarity(pair.vectorA, pair.vectorB) : 0),
    [pair]
  );
  const pct = Math.round(score * 100);
  const colors = scoreColor(score);

  function nextPair() {
    setAnimating(true);
    setTimeout(() => {
      setPairIdx((i) => (i + 1) % pairs.length);
      setAnimating(false);
    }, 500);
  }

  function reset() {
    setPairIdx(0);
    setAnimating(false);
  }

  const footerText =
    pairs.length === 0
      ? "Add phrase pairs to compare how similar their embeddings are."
      : pair
        ? score >= 0.75
          ? `"${pair.textA}" and "${pair.textB}" mean almost the same thing — vectors point the same way.`
          : score >= 0.5
            ? `"${pair.textA}" and "${pair.textB}" share some meaning but aren't close neighbors.`
            : `"${pair.textA}" and "${pair.textB}" live in different parts of vector space.`
        : "Click Compare Next Pair to step through examples.";

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/50">
        <Sparkles className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">{name}</span>
        <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">cosine</span>
        {interactive && (
          <button onClick={reset} className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all duration-500">
            <RefreshCw className="size-3.5" />
          </button>
        )}
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-900">
        AI turns words into number lists (vectors). Cosine similarity scores how close two meanings are — 100% means they point the same direction.
      </p>

      <div className="p-4 min-h-[280px] flex flex-col gap-4">
        {pairs.length > 0 && (
          <div className="text-[10px] font-mono text-zinc-400 text-center">
            Pair {(pairIdx % pairs.length) + 1} of {pairs.length}
          </div>
        )}

        {/* Phrase pair */}
        <div className="flex items-center gap-3">
          <div className="flex-1 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2.5 text-center">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-1">Phrase A</div>
            <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{pair?.textA ?? "—"}</span>
          </div>
          <ArrowLeftRight className="size-4 text-zinc-400 shrink-0" />
          <div className="flex-1 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2.5 text-center">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-1">Phrase B</div>
            <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{pair?.textB ?? "—"}</span>
          </div>
        </div>

        {/* Big score */}
        <div className="flex items-center gap-4">
          <div className="shrink-0 w-20 h-20 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-900 transition-all duration-500">
            <span className={cn("text-2xl font-bold font-mono transition-all duration-500", colors.text, animating && "opacity-40")}>
              {pct}%
            </span>
            <span className="text-[9px] text-zinc-400 uppercase tracking-wide">similar</span>
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex justify-between text-[10px]">
              <span className="text-zinc-400">Cosine similarity</span>
              <span className={cn("font-mono font-semibold", colors.text)}>{score.toFixed(3)}</span>
            </div>
            <div className="h-3 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-700", colors.bar)}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className={cn("text-xs font-medium", colors.text)}>{colors.label}</span>
          </div>
        </div>

        {/* Vector bars */}
        <div className="grid grid-cols-2 gap-3">
          {(["A", "B"] as const).map((label) => {
            const vec = label === "A" ? pair?.vectorA : pair?.vectorB;
            return (
              <div key={label} className="border border-zinc-100 dark:border-zinc-800 rounded-lg p-3 bg-zinc-50 dark:bg-zinc-900/50">
                <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-2">Vector {label}</div>
                <div className="flex items-end gap-1 h-12">
                  {(vec ?? []).map((v, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex-1 rounded-sm transition-all duration-500",
                        label === "A" ? "bg-violet-400 dark:bg-violet-500" : "bg-blue-400 dark:bg-blue-500",
                        animating && "opacity-40"
                      )}
                      style={{ height: `${Math.max(12, v * 100)}%` }}
                      title={`dim ${i}: ${v.toFixed(2)}`}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {interactive && (
        <div className="border-t border-zinc-100 dark:border-zinc-900 px-4 py-3 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/30 min-h-[52px]">
          <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">{footerText}</span>
          <button
            type="button"
            onClick={nextPair}
            disabled={pairs.length === 0 || animating}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 transition-all duration-500 shrink-0 disabled:opacity-50"
          >
            Compare Next Pair
          </button>
        </div>
      )}
    </div>
  );
}
