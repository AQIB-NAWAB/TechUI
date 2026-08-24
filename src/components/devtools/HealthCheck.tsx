"use client";

import { useState, useCallback } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Activity, CheckCircle, AlertCircle, XCircle, Loader2 } from "lucide-react";

export const HealthCheckSchema = z.object({
  service: z.string().default("FreshMarket API"),
  endpoints: z
    .array(
      z.object({
        name: z.string(),
        path: z.string(),
        status: z
          .enum(["healthy", "degraded", "down", "pending"])
          .default("pending"),
        responseMs: z.number().optional(),
        expectedMs: z.number().optional().default(200),
      })
    )
    .default([
      { name: "API Gateway", path: "/health", status: "healthy", responseMs: 12, expectedMs: 100 },
      { name: "Database", path: "/health/db", status: "healthy", responseMs: 8, expectedMs: 50 },
      { name: "Cache (Redis)", path: "/health/cache", status: "degraded", responseMs: 450, expectedMs: 10 },
      { name: "Payment Service", path: "/health/payments", status: "down", expectedMs: 200 },
      { name: "Email Queue", path: "/health/queue", status: "healthy", responseMs: 5, expectedMs: 100 },
    ]),
  intervalSeconds: z.number().optional().default(30),
});

export type HealthCheckProps = z.infer<typeof HealthCheckSchema>;

type EndpointStatus = "healthy" | "degraded" | "down" | "pending";

type EndpointState = {
  name: string;
  path: string;
  status: EndpointStatus;
  responseMs?: number;
  expectedMs: number;
  checking: boolean;
};

function getTimeBadgeColor(responseMs: number | undefined, expectedMs: number): string {
  if (responseMs === undefined) return "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400";
  if (responseMs <= expectedMs) return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400";
  if (responseMs <= expectedMs * 2) return "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400";
  return "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400";
}

function StatusIcon({ status, checking }: { status: EndpointStatus; checking: boolean }) {
  if (checking) {
    return <Loader2 className="size-4 text-blue-500 animate-spin shrink-0" />;
  }
  if (status === "healthy") return <CheckCircle className="size-4 text-emerald-500 shrink-0" />;
  if (status === "degraded") return <AlertCircle className="size-4 text-amber-500 shrink-0" />;
  if (status === "down") return <XCircle className="size-4 text-red-500 shrink-0" />;
  return <div className="size-4 rounded-full border-2 border-zinc-300 dark:border-zinc-600 shrink-0" />;
}

function statusDotColor(status: EndpointStatus): string {
  if (status === "healthy") return "bg-emerald-500";
  if (status === "degraded") return "bg-amber-500";
  if (status === "down") return "bg-red-500";
  return "bg-zinc-400";
}

