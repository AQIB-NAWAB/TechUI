"use client";

import { useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Hash, RefreshCw } from "lucide-react";

export const HashTableCollisionSchema = z.object({
  title: z.string().optional().default("Hash Table Collisions"),
  strategy: z.enum(["chaining", "open-addressing"]).optional().default("chaining"),
  bucketCount: z.number().int().min(4).max(8).optional().default(6),
  keysToInsert: z.array(z.string()).optional().default(["cat", "act", "tac", "dog", "god"]),
  interactive: z.boolean().optional().default(true),
});

export type HashTableCollisionProps = z.infer<typeof HashTableCollisionSchema>;

type BucketState = {
  index: number;
  chain: string[];
  probe: string | null;
};

function hashKey(key: string, bucketCount: number): number {
  let sum = 0;
  for (let i = 0; i < key.length; i++) sum += key.charCodeAt(i);
  return sum % bucketCount;
}

function buildInitialBuckets(bucketCount: number): BucketState[] {
  return Array.from({ length: bucketCount }, (_, i) => ({
    index: i,
    chain: [],
    probe: null,
  }));
}

export function HashTableCollision({
  title = "Hash Table Collisions",
  strategy = "chaining",
  bucketCount = 6,
  keysToInsert = ["cat", "act", "tac", "dog", "god"],
  interactive = true,
}: HashTableCollisionProps) {
  const [currentStrategy, setCurrentStrategy] = useState(strategy);
  const [buckets, setBuckets] = useState<BucketState[]>(() => buildInitialBuckets(bucketCount));
  const [insertIndex, setInsertIndex] = useState(0);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [highlightBucket, setHighlightBucket] = useState<number | null>(null);
  const [animating, setAnimating] = useState(false);

  const remaining = keysToInsert.slice(insertIndex);
  const done = insertIndex >= keysToInsert.length;

  function reset() {
    setBuckets(buildInitialBuckets(bucketCount));
    setInsertIndex(0);
    setLastAction(null);
    setHighlightBucket(null);
    setAnimating(false);
  }

  function switchStrategy(next: "chaining" | "open-addressing") {
    setCurrentStrategy(next);
    reset();
  }

  function insertNext() {
    if (animating || done) return;
    const key = keysToInsert[insertIndex];
    const target = hashKey(key, bucketCount);
    setAnimating(true);
    setHighlightBucket(target);

    setTimeout(() => {
      if (currentStrategy === "chaining") {
        setBuckets((prev) =>
          prev.map((b) =>
            b.index === target ? { ...b, chain: [...b.chain, key] } : b
          )
        );
        const collision = buckets[target].chain.length > 0;
        setLastAction(
          collision
            ? `"${key}" collided at bucket ${target} — chained onto the linked list.`
            : `"${key}" landed in empty bucket ${target}.`
        );
      } else {
        let placed = false;
        let probeCount = 0;
        setBuckets((prev) => {
          const next = prev.map((b) => ({ ...b, probe: b.probe }));
          for (let i = 0; i < bucketCount; i++) {
            const idx = (target + i) % bucketCount;
            probeCount = i;
            if (!next[idx].probe) {
              next[idx] = { ...next[idx], probe: key };
              placed = true;
              break;
            }
          }
          return next;
        });
        setLastAction(
          placed
            ? probeCount > 0
              ? `"${key}" collided at bucket ${target} — probed ${probeCount} slot(s) forward.`
              : `"${key}" landed in empty bucket ${target}.`
            : `"${key}" could not be placed — table is full.`
        );
      }

      setInsertIndex((i) => i + 1);
      setTimeout(() => {
        setHighlightBucket(null);
        setAnimating(false);
      }, 800);
    }, 1000);
  }

  const statusText = done
    ? "All keys inserted. Toggle strategy to compare collision handling."
    : lastAction ?? `Next key: "${remaining[0]}" → bucket ${hashKey(remaining[0], bucketCount)}`;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/50">
        <Hash className="size-4 text-violet-500 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">{title}</span>
        <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
          {currentStrategy}
        </span>
        {interactive && (
          <button onClick={reset} className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all duration-500">
            <RefreshCw className="size-3.5" />
          </button>
        )}
      </div>

      <div className="px-4 py-2 text-sm text-zinc-500 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-900">
        {currentStrategy === "chaining"
          ? "Collisions store multiple keys in a linked list at the same bucket."
          : "Collisions probe forward to the next empty slot (linear probing)."}
      </div>

      <div className="p-4 min-h-[220px]">
        {interactive && (
          <div className="flex gap-2 mb-4">
            {(["chaining", "open-addressing"] as const).map((s) => (
              <button
                key={s}
                onClick={() => switchStrategy(s)}
                className={cn(
                  "text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-md border transition-all duration-500",
                  currentStrategy === s
                    ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white"
                    : "bg-zinc-50 dark:bg-zinc-900 text-zinc-500 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400"
                )}
              >
                {s === "chaining" ? "Chaining" : "Open Addressing"}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {buckets.map((bucket) => (
            <div
              key={bucket.index}
              className={cn(
                "rounded-lg border p-2 min-h-[72px] transition-all duration-500",
                highlightBucket === bucket.index
                  ? "border-amber-400 bg-amber-50 dark:bg-amber-950/30 ring-2 ring-amber-300 dark:ring-amber-700"
                  : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900"
              )}
            >
              <div className="text-[9px] font-semibold uppercase tracking-widest text-zinc-400 mb-1.5">
                [{bucket.index}]
              </div>
              {currentStrategy === "chaining" ? (
                <div className="flex flex-col gap-1">
                  {bucket.chain.length === 0 ? (
                    <span className="text-[10px] text-zinc-300 dark:text-zinc-600">empty</span>
                  ) : (
                    bucket.chain.map((k, i) => (
                      <span
                        key={`${k}-${i}`}
                        className={cn(
                          "text-[10px] font-mono font-bold px-1.5 py-0.5 rounded transition-all duration-500",
                          i === bucket.chain.length - 1 && highlightBucket === bucket.index
                            ? "bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100"
                            : "bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300"
                        )}
                      >
                        {i > 0 && <span className="text-zinc-400 mr-0.5">→</span>}
                        {k}
                      </span>
                    ))
                  )}
                </div>
              ) : (
                <div>
                  {bucket.probe ? (
                    <span
                      className={cn(
                        "text-[10px] font-mono font-bold px-1.5 py-0.5 rounded transition-all duration-500",
                        highlightBucket !== null &&
                          keysToInsert[insertIndex - 1] === bucket.probe
                          ? "bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100"
                          : "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                      )}
                    >
                      {bucket.probe}
                    </span>
                  ) : (
                    <span className="text-[10px] text-zinc-300 dark:text-zinc-600">empty</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          <span className="text-[10px] text-zinc-400 mr-1">Keys:</span>
          {keysToInsert.map((k, i) => (
            <span
              key={k + i}
              className={cn(
                "text-[10px] font-mono px-1.5 py-0.5 rounded transition-all duration-500",
                i < insertIndex
                  ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-400 line-through"
                  : i === insertIndex
                    ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
              )}
            >
              {k}
            </span>
          ))}
        </div>
      </div>

      {interactive && (
        <div className="border-t border-zinc-100 dark:border-zinc-900 px-4 py-3 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/30">
          <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">{statusText}</span>
          <button
            onClick={insertNext}
            disabled={animating || done}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-500 shrink-0 hover:opacity-90",
              done || animating
                ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-400 cursor-not-allowed"
                : "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
            )}
          >
            {done ? "Done" : "Insert Key"}
          </button>
        </div>
      )}
    </div>
  );
}
