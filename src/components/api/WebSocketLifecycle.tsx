"use client";

import { useState, useRef } from "react";
import { z } from "zod";
import { Wifi, ArrowRight, ArrowLeft, X, CheckCircle2, Circle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export const WebSocketLifecycleSchema = z.object({
  url: z.string().default("wss://api.example.com/ws"),
  messages: z
    .array(
      z.object({
        direction: z.enum(["client", "server"]),
        type: z.string(),
        data: z.string(),
        delayMs: z.number().optional().default(0),
      })
    )
    .default([
      { direction: "server", type: "welcome",   data: '{"status":"connected","id":"ws_001"}',      delayMs: 0 },
      { direction: "client", type: "subscribe", data: '{"action":"subscribe","channel":"prices"}',  delayMs: 0 },
      { direction: "server", type: "data",      data: '{"BTC":"$67,234","ETH":"$3,891"}',           delayMs: 0 },
      { direction: "server", type: "heartbeat", data: '{"type":"ping"}',                            delayMs: 0 },
      { direction: "client", type: "pong",      data: '{"type":"pong"}',                            delayMs: 0 },
    ]),
});

export type WebSocketLifecycleProps = z.infer<typeof WebSocketLifecycleSchema>;

type Phase = "idle" | "handshake" | "open" | "messages" | "closed";

const UPGRADE_HEADERS = [
  "GET /ws HTTP/1.1",
  "Host: api.example.com",
  "Upgrade: websocket",
  "Connection: Upgrade",
  "Sec-WebSocket-Key: dGhlIHNhbXBsZWtleQ==",
  "Sec-WebSocket-Version: 13",
  "",
  "← 101 Switching Protocols",
  "Upgrade: websocket",
  "Connection: Upgrade",
  "Sec-WebSocket-Accept: s3pPLMBiTxaQ...",
];

export function WebSocketLifecycle({
  url = "wss://api.example.com/ws",
  messages = [],
}: WebSocketLifecycleProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [visibleMessages, setVisibleMessages] = useState<number>(0);
  const [running, setRunning] = useState(false);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  function clearAll() {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }

  function addTimeout(fn: () => void, ms: number) {
    const t = setTimeout(fn, ms);
    timeoutsRef.current.push(t);
    return t;
  }

  function connect() {
    if (running) return;
    clearAll();
    setPhase("idle");
    setVisibleMessages(0);
    setRunning(true);

    addTimeout(() => setPhase("handshake"), 100);
    addTimeout(() => setPhase("open"), 1400);
    addTimeout(() => {
      setPhase("messages");
      // Reveal messages one by one
      for (let i = 0; i < messages.length; i++) {
        addTimeout(() => setVisibleMessages(i + 1), i * 900);
      }
      addTimeout(() => setRunning(false), messages.length * 900 + 200);
    }, 2200);
  }

  function disconnect() {
    if (phase === "idle" || phase === "closed") return;
    clearAll();
    setRunning(false);
    setPhase("closed");
  }

  function reset() {
    clearAll();
    setPhase("idle");
    setVisibleMessages(0);
    setRunning(false);
  }

  const phaseLabels: { id: Phase; label: string; desc: string }[] = [
    { id: "handshake", label: "Phase 1: HTTP Upgrade", desc: "One-time handshake to switch protocols" },
    { id: "open",      label: "Phase 2: Open",         desc: "WebSocket connection established" },
    { id: "messages",  label: "Phase 3: Messages",     desc: "Bidirectional — either side sends anytime" },
    { id: "closed",    label: "Phase 4: Close",        desc: "Either side sends close frame (code 1000)" },
  ];

  const phaseOrder: Phase[] = ["idle", "handshake", "open", "messages", "closed"];
  const currentIdx = phaseOrder.indexOf(phase);

  function phaseReached(p: Phase) {
    const idx = phaseOrder.indexOf(p);
    return currentIdx >= idx && phase !== "idle";
  }

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 h-11 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
        <Wifi className="size-3.5 text-zinc-400 shrink-0" />
        <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex-1">WebSocket Lifecycle</span>
        <span className="font-mono text-[10px] text-zinc-400 truncate max-w-[200px]">{url}</span>
        {/* Status dot */}
        <div className={cn(
          "size-2 rounded-full transition-all duration-500",
          phase === "open" || phase === "messages" ? "bg-emerald-500 shadow-sm shadow-emerald-500/50" : "bg-zinc-300 dark:bg-zinc-600"
        )} />
      </div>

      {/* Timeline — fixed height */}
      <div className="px-4 pt-3 min-h-[320px] space-y-2">
        {phaseLabels.map(({ id, label, desc }) => {
          const reached = phaseReached(id);
          const active = phase === id;
          return (
            <div
              key={id}
              className={cn(
                "rounded-lg border transition-all duration-500",
                active
                  ? "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/30"
                  : reached
                  ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/10"
                  : "border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20"
              )}
            >
              {/* Phase label row */}
              <div className="flex items-center gap-2 px-3 py-2">
                {reached ? (
                  <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                ) : (
                  <Circle className="size-3.5 text-zinc-300 dark:text-zinc-600 shrink-0" />
                )}
                <span className={cn(
                  "text-xs font-semibold transition-colors duration-500",
                  active ? "text-blue-700 dark:text-blue-300"
                    : reached ? "text-emerald-700 dark:text-emerald-300"
                    : "text-zinc-400 dark:text-zinc-500"
                )}>
                  {label}
                </span>
                <span className={cn(
                  "text-[10px] transition-colors duration-500",
                  active ? "text-blue-500 dark:text-blue-400"
                    : reached ? "text-emerald-600 dark:text-emerald-400"
                    : "text-zinc-400 dark:text-zinc-600"
                )}>
                  — {desc}
                </span>
              </div>

              {/* Phase 1: HTTP Upgrade headers */}
              {id === "handshake" && reached && (
                <div className="px-3 pb-2">
                  <div className="rounded bg-zinc-950 border border-zinc-800 px-2.5 py-2 font-mono text-[10px] space-y-px">
                    {UPGRADE_HEADERS.map((line, i) => (
                      <div
                        key={i}
                        className={cn(
                          "transition-all duration-500",
                          line.startsWith("←")
                            ? "text-emerald-400"
                            : line === ""
                            ? "h-2"
                            : "text-zinc-300"
                        )}
                      >
                        {line}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Phase 3: Messages */}
              {id === "messages" && reached && (
                <div className="px-3 pb-2 space-y-1 max-h-[120px] overflow-y-auto">
                  {messages.slice(0, visibleMessages).map((msg, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex items-center gap-2 text-[11px] transition-all duration-500",
                        msg.direction === "client" ? "flex-row" : "flex-row-reverse"
                      )}
                    >
                      {msg.direction === "client" ? (
                        <ArrowRight className="size-3 text-blue-500 shrink-0" />
                      ) : (
                        <ArrowLeft className="size-3 text-emerald-500 shrink-0" />
                      )}
                      <span className={cn(
                        "rounded px-1.5 py-0.5 text-[10px] font-mono font-semibold shrink-0",
                        msg.direction === "client"
                          ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                          : "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                      )}>
                        {msg.type}
                      </span>
                      <span className="font-mono text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                        {msg.data.length > 48 ? msg.data.slice(0, 48) + "…" : msg.data}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Phase 4: Close frame */}
              {id === "closed" && reached && (
                <div className="px-3 pb-2 space-y-1">
                  <div className="flex items-center gap-2 text-[11px]">
                    <ArrowRight className="size-3 text-zinc-500 shrink-0" />
                    <span className="font-mono text-[10px] text-zinc-400">Client → Close frame (code 1000)</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <ArrowLeft className="size-3 text-zinc-500 shrink-0" />
                    <span className="font-mono text-[10px] text-zinc-400">Server ← Close frame (1000 Normal Closure)</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <X className="size-3 text-red-400" />
                    <span className="text-[11px] text-red-500 dark:text-red-400 font-semibold">Connection closed</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action buttons */}
      <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
        <button
          onClick={connect}
          disabled={running || (phase !== "idle" && phase !== "closed")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-500 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 disabled:opacity-40"
        >
          {running ? <RefreshCw className="size-3 animate-spin" /> : <Wifi className="size-3" />}
          {running ? "Connecting…" : "Connect"}
        </button>

        <button
          onClick={disconnect}
          disabled={phase === "idle" || phase === "closed" || running}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-500 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-red-300 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-40"
        >
          <X className="size-3" />
          Disconnect
        </button>

        <button
          onClick={reset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all duration-500 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          <RefreshCw className="size-3" />
          Reset
        </button>

        <div className="flex-1 text-right">
          <span className={cn(
            "text-[11px] font-mono transition-all duration-500",
            phase === "open" || phase === "messages" ? "text-emerald-600 dark:text-emerald-400" :
            phase === "closed" ? "text-red-500 dark:text-red-400" :
            phase === "handshake" ? "text-blue-500 dark:text-blue-400" :
            "text-zinc-400"
          )}>
            {phase === "idle" ? "Disconnected"
              : phase === "handshake" ? "Upgrading protocol…"
              : phase === "open" ? "Connected"
              : phase === "messages" ? `Live — ${visibleMessages}/${messages.length} messages`
              : "Closed"}
          </span>
        </div>
      </div>
    </div>
  );
}
