"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Database, ChevronLeft, ChevronRight, Play, RotateCcw } from "lucide-react";

const OperationSchema = z.object({
  op: z.enum(["get", "set"]),
  key: z.string(),
  value: z.string().optional(),
});

export const LruCacheSchema = z.object({
  capacity: z.number().default(4),
  operations: z.array(OperationSchema).default([
    { op: "set", key: "user:1", value: "Alice"   },
    { op: "set", key: "user:2", value: "Bob"     },
    { op: "set", key: "user:3", value: "Charlie" },
    { op: "get", key: "user:1"                   },
    { op: "set", key: "user:4", value: "Dana"    },
    { op: "set", key: "user:5", value: "Eve"     },
  ]),
});

export type LruCacheProps = z.infer<typeof LruCacheSchema>;

type Operation = z.infer<typeof OperationSchema>;

interface CacheSlot {
  key: string;
  value: string;
  id: number; // stable id for animation
  flash?: "hit" | "miss" | "evict" | "new";
}

interface StepResult {
  slots: CacheSlot[];        // MRU first
  message: string;
  messageType: "hit" | "miss" | "set" | "evict" | "info";
  evictedKey?: string;
  hits: number;
  total: number;
}

let _idCounter = 1;

function applyOp(
  slots: CacheSlot[],
  op: Operation,
  capacity: number,
  hits: number,
  total: number
): StepResult {
  const { op: kind, key, value } = op;
  const idx = slots.findIndex((s) => s.key === key);

  if (kind === "get") {
    const newTotal = total + 1;
    if (idx === -1) {
      return {
        slots: slots.map((s) => ({ ...s, flash: undefined })),
        message: `GET ${key} → MISS`,
        messageType: "miss",
        hits,
        total: newTotal,
      };
    }
    // Move to MRU (front)
    const hit = slots[idx]!;
    const rest = slots.filter((_, i) => i !== idx);
    return {
      slots: [{ ...hit, flash: "hit" }, ...rest.map((s) => ({ ...s, flash: undefined }))],
      message: `GET ${key} → HIT "${hit.value}" (moved to MRU)`,
      messageType: "hit",
      hits: hits + 1,
      total: newTotal,
    };
  }

  // SET
  if (idx !== -1) {
    // update existing, move to MRU
    const rest = slots.filter((_, i) => i !== idx);
    const updated: CacheSlot = { key, value: value ?? "", id: slots[idx]!.id, flash: "new" };
    return {
      slots: [updated, ...rest.map((s) => ({ ...s, flash: undefined }))],
      message: `SET ${key} = "${value}" (updated, moved to MRU)`,
      messageType: "set",
      hits,
      total,
    };
  }

  if (slots.length < capacity) {
    // Space available
    const newSlot: CacheSlot = { key, value: value ?? "", id: _idCounter++, flash: "new" };
    return {
      slots: [newSlot, ...slots.map((s) => ({ ...s, flash: undefined }))],
      message: `SET ${key} = "${value}"`,
      messageType: "set",
      hits,
      total,
    };
  }

  // Evict LRU (last slot)
  const evicted = slots[slots.length - 1]!;
  const kept = slots.slice(0, slots.length - 1);
  const newSlot: CacheSlot = { key, value: value ?? "", id: _idCounter++, flash: "new" };
  return {
    slots: [newSlot, ...kept.map((s) => ({ ...s, flash: undefined }))],
    message: `SET ${key} → Cache full! Evicted LRU: ${evicted.key}`,
    messageType: "evict",
    evictedKey: evicted.key,
    hits,
    total,
  };
}

