"use client";

import { useState, useEffect } from "react";
import { Play, Pause, Plus, Trash2, ArrowRight, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { z } from "zod";

export const QueueMessageSchema = z.object({
  id: z.string(),
  payload: z.string(),
  status: z.enum(["waiting", "processing", "done", "failed"]).default("waiting"),
  retries: z.number().default(0),
});

export const QueueVisualizerSchema = z.object({
  name: z.string().default("task-queue"),
  type: z.enum(["FIFO", "LIFO", "priority"]).default("FIFO"),
  messages: z.array(QueueMessageSchema).optional(),
  producerLabel: z.string().default("Producer"),
  consumerLabel: z.string().default("Consumer"),
  interactive: z.boolean().default(true),
  maxVisible: z.number().default(6),
});

export type QueueVisualizerProps = z.infer<typeof QueueVisualizerSchema>;
type QueueMessage = z.infer<typeof QueueMessageSchema>;

const STATUS_STYLES: Record<QueueMessage["status"], { bg: string; dot: string; label: string }> = {
  waiting:    { bg: "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700",   dot: "bg-zinc-400", label: "waiting" },
  processing: { bg: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900", dot: "bg-blue-500 animate-pulse", label: "processing" },
  done:       { bg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900", dot: "bg-emerald-500", label: "done" },
  failed:     { bg: "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900",     dot: "bg-red-500", label: "failed" },
};

let msgCounter = 100;

export function QueueVisualizer({
  name = "task-queue",
  type = "FIFO",
  messages: initialMessages,
  producerLabel = "Producer",
  consumerLabel = "Consumer",
  interactive = true,
  maxVisible = 6,
}: QueueVisualizerProps) {
  const [messages, setMessages] = useState<QueueMessage[]>(initialMessages ?? [
    { id: "msg-1", payload: '{"userId": 42, "action": "sendEmail"}', status: "waiting", retries: 0 },
    { id: "msg-2", payload: '{"orderId": 99, "event": "shipped"}',   status: "waiting", retries: 0 },
    { id: "msg-3", payload: '{"file": "report.pdf", "op": "compress"}', status: "waiting", retries: 0 },
  ]);
  const [running, setRunning] = useState(false);
  const [processed, setProcessed] = useState(0);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setMessages(prev => {
        const idx = prev.findIndex(m => m.status === "waiting");
        if (idx === -1) { setRunning(false); return prev; }
        const next = [...prev];
        next[idx] = { ...next[idx]!, status: "processing" };
        setTimeout(() => {
          setMessages(p => p.map(m => m.id === next[idx]!.id ? { ...m, status: "done" } : m));
          setProcessed(n => n + 1);
          setTimeout(() => {
            setMessages(p => p.filter(m => m.id !== next[idx]!.id));
          }, 1000);
        }, 900);
        return next;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, [running]);

  function produce() {
    msgCounter++;
    const payloads = [
      `{"job": "resize-image", "id": ${msgCounter}}`,
      `{"event": "user.signup", "userId": ${msgCounter}}`,
      `{"task": "generate-report", "month": "aug"}`,
      `{"email": "welcome@example.com", "to": "user${msgCounter}"}`,
    ];
    const msg: QueueMessage = {
      id: `msg-${msgCounter}`,
      payload: payloads[msgCounter % payloads.length]!,
      status: "waiting",
      retries: 0,
    };
    setMessages(prev => [...prev, msg]);
  }

  function clear() {
    setMessages([]);
    setRunning(false);
  }

  const visible = messages.slice(0, maxVisible);
  const overflow = messages.length - maxVisible;
  const waiting = messages.filter(m => m.status === "waiting").length;
  const processing = messages.filter(m => m.status === "processing").length;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/50">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{name}</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-900">
              {type}
            </span>
          </div>
          <div className="text-[10px] text-zinc-400 mt-0.5">
            {waiting} waiting · {processing} processing · {processed} consumed
          </div>
        </div>
        {interactive && (
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={produce}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
            >
              <Plus className="size-3" /> Produce
            </button>
            <button
              onClick={() => setRunning(v => !v)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors",
                running
                  ? "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50"
                  : "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50"
              )}
            >
              {running ? <><Pause className="size-3" /> Pause</> : <><Play className="size-3" /> Consume</>}
            </button>
            <button
              onClick={clear}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Flow diagram */}
      <div className="flex items-center gap-4 px-6 py-4">
        {/* Producer */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="size-10 flex items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
            <Plus className="size-4 text-blue-600 dark:text-blue-400" />
          </div>
          <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">{producerLabel}</span>
        </div>

        <ArrowRight className="size-4 text-zinc-300 dark:text-zinc-700 shrink-0" />

        {/* Queue */}
        <div className="flex-1 min-w-0">
          <div className="flex gap-1.5 overflow-hidden">
            {messages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center h-14 rounded-lg border-2 border-dashed border-zinc-200 dark:border-zinc-800 text-xs text-zinc-400 dark:text-zinc-600 font-sans">
                Queue is empty
              </div>
            ) : (
              <>
                {visible.map((msg) => {
                  const style = STATUS_STYLES[msg.status];
                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex flex-col gap-1 px-2 py-1.5 rounded-lg border min-w-[80px] max-w-[100px] transition-all",
                        style.bg
                      )}
                    >
                      <div className="flex items-center gap-1">
                        <span className={cn("size-1.5 rounded-full shrink-0", style.dot)} />
                        <span className="text-[9px] font-mono text-zinc-500 truncate">{msg.id}</span>
                      </div>
                      <p className="text-[9px] text-zinc-600 dark:text-zinc-400 truncate leading-tight font-mono">
                        {msg.payload.slice(0, 30)}…
                      </p>
                    </div>
                  );
                })}
                {overflow > 0 && (
                  <div className="flex items-center justify-center px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-[10px] text-zinc-400 min-w-[40px]">
                    +{overflow}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <ArrowRight className="size-4 text-zinc-300 dark:text-zinc-700 shrink-0" />

        {/* Consumer */}
        <div className="flex flex-col items-center gap-1.5">
          <div className={cn(
            "size-10 flex items-center justify-center rounded-xl border transition-colors",
            running && processing > 0
              ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900"
              : "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
          )}>
            {running && processing > 0
              ? <AlertCircle className="size-4 text-emerald-600 dark:text-emerald-400 animate-pulse" />
              : <Pause className="size-4 text-zinc-400" />
            }
          </div>
          <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">{consumerLabel}</span>
        </div>
      </div>
    </div>
  );
}
