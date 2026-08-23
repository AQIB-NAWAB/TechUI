"use client";

import { useState, useCallback } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

export const AiEmbeddingsSchema = z.object({
  words: z.array(z.object({
    text: z.string(),
    x: z.number(),
    y: z.number(),
    category: z.enum(["fruit", "vehicle", "animal", "tech", "food"]),
  })).default([
    { text: "apple",      x: 0.15, y: 0.80, category: "fruit"   },
    { text: "banana",     x: 0.20, y: 0.70, category: "fruit"   },
    { text: "mango",      x: 0.10, y: 0.65, category: "fruit"   },
    { text: "car",        x: 0.75, y: 0.25, category: "vehicle" },
    { text: "truck",      x: 0.85, y: 0.20, category: "vehicle" },
    { text: "bike",       x: 0.70, y: 0.35, category: "vehicle" },
    { text: "dog",        x: 0.35, y: 0.55, category: "animal"  },
    { text: "cat",        x: 0.30, y: 0.60, category: "animal"  },
    { text: "python",     x: 0.60, y: 0.75, category: "tech"    },
    { text: "javascript", x: 0.65, y: 0.80, category: "tech"    },
    { text: "api",        x: 0.55, y: 0.70, category: "tech"    },
  ]),
});

export type AiEmbeddingsProps = z.infer<typeof AiEmbeddingsSchema>;

const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  fruit:   { bg: "bg-emerald-50 dark:bg-emerald-950/30",   border: "border-emerald-300 dark:border-emerald-700", text: "text-emerald-800 dark:text-emerald-200", dot: "bg-emerald-500" },
  vehicle: { bg: "bg-blue-50 dark:bg-blue-950/30",         border: "border-blue-300 dark:border-blue-700",       text: "text-blue-800 dark:text-blue-200",       dot: "bg-blue-500"    },
  animal:  { bg: "bg-amber-50 dark:bg-amber-950/30",       border: "border-amber-300 dark:border-amber-700",     text: "text-amber-800 dark:text-amber-200",     dot: "bg-amber-500"   },
  tech:    { bg: "bg-violet-50 dark:bg-violet-950/30",     border: "border-violet-300 dark:border-violet-700",   text: "text-violet-800 dark:text-violet-200",   dot: "bg-violet-500"  },
  food:    { bg: "bg-rose-50 dark:bg-rose-950/30",         border: "border-rose-300 dark:border-rose-700",       text: "text-rose-800 dark:text-rose-200",       dot: "bg-rose-500"    },
};

const CATEGORY_LEGEND_COLORS: Record<string, string> = {
  fruit:   "bg-emerald-500",
  vehicle: "bg-blue-500",
  animal:  "bg-amber-500",
  tech:    "bg-violet-500",
  food:    "bg-rose-500",
};

