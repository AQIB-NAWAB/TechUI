"use client";

import { useState, useRef, useCallback } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Mail, Cpu, CheckCircle2, XCircle, RefreshCw } from "lucide-react";

export const IdempotencyConsumerSchema = z.object({
  queueName: z.string().optional().default("order-events"),
  dedupWindowSeconds: z.number().optional().default(300),
  interactive: z.boolean().optional().default(true),
});

export type IdempotencyConsumerProps = z.infer<typeof IdempotencyConsumerSchema>;

type Message = {
  id: string;
  payload: string;
  duplicate: boolean;
};

const INCOMING: Message[] = [
  { id: "evt_a1b2", payload: "Order #1042 created", duplicate: false },
  { id: "evt_a1b2", payload: "Order #1042 created", duplicate: true },
  { id: "evt_c3d4", payload: "Payment captured", duplicate: false },
  { id: "evt_c3d4", payload: "Payment captured", duplicate: true },
];

type ProcessResult = {
  id: string;
  status: "processed" | "skipped";
  label: string;
};

export function IdempotencyConsumer({
  queueName = "order-events",
  dedupWindowSeconds = 300,
  interactive = true,
}: IdempotencyConsumerProps) {
  const [queue, setQueue] = useState<Message[]>([]);
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<ProcessResult[]>([]);
  const [running, setRunning] = useState(false);
  const [incomingIdx, setIncomingIdx] = useState(0);
  const [activeMsg, setActiveMsg] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const reset = useCallback(() => {
    clearTimer();
    setQueue([]);
    setSeenIds(new Set());
    setResults([]);
    setRunning(false);
    setIncomingIdx(0);
    setActiveMsg(null);
  }, []);

  const simulate = useCallback(() => {
    if (running) return;
    clearTimer();
    setQueue([]);
    setSeenIds(new Set());
    setResults([]);
    setIncomingIdx(0);
    setActiveMsg(null);
    setRunning(true);

    let idx = 0;
    const seen = new Set<string>();
    let currentQueue: Message[] = [];
    const allResults: ProcessResult[] = [];

    function deliverNext() {
      if (idx >= INCOMING.length) {
        setRunning(false);
        return;
      }
      const msg = INCOMING[idx];
      idx++;
      setIncomingIdx(idx);
      currentQueue = [...currentQueue, msg];
      setQueue([...currentQueue]);

      timerRef.current = setTimeout(processNext, 1200);
    }

    function processNext() {
      if (currentQueue.length === 0) {
        deliverNext();
        return;
      }
      const msg = currentQueue[0];
      setActiveMsg(msg.id);

      timerRef.current = setTimeout(() => {
        const alreadySeen = seen.has(msg.id);
        if (alreadySeen) {
          allResults.unshift({ id: msg.id, status: "skipped", label: "Duplicate — already processed" });
        } else {
          seen.add(msg.id);
          setSeenIds(new Set(seen));
          allResults.unshift({ id: msg.id, status: "processed", label: "Processed successfully" });
        }
        setResults([...allResults].slice(0, 6));
        currentQueue = currentQueue.slice(1);
        setQueue([...currentQueue]);
        setActiveMsg(null);

        timerRef.current = setTimeout(deliverNext, 1200);
      }, 1000);
    }

    deliverNext();
  }, [running]);

  const statusText = running
    ? "Simulating delivery and processing — watch duplicates get skipped."
    : results.length > 0
    ? "All messages handled — duplicates were safely ignored."
    : "Click Simulate to deliver messages and process them with deduplication.";

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="h-12 px-4 flex items-center gap-3 border-b border-zinc-200 dark:border-zinc-800">
        <Mail className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex-1">Idempotency Consumer</span>
        <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">{queueName}</span>
      </div>

      <div className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        Message brokers may deliver the same event twice — consumers deduplicate by message ID.
      </div>

      <div className="min-h-[260px] px-4 py-4 flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 p-3">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-2">Incoming</div>
            <div className="text-[10px] text-zinc-500 mb-2">
              {incomingIdx}/{INCOMING.length} delivered
            </div>
            {incomingIdx < INCOMING.length && !running && (
              <div className="rounded-md border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/30 px-2 py-1.5 text-[10px] font-mono text-violet-700 dark:text-violet-400">
                {INCOMING[incomingIdx].id}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 p-3">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-2">Queue</div>
            <div className="flex flex-wrap gap-1 min-h-[40px]">
              {queue.length === 0 && (
                <span className="text-[10px] text-zinc-400 italic">Empty</span>
              )}
              {queue.map((msg, i) => (
                <div
                  key={`${msg.id}-${i}`}
                  className={cn(
                    "rounded px-1.5 py-0.5 text-[10px] font-mono border transition-all duration-500",
                    activeMsg === msg.id && i === 0
                      ? "bg-blue-100 dark:bg-blue-900/40 border-blue-300 dark:border-blue-700 scale-105"
                      : msg.duplicate
                      ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400"
                      : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"
                  )}
                >
                  {msg.id}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 p-3">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-2">Dedup store</div>
            <div className="flex flex-wrap gap-1 min-h-[40px]">
              {seenIds.size === 0 && (
                <span className="text-[10px] text-zinc-400 italic">No IDs yet</span>
              )}
              {[...seenIds].map((id) => (
                <span
                  key={id}
                  className="rounded bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.5 text-[10px] font-mono text-emerald-700 dark:text-emerald-400"
                >
                  {id}
                </span>
              ))}
            </div>
            <div className="mt-1.5 text-[9px] text-zinc-400">TTL: {dedupWindowSeconds}s</div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 py-1">
          <Cpu
            className={cn(
              "size-5 transition-all duration-500",
              activeMsg ? "text-blue-500 animate-pulse" : "text-zinc-400"
            )}
          />
          <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
            {activeMsg ? `Processing ${activeMsg}…` : running ? "Running simulation…" : "Consumer idle"}
          </span>
        </div>

        <div className="flex-1 min-h-[80px]">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-1.5">Results</div>
          <div className="space-y-1.5">
            {results.length === 0 && (
              <div className="text-[11px] text-zinc-400 italic">Process messages to see dedup in action</div>
            )}
            {results.map((r, i) => (
              <div
                key={`${r.id}-${i}`}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[11px] border transition-all duration-500",
                  r.status === "processed"
                    ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400"
                    : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400"
                )}
              >
                {r.status === "processed" ? (
                  <CheckCircle2 className="size-3.5 shrink-0" />
                ) : (
                  <XCircle className="size-3.5 shrink-0" />
                )}
                <span className="font-mono font-bold">{r.id}</span>
                <span>{r.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {interactive && (
        <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-3">
          <span className="text-[11px] text-zinc-500 flex-1">{statusText}</span>
          <button
            onClick={reset}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            title="Reset"
          >
            <RefreshCw className="size-3.5" />
          </button>
          <button
            onClick={simulate}
            disabled={running}
            className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            Simulate
          </button>
        </div>
      )}
    </div>
  );
}
