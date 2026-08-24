"use client";

import { useState, useEffect } from "react";
import { Play, Pause, Plus, Mail, Server, Cpu } from "lucide-react";
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

const STATUS_STYLES: Record<QueueMessage["status"], { border: string; dot: string }> = {
  waiting:    { border: "border-l-zinc-300 dark:border-l-zinc-700",           dot: "bg-zinc-400" },
  processing: { border: "border-l-blue-400 dark:border-l-blue-500",           dot: "bg-blue-500 animate-pulse" },
  done:       { border: "border-l-emerald-400 dark:border-l-emerald-500",     dot: "bg-emerald-500" },
  failed:     { border: "border-l-red-400 dark:border-l-red-600",             dot: "bg-red-500" },
};

const MSG_PREVIEWS = [
  "task: process order",
  "task: send email",
  "task: resize image",
  "task: generate PDF",
  "task: sync inventory",
  "task: update cache",
];

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
  const [messages, setMessages] = useState<(QueueMessage & { fresh?: boolean; exiting?: boolean })[]>(
    initialMessages ?? [
      { id: "msg-1", payload: '{"userId": 42, "action": "sendEmail"}', status: "waiting", retries: 0 },
      { id: "msg-2", payload: '{"orderId": 99, "event": "shipped"}',   status: "waiting", retries: 0 },
      { id: "msg-3", payload: '{"file": "report.pdf", "op": "compress"}', status: "waiting", retries: 0 },
    ]
  );
  const [running, setRunning] = useState(false);
  const [processed, setProcessed] = useState(0);
  const [consumerActive, setConsumerActive] = useState(false);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setMessages(prev => {
        const idx = prev.findIndex(m => m.status === "waiting");
        if (idx === -1) { setRunning(false); return prev; }
        const next = [...prev];
        const msg = { ...next[idx]!, status: "processing" as const };
        next[idx] = msg;

        setTimeout(() => {
          setConsumerActive(true);
          setMessages(p => p.map(m => m.id === msg.id ? { ...m, exiting: true } : m));
          setTimeout(() => {
            setMessages(p => p.filter(m => m.id !== msg.id));
            setProcessed(n => n + 1);
            setConsumerActive(false);
          }, 500);
        }, 900);

        return next;
      });
    }, 1600);
    return () => clearInterval(interval);
  }, [running]);

  function produce() {
    msgCounter++;
    const preview = MSG_PREVIEWS[msgCounter % MSG_PREVIEWS.length]!;
    const msg = {
      id: `msg-${msgCounter}`,
      payload: `{"id": ${msgCounter}, "${preview.split(":")[0] ?? "task"}": "${preview.split(": ")[1] ?? preview}"}`,
      status: "waiting" as const,
      retries: 0,
      fresh: true,
    };
    setMessages(prev => [...prev, msg]);
    setTimeout(() => {
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, fresh: false } : m));
    }, 500);
  }

  const visible = messages.slice(0, maxVisible);
  const overflow = messages.length - maxVisible;
  const waiting = messages.filter(m => m.status === "waiting").length;
  const capacityPct = Math.min(100, (messages.length / maxVisible) * 100);

  const statusText = running
    ? "Consumer processing messages from the front of the queue…"
    : waiting > 0
    ? `${waiting} message${waiting !== 1 ? "s" : ""} waiting · ${processed} consumed`
    : "Queue empty — produce a message to get started";

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <Mail className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex-1">{name}</span>
        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
          {type}
        </span>
        {interactive && waiting > 0 && (
          <button
            type="button"
            onClick={() => setRunning(v => !v)}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium border transition-all duration-500",
              running
                ? "border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30"
                : "border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            )}
          >
            {running ? <><Pause className="size-2.5" /> Pause</> : <><Play className="size-2.5" /> Auto-consume</>}
          </button>
        )}
      </div>

      <div className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        Producers add messages to the back; consumers take from the front — decoupling senders from workers.
      </div>

      <div className="flex items-stretch gap-3 px-4 py-4 min-h-[200px]">
        <div className="flex flex-col items-center gap-1.5 shrink-0 justify-center">
          <div className="size-12 flex items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-200 dark:border-blue-900">
            <Server className="size-5 text-blue-600 dark:text-blue-400" />
          </div>
          <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 text-center max-w-[60px] truncate">{producerLabel}</span>
        </div>

        <div className="flex items-center shrink-0">
          <div className="flex items-center gap-1">
            <div className="h-0.5 w-4 bg-zinc-300 dark:bg-zinc-700" />
            <div className="border-l-[5px] border-t-[3px] border-b-[3px] border-l-zinc-300 dark:border-l-zinc-700 border-t-transparent border-b-transparent" />
          </div>
        </div>

        <div className="flex-1 min-w-0 flex flex-col gap-1.5 justify-center">
          <div className="h-1 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                capacityPct > 80 ? "bg-red-500" :
                capacityPct > 50 ? "bg-amber-500" :
                "bg-emerald-500"
              )}
              style={{ width: `${capacityPct}%` }}
            />
          </div>

          <div className="flex gap-1.5 min-h-[72px] items-center overflow-hidden">
            {messages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center h-[72px] rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 text-xs text-zinc-400 dark:text-zinc-600">
                Queue empty
              </div>
            ) : (
              <>
                {visible.map((msg, idx) => {
                  const style = STATUS_STYLES[msg.status];
                  const preview = MSG_PREVIEWS[idx % MSG_PREVIEWS.length]!;
                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex flex-col gap-1 px-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 border-l-4 bg-white dark:bg-zinc-900 min-w-[72px] max-w-[90px] transition-all duration-500",
                        style.border,
                        msg.fresh && "translate-x-4 opacity-0",
                        !msg.fresh && "translate-x-0 opacity-100",
                        msg.exiting && "-translate-x-8 opacity-0",
                      )}
                    >
                      <div className="flex items-center gap-1">
                        <Mail className="size-2.5 text-zinc-400 shrink-0" />
                        <span className={cn("size-1.5 rounded-full shrink-0", style.dot)} />
                      </div>
                      <p className="text-[9px] text-zinc-600 dark:text-zinc-400 leading-tight font-mono truncate">
                        {preview}
                      </p>
                      <p className="text-[8px] text-zinc-400 truncate font-mono">{msg.id}</p>
                    </div>
                  );
                })}
                {overflow > 0 && (
                  <div className="flex items-center justify-center px-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-[10px] text-zinc-400 min-w-[36px]">
                    +{overflow}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex items-center shrink-0">
          <div className="flex items-center gap-1">
            <div className="h-0.5 w-4 bg-zinc-300 dark:bg-zinc-700" />
            <div className="border-l-[5px] border-t-[3px] border-b-[3px] border-l-zinc-300 dark:border-l-zinc-700 border-t-transparent border-b-transparent" />
          </div>
        </div>

        <div className="flex flex-col items-center gap-1.5 shrink-0 justify-center">
          <div className={cn(
            "size-12 flex items-center justify-center rounded-xl border-2 transition-all duration-500",
            consumerActive
              ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-600 ring-2 ring-emerald-300 dark:ring-emerald-700"
              : "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
          )}>
            <Cpu className={cn(
              "size-5 transition-all duration-500",
              consumerActive ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400"
            )} />
          </div>
          <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 text-center max-w-[60px] truncate">{consumerLabel}</span>
        </div>
      </div>

      {interactive && (
        <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/30">
          <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">{statusText}</span>
          <button
            type="button"
            onClick={produce}
            className="flex items-center gap-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity shrink-0"
          >
            <Plus className="size-3.5" />
            Produce Message
          </button>
        </div>
      )}
    </div>
  );
}
