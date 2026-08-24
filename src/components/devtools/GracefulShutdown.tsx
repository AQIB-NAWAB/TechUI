"use client";

import { useState, useRef } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Server, Monitor, Ban, Loader2, Power, CheckCircle2 } from "lucide-react";

export const GracefulShutdownSchema = z.object({
  serviceName: z.string().optional().default("api-server"),
  initialConnections: z.number().int().min(1).max(12).optional().default(6),
  drainTimeoutSeconds: z.number().optional().default(30),
  interactive: z.boolean().optional().default(true),
});

export type GracefulShutdownProps = z.infer<typeof GracefulShutdownSchema>;

type ShutdownPhase = "running" | "sigterm" | "draining" | "complete";

type Connection = {
  id: number;
  label: string;
  progress: number;
  done: boolean;
};

let _connId = 0;

export function GracefulShutdown({
  serviceName = "api-server",
  initialConnections = 6,
  drainTimeoutSeconds = 30,
  interactive = true,
}: GracefulShutdownProps) {
  const [phase, setPhase] = useState<ShutdownPhase>("running");
  const [connections, setConnections] = useState<Connection[]>(() =>
    Array.from({ length: initialConnections }, (_, i) => ({
      id: ++_connId,
      label: `client-${i + 1}`,
      progress: 20 + (i % 4) * 15,
      done: false,
    }))
  );
  const [newRequestsBlocked, setNewRequestsBlocked] = useState(false);
  const [animating, setAnimating] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  function clearTimers() {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }

  function reset() {
    clearTimers();
    setPhase("running");
    setNewRequestsBlocked(false);
    setAnimating(false);
    setConnections(
      Array.from({ length: initialConnections }, (_, i) => ({
        id: ++_connId,
        label: `client-${i + 1}`,
        progress: 20 + (i % 4) * 15,
        done: false,
      }))
    );
  }

  function initiateShutdown() {
    if (animating || !interactive) return;
    setAnimating(true);
    clearTimers();

    setPhase("sigterm");
    timersRef.current.push(
      setTimeout(() => {
        setNewRequestsBlocked(true);
        setPhase("draining");
      }, 1200)
    );

    connections.forEach((conn, idx) => {
      timersRef.current.push(
        setTimeout(() => {
          setConnections((prev) =>
            prev.map((c) =>
              c.id === conn.id ? { ...c, progress: 100, done: true } : c
            )
          );
        }, 2400 + idx * 1000)
      );
    });

    timersRef.current.push(
      setTimeout(() => {
        setPhase("complete");
        setAnimating(false);
      }, 2400 + connections.length * 1000 + 800)
    );
  }

  const activeCount = connections.filter((c) => !c.done).length;
  const drainedCount = connections.filter((c) => c.done).length;

  const statusMessages: Record<ShutdownPhase, string> = {
    running: "Server is live — accepting new connections and serving requests.",
    sigterm: "SIGTERM received — load balancer notified, preparing to drain.",
    draining: `Draining ${activeCount} active connection${activeCount === 1 ? "" : "s"} — no new requests accepted.`,
    complete: "All connections finished — process exited cleanly with zero dropped requests.",
  };

  const phaseBadge: Record<ShutdownPhase, string> = {
    running: "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    sigterm: "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    draining: "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    complete: "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700",
  };

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-200 dark:border-zinc-800">
        <Server className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex-1">
          Graceful Shutdown
        </span>
        <span className="font-mono text-[10px] text-zinc-400">{serviceName}</span>
        <span
          className={cn(
            "text-[10px] font-semibold px-2 py-0.5 rounded border uppercase tracking-wide transition-all duration-500",
            phaseBadge[phase]
          )}
        >
          {phase === "sigterm" ? "SIGTERM" : phase}
        </span>
      </div>

      <div className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        On deploy or scale-down, stop accepting new traffic and let in-flight requests finish before exit.
      </div>

      <div className="min-h-[240px] px-4 py-4 flex gap-4">
        {/* Server block */}
        <div className="w-28 shrink-0 flex flex-col items-center gap-2">
          <div
            className={cn(
              "w-full rounded-lg border-2 p-3 flex flex-col items-center gap-2 transition-all duration-700",
              phase === "complete"
                ? "border-zinc-300 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-800 opacity-50"
                : phase === "running"
                ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/20"
                : "border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/20"
            )}
          >
            <Server
              className={cn(
                "size-6 transition-all duration-500",
                phase === "complete" ? "text-zinc-400" : phase === "running" ? "text-emerald-500" : "text-amber-500"
              )}
            />
            <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-300 text-center leading-tight">
              {phase === "complete" ? "Stopped" : "Running"}
            </span>
            {phase === "draining" && (
              <Loader2 className="size-3.5 text-blue-500 animate-spin" />
            )}
            {phase === "complete" && (
              <CheckCircle2 className="size-3.5 text-zinc-400" />
            )}
          </div>

          {newRequestsBlocked && phase !== "complete" && (
            <div className="flex items-center gap-1 text-[10px] text-red-600 dark:text-red-400 font-semibold transition-all duration-500">
              <Ban className="size-3" />
              503 new
            </div>
          )}
        </div>

        {/* Connections */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center justify-between text-[10px]">
            <span className="font-semibold uppercase tracking-widest text-zinc-400">Active connections</span>
            <span className="font-mono text-zinc-500">
              {drainedCount}/{connections.length} drained · {drainTimeoutSeconds}s timeout
            </span>
          </div>

          <div className="space-y-1.5 min-h-[160px]">
            {connections.map((conn) => (
              <div
                key={conn.id}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-2.5 py-2 transition-all duration-500",
                  conn.done
                    ? "border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20 opacity-60"
                    : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                )}
              >
                <Monitor className="size-3.5 text-zinc-400 shrink-0" />
                <span className="text-[10px] font-mono text-zinc-500 w-16 shrink-0">{conn.label}</span>
                <div className="flex-1 h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-700",
                      conn.done ? "bg-emerald-500 w-full" : "bg-blue-500"
                    )}
                    style={{ width: conn.done ? "100%" : `${conn.progress}%` }}
                  />
                </div>
                {conn.done ? (
                  <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                ) : phase === "draining" ? (
                  <Loader2 className="size-3.5 text-blue-500 animate-spin shrink-0" />
                ) : (
                  <div className="size-3.5 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
                )}
              </div>
            ))}
          </div>

          {/* Blocked new request visual */}
          <div
            className={cn(
              "rounded-lg border border-dashed px-3 py-2 flex items-center gap-2 transition-all duration-500",
              newRequestsBlocked
                ? "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 opacity-100"
                : "border-zinc-200 dark:border-zinc-700 opacity-40"
            )}
          >
            <Monitor className="size-3.5 text-zinc-400" />
            <span className="text-[10px] text-zinc-500 flex-1">new-client →</span>
            <Ban className="size-3.5 text-red-500" />
            <span className="text-[10px] font-semibold text-red-600 dark:text-red-400">rejected</span>
          </div>
        </div>
      </div>

      {interactive && (
        <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/30">
          <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">{statusMessages[phase]}</span>
          {phase === "complete" ? (
            <button
              type="button"
              onClick={reset}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-500 shrink-0 hover:opacity-90 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
            >
              Reset
            </button>
          ) : (
            <button
              type="button"
              onClick={initiateShutdown}
              disabled={animating || phase !== "running"}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-500 shrink-0 hover:opacity-90 flex items-center gap-1.5",
                "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900",
                (animating || phase !== "running") && "opacity-50 cursor-not-allowed"
              )}
            >
              <Power className="size-3.5" />
              Initiate Shutdown
            </button>
          )}
        </div>
      )}
    </div>
  );
}
