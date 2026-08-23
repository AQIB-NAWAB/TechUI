"use client";

import { useState, useEffect, useRef } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Filter } from "lucide-react";

export const BloomFilterSchema = z.object({
  size: z.number().default(16),
  hashCount: z.number().default(3),
  items: z.array(z.string()).default(["alice", "bob", "charlie"]),
});

export type BloomFilterProps = z.infer<typeof BloomFilterSchema>;

// Simple deterministic hash functions
function hash1(str: string, size: number): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return h % size;
}

function hash2(str: string, size: number): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) ^ str.charCodeAt(i);
    h = h >>> 0;
  }
  return h % size;
}

function hash3(str: string, size: number): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 4) ^ (h >> 28) ^ str.charCodeAt(i);
    h = h >>> 0;
  }
  return h % size;
}

function hash4(str: string, size: number): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 1664525) >>> 0;
  }
  return h % size;
}

const ALL_HASHES = [hash1, hash2, hash3, hash4];

function getBits(item: string, size: number, hashCount: number): number[] {
  const count = Math.min(hashCount, ALL_HASHES.length);
  const bits: number[] = [];
  for (let i = 0; i < count; i++) {
    bits.push(ALL_HASHES[i]!(item, size));
  }
  return bits;
}

function buildBitArray(items: string[], size: number, hashCount: number): boolean[] {
  const arr = new Array<boolean>(size).fill(false);
  for (const item of items) {
    const bits = getBits(item, size, hashCount);
    for (const b of bits) arr[b] = true;
  }
  return arr;
}

const CHECK_ITEMS = ["alice", "dave", "eve"];

