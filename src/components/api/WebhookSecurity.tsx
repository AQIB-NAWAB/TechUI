"use client";

import { useState, useRef, useEffect } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { ShieldCheck, ShieldX, RefreshCw, CheckCircle2, XCircle, Circle } from "lucide-react";

export const WebhookSecuritySchema = z.object({
  provider: z.string().default("Stripe"),
  secretKey: z.string().default("whsec_test_secret"),
  payload: z.string().default('{"type":"payment.succeeded","amount":4999}'),
  signatureHeader: z.string().default("Stripe-Signature"),
  verified: z.boolean().default(true),
  tampered: z.boolean().optional().default(false),
});

export type WebhookSecurityProps = z.infer<typeof WebhookSecuritySchema>;

type StepState = "idle" | "active" | "done" | "error";

function truncateSig(sig: string, len = 16) {
  return sig.length > len ? sig.slice(0, len) + "…" : sig;
}

// Deterministic fake signature based on provider
function fakeComputedSig(provider: string) {
  const map: Record<string, string> = {
    Stripe: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6",
    GitHub: "3f8a2b1c9d4e5f6a7b8c9d0e1f2a3b4c",
  };
  return map[provider] ?? "c9d4e5f6a7b8c3d4e5f6a1b2c3d4e5f6";
}

function fakeReceivedSig(provider: string, tampered: boolean) {
  const real = fakeComputedSig(provider);
  if (!tampered) return real;
  return "DEADBEEF00000000000000000000BAD1";
}

function fakeSigHeader(provider: string, tampered: boolean) {
  const ts = "1716239022";
  const sig = fakeReceivedSig(provider, tampered);
  if (provider === "GitHub") {
    return `sha256=${truncateSig(sig, 24)}`;
  }
  return `t=${ts},v1=${truncateSig(sig, 16)}`;
}

