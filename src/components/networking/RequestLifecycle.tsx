"use client";

import { useState, useEffect, useRef } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Globe, Cable, Lock, ArrowUpRight, Server, CheckCircle, ChevronRight, RefreshCw } from "lucide-react";

export const RequestLifecycleSchema = z.object({
  url: z.string().default("https://api.example.com/users/42"),
  method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]).default("GET"),
  showTiming: z.boolean().optional().default(false),
});

export type RequestLifecycleProps = z.infer<typeof RequestLifecycleSchema>;

type Phase = {
  id: string;
  label: string;
  icon: React.ReactNode;
  timing: string;
  description: string;
  code: string;
};

const PHASES: Phase[] = [
  {
    id: "dns",
    label: "DNS",
    icon: <Globe className="size-5" />,
    timing: "~20–200ms",
    description: "Your computer asks a DNS resolver to convert the domain name into an IP address. It checks its cache first, then walks the DNS hierarchy: Root → .com → example.com → final IP.",
    code: "api.example.com\n  → 93.184.216.34",
  },
  {
    id: "tcp",
    label: "TCP",
    icon: <Cable className="size-5" />,
    timing: "~10–100ms",
    description: "A TCP connection is established with a 3-way handshake. The client sends SYN, the server replies SYN-ACK, and the client confirms with ACK — creating a reliable channel.",
    code: "Client → SYN\nServer → SYN-ACK\nClient → ACK\nConnection ready",
  },
  {
    id: "tls",
    label: "TLS",
    icon: <Lock className="size-5" />,
    timing: "~10–50ms",
    description: "TLS 1.3 negotiates encryption in one round-trip. Client and server agree on a cipher, exchange keys, and verify the certificate — all traffic is now encrypted.",
    code: "ClientHello → TLS 1.3\nServerHello + Cert\nKeys derived\nChannel encrypted ✓",
  },
  {
    id: "request",
    label: "HTTP",
    icon: <ArrowUpRight className="size-5" />,
    timing: "~1 RTT",
    description: "The HTTP request travels over the encrypted TLS channel. It includes the method, path, headers (like Authorization), and an optional body.",
    code: "GET /users/42 HTTP/2\nHost: api.example.com\nAuthorization: Bearer …\nAccept: application/json",
  },
  {
    id: "server",
    label: "Server",
    icon: <Server className="size-5" />,
    timing: "~10–500ms",
    description: "The server validates the auth token, routes the request to the right handler, runs business logic, queries the database, then builds a response.",
    code: "1. Validate JWT\n2. Route → GET /users/:id\n3. SELECT FROM users\n4. Serialize → JSON\n5. Return 200 OK",
  },
  {
    id: "response",
    label: "Response",
    icon: <CheckCircle className="size-5" />,
    timing: "~1 RTT",
    description: "The server sends back a status code, headers, and the response body. A 200 means success. The data is decrypted by TLS and delivered to your app.",
    code: 'HTTP/2 200 OK\nContent-Type: application/json\n\n{ "id": 42, "name": "Alice" }',
  },
];