export function BloomFilter({
  size = 16,
  hashCount = 3,
  items = ["alice", "bob", "charlie"],
}: BloomFilterProps) {
  const effectiveHashCount = Math.min(hashCount, ALL_HASHES.length);
  const [insertedItems, setInsertedItems] = useState<string[]>(items);
  const [bitArray, setBitArray] = useState<boolean[]>(() => buildBitArray(items, size, effectiveHashCount));
  const [highlightedBits, setHighlightedBits] = useState<Set<number>>(new Set());
  const [checkResult, setCheckResult] = useState<{ item: string; bits: number[]; inSet: boolean; falsePositive: boolean } | null>(null);
  const [animatingStep, setAnimatingStep] = useState<number>(-1);
  const [newItemInput, setNewItemInput] = useState("");
  const [newlyLitBits, setNewlyLitBits] = useState<Set<number>>(new Set());
  const animTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const newItems = items;
    setInsertedItems(newItems);
    setBitArray(buildBitArray(newItems, size, effectiveHashCount));
    setHighlightedBits(new Set());
    setCheckResult(null);
    setAnimatingStep(-1);
    setNewlyLitBits(new Set());
  }, [items, size, hashCount, effectiveHashCount]);

  function runCheck(item: string) {
    if (animTimerRef.current) clearTimeout(animTimerRef.current);
    const bits = getBits(item, size, effectiveHashCount);
    const allSet = bits.every((b) => bitArray[b]);
    const actuallyIn = insertedItems.includes(item);
    const falsePositive = allSet && !actuallyIn;

    setCheckResult({ item, bits, inSet: allSet, falsePositive });
    setHighlightedBits(new Set());
    setAnimatingStep(-1);
    setNewlyLitBits(new Set());

    // Animate hash checks one by one
    bits.forEach((bit, idx) => {
      animTimerRef.current = setTimeout(() => {
        setAnimatingStep(idx);
        setHighlightedBits((prev) => {
          const next = new Set(prev);
          next.add(bit);
          return next;
        });
      }, idx * 600);
    });

    animTimerRef.current = setTimeout(() => {
      setAnimatingStep(bits.length);
    }, bits.length * 600);
  }

  function addItem() {
    const item = newItemInput.trim();
    if (!item) return;
    const newItems = insertedItems.includes(item) ? insertedItems : [...insertedItems, item];
    const newBits = buildBitArray(newItems, size, effectiveHashCount);
    const justLit = getBits(item, size, effectiveHashCount).filter((b) => !bitArray[b]);
    setNewlyLitBits(new Set(justLit));
    setInsertedItems(newItems);
    setBitArray(newBits);
    setNewItemInput("");
    setCheckResult(null);
    setHighlightedBits(new Set());
    setAnimatingStep(-1);
    setTimeout(() => setNewlyLitBits(new Set()), 1200);
  }

  const checkBits = checkResult ? getBits(checkResult.item, size, effectiveHashCount) : [];

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <Filter className="size-4 text-violet-500 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">Bloom Filter</span>
        <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
          {size}-bit · {effectiveHashCount} hash func{effectiveHashCount !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Interactive area */}
      <div className="min-h-[300px] px-4 pt-4 pb-3 flex flex-col gap-4">

        {/* Bit array */}
        <div>
          <div className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Bit array</div>
          <div className="flex flex-wrap gap-1">
            {bitArray.map((bit, idx) => {
              const isHighlighted = highlightedBits.has(idx);
              const isCheckBit = checkBits.includes(idx);
              const isNewlyLit = newlyLitBits.has(idx);
              return (
                <div key={idx} className="flex flex-col items-center gap-0.5">
                  <div
                    className={cn(
                      "w-7 h-7 rounded-md border-2 flex items-center justify-center text-[10px] font-bold font-mono transition-all duration-500",
                      isNewlyLit
                        ? "bg-emerald-200 dark:bg-emerald-800/60 border-emerald-500 text-emerald-700 dark:text-emerald-300 scale-110"
                        : isHighlighted
                        ? "bg-violet-200 dark:bg-violet-800/60 border-violet-500 text-violet-700 dark:text-violet-300 scale-110"
                        : bit
                        ? "bg-blue-100 dark:bg-blue-900/40 border-blue-400 dark:border-blue-600 text-blue-700 dark:text-blue-300"
                        : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-600"
                    )}
                  >
                    {bit ? "1" : "0"}
                  </div>
                  <span className={cn(
                    "text-[8px] font-mono tabular-nums transition-all duration-300",
                    isCheckBit ? "text-violet-500 dark:text-violet-400 font-bold" : "text-zinc-300 dark:text-zinc-600"
                  )}>
                    {idx}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Inserted items */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Inserted:</span>
          {insertedItems.map((item) => (
            <span key={item} className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              {item}
            </span>
          ))}
          {insertedItems.length === 0 && (
            <span className="text-[11px] text-zinc-400 italic">none</span>
          )}
        </div>

        {/* Check result */}
        {checkResult && (
          <div className={cn(
            "rounded-lg px-3 py-2.5 border text-xs transition-all duration-500",
            checkResult.falsePositive
              ? "bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700"
              : checkResult.inSet
              ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700"
              : "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700"
          )}>
            <div className="flex items-start gap-2 mb-1.5">
              <span className="font-semibold text-zinc-600 dark:text-zinc-300">Check:</span>
              <code className="font-mono font-bold text-zinc-800 dark:text-zinc-100">&quot;{checkResult.item}&quot;</code>
            </div>
            <div className="flex flex-wrap gap-2 mb-2">
              {checkResult.bits.map((bit, idx) => (
                <span key={idx} className={cn(
                  "text-[11px] font-mono transition-all duration-300",
                  idx < animatingStep
                    ? bitArray[bit]
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-500 dark:text-red-400"
                    : "text-zinc-400"
                )}>
                  Hash {idx + 1}: {bit}{" "}
                  {idx < animatingStep
                    ? bitArray[bit] ? "✓" : "✗"
                    : "…"}
                </span>
              ))}
            </div>
            {animatingStep >= checkResult.bits.length && (
              <div className={cn(
                "font-bold text-sm transition-all duration-500",
                checkResult.falsePositive
                  ? "text-amber-600 dark:text-amber-400"
                  : checkResult.inSet
                  ? "text-emerald-700 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
              )}>
                {checkResult.falsePositive
                  ? "⚠ FALSE POSITIVE — all bits set, but item was never inserted!"
                  : checkResult.inSet
                  ? "✓ PROBABLY in set"
                  : "✗ DEFINITELY NOT in set — at least one bit is 0"}
              </div>
            )}
          </div>
        )}

        {/* Check buttons */}
        <div className="flex flex-wrap gap-2">
          {CHECK_ITEMS.map((item) => (
            <button
              key={item}
              onClick={() => runCheck(item)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200",
                checkResult?.item === item
                  ? "bg-violet-100 dark:bg-violet-900/40 border-violet-400 dark:border-violet-600 text-violet-700 dark:text-violet-300"
                  : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700"
              )}
            >
              Check &quot;{item}&quot;
            </button>
          ))}
        </div>

        {/* Add item */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newItemInput}
            onChange={(e) => setNewItemInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addItem()}
            placeholder='Add item (e.g. "dave")'
            className="flex-1 text-xs font-mono px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-400 transition-all"
          />
          <button
            onClick={addItem}
            disabled={!newItemInput.trim()}
            className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-30"
          >
            Add
          </button>
        </div>

        {/* Key insight */}
        <div className="text-[10px] text-zinc-400 dark:text-zinc-500 bg-zinc-50 dark:bg-zinc-800/40 rounded-lg px-3 py-2">
          Bloom filters <strong className="text-zinc-600 dark:text-zinc-300">never have false negatives</strong>, but can have{" "}
          <strong className="text-amber-600 dark:text-amber-400">false positives</strong>. Used in DBs to skip unnecessary disk reads.
        </div>
      </div>
    </div>
  );
}
