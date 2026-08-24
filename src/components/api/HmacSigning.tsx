"use client";

import { useState, useMemo } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { KeyRound, RefreshCw, CheckCircle2, XCircle, ArrowRight } from "lucide-react";

export const HmacSigningSchema = z.object({
  name: z.string().optional().default("Payment API Signing"),
  algorithm: z.enum(["HMAC-SHA256", "HMAC-SHA512"]).optional().default("HMAC-SHA256"),
  secretKey: z.string().optional().default("sk_live_a1b2c3d4e5f6"),
  method: z.enum(["GET", "POST", "PUT", "DELETE"]).optional().default("POST"),
  path: z.string().optional().default("/v1/payments"),
  body: z.string().optional().default('{"amount":4999,"currency":"usd"}'),
  timestamp: z.string().optional().default("1716239022"),
  interactive: z.boolean().optional().default(true),
});

export type HmacSigningProps = z.infer<typeof HmacSigningSchema>;

type Step = "canonical" | "hmac" | "header" | "verify";

function fakeHash(input: string, algo: string): string {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = ((h << 5) - h + input.charCodeAt(i)) | 0;
  const hex = Math.abs(h).toString(16).padStart(8, "0");
  const prefix = algo.includes("512") ? "sha512" : "sha256";
  return `${prefix}=${hex.repeat(4).slice(0, 64)}`;
}

function buildCanonicalString(method: string, path: string, timestamp: string, body: string): string {
  return `${method}\n${path}\n${timestamp}\n${body}`;
}

export function HmacSigning({
  name = "Payment API Signing",
  algorithm = "HMAC-SHA256",
  secretKey = "sk_live_a1b2c3d4e5f6",
  method = "POST",
  path = "/v1/payments",
  body = '{"amount":4999,"currency":"usd"}',
  timestamp = "1716239022",
  interactive = true,
}: HmacSigningProps) {
  const [step, setStep] = useState<Step | null>(null);
  const [running, setRunning] = useState(false);
  const [tampered, setTampered] = useState(false);
  const [verifyResult, setVerifyResult] = useState<"match" | "mismatch" | null>(null);
  const [flash, setFlash] = useState<"ok" | "fail" | null>(null);

  const canonical = useMemo(
    () => buildCanonicalString(method, path, timestamp, body),
    [method, path, timestamp, body]
  );
  const signature = useMemo(() => fakeHash(canonical + secretKey, algorithm), [canonical, secretKey, algorithm]);
  const headerValue = `t=${timestamp},v1=${signature.slice(signature.indexOf("=") + 1, signature.indexOf("=") + 17)}…`;

  const steps: { id: Step; label: string; detail: string }[] = [
    { id: "canonical", label: "Build canonical string", detail: canonical.replace(/\n/g, " ↵ ") },
    { id: "hmac", label: `Compute ${algorithm}`, detail: signature },
    { id: "header", label: "Attach signature header", detail: `Authorization: ${headerValue}` },
    { id: "verify", label: "Server verifies HMAC", detail: tampered ? "Signature mismatch — request rejected" : "Signatures match — request accepted" },
  ];

  function runSigning() {
    if (running) return;
    setRunning(true);
    setStep(null);
    setVerifyResult(null);
    setFlash(null);

    const order: Step[] = ["canonical", "hmac", "header", "verify"];
    order.forEach((s, i) => {
      setTimeout(() => {
        setStep(s);
        if (s === "verify") {
          const result = tampered ? "mismatch" : "match";
          setVerifyResult(result);
          setFlash(result === "match" ? "ok" : "fail");
          setRunning(false);
          setTimeout(() => setFlash(null), 700);
        }
      }, i * 900);
    });
  }

  function reset() {
    setStep(null);
    setRunning(false);
    setVerifyResult(null);
    setFlash(null);
    setTampered(false);
  }

  function toggleTamper() {
    setTampered((t) => !t);
    setStep(null);
    setVerifyResult(null);
    setFlash(null);
  }

  const stepIndex = step ? steps.findIndex((s) => s.id === step) : -1;

  return (
    <div
      className={cn(
        "rounded-xl border bg-white dark:bg-zinc-900 overflow-hidden transition-all duration-500",
        flash === "fail" ? "border-red-300 dark:border-red-800" : flash === "ok" ? "border-emerald-300 dark:border-emerald-800" : "border-zinc-200 dark:border-zinc-800"
      )}
    >
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <KeyRound className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">{name}</span>
        <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">{algorithm}</span>
        {interactive && (
          <button type="button" onClick={reset} className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all duration-500">
            <RefreshCw className="size-3.5" />
          </button>
        )}
      </div>

      <div className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        Sign each request with a shared secret — the server recomputes the HMAC to verify nothing was tampered with.
      </div>

      <div className="p-4 min-h-[220px] space-y-4">
        {/* Request preview */}
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg px-3 py-2">
            <div className="text-zinc-400">Request</div>
            <div className="font-mono font-bold text-zinc-700 dark:text-zinc-300 mt-0.5">
              {method} {path}
            </div>
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg px-3 py-2">
            <div className="text-zinc-400">Secret key</div>
            <div className="font-mono font-bold text-zinc-700 dark:text-zinc-300 mt-0.5 truncate">
              {secretKey.slice(0, 8)}…{secretKey.slice(-4)}
            </div>
          </div>
        </div>

        {/* Signing pipeline */}
        <div className="space-y-2">
          {steps.map((s, i) => {
            const isActive = step === s.id;
            const isDone = stepIndex > i || (step === "verify" && verifyResult !== null);
            const isError = s.id === "verify" && verifyResult === "mismatch";

            return (
              <div
                key={s.id}
                className={cn(
                  "flex items-start gap-3 px-3 py-2.5 rounded-lg border transition-all duration-500",
                  isActive && "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/20 ring-1 ring-blue-200 dark:ring-blue-800",
                  isDone && !isError && "border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/10",
                  isError && "border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/10",
                  !isActive && !isDone && "border-zinc-100 dark:border-zinc-800"
                )}
              >
                <div className="mt-0.5 shrink-0">
                  {isDone && !isError ? (
                    <CheckCircle2 className="size-4 text-emerald-500" />
                  ) : isError ? (
                    <XCircle className="size-4 text-red-500" />
                  ) : isActive ? (
                    <ArrowRight className="size-4 text-blue-500 animate-pulse" />
                  ) : (
                    <div className="size-4 rounded-full border-2 border-zinc-200 dark:border-zinc-700" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">{s.label}</div>
                  {(isActive || isDone) && (
                    <div className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 mt-0.5 break-all">{s.detail}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {interactive && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTamper}
              className={cn(
                "text-[10px] px-2.5 py-1 rounded-full font-semibold transition-all duration-500",
                tampered
                  ? "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-zinc-200 dark:border-zinc-700"
              )}
            >
              {tampered ? "Tampered payload ON" : "Simulate tampered payload"}
            </button>
          </div>
        )}
      </div>

      {interactive && (
        <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/30 min-h-[52px]">
          <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">
            {flash === "fail"
              ? "HMAC mismatch! Server rejects the request."
              : flash === "ok"
              ? "Signature verified — request authenticated."
              : "Walk through canonical string → HMAC → header → server verification."}
          </span>
          <button
            type="button"
            onClick={runSigning}
            disabled={running}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-500 shrink-0 hover:opacity-90 disabled:opacity-50",
              flash === "fail"
                ? "bg-red-500 text-white"
                : "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
            )}
          >
            {running ? "Signing…" : "Sign Request"}
          </button>
        </div>
      )}
    </div>
  );
}
