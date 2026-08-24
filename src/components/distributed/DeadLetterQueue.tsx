"use client";

import { useState, useRef, useCallback } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Inbox, CheckCircle2, XCircle, AlertTriangle, RotateCcw, Search, Trash2, Mail, Cpu } from "lucide-react";

export const DeadLetterQueueSchema = z.object({
  maxRetries: z.number().default(3),
  messages: z.array(z.object({
    id: z.string(),
    content: z.string(),
    willFail: z.boolean().optional().default(false),
  })).default([
    { id: "msg-001", content: "Order #1042 payment",   willFail: false },
    { id: "msg-002", content: "Order #1043 payment",   willFail: true  },
    { id: "msg-003", content: "Order #1044 inventory", willFail: false },
    { id: "msg-004", content: "Order #1045 payment",   willFail: true  },
  ]),
});

export type DeadLetterQueueProps = z.infer<typeof DeadLetterQueueSchema>;

interface Message {
  id: string;
  content: string;
  willFail: boolean;
  retries?: number;
  failedAt?: string;
}

type ProcessState =
  | { phase: "idle" }
  | { phase: "processing"; msgId: string; attempt: number; maxRetries: number }
  | { phase: "success"; msgId: string }
  | { phase: "failed"; msgId: string; attempt: number; maxRetries: number }
  | { phase: "moving-to-dlq"; msgId: string };