export function HealthCheck({
  service = "FreshMarket API",
  endpoints = [
    { name: "API Gateway", path: "/health", status: "healthy" as const, responseMs: 12, expectedMs: 100 },
    { name: "Database", path: "/health/db", status: "healthy" as const, responseMs: 8, expectedMs: 50 },
    { name: "Cache (Redis)", path: "/health/cache", status: "degraded" as const, responseMs: 450, expectedMs: 10 },
    { name: "Payment Service", path: "/health/payments", status: "down" as const, expectedMs: 200 },
    { name: "Email Queue", path: "/health/queue", status: "healthy" as const, responseMs: 5, expectedMs: 100 },
  ],
  intervalSeconds = 30,
}: HealthCheckProps) {
  const [states, setStates] = useState<EndpointState[]>(
    endpoints.map((e) => ({
      ...e,
      status: e.status as EndpointStatus,
      expectedMs: e.expectedMs ?? 200,
      checking: false,
    }))
  );
  const [running, setRunning] = useState(false);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const runChecks = useCallback(() => {
    if (running) return;
    setRunning(true);

    setStates((prev) =>
      prev.map((s) => ({ ...s, status: "pending" as EndpointStatus, checking: false, responseMs: undefined }))
    );

    endpoints.forEach((ep, idx) => {
      setTimeout(() => {
        setActiveIdx(idx);
        setStates((prev) =>
          prev.map((s, i) => (i === idx ? { ...s, checking: true } : s))
        );
      }, idx * 1200);

      setTimeout(() => {
        setActiveIdx(null);
        setStates((prev) =>
          prev.map((s, i) =>
            i === idx
              ? {
                  ...s,
                  checking: false,
                  status: (endpoints[i].status as EndpointStatus) ?? "pending",
                  responseMs: endpoints[i].responseMs,
                }
              : s
          )
        );
        if (idx === endpoints.length - 1) {
          setRunning(false);
        }
      }, idx * 1200 + 800);
    });
  }, [running, endpoints]);

  const healthyCount = states.filter((s) => s.status === "healthy").length;
  const degradedCount = states.filter((s) => s.status === "degraded").length;
  const downCount = states.filter((s) => s.status === "down").length;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800">
        <Activity className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">
          Health Check
        </span>
        <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
          {service}
        </span>
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        Ping each dependency to see if your app and its services are up and responding fast enough.
      </p>

      <div className="min-h-[260px] px-4 py-3">
        <div className="mb-3 flex gap-2">
          {[
            { label: "Healthy", count: healthyCount, color: "bg-emerald-500" },
            { label: "Slow", count: degradedCount, color: "bg-amber-500" },
            { label: "Down", count: downCount, color: "bg-red-500" },
          ].map(({ label, count, color }) => (
            <div key={label} className="flex-1 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 px-3 py-2 text-center">
              <div className={cn("size-2 rounded-full mx-auto mb-1", color, count > 0 && label !== "Healthy" && "animate-pulse")} />
              <div className="text-lg font-bold text-zinc-800 dark:text-zinc-100">{count}</div>
              <div className="text-[10px] text-zinc-400">{label}</div>
            </div>
          ))}
        </div>

        <div className="border border-zinc-100 dark:border-zinc-800 rounded-lg divide-y divide-zinc-100 dark:divide-zinc-800">
          {states.map((ep, idx) => (
            <div
              key={ep.name}
              className={cn(
                "flex items-center gap-3 px-3 py-2 transition-all duration-500",
                activeIdx === idx
                  ? "bg-blue-50 dark:bg-blue-950/30"
                  : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
              )}
            >
              <StatusIcon status={ep.status} checking={ep.checking} />

              <div className="flex-1 min-w-0 flex items-center gap-2">
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 truncate">
                  {ep.name}
                </span>
                <span className="text-[10px] font-mono text-zinc-400 truncate hidden sm:inline">
                  {ep.path}
                </span>
              </div>

              <span
                className={cn(
                  "text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0 transition-all duration-500",
                  ep.checking || ep.status === "pending"
                    ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
                    : getTimeBadgeColor(ep.responseMs, ep.expectedMs)
                )}
              >
                {ep.checking || ep.status === "pending"
                  ? "---"
                  : ep.responseMs !== undefined
                  ? `${ep.responseMs}ms`
                  : "---"}
              </span>

              <div className="flex items-center gap-1 shrink-0 w-12 justify-end">
                <span
                  className={cn(
                    "size-2 rounded-full transition-all duration-500",
                    ep.checking ? "bg-blue-500 animate-pulse" : statusDotColor(ep.status)
                  )}
                />
                {ep.status === "degraded" && !ep.checking && (
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                    slow
                  </span>
                )}
                {ep.status === "down" && !ep.checking && (
                  <span className="text-[10px] text-red-600 dark:text-red-400 font-semibold">
                    down
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400 flex-wrap">
          {healthyCount > 0 && (
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              {healthyCount} healthy
            </span>
          )}
          {degradedCount > 0 && (
            <span className="text-amber-600 dark:text-amber-400 font-semibold">
              {degradedCount} degraded
            </span>
          )}
          {downCount > 0 && (
            <span className="text-red-600 dark:text-red-400 font-semibold">
              {downCount} down
            </span>
          )}
          {healthyCount === 0 && degradedCount === 0 && downCount === 0 && (
            <span>Pending checks…</span>
          )}
          <span className="text-[10px] text-zinc-400">· every {intervalSeconds}s</span>
        </div>
        <button
          onClick={runChecks}
          disabled={running}
          className={cn(
            "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity shrink-0",
            running && "opacity-50 cursor-not-allowed"
          )}
        >
          {running ? "Checking…" : "Run Checks"}
        </button>
      </div>
    </div>
  );
}