export function LruCache({
  capacity = 4,
  operations = [],
}: LruCacheProps) {
  const [stepIndex, setStepIndex] = useState(-1); // -1 = before any step
  const [slots, setSlots] = useState<CacheSlot[]>([]);
  const [message, setMessage] = useState<string>("Press Step → to begin");
  const [messageType, setMessageType] = useState<StepResult["messageType"]>("info");
  const [hits, setHits] = useState(0);
  const [total, setTotal] = useState(0);
  const [evictingKey, setEvictingKey] = useState<string | null>(null);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const playRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // History for back-stepping
  const historyRef = useRef<StepResult[]>([]);

  const doStep = useCallback((currentStepIndex: number, currentSlots: CacheSlot[], currentHits: number, currentTotal: number) => {
    const nextIdx = currentStepIndex + 1;
    if (nextIdx >= operations.length) return false;
    const op = operations[nextIdx]!;
    const result = applyOp(currentSlots, op, capacity, currentHits, currentTotal);
    historyRef.current[nextIdx] = result;

    setEvictingKey(result.evictedKey ?? null);
    setNewKey(result.slots[0]?.flash === "new" ? result.slots[0].key : null);
    setSlots(result.slots);
    setMessage(result.message);
    setMessageType(result.messageType);
    setHits(result.hits);
    setTotal(result.total);
    setStepIndex(nextIdx);

    // Clear flash after animation
    setTimeout(() => {
      setSlots((prev) => prev.map((s) => ({ ...s, flash: undefined })));
      setEvictingKey(null);
      setNewKey(null);
    }, 700);

    return true;
  }, [operations, capacity]);

  function handleStep() {
    doStep(stepIndex, slots, hits, total);
  }

  function handleBack() {
    if (stepIndex <= 0) {
      handleReset();
      return;
    }
    const prev = historyRef.current[stepIndex - 1];
    if (!prev) { handleReset(); return; }
    setSlots(prev.slots.map((s) => ({ ...s, flash: undefined })));
    setMessage(prev.message);
    setMessageType(prev.messageType);
    setHits(prev.hits);
    setTotal(prev.total);
    setStepIndex(stepIndex - 1);
    setEvictingKey(null);
    setNewKey(null);
  }

  function handleReset() {
    if (playRef.current) clearTimeout(playRef.current);
    setStepIndex(-1);
    setSlots([]);
    setMessage("Press Step → to begin");
    setMessageType("info");
    setHits(0);
    setTotal(0);
    setEvictingKey(null);
    setNewKey(null);
    setIsPlaying(false);
    historyRef.current = [];
    _idCounter = 1;
  }

  function handleAutoPlay() {
    if (isPlaying) {
      if (playRef.current) clearTimeout(playRef.current);
      setIsPlaying(false);
      return;
    }
    setIsPlaying(true);

    let idx = stepIndex;
    let currentSlots = slots;
    let currentHits = hits;
    let currentTotal = total;

    function tick() {
      const nextIdx = idx + 1;
      if (nextIdx >= operations.length) {
        setIsPlaying(false);
        return;
      }
      const op = operations[nextIdx]!;
      const result = applyOp(currentSlots, op, capacity, currentHits, currentTotal);
      historyRef.current[nextIdx] = result;

      setEvictingKey(result.evictedKey ?? null);
      setNewKey(result.slots[0]?.flash === "new" ? result.slots[0].key : null);
      setSlots(result.slots);
      setMessage(result.message);
      setMessageType(result.messageType);
      setHits(result.hits);
      setTotal(result.total);
      setStepIndex(nextIdx);

      idx = nextIdx;
      currentSlots = result.slots;
      currentHits = result.hits;
      currentTotal = result.total;

      setTimeout(() => {
        setSlots((prev) => prev.map((s) => ({ ...s, flash: undefined })));
        setEvictingKey(null);
        setNewKey(null);
      }, 600);

      if (nextIdx < operations.length - 1) {
        playRef.current = setTimeout(tick, 1300);
      } else {
        setIsPlaying(false);
      }
    }

    playRef.current = setTimeout(tick, 100);
  }

  useEffect(() => () => { if (playRef.current) clearTimeout(playRef.current); }, []);

  const hitRate = total > 0 ? Math.round((hits / total) * 100) : null;
  const isDone = stepIndex >= operations.length - 1;
  const nextOp = stepIndex + 1 < operations.length ? operations[stepIndex + 1] : null;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
        <Database className="size-3.5 text-sky-500 shrink-0" />
        <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex-1">
          LRU Cache
          <span className="ml-1.5 text-[10px] font-normal text-zinc-400">capacity: {capacity}</span>
        </span>
        {hitRate !== null && (
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
            Hit rate: <strong className="text-zinc-700 dark:text-zinc-300">{hits}/{total}</strong> ({hitRate}%)
          </span>
        )}
      </div>

      {/* Cache slots */}
      <div className="min-h-[280px] px-4 pt-4 pb-2 space-y-4">
        {/* Slot labels */}
        <div className="flex items-center gap-1 justify-between px-1">
          <span className="text-[10px] font-semibold text-zinc-400">MRU</span>
          <span className="text-[10px] font-semibold text-zinc-400">LRU</span>
        </div>

        {/* Slots row */}
        <div className="flex gap-2 min-h-[72px] items-stretch">
          {/* Empty slots up to capacity */}
          {Array.from({ length: capacity }).map((_, i) => {
            const slot = slots[i];
            if (!slot) {
              return (
                <div
                  key={`empty-${i}`}
                  className="flex-1 rounded-lg border-2 border-dashed border-zinc-200 dark:border-zinc-700 flex items-center justify-center"
                >
                  <span className="text-[10px] text-zinc-300 dark:text-zinc-600">empty</span>
                </div>
              );
            }

            const isEvicting = evictingKey === slot.key;
            const isNew = newKey === slot.key;

            return (
              <div
                key={slot.id}
                className={cn(
                  "flex-1 rounded-lg border-2 px-2 py-2 flex flex-col items-center justify-center text-center transition-all duration-500",
                  slot.flash === "hit"
                    ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30"
                    : slot.flash === "new"
                    ? "border-sky-400 bg-sky-50 dark:bg-sky-950/30"
                    : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50",
                  isEvicting && "opacity-0 -translate-x-4",
                  isNew && "scale-105",
                )}
              >
                <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 truncate w-full">{slot.key}</span>
                {slot.value && (
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate w-full mt-0.5">{slot.value}</span>
                )}
                {i === 0 && (
                  <span className="text-[8px] text-emerald-500 font-semibold mt-1">MRU</span>
                )}
                {i === slots.length - 1 && slots.length === capacity && (
                  <span className="text-[8px] text-amber-500 font-semibold mt-1">LRU</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Message */}
        <div className={cn(
          "rounded-lg px-3 py-2.5 text-[11px] font-medium transition-all duration-500",
          messageType === "hit"   && "bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-400",
          messageType === "miss"  && "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 text-red-700 dark:text-red-400",
          messageType === "evict" && "bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 text-amber-700 dark:text-amber-400",
          messageType === "set"   && "bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800/40 text-sky-700 dark:text-sky-400",
          messageType === "info"  && "bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400",
        )}>
          {message}
        </div>

        {/* Next op preview */}
        {nextOp && (
          <div className="text-[10px] text-zinc-400 flex items-center gap-1.5">
            <span>Next:</span>
            <span className={cn(
              "font-mono font-bold px-1.5 py-0.5 rounded",
              nextOp.op === "get" ? "bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400"
                                  : "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400"
            )}>
              {nextOp.op.toUpperCase()}
            </span>
            <span className="font-mono text-zinc-500">{nextOp.key}</span>
            {nextOp.value && <span className="text-zinc-400">= "{nextOp.value}"</span>}
          </div>
        )}

        {/* Operation progress */}
        <div className="flex items-center gap-1">
          {operations.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full transition-all duration-500",
                i <= stepIndex ? "bg-zinc-700 dark:bg-zinc-300" : "bg-zinc-200 dark:bg-zinc-700"
              )}
            />
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-2 pb-1">
          <button
            onClick={handleBack}
            disabled={stepIndex < 0}
            className={cn(
              "flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all duration-300",
              stepIndex < 0
                ? "border-zinc-200 dark:border-zinc-700 text-zinc-300 dark:text-zinc-600 cursor-not-allowed"
                : "border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            )}
          >
            <ChevronLeft className="size-3.5" />
            Step
          </button>

          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all duration-300"
          >
            <RotateCcw className="size-3" />
            Reset
          </button>

          <button
            onClick={handleStep}
            disabled={isDone || isPlaying}
            className={cn(
              "flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all duration-300",
              isDone || isPlaying
                ? "border-zinc-200 dark:border-zinc-700 text-zinc-300 dark:text-zinc-600 cursor-not-allowed"
                : "border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            )}
          >
            Step
            <ChevronRight className="size-3.5" />
          </button>

          <button
            onClick={handleAutoPlay}
            disabled={isDone && !isPlaying}
            className={cn(
              "flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-300",
              isPlaying
                ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700"
                : isDone
                ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed border border-zinc-200 dark:border-zinc-700"
                : "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90"
            )}
          >
            <Play className="size-3.5" />
            {isPlaying ? "Pause" : "Auto Play"}
          </button>
        </div>

        {/* Footer stats */}
        <div className="flex items-center justify-center gap-4 text-[10px] text-zinc-400 border-t border-zinc-100 dark:border-zinc-800 pt-2">
          <span>GET: O(1)</span>
          <span className="text-zinc-200 dark:text-zinc-700">·</span>
          <span>SET: O(1)</span>
          <span className="text-zinc-200 dark:text-zinc-700">·</span>
          <span>Eviction: O(1)</span>
        </div>
      </div>
    </div>
  );
}
