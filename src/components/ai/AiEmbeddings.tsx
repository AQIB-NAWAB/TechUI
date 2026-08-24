"use client";

import { useState, useCallback } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Sparkles, RotateCcw } from "lucide-react";

export const AiEmbeddingsSchema = z.object({
  words: z.array(z.object({
    text: z.string(),
    x: z.number(),
    y: z.number(),
    category: z.enum(["fruit", "vehicle", "animal", "tech", "food"]),
  })).default([
    { text: "apple", x: 0.15, y: 0.80, category: "fruit" },
    { text: "banana", x: 0.20, y: 0.70, category: "fruit" },
    { text: "mango", x: 0.10, y: 0.65, category: "fruit" },
    { text: "car", x: 0.75, y: 0.25, category: "vehicle" },
    { text: "truck", x: 0.85, y: 0.20, category: "vehicle" },
    { text: "bike", x: 0.70, y: 0.35, category: "vehicle" },
    { text: "dog", x: 0.35, y: 0.55, category: "animal" },
    { text: "cat", x: 0.30, y: 0.60, category: "animal" },
    { text: "python", x: 0.60, y: 0.75, category: "tech" },
    { text: "javascript", x: 0.65, y: 0.80, category: "tech" },
    { text: "api", x: 0.55, y: 0.70, category: "tech" },
  ]),
});

export type AiEmbeddingsProps = z.infer<typeof AiEmbeddingsSchema>;

const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  fruit: { bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-300 dark:border-emerald-700", text: "text-emerald-800 dark:text-emerald-200", dot: "bg-emerald-500" },
  vehicle: { bg: "bg-blue-50 dark:bg-blue-950/30", border: "border-blue-300 dark:border-blue-700", text: "text-blue-800 dark:text-blue-200", dot: "bg-blue-500" },
  animal: { bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-300 dark:border-amber-700", text: "text-amber-800 dark:text-amber-200", dot: "bg-amber-500" },
  tech: { bg: "bg-violet-50 dark:bg-violet-950/30", border: "border-violet-300 dark:border-violet-700", text: "text-violet-800 dark:text-violet-200", dot: "bg-violet-500" },
  food: { bg: "bg-rose-50 dark:bg-rose-950/30", border: "border-rose-300 dark:border-rose-700", text: "text-rose-800 dark:text-rose-200", dot: "bg-rose-500" },
};

function euclidean(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function distToSimilarity(dist: number): number {
  return Math.max(0, Math.round((1 - dist / 1.2) * 100) / 100);
}

export function AiEmbeddings({ words = [] }: AiEmbeddingsProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [autoIdx, setAutoIdx] = useState(0);

  const handleClick = useCallback((text: string) => {
    setSelected((prev) => (prev === text ? null : text));
  }, []);

  const handleExplore = () => {
    const next = words[autoIdx % words.length];
    setSelected(next.text);
    setAutoIdx((i) => i + 1);
  };

  const handleReset = () => {
    setSelected(null);
    setAutoIdx(0);
  };

  const selectedWord = words.find((w) => w.text === selected);

  const neighbors = selectedWord
    ? words
        .filter((w) => w.text !== selected)
        .map((w) => ({ ...w, dist: euclidean(selectedWord, w) }))
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 3)
    : [];

  const neighborSet = new Set(neighbors.map((n) => n.text));
  const categories = Array.from(new Set(words.map((w) => w.category)));

  const footerStatus = selected
    ? `"${selected}" → nearest: ${neighbors.map((n) => `${n.text} (${distToSimilarity(n.dist).toFixed(2)})`).join(", ")}`
    : "Similar words cluster together in vector space";

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800">
        <Sparkles className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">Embeddings</span>
        <span className="text-[10px] text-zinc-400 border border-zinc-200 dark:border-zinc-700 px-2 py-0.5 rounded">2D map</span>
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        Words become numbers — similar meanings end up close together.
      </p>

      <div className="min-h-[220px] px-4 pt-3 pb-2">
        <div className="relative h-[180px] rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30 overflow-hidden">
          {[25, 50, 75].map((pct) => (
            <div key={`h${pct}`} className="absolute left-0 right-0 border-t border-zinc-100 dark:border-zinc-800/60 pointer-events-none" style={{ top: `${pct}%` }} />
          ))}
          {[25, 50, 75].map((pct) => (
            <div key={`v${pct}`} className="absolute top-0 bottom-0 border-l border-zinc-100 dark:border-zinc-800/60 pointer-events-none" style={{ left: `${pct}%` }} />
          ))}

          {words.map((word) => {
            const color = CATEGORY_COLORS[word.category] ?? CATEGORY_COLORS.food;
            const isSelected = word.text === selected;
            const isNeighbor = neighborSet.has(word.text);
            const neighborItem = neighbors.find((n) => n.text === word.text);

            return (
              <button
                key={word.text}
                onClick={() => handleClick(word.text)}
                className={cn(
                  "absolute -translate-x-1/2 -translate-y-1/2 px-2 py-0.5 rounded-md border text-[10px] font-semibold transition-all duration-500 hover:scale-110 z-10",
                  color.bg, color.border, color.text,
                  isSelected && "ring-2 ring-offset-1 ring-violet-500 scale-110 z-20",
                  isNeighbor && "ring-2 ring-offset-1 ring-amber-400 scale-105 z-20",
                  !isSelected && !isNeighbor && selected && "opacity-40"
                )}
                style={{ left: `${word.x * 100}%`, top: `${(1 - word.y) * 100}%` }}
              >
                {word.text}
                {isNeighbor && neighborItem && (
                  <span className="ml-1 text-amber-600 font-mono">{distToSimilarity(neighborItem.dist).toFixed(2)}</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 min-h-[20px]">
          {categories.map((cat) => (
            <span key={cat} className="flex items-center gap-1 text-[10px] text-zinc-500 capitalize">
              <span className={cn("inline-block size-2 rounded-full", CATEGORY_COLORS[cat]?.dot)} />
              {cat}
            </span>
          ))}
        </div>
      </div>

      <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
        <button
          onClick={handleReset}
          className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all duration-500"
          title="Reset"
        >
          <RotateCcw className="size-3.5" />
        </button>
        <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1 truncate">{footerStatus}</span>
        <button
          onClick={handleExplore}
          className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity shrink-0"
        >
          Explore Word
        </button>
      </div>
    </div>
  );
}
