"use client";

import { useState, useEffect, useRef } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Radio, Zap, Monitor, Server, ArrowRight, ArrowLeft } from "lucide-react";

export const WebSocketVsSseSchema = z.object({
  protocol: z.enum(["websocket", "sse"]).default("websocket"),
  interactive: z.boolean().optional().default(true),
});

export type WebSocketVsSseProps = z.infer<typeof WebSocketVsSseSchema>;

type Protocol = "websocket" | "sse";

interface Message {
  from: "client" | "server";
  text: string;
}

const FEATURES: Record<Protocol, Array<{ label: string; value: string; good: boolean }>> = {
  websocket: [
    { label: "Direction", value: "Bidirectional", good: true },
    { label: "Protocol", value: "ws:// upgrade", good: true },
    { label: "Overhead", value: "Low (frames)", good: true },
    { label: "Reconnect", value: "Manual", good: false },
  ],
  sse: [
    { label: "Direction", value: "Server → Client only", good: false },
    { label: "Protocol", value: "HTTP stream", good: true },
    { label: "Overhead", value: "Very low", good: true },
    { label: "Reconnect", value: "Built-in auto", good: true },
  ],
};

export function WebSocketVsSse({
  protocol: initialProtocol = "websocket",
  interactive = true,
}: WebSocketVsSseProps) {
  const [protocol, setProtocol] = useState<Protocol>(initialProtocol);
  const [messages, setMessages] = useState<Message[]>([]);
  const [connected, setConnected] = useState(false);
  const [animating, setAnimating] = useState(false);
  const msgId = useRef(0);

  useEffect(() => {
    setMessages([]);
    setConnected(false);
    setAnimating(false);
  }, [protocol]);

  function connect() {
    if (animating || connected) return;
    setAnimating(true);
    setTimeout(() => {
      setConnected(true);
      setAnimating(false);
      if (protocol === "sse") {
        setMessages([{ from: "server", text: "event: connected\ndata: stream open" }]);
      } else {
        setMessages([{ from: "server", text: '{"type":"connected"}' }]);
      }
    }, 1000);
  }

  function sendMessage() {
    if (!connected || animating) return;
    setAnimating(true);
    const id = ++msgId.current;

    if (protocol === "websocket") {
      setMessages((prev) => [...prev.slice(-5), { from: "client", text: `ping #${id}` }]);
      setTimeout(() => {
        setMessages((prev) => [...prev.slice(-5), { from: "server", text: `pong #${id}` }]);
        setAnimating(false);
      }, 1000);
    } else {
      setMessages((prev) => [
        ...prev.slice(-5),
        { from: "server", text: `data: {"price": ${(42 + id * 0.1).toFixed(1)}}` },
      ]);
      setAnimating(false);
    }
  }

  function disconnect() {
    setConnected(false);
    setMessages([]);
    setAnimating(false);
  }

  const statusText = !connected
    ? animating
      ? "Connecting…"
      : protocol === "websocket"
      ? "WebSocket opens a two-way pipe — client and server can both send anytime"
      : "SSE keeps one HTTP stream open — server pushes events, browser auto-reconnects"
    : protocol === "websocket"
    ? "Connected — click Send to ping the server"
    : "Stream open — server pushes price updates automatically";

  return (
    <>
      <style>{`
        @keyframes ws-travel-right {
          from { left: 20%; opacity: 1; }
          to { left: 75%; opacity: 0.3; }
        }
        @keyframes ws-travel-left {
          from { left: 75%; opacity: 1; }
          to { left: 20%; opacity: 0.3; }
        }
        @keyframes sse-travel {
          from { left: 75%; opacity: 1; }
          to { left: 20%; opacity: 0.3; }
        }
      `}</style>
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
        <div className="h-12 px-4 flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
          {protocol === "websocket" ? (
            <Zap className="size-4 text-violet-500 shrink-0" />
          ) : (
            <Radio className="size-4 text-blue-500 shrink-0" />
          )}
          <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">WebSocket vs SSE</span>
          <div className="flex rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
            {(["websocket", "sse"] as Protocol[]).map((p) => (
              <button
                key={p}
                onClick={() => setProtocol(p)}
                className={cn(
                  "px-2.5 py-1 text-[10px] font-semibold transition-all duration-500",
                  protocol === p
                    ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                )}
              >
                {p === "websocket" ? "WebSocket" : "SSE"}
              </button>
            ))}
          </div>
          <span
            className={cn(
              "text-[10px] font-semibold px-2 py-0.5 rounded-full transition-all duration-500",
              connected
                ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
            )}
          >
            {connected ? "● Connected" : "○ Closed"}
          </span>
        </div>

        <div className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
          Real-time updates need a persistent connection — WebSocket for chat/games, SSE for live feeds and dashboards.
        </div>

        <div className="min-h-[220px] px-4 py-4 flex flex-col gap-3">
          <div className="flex items-center justify-between relative h-10">
            <div className="flex items-center gap-1.5">
              <Monitor className="size-4 text-blue-500" />
              <span className="text-[10px] font-semibold text-zinc-500">Client</span>
            </div>
            <div className="flex-1 mx-3 relative h-0.5 bg-zinc-200 dark:bg-zinc-700 rounded">
              {animating && connected && protocol === "websocket" && (
                <div
                  className="absolute top-1/2 -translate-y-1/2 size-2 rounded-full bg-violet-500"
                  style={{ animation: "ws-travel-right 1s ease-out forwards" }}
                />
              )}
              {animating && protocol === "sse" && (
                <div
                  className="absolute top-1/2 -translate-y-1/2 size-2 rounded-full bg-blue-500"
                  style={{ animation: "sse-travel 1s ease-out forwards" }}
                />
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <Server className="size-4 text-emerald-500" />
              <span className="text-[10px] font-semibold text-zinc-500">Server</span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {FEATURES[protocol].map((f) => (
              <div
                key={f.label}
                className="rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 px-2 py-1.5 text-center"
              >
                <div className="text-[9px] text-zinc-400 uppercase">{f.label}</div>
                <div className={cn("text-[10px] font-semibold mt-0.5", f.good ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400")}>
                  {f.value}
                </div>
              </div>
            ))}
          </div>

          <div className="flex-1 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 p-2 min-h-[80px] overflow-y-auto space-y-1">
            {messages.length === 0 && (
              <div className="text-[11px] text-zinc-400 text-center py-4">No messages yet</div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-center gap-1 text-[10px] font-mono transition-all duration-500",
                  m.from === "client" ? "justify-end text-violet-600 dark:text-violet-400" : "justify-start text-blue-600 dark:text-blue-400"
                )}
              >
                {m.from === "server" && <ArrowLeft className="size-2.5 shrink-0" />}
                <span className="bg-white dark:bg-zinc-900 rounded px-2 py-0.5 border border-zinc-200 dark:border-zinc-700">
                  {m.text}
                </span>
                {m.from === "client" && <ArrowRight className="size-2.5 shrink-0" />}
              </div>
            ))}
          </div>
        </div>

        {interactive && (
          <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/30">
            <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">{statusText}</span>
            {connected && (
              <button
                onClick={disconnect}
                className="border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 rounded-lg px-3 py-2 text-xs font-semibold hover:opacity-80 transition-opacity"
              >
                Disconnect
              </button>
            )}
            <button
              onClick={connected ? sendMessage : connect}
              disabled={animating}
              className={cn(
                "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity",
                animating && "opacity-50 cursor-not-allowed"
              )}
            >
              {!connected ? (animating ? "Connecting…" : "Connect") : protocol === "websocket" ? "Send Ping" : "Receive Event"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
