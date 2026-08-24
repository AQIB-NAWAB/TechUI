"use client";

import { useState, useEffect, useRef } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Clock, Monitor, Server, RefreshCw, ArrowRight } from "lucide-react";

export const RetryAfterHeaderSchema = z.object({
  name: z.string().optional().default("Retry-After Header"),
  retryAfterSeconds: z.number().int().min(3).max(30).optional().default(8),
  endpoint: z.string().optional().default("/api/search"),
  interactive: z.boolean().optional().default(true),
});

export type RetryAfterHeaderProps = z.infer<typeof RetryAfterHeaderSchema>;

type Phase = "idle" | "blocked" | "waiting" | "retrying" | "success";
type LogEntry = { id: number; text: string; tone: "info" | "error" | "success" | "warn" };

let _logId = 0;

export function RetryAfterHeader({
  name = "Retry-After Header",
  retryAfterSeconds = 8,
  endpoint = "/api/search",
  interactive = true,
}: RetryAfterHeaderProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [countdown, setCountdown] = useState(retryAfterSeconds);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => () => clearTimer(), []);

  useEffect(() => {
    if (phase !== "waiting") return;
    clearTimer();
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearTimer();
          setPhase("retrying");
          addLog("Countdown finished — retrying request…", "info");
          setTimeout(() => {
            setPhase("success");
            addLog("200 OK — request allowed after wait", "success");
          }, 1000);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return clearTimer;
  }, [phase]);

  function addLog(text: string, tone: LogEntry["tone"]) {
    setLogs((prev) => [{ id: ++_logId, text, tone }, ...prev].slice(0, 5));
  }

  function sendRequest() {
    if (phase === "waiting" || phase === "retrying") return;
    clearTimer();
    setCountdown(retryAfterSeconds);
    setPhase("blocked");
    addLog(`429 Too Many Requests — Retry-After: ${retryAfterSeconds}`, "error");
    setTimeout(() => {
      setPhase("waiting");
      addLog(`Client waits ${retryAfterSeconds}s before retrying (RFC 7231)`, "warn");
    }, 1000);
  }

  function reset() {
    clearTimer();
    setPhase("idle");
    setCountdown(retryAfterSeconds);
    setLogs([]);
  }

  function handlePrimaryAction() {
    if (phase === "success") {
      reset();
      return;
    }
    sendRequest();
  }

  const fillPct = phase === "waiting" ? ((retryAfterSeconds - countdown) / retryAfterSeconds) * 100 : phase === "success" ? 100 : 0;
  const footerText =
    phase === "idle"
      ? "Send a request — the server may respond 429 and tell you how long to wait."
      : phase === "blocked"
      ? "Server rejected the request — read Retry-After before trying again."
      : phase === "waiting"
      ? `Waiting ${countdown}s — retrying too early wastes quota and may extend the ban.`
      : phase === "retrying"
      ? "Retry in flight…"
      : "Success — honoring Retry-After avoided another 429.";

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <Clock className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">{name}</span>
        <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
          Retry-After
        </span>
        {interactive && (
          <button type="button" onClick={reset} className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all duration-500">
            <RefreshCw className="size-3.5" />
          </button>
        )}
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        When you hit a rate limit, the server responds with HTTP 429 and a <span className="font-mono text-xs">Retry-After</span> header telling your client exactly how many seconds to wait before trying again.
      </p>

      <div className="p-4 min-h-[260px] flex flex-col gap-4">
        {/* Client → Server flow */}
        <div className="flex items-center justify-center gap-3">
          <div className={cn(
            "flex flex-col items-center gap-1 px-3 py-2 rounded-lg border transition-all duration-500",
            phase === "waiting" ? "border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30" : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50"
          )}>
            <Monitor className="size-5 text-blue-500" />
            <span className="text-[10px] font-semibold text-zinc-500">Client</span>
          </div>

          <div className="flex-1 max-w-[120px] relative h-8 flex items-center">
            <div className="absolute inset-x-0 top-1/2 h-px bg-zinc-200 dark:bg-zinc-700" />
            {(phase === "blocked" || phase === "retrying") && (
              <ArrowRight
                className={cn(
                  "size-4 absolute transition-all duration-700",
                  phase === "blocked" ? "text-red-500 left-0" : "text-emerald-500 right-0 rotate-180"
                )}
                style={{ animation: "travel 0.8s ease-out forwards" }}
              />
            )}
            {phase === "success" && (
              <span className="absolute inset-x-0 text-center text-[10px] font-bold text-emerald-600 dark:text-emerald-400">200 OK</span>
            )}
            {phase === "blocked" && (
              <span className="absolute inset-x-0 text-center text-[10px] font-bold text-red-600 dark:text-red-400">429</span>
            )}
          </div>

          <div className={cn(
            "flex flex-col items-center gap-1 px-3 py-2 rounded-lg border transition-all duration-500",
            phase === "blocked" ? "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/30" : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50"
          )}>
            <Server className="size-5 text-emerald-500" />
            <span className="text-[10px] font-semibold text-zinc-500">API</span>
          </div>
        </div>

        {/* Countdown + header display */}
        <div className="grid grid-cols-2 gap-3">
          <div className="border border-zinc-100 dark:border-zinc-800 rounded-lg p-3 bg-zinc-50 dark:bg-zinc-800/50">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2">
              Countdown
            </div>
            <div className="flex items-end gap-2">
              <span className={cn(
                "text-4xl font-bold font-mono tabular-nums transition-all duration-500",
                phase === "waiting" ? "text-amber-600 dark:text-amber-400" : phase === "success" ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-300 dark:text-zinc-600"
              )}>
                {phase === "idle" || phase === "blocked" ? retryAfterSeconds : countdown}
              </span>
              <span className="text-xs text-zinc-400 mb-1">seconds</span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  phase === "success" ? "bg-emerald-500" : phase === "waiting" ? "bg-amber-500" : "bg-zinc-300 dark:bg-zinc-600"
                )}
                style={{ width: `${fillPct}%` }}
              />
            </div>
          </div>

          <div className="border border-zinc-100 dark:border-zinc-800 rounded-lg p-3 bg-zinc-50 dark:bg-zinc-800/50">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2">
              Response header
            </div>
            <div className="space-y-1.5 font-mono text-xs">
              <div className="flex gap-2">
                <span className="text-zinc-400 shrink-0">HTTP/1.1</span>
                <span className={cn(
                  "font-bold",
                  phase === "success" ? "text-emerald-600 dark:text-emerald-400" : phase !== "idle" ? "text-red-600 dark:text-red-400" : "text-zinc-400"
                )}>
                  {phase === "success" ? "200 OK" : phase !== "idle" ? "429 Too Many Requests" : "—"}
                </span>
              </div>
              {(phase === "blocked" || phase === "waiting" || phase === "retrying") && (
                <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded px-2 py-1 text-amber-700 dark:text-amber-400">
                  Retry-After: {retryAfterSeconds}
                </div>
              )}
              <div className="text-zinc-400 truncate">GET {endpoint}</div>
            </div>
          </div>
        </div>

        {/* Event log */}
        <div className="min-h-[88px]">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1.5">
            Client log
          </div>
          <div className="space-y-1 min-h-[64px]">
            {logs.length === 0 && (
              <span className="text-[10px] text-zinc-400">No requests yet — click Send Request below</span>
            )}
            {logs.map((log) => (
              <div
                key={log.id}
                className={cn(
                  "text-[10px] font-mono rounded px-2 py-1 border transition-all duration-500",
                  log.tone === "error" && "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
                  log.tone === "warn" && "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
                  log.tone === "success" && "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
                  log.tone === "info" && "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                )}
              >
                {log.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {interactive && (
        <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/30 min-h-[52px]">
          <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">{footerText}</span>
          <button
            type="button"
            onClick={handlePrimaryAction}
            disabled={phase === "waiting" || phase === "retrying"}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-500 shrink-0 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed",
              "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
            )}
          >
            {phase === "success" ? "Try Again" : "Send Request"}
          </button>
        </div>
      )}

      <style>{`
        @keyframes travel {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(80px); opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
