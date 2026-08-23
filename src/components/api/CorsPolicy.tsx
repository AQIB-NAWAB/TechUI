"use client";

import { useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Monitor, Globe, CheckCircle2, XCircle, ArrowRight } from "lucide-react";

export const CorsPolicySchema = z.object({
  origin: z.string().optional().default("https://app.example.com"),
  allowedOrigins: z.array(z.string()).optional().default(["https://app.example.com", "https://admin.example.com"]),
  allowedMethods: z.array(z.string()).optional().default(["GET", "POST", "PUT", "DELETE"]),
  allowedHeaders: z.array(z.string()).optional().default(["Content-Type", "Authorization"]),
  credentials: z.boolean().optional().default(true),
  method: z.string().optional().default("POST"),
  outcome: z.enum(["allowed", "blocked"]).optional().default("allowed"),
});

export type CorsPolicyProps = z.infer<typeof CorsPolicySchema>;

export function CorsPolicy({
  origin = "https://app.example.com",
  allowedOrigins = ["https://app.example.com", "https://admin.example.com"],
  allowedMethods = ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders = ["Content-Type", "Authorization"],
  credentials = true,
  method = "POST",
  outcome = "allowed",
}: CorsPolicyProps) {
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);

  const isAllowed = outcome === "allowed";

  function simulate() {
    if (running) return;
    setStep(0);
    setRunning(true);
    setTimeout(() => setStep(1), 600);
    setTimeout(() => setStep(2), 1600);
    setTimeout(() => setStep(3), 2700);
    setTimeout(() => setRunning(false), 2700);
  }

  function reset() {
    setStep(0);
    setRunning(false);
  }

  const statusLabel =
    step === 0
      ? "Ready to simulate preflight flow"
      : step === 1
      ? "OPTIONS preflight sent to server..."
      : step === 2
      ? isAllowed
        ? "Preflight passed — origin is allowed"
        : "Preflight blocked — origin not in allowlist"
      : isAllowed
      ? "Preflight passed · actual request sent"
      : "CORS Error: Access blocked by server";

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="h-12 px-4 flex items-center gap-3 border-b border-zinc-200 dark:border-zinc-800">
        <Globe className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex-1">CORS Policy</span>
        <span
          className={cn(
            "text-[10px] font-semibold px-2 py-0.5 rounded-full transition-all duration-500",
            step === 0
              ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
              : isAllowed
              ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400"
              : "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400"
          )}
        >
          {step === 0 ? "Idle" : isAllowed ? "● Allowed" : "● Blocked"}
        </span>
      </div>

      <div className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        Browsers check permission before sending cross-origin requests — this preflight ensures servers control who can call them.
      </div>

      <div className="min-h-[260px] px-4 py-4 flex flex-col gap-3">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "flex-1 rounded-lg border px-3 py-2.5 transition-all duration-500",
              step >= 1
                ? "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/20"
                : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/40"
            )}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <Monitor className="size-3.5 text-zinc-500" />
              <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">Browser</span>
            </div>
            <div className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">origin:</div>
            <div className="text-[10px] font-mono text-zinc-700 dark:text-zinc-300 truncate">{origin}</div>
          </div>

          <div
            className={cn(
              "flex-1 rounded-lg border px-3 py-2.5 transition-all duration-500",
              step >= 2
                ? isAllowed
                  ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/20"
                  : "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/20"
                : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/40"
            )}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <Globe className="size-3.5 text-zinc-500" />
              <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">API Server</span>
              {step >= 2 && (
                <span className="ml-auto transition-all duration-500">
                  {isAllowed ? (
                    <CheckCircle2 className="size-3.5 text-emerald-500" />
                  ) : (
                    <XCircle className="size-3.5 text-red-500" />
                  )}
                </span>
              )}
            </div>
            <div className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">Access-Control-Allow-Origin:</div>
            <div
              className={cn(
                "text-[10px] font-mono transition-all duration-500",
                step >= 2
                  ? isAllowed
                    ? "text-emerald-700 dark:text-emerald-400"
                    : "text-red-600 dark:text-red-400"
                  : "text-zinc-400 dark:text-zinc-600"
              )}
            >
              {step >= 2
                ? isAllowed
                  ? origin + " ✓"
                  : "null (blocked)"
                : "—"}
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex-1 h-0.5 rounded-full origin-left transition-all duration-700",
                step >= 1 ? "bg-blue-400 scale-x-100" : "bg-zinc-200 dark:bg-zinc-700 scale-x-0"
              )}
              style={{ transformOrigin: "left" }}
            />
            <div className={cn("flex items-center gap-1 transition-all duration-500", step >= 1 ? "opacity-100" : "opacity-0")}>
              <ArrowRight className="size-3.5 text-blue-400 shrink-0" />
            </div>
            <span className={cn("text-[10px] font-mono transition-all duration-500", step >= 1 ? "text-blue-600 dark:text-blue-400" : "text-zinc-400 opacity-0")}>
              OPTIONS preflight
            </span>
          </div>

          {step >= 1 && (
            <div className="text-[10px] text-zinc-500 dark:text-zinc-400 pl-1 transition-all duration-500">
              Preflight request: "Can I {method} with {allowedHeaders.join(", ")}?"
            </div>
          )}

          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-[10px] font-mono transition-all duration-500",
                step >= 2
                  ? isAllowed
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-600 dark:text-red-400"
                  : "text-zinc-400 opacity-0"
              )}
            >
              {step >= 2 ? (isAllowed ? "200 OK" : "403 Forbidden") : ""}
            </span>
            <div
              className={cn(
                "flex-1 h-0.5 rounded-full origin-right transition-all duration-700",
                step >= 2
                  ? isAllowed
                    ? "bg-emerald-400 scale-x-100"
                    : "bg-red-400 scale-x-100"
                  : "bg-zinc-200 dark:bg-zinc-700 scale-x-0"
              )}
              style={{ transformOrigin: "right" }}
            />
          </div>

          {step >= 2 && isAllowed && (
            <div className="text-[10px] text-zinc-500 dark:text-zinc-400 pl-1 transition-all duration-500">
              "Yes, allowed headers: {allowedHeaders.join(", ")}"
            </div>
          )}
        </div>

        {step >= 3 && isAllowed && (
          <div className="space-y-1 transition-all duration-500">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-0.5 rounded-full bg-zinc-400 dark:bg-zinc-500" style={{ transformOrigin: "left" }} />
              <ArrowRight className="size-3.5 text-zinc-400 shrink-0" />
              <span className="text-[10px] font-mono text-zinc-600 dark:text-zinc-400">{method} (actual request)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">Response</span>
              <div className="flex-1 h-0.5 rounded-full bg-emerald-400" style={{ transformOrigin: "right" }} />
            </div>
          </div>
        )}

        {step >= 3 && !isAllowed && (
          <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-3 py-2 transition-all duration-500">
            <div className="flex items-center gap-2">
              <XCircle className="size-3.5 text-red-500 shrink-0" />
              <span className="text-[11px] font-semibold text-red-700 dark:text-red-400">CORS Error: Access blocked</span>
            </div>
            <div className="text-[10px] text-red-600 dark:text-red-400 mt-1">
              Origin &quot;{origin}&quot; is not in the allowlist. The browser will not send the real request.
            </div>
          </div>
        )}

        {step >= 2 && isAllowed && (
          <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 px-3 py-2 font-mono text-[10px] text-zinc-600 dark:text-zinc-400 transition-all duration-500">
            <span className="text-zinc-400">Access-Control-Allow-Origin: </span>
            <span className="text-emerald-600 dark:text-emerald-400">{origin}</span>
            {credentials && (
              <>
                <br />
                <span className="text-zinc-400">Access-Control-Allow-Credentials: </span>
                <span className="text-blue-600 dark:text-blue-400">true</span>
              </>
            )}
            <br />
            <span className="text-zinc-400">Access-Control-Allow-Methods: </span>
            <span className="text-violet-600 dark:text-violet-400">{allowedMethods.join(", ")}</span>
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
        <span className="text-[11px] text-zinc-500 flex-1 transition-all duration-500">{statusLabel}</span>
        {step > 0 && !running && (
          <button
            onClick={reset}
            className="text-xs px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-600 transition-all duration-300"
          >
            Reset
          </button>
        )}
        <button
          onClick={simulate}
          disabled={running}
          className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          Simulate
        </button>
      </div>
    </div>
  );
}