export function WebhookSecurity({
  provider = "Stripe",
  payload = '{"type":"payment.succeeded","amount":4999}',
  signatureHeader = "Stripe-Signature",
  tampered = false,
}: WebhookSecurityProps) {
  const [step, setStep] = useState<number>(-1); // -1 = idle, 0,1,2 = active step
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<"verified" | "rejected" | null>(null);
  const [currentTampered, setCurrentTampered] = useState(tampered);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const computedSig = fakeComputedSig(provider);
  const receivedSig = fakeReceivedSig(provider, currentTampered);
  const sigHeader = fakeSigHeader(provider, currentTampered);
  const sigMatch = !currentTampered;

  function runVerification(isTampered: boolean) {
    if (running) return;
    setCurrentTampered(isTampered);
    setStep(-1);
    setResult(null);
    setRunning(true);

    timerRef.current = setTimeout(() => {
      setStep(0);
      timerRef.current = setTimeout(() => {
        setStep(1);
        timerRef.current = setTimeout(() => {
          setStep(2);
          timerRef.current = setTimeout(() => {
            setResult(isTampered ? "rejected" : "verified");
            setRunning(false);
          }, 800);
        }, 800);
      }, 800);
    }, 300);
  }

  function reset() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setStep(-1);
    setResult(null);
    setRunning(false);
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  function stepState(idx: number): StepState {
    if (step === -1 && result === null) return "idle";
    if (step === idx && running) return "active";
    if (step > idx || result !== null) return idx === 2 && result === "rejected" ? "error" : "done";
    return "idle";
  }

  const steps = [
    {
      label: "Incoming Request",
      content: (
        <div className="space-y-1 font-mono text-[11px]">
          <div className="text-zinc-500 dark:text-zinc-400">
            POST /webhooks/{provider.toLowerCase()}
          </div>
          <div className="text-zinc-600 dark:text-zinc-300">
            <span className="text-violet-600 dark:text-violet-400">{signatureHeader}:</span>{" "}
            {sigHeader}
          </div>
          <div className="text-zinc-500 dark:text-zinc-400 truncate">
            Body: {payload.slice(0, 48)}{payload.length > 48 ? "…" : ""}
          </div>
        </div>
      ),
    },
    {
      label: "Extract + Compute HMAC-SHA256",
      content: (
        <div className="space-y-1 font-mono text-[11px]">
          <div className="text-zinc-500 dark:text-zinc-400">
            HMAC-SHA256(secret, timestamp + &ldquo;.&rdquo; + payload)
          </div>
          <div className="text-zinc-600 dark:text-zinc-300">
            = {truncateSig(computedSig, 20)}{" "}
            <span className="text-emerald-500">✓</span>
          </div>
        </div>
      ),
    },
    {
      label: "Compare Signatures",
      content: (
        <div className="space-y-1.5 font-mono text-[11px]">
          <div className="flex items-center gap-2">
            <span className="text-zinc-500 dark:text-zinc-400 w-16 shrink-0">Received:</span>
            <span
              className={cn(
                "transition-colors duration-500",
                result === "rejected"
                  ? "text-red-600 dark:text-red-400"
                  : "text-zinc-600 dark:text-zinc-300"
              )}
            >
              {truncateSig(receivedSig, 20)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-zinc-500 dark:text-zinc-400 w-16 shrink-0">Computed:</span>
            <span className="text-zinc-600 dark:text-zinc-300">{truncateSig(computedSig, 20)}</span>
          </div>
          {result !== null && (
            <div
              className={cn(
                "mt-1 px-2 py-1.5 rounded-md font-semibold text-xs transition-all duration-500",
                sigMatch
                  ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                  : "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"
              )}
            >
              {sigMatch
                ? "✓ MATCH — request is authentic"
                : "✗ MISMATCH — signatures don't match!"}
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
        <ShieldCheck className="size-3.5 text-zinc-400 shrink-0" />
        <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex-1">
          Webhook Security — {provider}
        </span>
        {result !== null && (
          <span
            className={cn(
              "flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full transition-all duration-500",
              result === "verified"
                ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                : "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"
            )}
          >
            {result === "verified" ? (
              <CheckCircle2 className="size-3" />
            ) : (
              <XCircle className="size-3" />
            )}
            {result === "verified" ? "Verified" : "Rejected"}
          </span>
        )}
      </div>

      {/* Steps */}
      <div className="px-4 py-4 min-h-[260px] space-y-3">
        {steps.map((s, i) => {
          const state = stepState(i);
          return (
            <div
              key={i}
              className={cn(
                "rounded-lg border-2 p-3 transition-all duration-500",
                state === "active"
                  ? "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/30"
                  : state === "done"
                  ? "border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/10"
                  : state === "error"
                  ? "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/20"
                  : "border-zinc-100 dark:border-zinc-800"
              )}
            >
              <div className="flex items-center gap-2 mb-1.5">
                {state === "active" ? (
                  <Circle className="size-3.5 text-blue-500 animate-pulse" />
                ) : state === "done" ? (
                  <CheckCircle2 className="size-3.5 text-emerald-500" />
                ) : state === "error" ? (
                  <XCircle className="size-3.5 text-red-500" />
                ) : (
                  <Circle className="size-3.5 text-zinc-300 dark:text-zinc-600" />
                )}
                <span
                  className={cn(
                    "text-xs font-semibold transition-colors duration-500",
                    state === "active"
                      ? "text-blue-700 dark:text-blue-300"
                      : state === "done"
                      ? "text-emerald-700 dark:text-emerald-300"
                      : state === "error"
                      ? "text-red-700 dark:text-red-300"
                      : "text-zinc-600 dark:text-zinc-400"
                  )}
                >
                  Step {i + 1}: {s.label}
                </span>
              </div>
              <div
                className={cn(
                  "transition-all duration-500",
                  state === "idle" ? "opacity-40" : "opacity-100"
                )}
              >
                {s.content}
              </div>
            </div>
          );
        })}

        {/* Big result banner */}
        {result === "rejected" && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 transition-all duration-500">
            <ShieldX className="size-4 text-red-600 dark:text-red-400 shrink-0" />
            <span className="text-sm font-bold text-red-700 dark:text-red-300">
              REJECTED — signatures don&rsquo;t match!
            </span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900/40">
        <button
          onClick={() => runVerification(false)}
          disabled={running}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-500",
            "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 disabled:opacity-50"
          )}
        >
          {running && !currentTampered ? (
            <RefreshCw className="size-3 animate-spin" />
          ) : (
            <ShieldCheck className="size-3" />
          )}
          Verify Valid
        </button>
        <button
          onClick={() => runVerification(true)}
          disabled={running}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-500",
            "border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-50"
          )}
        >
          {running && currentTampered ? (
            <RefreshCw className="size-3 animate-spin" />
          ) : (
            <ShieldX className="size-3" />
          )}
          Test Tampered
        </button>
        {result !== null && (
          <button
            onClick={reset}
            className="ml-auto flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors duration-500"
          >
            <RefreshCw className="size-3" /> Reset
          </button>
        )}
      </div>

      {/* Footer insight */}
      <div className="border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2">
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
          Never accept webhook data without verifying the signature
        </p>
      </div>
    </div>
  );
}
