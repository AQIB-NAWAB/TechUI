"use client";

import { useState, useRef } from "react";
import { z } from "zod";
import { Wifi, ArrowRight, ArrowLeft, X, CheckCircle2, Circle, RefreshCw, Monitor, Server } from "lucide-react";
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

    addTimeout(() => setPhase("handshake"), 200);
    addTimeout(() => setPhase("open"), 1400);
    addTimeout(() => {
      setPhase("messages");
      for (let i = 0; i < messages.length; i++) {
        addTimeout(() => setVisibleMessages(i + 1), i * 1200);
      }
      addTimeout(() => setRunning(false), messages.length * 1200 + 200);
    }, 2600);
  }

  const phaseLabels: { id: Phase; label: string; desc: string }[] = [
    { id: "handshake", label: "HTTP Upgrade", desc: "Switch from HTTP to WebSocket" },
    { id: "open",      label: "Connected",    desc: "Persistent two-way channel open" },
    { id: "messages",  label: "Messages",     desc: "Either side sends anytime" },
    { id: "closed",    label: "Close",        desc: "Connection terminated" },
  ];

  const phaseOrder: Phase[] = ["idle", "handshake", "open", "messages", "closed"];
  const currentIdx = phaseOrder.indexOf(phase);

  function phaseReached(p: Phase) {
    const idx = phaseOrder.indexOf(p);
    return currentIdx >= idx && phase !== "idle";
  }

  const statusText =
    phase === "idle" ? "Click Connect to start the lifecycle"
    : phase === "handshake" ? "Upgrading protocol…"
    : phase === "open" ? "Connected — channel open"
    : phase === "messages" ? `Live — ${visibleMessages}/${messages.length} messages`
    : "Connection closed";

  function handlePrimaryAction() {
    if (running) return;
    if (phase === "idle" || phase === "closed") {
      connect();
    } else if (phase === "messages") {
      setPhase("closed");
      setRunning(false);
    }
  }

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800">
        <Wifi className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex-1">WebSocket Lifecycle</span>
        <span className="font-mono text-[10px] text-zinc-400 truncate max-w-[180px]">{url}</span>
        <div className={cn(
          "size-2 rounded-full shrink-0 transition-all duration-500",
          phase === "open" || phase === "messages" ? "bg-emerald-500 animate-pulse" : "bg-zinc-300 dark:bg-zinc-600"
        )} />
      </div>

      <div className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        WebSockets upgrade HTTP into a persistent, two-way channel for real-time communication.
      </div>

      <div className="min-h-[280px] px-4 py-3 flex flex-col gap-2">
        <div className="flex items-center justify-center gap-6 mb-2">
          <div className="flex flex-col items-center gap-1">
            <Monitor className={cn("size-5 transition-colors duration-500", phaseReached("open") ? "text-blue-500" : "text-zinc-400")} />
            <span className="text-[9px] text-zinc-400">Client</span>
          </div>
          <div className={cn(
            "flex-1 h-0.5 max-w-[120px] transition-all duration-700",
            phaseReached("open") ? "bg-emerald-400" : "bg-zinc-200 dark:bg-zinc-700"
          )} />
          <div className="flex flex-col items-center gap-1">
            <Server className={cn("size-5 transition-colors duration-500", phaseReached("open") ? "text-emerald-500" : "text-zinc-400")} />
            <span className="text-[9px] text-zinc-400">Server</span>
          </div>
        </div>

        {phaseLabels.map(({ id, label, desc }) => {
          const reached = phaseReached(id);
          const active = phase === id;
          return (
            <div
              key={id}
              className={cn(
                "rounded-lg border p-2.5 transition-all duration-500 min-h-[52px]",
                active ? "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/30" :
                reached ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/10" :
                "border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20"
              )}
            >
              <div className="flex items-center gap-2">
                {reached ? <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" /> : <Circle className="size-3.5 text-zinc-300 shrink-0" />}
                <span className={cn("text-xs font-semibold", active ? "text-blue-700 dark:text-blue-300" : reached ? "text-emerald-700 dark:text-emerald-300" : "text-zinc-400")}>
                  {label}
                </span>
                <span className="text-[10px] text-zinc-400">— {desc}</span>
              </div>

              {id === "handshake" && reached && (
                <div className="mt-1.5 font-mono text-[10px] text-zinc-500 pl-5">
                  GET /ws → 101 Switching Protocols
                </div>
              )}

              {id === "messages" && reached && (
                <div className="mt-1.5 space-y-1 h-[80px] overflow-y-auto pl-1">
                  {messages.slice(0, visibleMessages).map((msg, i) => (
                    <div key={i} className={cn("flex items-center gap-2 text-[10px] transition-all duration-500", msg.direction === "client" ? "justify-end" : "justify-start")}>
                      {msg.direction === "server" && <ArrowLeft className="size-3 text-emerald-500 shrink-0" />}
                      <span className={cn(
                        "rounded px-1.5 py-0.5 font-mono font-semibold",
                        msg.direction === "client" ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700" : "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700"
                      )}>
                        {msg.type}
                      </span>
                      {msg.direction === "client" && <ArrowRight className="size-3 text-blue-500 shrink-0" />}
                    </div>
                  ))}
                </div>
              )}

              {id === "closed" && phase === "closed" && (
                <div className="mt-1.5 flex items-center gap-1.5 pl-5 text-[10px] text-red-500">
                  <X className="size-3" /> Close frame (1000 Normal Closure)
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
        <span className={cn(
          "text-sm flex-1 transition-all duration-500",
          phase === "open" || phase === "messages" ? "text-emerald-600 dark:text-emerald-400" :
          phase === "closed" ? "text-red-500" : "text-zinc-500 dark:text-zinc-400"
        )}>
          {statusText}
        </span>
        <button
          onClick={handlePrimaryAction}
          disabled={running || (phase !== "idle" && phase !== "closed" && phase !== "messages")}
          className="flex items-center gap-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-all duration-500 disabled:opacity-50"
        >
          {running ? <RefreshCw className="size-3.5 animate-spin" /> : <Wifi className="size-3.5" />}
          {running ? "Connecting…" : phase === "messages" ? "Disconnect" : phase === "closed" ? "Reconnect" : "Connect"}
        </button>
      </div>
    </div>
  );
}
