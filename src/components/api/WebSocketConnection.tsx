"use client";

import { useState, useEffect, useRef } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Zap, Send, ChevronDown, ChevronRight, Monitor, Server } from "lucide-react";

const WSMessageSchema = z.object({
  direction: z.enum(["client", "server"]),
  data: z.string(),
  type: z.enum(["text", "binary", "ping", "pong", "close"]).optional().default("text"),
});

export const WebSocketConnectionSchema = z.object({
  url: z.string().default("wss://api.example.com/ws"),
  protocol: z.string().optional(),
  messages: z.array(WSMessageSchema).optional(),
  showHandshake: z.boolean().optional().default(true),
  interactive: z.boolean().optional().default(true),
});

export type WebSocketConnectionProps = z.infer<typeof WebSocketConnectionSchema>;

type ConnState = "closed" | "handshaking" | "connected";

type Message = {
  id: number;
  direction: "client" | "server";
  data: string;
  type: "text" | "binary" | "ping" | "pong" | "close";
  visible: boolean;
};

let _msgId = 0;

const AUTO_SEQUENCE: { direction: "client" | "server"; data: string; delayMs: number }[] = [
  { direction: "client", data: '{"action":"subscribe","channel":"prices"}', delayMs: 0 },
  { direction: "server", data: '{"event":"subscribed","channel":"prices","status":"ok"}', delayMs: 800 },
  { direction: "server", data: '{"event":"price","symbol":"BTC","price":67420.50}', delayMs: 1800 },
  { direction: "server", data: '{"event":"price","symbol":"ETH","price":3841.20}', delayMs: 2600 },
];

const SERVER_RESPONSES: { match: string; reply: string }[] = [
  { match: "ping",       reply: '{"event":"pong"}' },
  { match: "subscribe",  reply: '{"event":"subscribed","status":"ok"}' },
  { match: "send",       reply: '{"event":"delivered","messageId":"msg_482"}' },
  { match: "hello",      reply: '{"event":"echo","data":"Hello! I am the server."}' },
];

function getServerReply(input: string): string {
  const lower = input.toLowerCase();
  if (lower === "hello from client" || lower === "hello") {
    return "Pong!";
  }
  for (const { match, reply } of SERVER_RESPONSES) {
    if (lower.includes(match)) return reply;
  }
  return `{"event":"echo","data":${JSON.stringify(input.slice(0, 40))}}`;
}

const PRESET_MESSAGES = [
  "Hello from client",
  '{"action":"ping"}',
  '{"action":"subscribe","channel":"prices"}',
];