export function DeadLetterQueue({
  maxRetries = 3,
  messages: initialMessages = [
    { id: "msg-001", content: "Order #1042 payment",   willFail: false },
    { id: "msg-002", content: "Order #1043 payment",   willFail: true  },
    { id: "msg-003", content: "Order #1044 inventory", willFail: false },
    { id: "msg-004", content: "Order #1045 payment",   willFail: true  },
  ],
}: DeadLetterQueueProps) {
  const [queue, setQueue] = useState<Message[]>(
    initialMessages.map((m) => ({ ...m, willFail: m.willFail ?? false }))
  );
  const [dlq, setDlq] = useState<Message[]>([]);
  const [state, setState] = useState<ProcessState>({ phase: "idle" });
  const [inspecting, setInspecting] = useState<string | null>(null);
  const [discardConfirm, setDiscardConfirm] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isAnimating = state.phase !== "idle" && state.phase !== "success" && state.phase !== "failed" && state.phase !== "moving-to-dlq";

  const clearTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const processNext = useCallback(() => {
    if (queue.length === 0 || state.phase !== "idle") return;
    const msg = queue[0];
    let attempt = 1;

    function tryAttempt() {
      setState({ phase: "processing", msgId: msg.id, attempt, maxRetries });

      timerRef.current = setTimeout(() => {
        if (!msg.willFail) {
          // Success
          setState({ phase: "success", msgId: msg.id });
          setQueue((q) => q.filter((m) => m.id !== msg.id));
          timerRef.current = setTimeout(() => setState({ phase: "idle" }), 1200);
        } else {
          // Failure
          setState({ phase: "failed", msgId: msg.id, attempt, maxRetries });
          timerRef.current = setTimeout(() => {
            if (attempt >= maxRetries) {
              // Move to DLQ
              setState({ phase: "moving-to-dlq", msgId: msg.id });
              timerRef.current = setTimeout(() => {
                setQueue((q) => q.filter((m) => m.id !== msg.id));
                setDlq((d) => [...d, { ...msg, retries: maxRetries, failedAt: new Date().toISOString() }]);
                setState({ phase: "idle" });
              }, 1200);
            } else {
              attempt++;
              timerRef.current = setTimeout(tryAttempt, 1200);
            }
          }, 1200);
        }
      }, 1200);
    }

    tryAttempt();
  }, [queue, state.phase, maxRetries]);

  const handleReplay = useCallback((msgId: string) => {
    const msg = dlq.find((m) => m.id === msgId);
    if (!msg) return;
    setDlq((d) => d.filter((m) => m.id !== msgId));
    setQueue((q) => [...q, { ...msg, retries: 0, failedAt: undefined }]);
    setInspecting(null);
  }, [dlq]);

  const handleDiscard = useCallback((msgId: string) => {
    setDlq((d) => d.filter((m) => m.id !== msgId));
    setDiscardConfirm(null);
    setInspecting(null);
  }, []);

  const handleReset = useCallback(() => {
    clearTimer();
    setState({ phase: "idle" });
    setQueue(initialMessages.map((m) => ({ ...m, willFail: m.willFail ?? false })));
    setDlq([]);
    setInspecting(null);
    setDiscardConfirm(null);
  }, [initialMessages]);

  const activeId = state.phase !== "idle" ? (state as { msgId?: string }).msgId : null;
  const inspectedMsg = dlq.find((m) => m.id === inspecting);

  const footerStatus =
    state.phase === "idle"
      ? `${queue.length} message${queue.length !== 1 ? "s" : ""} waiting · ${dlq.length} in DLQ`
      : state.phase === "processing"
      ? `Processing ${state.msgId} — attempt ${state.attempt}/${state.maxRetries}`
      : state.phase === "success"
      ? `${state.msgId} processed successfully`
      : state.phase === "failed"
      ? `${state.msgId} failed — ${state.attempt < state.maxRetries ? "retrying…" : "moving to DLQ"}`
      : `Moving ${state.msgId} to Dead Letter Queue…`;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800">
        <Inbox className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">Dead Letter Queue</span>
        <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 px-2 py-0.5 rounded">
          maxRetries: {maxRetries}
        </span>
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        Messages that fail all retries go to the DLQ — inspect, fix, then replay.
      </p>

      <div className="min-h-[220px] flex flex-col px-4 pt-3 pb-3 gap-3">

        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Mail className="size-3 text-zinc-400" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Main Queue</span>
          </div>
          {queue.length === 0 ? (
            <div className="text-xs text-zinc-400 dark:text-zinc-500 italic">— empty —</div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {queue.map((msg) => {
                const isActive = msg.id === activeId;
                return (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-mono border transition-all duration-500",
                      isActive
                        ? "bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 scale-105"
                        : msg.willFail
                        ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
                        : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"
                    )}
                  >
                    {msg.willFail && <AlertTriangle className="size-3 text-red-400" />}
                    <span className="font-semibold">{msg.id}</span>
                    <span className="text-zinc-400 dark:text-zinc-500">·</span>
                    <span>{msg.content}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Cpu className="size-3 text-red-400" />
            <span className="text-[10px] text-red-500 dark:text-red-400 font-semibold uppercase tracking-widest">Dead Letter Queue</span>
            {dlq.length > 0 && (
              <span className="text-[9px] bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full px-1.5 py-0.5 font-bold">
                {dlq.length}
              </span>
            )}
          </div>
          {dlq.length === 0 ? (
            <div className="text-xs text-zinc-400 dark:text-zinc-500 italic">— no failed messages —</div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {dlq.map((msg) => (
                <div
                  key={msg.id}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                >
                  <XCircle className="size-3.5 text-red-500 shrink-0" />
                  <span className="text-xs font-mono font-semibold text-red-700 dark:text-red-400">{msg.id}</span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 flex-1">{msg.content}</span>
                  <span className="text-[9px] text-zinc-400 font-mono">{msg.retries} retries</span>
                  <button
                    onClick={() => handleReplay(msg.id)}
                    title="Replay"
                    className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="size-2.5" /> Replay
                  </button>
                  <button
                    onClick={() => setInspecting(inspecting === msg.id ? null : msg.id)}
                    title="Inspect"
                    className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors cursor-pointer"
                  >
                    <Search className="size-2.5" /> Inspect
                  </button>
                  {discardConfirm === msg.id ? (
                    <button
                      onClick={() => handleDiscard(msg.id)}
                      className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-red-200 dark:bg-red-800 text-red-700 dark:text-red-200 hover:bg-red-300 transition-colors cursor-pointer font-semibold"
                    >
                      Confirm?
                    </button>
                  ) : (
                    <button
                      onClick={() => setDiscardConfirm(msg.id)}
                      title="Discard"
                      className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 transition-colors cursor-pointer"
                    >
                      <Trash2 className="size-2.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Inspect panel */}
        {inspectedMsg && (
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 px-3 py-2 text-[10px] font-mono text-zinc-600 dark:text-zinc-400">
            <div className="font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Inspect: {inspectedMsg.id}</div>
            <div>content: <span className="text-zinc-800 dark:text-zinc-200">{inspectedMsg.content}</span></div>
            <div>retries: <span className="text-red-600 dark:text-red-400">{inspectedMsg.retries}</span></div>
            <div>reason: <span className="text-red-500">ProcessingError — handler threw after {inspectedMsg.retries} attempts</span></div>
            {inspectedMsg.failedAt && (
              <div>failed_at: <span className="text-zinc-500">{inspectedMsg.failedAt}</span></div>
            )}
          </div>
        )}

      </div>

      <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
        <span className={cn(
          "text-sm flex-1 transition-all duration-500",
          state.phase === "success" && "text-emerald-700 dark:text-emerald-400",
          state.phase === "failed" && "text-red-700 dark:text-red-400",
          state.phase === "processing" && "text-blue-700 dark:text-blue-400",
          (state.phase === "idle" || state.phase === "moving-to-dlq") && "text-zinc-500 dark:text-zinc-400",
        )}>
          {footerStatus}
        </span>
        <button
          onClick={handleReset}
          className="px-3 py-2 text-sm font-semibold rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all duration-500"
        >
          Reset
        </button>
        <button
          onClick={processNext}
          disabled={queue.length === 0 || state.phase !== "idle"}
          className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          Process Next
        </button>
      </div>
    </div>
  );
}