function euclidean(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function distToSimilarity(dist: number): number {
  // Map Euclidean distance (0–~1.4) to similarity score (1–0)
  return Math.max(0, Math.round((1 - dist / 1.2) * 100) / 100);
}

export function AiEmbeddings({ words = [] }: AiEmbeddingsProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleClick = useCallback((text: string) => {
    setSelected((prev) => (prev === text ? null : text));
  }, []);

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

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
        <Sparkles className="size-4 text-violet-500" />
        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Embeddings</span>
        <span className="ml-auto text-[10px] text-zinc-400 dark:text-zinc-500">2D projection of vectors</span>
      </div>

      {/* Plot area */}
      <div className="px-4 pt-3 pb-2">
        <div
          className="relative min-h-[200px] rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30 overflow-hidden"
          style={{ height: 220 }}
        >
          {/* Grid lines */}
          <div className="absolute inset-0 pointer-events-none">
            {[25, 50, 75].map((pct) => (
              <div key={`h${pct}`} className="absolute left-0 right-0 border-t border-zinc-100 dark:border-zinc-800/60" style={{ top: `${pct}%` }} />
            ))}
            {[25, 50, 75].map((pct) => (
              <div key={`v${pct}`} className="absolute top-0 bottom-0 border-l border-zinc-100 dark:border-zinc-800/60" style={{ left: `${pct}%` }} />
            ))}
          </div>

          {/* Words */}
          {words.map((word) => {
            const color = CATEGORY_COLORS[word.category] ?? CATEGORY_COLORS.food;
            const isSelected = word.text === selected;
            const isNeighbor = neighborSet.has(word.text);
            const neighborIdx = neighbors.findIndex((n) => n.text === word.text);
            const neighborItem = neighborIdx >= 0 ? neighbors[neighborIdx] : null;

            return (
              <button
                key={word.text}
                onClick={() => handleClick(word.text)}
                className={cn(
                  "absolute -translate-x-1/2 -translate-y-1/2 px-2 py-0.5 rounded-md border text-[10px] font-semibold transition-all duration-500 hover:scale-110 hover:z-20 z-10",
                  color.bg, color.border, color.text,
                  isSelected && "ring-2 ring-offset-1 ring-violet-500 scale-110 z-20",
                  isNeighbor && "ring-2 ring-offset-1 ring-amber-400 scale-105 z-20",
                  !isSelected && !isNeighbor && selected && "opacity-40",
                )}
                style={{
                  left: `${word.x * 100}%`,
                  top: `${(1 - word.y) * 100}%`,
                }}
                title={`${word.text} (${word.category})`}
              >
                {word.text}
                {isNeighbor && neighborItem && (
                  <span className="ml-1 text-amber-600 dark:text-amber-400 font-mono">
                    {distToSimilarity(neighborItem.dist).toFixed(2)}
                  </span>
                )}
              </button>
            );
          })}

          {/* Idle hint */}
          {!selected && (
            <div className="absolute bottom-2 right-2 text-[9px] text-zinc-400 dark:text-zinc-600 pointer-events-none">
              click a word
            </div>
          )}
        </div>
      </div>

      {/* Neighbor result panel */}
      <div className="px-4 pb-3 min-h-[48px]">
        {selected && selectedWord ? (
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className={cn("px-2 py-0.5 rounded-md border font-semibold", CATEGORY_COLORS[selectedWord.category]?.bg, CATEGORY_COLORS[selectedWord.category]?.border, CATEGORY_COLORS[selectedWord.category]?.text)}>
              {selected}
            </span>
            <span className="text-zinc-400 dark:text-zinc-500">nearest:</span>
            {neighbors.map((n, i) => (
              <span key={n.text} className="flex items-center gap-0.5">
                <span className={cn("px-1.5 py-0.5 rounded border font-medium", CATEGORY_COLORS[n.category]?.bg, CATEGORY_COLORS[n.category]?.border, CATEGORY_COLORS[n.category]?.text)}>
                  {n.text}
                </span>
                <span className="font-mono text-amber-600 dark:text-amber-400 font-semibold">
                  ({distToSimilarity(n.dist).toFixed(2)})
                </span>
                {i < neighbors.length - 1 && <span className="text-zinc-300 dark:text-zinc-700 ml-0.5">·</span>}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
            Click any word to see its 3 nearest neighbors and similarity scores
          </p>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 border-t border-zinc-100 dark:border-zinc-800">
        {categories.map((cat) => (
          <span key={cat} className="flex items-center gap-1 text-[10px] text-zinc-500 dark:text-zinc-400 capitalize">
            <span className={cn("inline-block size-2 rounded-full", CATEGORY_LEGEND_COLORS[cat])} />
            {cat}
          </span>
        ))}
      </div>

      {/* Insight footer */}
      <div className="px-4 py-2.5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40">
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
          <strong className="text-zinc-700 dark:text-zinc-300">Key insight:</strong>{" "}
          Words with similar meanings land near each other — the model learned this from text.
        </p>
      </div>
    </div>
  );
}