export function WebSocketConnection({
  url = "wss://api.example.com/ws",
  protocol,
  messages: initMessages,
  showHandshake = true,
  interactive = true,
}: WebSocketConnectionProps) {
  const [connState, setConnState] = useState<ConnState>("closed");
  const [messages, setMessages] = useState<Message[]>(() =>
    (initMessages ?? []).map((m) => ({
      id: ++_msgId,
      direction: m.direction,
      data: m.data,
      type: m.type ?? "text",
      visible: true,
    }))
  );
  const [input, setInput] = useState(PRESET_MESSAGES[0]!);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  function addMessage(direction: "client" | "server", data: string, type: Message["type"] = "text") {
    const msg: Message = { id: ++_msgId, direction, data, type, visible: false };
    setMessages((prev) => [...prev.slice(-15), msg]);
    setTimeout(() => {
      setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, visible: true } : m));
    }, 50);
  }

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [messages]);

  function connect() {
    setConnState("handshaking");
    setMessages([]);
    setTimeout(() => {
      setConnState("connected");
      AUTO_SEQUENCE.forEach(({ direction, data, delayMs }) => {
        setTimeout(() => addMessage(direction, data), delayMs + 100);
      });
    }, 1200);
  }

  function disconnect() {
    addMessage("client", '{"action":"close"}', "close");
    setTimeout(() => {
      addMessage("server", "Connection closed.", "close");
      setConnState("closed");
      setMessages([]);
    }, 1000);
  }

  function sendMessage() {
    if (!input.trim() || connState !== "connected") return;
    addMessage("client", input.trim());
    const reply = getServerReply(input.trim());
    setTimeout(() => addMessage("server", reply), 1000);
  }

  const statusDot = connState === "connected"
    ? "bg-emerald-500 animate-pulse"
    : connState === "handshaking"
    ? "bg-amber-400 animate-pulse"
    : "bg-zinc-400 dark:bg-zinc-600";

  const statusLabel = connState === "connected" ? "Connected" : connState === "handshaking" ? "Handshaking…" : "Closed";

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800">
        <Zap className="size-4 text-violet-500 shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 block">WebSocket Connection</span>
          <code className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 truncate block">{url}</code>
        </div>
        {protocol && <span className="text-[11px] text-zinc-400 font-mono shrink-0">{protocol}</span>}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={cn("size-2 rounded-full transition-all duration-500", statusDot)} />
          <span className="text-xs text-zinc-500">{statusLabel}</span>
        </div>
      </div>

      <div className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        Keeps a live connection open so the server and client can send messages instantly.
      </div>

      {/* Pre-connect state */}
      {connState === "closed" && (
        <div className="px-4 py-6 min-h-[200px] flex flex-col items-center justify-center gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 flex items-center justify-center">
            <Zap className="size-8 text-violet-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1">WebSocket Connection</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-52">
              Keeps a connection open so server and client can message each other anytime — no polling needed.
            </p>
          </div>
          {interactive && (
            <button
              onClick={connect}
              className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-6 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Connect
            </button>
          )}
        </div>
      )}

      {/* Handshaking state */}
      {connState === "handshaking" && (
        <div className="px-4 min-h-[200px] flex flex-col items-center justify-center gap-3">
          <div className="size-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
          <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">Handshaking…</p>
          <p className="text-xs text-zinc-400">Upgrading HTTP connection to WebSocket</p>
        </div>
      )}

      {/* Connected state */}
      {connState === "connected" && (
        <>
          {/* Participant labels */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20">
            <span className="flex items-center gap-1.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">
              <Monitor className="size-3" /> Client
            </span>
            <span className="flex items-center gap-1.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">
              Server <Server className="size-3" />
            </span>
          </div>

          {/* Message log */}
          <div
            ref={logRef}
            className="min-h-[200px] max-h-[200px] overflow-y-auto px-4 py-3 space-y-2"
          >
            {messages.length === 0 && (
              <p className="text-xs text-zinc-400 text-center py-6">Connecting…</p>
            )}
            {messages.slice(-8).map((msg) => {
              const isClient = msg.direction === "client";
              const isClose = msg.type === "close";
              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-2 transition-all duration-500",
                    isClient ? "justify-end" : "justify-start",
                    msg.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                  )}
                >
                  <div className={cn(
                    "max-w-[78%] rounded-xl px-3 py-2 text-[11px] font-mono",
                    isClose
                      ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 italic text-center"
                      : isClient
                      ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
                  )}>
                    <div className="text-[9px] font-sans font-semibold opacity-50 mb-0.5">
                      {isClient ? "CLIENT" : "SERVER"}
                    </div>
                    <span className="break-all">{msg.data}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Input */}
          {interactive && (
            <div className="border-t border-zinc-100 dark:border-zinc-800 px-3 py-2 flex items-center gap-2">
              <select
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 text-[11px] font-mono bg-transparent text-zinc-600 dark:text-zinc-400 outline-none cursor-pointer min-w-0 truncate border border-zinc-200 dark:border-zinc-700 rounded-md px-2 py-1"
              >
                {PRESET_MESSAGES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <button
                onClick={sendMessage}
                className="shrink-0 p-1.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 transition-opacity"
              >
                <Send className="size-3.5" />
              </button>
              <button
                onClick={disconnect}
                className="shrink-0 px-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all duration-500"
              >
                Disconnect
              </button>
            </div>
          )}

          {/* Collapsible upgrade details */}
          {showHandshake && (
          <div className="border-t border-zinc-100 dark:border-zinc-800">
            <button
              onClick={() => setShowUpgrade((v) => !v)}
              className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-all duration-500"
            >
              {showUpgrade ? <ChevronDown className="size-3 text-zinc-400" /> : <ChevronRight className="size-3 text-zinc-400" />}
              <span className="text-[10px] font-semibold text-zinc-400">How WebSockets connect</span>
            </button>
            {showUpgrade && (
              <div className="px-4 pb-3">
                <pre className="text-[10px] font-mono text-zinc-500 dark:text-zinc-500 leading-relaxed bg-zinc-50 dark:bg-zinc-900 rounded-lg p-3 border border-zinc-100 dark:border-zinc-800">{`GET ${url.replace("wss://", "https://")} HTTP/1.1\nUpgrade: websocket\nConnection: Upgrade\n→ 101 Switching Protocols`}</pre>
              </div>
            )}
          </div>
          )}
        </>
      )}
    </div>
  );
}
