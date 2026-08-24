"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Activity, Server, Cpu, Mail, ArrowRight } from "lucide-react";

export const BackpressureSchema = z.object({
  producerRate: z.number().default(5),
  consumerRate: z.number().default(2),
  queueCapacity: z.number().default(10),
  strategy: z.enum(["drop", "block", "sample", "buffer"]).default("buffer"),
});

export type BackpressureProps = z.infer<typeof BackpressureSchema>;

type Strategy = "drop" | "block" | "sample" | "buffer";

interface QueueItem {
  id: number;
  skipped?: boolean;
}

let _itemId = 0;

const STRATEGY_INFO: Record<Strategy, { label: string; desc: string; color: string }> = {
  buffer: { label: "Buffer",  desc: "Keep all items; queue grows until capacity",     color: "blue"   },
  drop:   { label: "Drop",    desc: "Discard new items immediately when queue full",  color: "red"    },
  sample: { label: "Sample",  desc: "Keep every 3rd item when queue > 80% full",     color: "amber"  },
  block:  { label: "Block",   desc: "Slow producer to match consumer when > 80% full","color": "violet" },
};

export function Backpressure({
  producerRate: initialProducerRate = 5,
  consumerRate = 2,
  queueCapacity = 10,
  strategy: initialStrategy = "buffer",
}: BackpressureProps) {
  const [strategy, setStrategy] = useState<Strategy>(initialStrategy);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [running, setRunning] = useState(false);
  const [dropped, setDropped] = useState(0);
  const [processed, setProcessed] = useState(0);
  const [producerRate, setProducerRate] = useState(initialProducerRate);
  const [sampleCounter, setSampleCounter] = useState(0);

  const queueRef = useRef(queue);
  const droppedRef = useRef(dropped);
  const processedRef = useRef(processed);
  const sampleCounterRef = useRef(sampleCounter);
  const strategyRef = useRef(strategy);
  const producerRateRef = useRef(producerRate);

  queueRef.current = queue;
  droppedRef.current = dropped;
  processedRef.current = processed;
  sampleCounterRef.current = sampleCounter;
  strategyRef.current = strategy;
  producerRateRef.current = producerRate;

  const produce = useCallback(() => {
    const currentQueue = queueRef.current;
    const currentStrategy = strategyRef.current;
    const fill = currentQueue.length / queueCapacity;
    const isFull = currentQueue.length >= queueCapacity;
    const isOverloaded = fill >= 0.8;

    if (currentStrategy === "drop" && isFull) {
      setDropped((d) => d + 1);
      return;
    }
    if (currentStrategy === "sample" && isOverloaded) {
      const next = sampleCounterRef.current + 1;
      setSampleCounter(next);
      if (next % 3 !== 0) {
        setDropped((d) => d + 1);
        return;
      }
    }
    if (currentStrategy === "block" && isOverloaded) {
      // Skip production this tick — effectively blocks
      return;
    }
    if (currentStrategy === "buffer" && isFull) {
      // Still drop if truly at capacity even in buffer mode
      setDropped((d) => d + 1);
      return;
    }

    const id = ++_itemId;
    setQueue((q) => [...q, { id }].slice(0, queueCapacity));
  }, [queueCapacity]);

  const consume = useCallback(() => {
    setQueue((q) => {
      if (q.length === 0) return q;
      setProcessed((p) => p + 1);
      return q.slice(1);
    });
  }, []);

  // Producer interval
  useEffect(() => {
    if (!running) return;
    const effectiveRate = strategy === "block" && queue.length / queueCapacity >= 0.8
      ? Math.max(1, consumerRate)
      : producerRate;
    const interval = Math.round(1000 / effectiveRate);
    const id = setInterval(produce, interval);
    return () => clearInterval(id);
  }, [running, producerRate, strategy, queue.length, queueCapacity, consumerRate, produce]);

  // Consumer interval
  useEffect(() => {
    if (!running) return;
    const interval = Math.round(1000 / consumerRate);
    const id = setInterval(consume, interval);
    return () => clearInterval(id);
  }, [running, consumerRate, consume]);

  function reset() {
    setRunning(false);
    setQueue([]);
    setDropped(0);
    setProcessed(0);
    setSampleCounter(0);
    _itemId = 0;
  }

  const fill = queue.length / queueCapacity;
  const fillPct = fill * 100;
  const queueColor = fill >= 0.8 ? "bg-red-500" : fill >= 0.5 ? "bg-amber-500" : "bg-emerald-500";
  const queueBg = fill >= 0.8 ? "border-red-300 dark:border-red-800" : fill >= 0.5 ? "border-amber-300 dark:border-amber-800" : "border-emerald-300 dark:border-emerald-800";

  const STRATEGIES: Strategy[] = ["buffer", "drop", "sample", "block"];

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800">
        <Activity className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">Backpressure</span>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
          {STRATEGY_INFO[strategy].label}
        </span>
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        Slow down fast producers so slow consumers don&apos;t get overwhelmed.
      </p>

      <div className="min-h-[220px] px-4 pt-4 pb-3 flex flex-col gap-4">

        {/* Flow visualization */}
        <div className="flex items-center gap-3">
          {/* Producer */}
          <div className="flex flex-col items-center gap-1 shrink-0">
            <div className={cn(
              "px-3 py-2 rounded-lg border text-xs font-semibold transition-all duration-500 flex items-center gap-1.5",
              running ? "bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300" : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500"
            )}>
              <Server className="size-3.5" />
              Producer
            </div>
            <span className="text-[9px] text-zinc-400">{producerRate}/s</span>
          </div>

          <ArrowRight className="size-4 text-zinc-300 dark:text-zinc-600 shrink-0" />

          <div className="flex-1 flex flex-col gap-1">
            <div className={cn("rounded-lg border overflow-hidden transition-all duration-500", queueBg)}>
              <div className="h-8 relative bg-zinc-50 dark:bg-zinc-800/50">
                <div
                  className={cn("absolute left-0 top-0 h-full transition-all duration-500", queueColor, "opacity-80")}
                  style={{ width: `${fillPct}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center gap-1">
                  <Mail className="size-3 text-zinc-500 z-10 relative" />
                  <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-300 z-10 relative">
                    {queue.length}/{queueCapacity}
                  </span>
                </div>
              </div>
            </div>
            {fill >= 0.8 && (
              <div className="text-[9px] text-red-500 font-semibold text-center animate-pulse">
                {fill >= 1 ? "Queue FULL!" : "Queue filling up! Producer outpacing consumer"}
              </div>
            )}
          </div>

          <ArrowRight className="size-4 text-zinc-300 dark:text-zinc-600 shrink-0" />

          <div className="flex flex-col items-center gap-1 shrink-0">
            <div className={cn(
              "px-3 py-2 rounded-lg border text-xs font-semibold transition-all duration-500 flex items-center gap-1.5",
              running ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300" : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500"
            )}>
              <Cpu className="size-3.5" />
              Consumer
            </div>
            <span className="text-[9px] text-zinc-400">{consumerRate}/s</span>
          </div>
        </div>

        {/* Queue items visual */}
        <div className="flex flex-wrap gap-1 min-h-[36px]">
          {Array.from({ length: queueCapacity }, (_, i) => {
            const item = queue[i];
            return (
              <div
                key={i}
                className={cn(
                  "w-6 h-6 rounded border text-[8px] flex items-center justify-center transition-all duration-500",
                  item
                    ? i < Math.floor(queueCapacity * 0.5)
                      ? "bg-emerald-100 dark:bg-emerald-950/40 border-emerald-400 text-emerald-700 dark:text-emerald-400"
                      : i < Math.floor(queueCapacity * 0.8)
                      ? "bg-amber-100 dark:bg-amber-950/40 border-amber-400 text-amber-700 dark:text-amber-400"
                      : "bg-red-100 dark:bg-red-950/40 border-red-400 text-red-700 dark:text-red-400"
                    : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                )}
              >
                {item ? "■" : ""}
              </div>
            );
          })}
        </div>

        {/* Strategy buttons */}
        <div className="flex flex-wrap gap-1.5">
          {STRATEGIES.map((s) => (
            <button
              key={s}
              onClick={() => { setStrategy(s); reset(); }}
              className={cn(
                "px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-500",
                strategy === s
                  ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              )}
            >
              {STRATEGY_INFO[s].label}
            </button>
          ))}
        </div>
        <div className="text-[10px] text-zinc-500 dark:text-zinc-400 -mt-2">
          {STRATEGY_INFO[strategy].desc}
        </div>

        <div className="flex items-center gap-4 text-xs border border-zinc-100 dark:border-zinc-800 rounded-lg p-2 bg-zinc-50 dark:bg-zinc-800/40">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-zinc-500 dark:text-zinc-400">Dropped:</span>
            <span className="font-bold text-red-600 dark:text-red-400 font-mono">{dropped}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-zinc-500 dark:text-zinc-400">Processed:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{processed}</span>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <button
            onClick={() => setProducerRate((r) => Math.max(1, r - 1))}
            className="w-6 h-6 rounded border border-zinc-200 dark:border-zinc-700 text-xs font-bold flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-500"
          >
            −
          </button>
          <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
            {running ? `${producerRate}/s → ${consumerRate}/s` : STRATEGY_INFO[strategy].desc}
          </span>
          <button
            onClick={() => setProducerRate((r) => Math.min(10, r + 1))}
            className="w-6 h-6 rounded border border-zinc-200 dark:border-zinc-700 text-xs font-bold flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-500"
          >
            +
          </button>
        </div>
        <button
          onClick={reset}
          className="px-3 py-2 text-sm font-semibold rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all duration-500"
        >
          Reset
        </button>
        <button
          onClick={() => setRunning((r) => !r)}
          className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity shrink-0"
        >
          {running ? "Pause" : "Start"}
        </button>
      </div>
    </div>
  );
}