export function RequestLifecycle({
  url = "https://api.example.com/users/42",
  method = "GET",
}: RequestLifecycleProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const active = PHASES[activeIdx] ?? PHASES[0]!;
  const isComplete = activeIdx === PHASES.length - 1 && !running;

  function autoPlay() {
    if (running) {
      clearInterval(intervalRef.current!);
      setRunning(false);
      return;
    }
    setActiveIdx(0);
    setRunning(true);
    let i = 0;
    intervalRef.current = setInterval(() => {
      i++;
      if (i >= PHASES.length) {
        clearInterval(intervalRef.current!);
        setRunning(false);
      } else {
        setActiveIdx(i);
      }
    }, 1200);
  }

  function handlePrimary() {
    if (running) {
      autoPlay();
      return;
    }
    if (isComplete) {
      setActiveIdx(0);
      return;
    }
    if (activeIdx < PHASES.length - 1) {
      setActiveIdx((i) => i + 1);
    } else {
      autoPlay();
    }
  }

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const METHOD_COLORS: Record<string, string> = {
    GET: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30",
    POST: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30",
    PUT: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30",
    DELETE: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30",
    PATCH: "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/30",
  };

  const primaryLabel = running ? "Stop" : isComplete ? "Restart" : activeIdx === 0 ? "Auto-play" : "Next Step";

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-900">
        <ArrowUpRight className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex-1">Request Lifecycle</span>
        <span className={cn("text-[11px] font-bold px-1.5 py-0.5 rounded font-mono shrink-0", METHOD_COLORS[method] ?? "text-zinc-500")}>
          {method}
        </span>
      </div>

      <div className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-900">
        Every web request travels through DNS, TCP, TLS, and HTTP before the server sends a response.
      </div>

      <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20">
        <code className="text-xs font-mono text-zinc-600 dark:text-zinc-400 truncate block">{url}</code>
      </div>

      <div className="px-4 py-4 flex items-center justify-center gap-1 overflow-x-auto min-h-[100px] border-b border-zinc-100 dark:border-zinc-800">
        {PHASES.map((phase, i) => (
          <div key={phase.id} className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => { setActiveIdx(i); if (running) { clearInterval(intervalRef.current!); setRunning(false); } }}
              className={cn(
                "flex flex-col items-center gap-1 px-2 py-2 rounded-lg border-2 transition-all duration-500 w-[72px]",
                activeIdx === i
                  ? "border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-950/40 scale-110 shadow-md shadow-blue-200 dark:shadow-blue-900/30"
                  : i < activeIdx
                  ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/10"
                  : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-600"
              )}
            >
              <span
                className={cn(
                  "transition-colors duration-500",
                  activeIdx === i
                    ? "text-blue-600 dark:text-blue-400"
                    : i < activeIdx
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-zinc-400 dark:text-zinc-500"
                )}
              >
                {phase.icon}
              </span>
              <span
                className={cn(
                  "text-[10px] font-semibold leading-none transition-colors duration-500",
                  activeIdx === i
                    ? "text-blue-700 dark:text-blue-300"
                    : i < activeIdx
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-zinc-500 dark:text-zinc-400"
                )}
              >
                {phase.label}
              </span>
              <span
                className={cn(
                  "text-[9px] font-mono leading-none transition-colors duration-500",
                  activeIdx === i ? "text-blue-500 dark:text-blue-400" : "text-zinc-400 dark:text-zinc-500"
                )}
              >
                {phase.timing.split(" ")[0]}
              </span>
            </button>
            {i < PHASES.length - 1 && (
              <ChevronRight
                className={cn(
                  "size-3 shrink-0 transition-colors duration-500",
                  i < activeIdx ? "text-emerald-300 dark:text-emerald-700" : "text-zinc-200 dark:text-zinc-700"
                )}
              />
            )}
          </div>
        ))}
      </div>

      <div className="px-4 py-4 min-h-[160px] flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="shrink-0 size-9 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            {active.icon}
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{active.label}</h3>
            <span className="text-[10px] font-mono text-zinc-400">{active.timing}</span>
          </div>
        </div>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{active.description}</p>
        <pre className="text-[11px] font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md p-3 text-zinc-700 dark:text-zinc-300 whitespace-pre overflow-x-auto leading-relaxed min-h-[72px]">
          {active.code}
        </pre>
      </div>

      <div className="border-t border-zinc-100 dark:border-zinc-900 px-4 py-3 flex items-center gap-3">
        <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">
          {running ? `Auto-playing step ${activeIdx + 1} of ${PHASES.length}…` : `Step ${activeIdx + 1} of ${PHASES.length} — ${active.label}`}
        </span>
        <button
          onClick={handlePrimary}
          className="flex items-center gap-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity shrink-0"
        >
          {running ? <RefreshCw className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
          {primaryLabel}
        </button>
      </div>
    </div>
  );
}
