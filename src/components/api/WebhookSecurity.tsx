"use client";

import { useState, useRef, useEffect } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { ShieldCheck, ShieldX, CheckCircle2, XCircle, Circle, Server, Lock } from "lucide-react";

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
type Mode = "valid" | "tampered";

function truncateSig(sig: string, len = 16) {
  return sig.length > len ? sig.slice(0, len) + "…" : sig;
}

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
  if (provider === "GitHub") return `sha256=${truncateSig(sig, 24)}`;
  return `t=${ts},v1=${truncateSig(sig, 16)}`;
}

export function WebhookSecurity({
  provider = "Stripe",
  payload = '{"type":"payment.succeeded","amount":4999}',
  signatureHeader = "Stripe-Signature",
  tampered = false,
}: WebhookSecurityProps) {
  const [step, setStep] = useState<number>(-1);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<"verified" | "rejected" | null>(null);
  const [mode, setMode] = useState<Mode>(tampered ? "tampered" : "valid");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isTampered = mode === "tampered";
  const computedSig = fakeComputedSig(provider);
  const receivedSig = fakeReceivedSig(provider, isTampered);
  const sigHeader = fakeSigHeader(provider, isTampered);
  const sigMatch = !isTampered;

  function runVerification() {
    if (running) return;
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
          }, 1200);
        }, 1200);
      }, 1200);
    }, 500);
  }

  function reset() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setStep(-1);
    setResult(null);
    setRunning(false);
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);
  useEffect(() => { reset(); }, [mode]);

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
          <div className="flex items-center gap-1 text-zinc-500">
            <Server className="size-3" /> POST /webhooks/{provider.toLowerCase()}
          </div>
          <div className="text-zinc-600 dark:text-zinc-300">
            <span className="text-violet-600 dark:text-violet-400">{signatureHeader}:</span> {sigHeader}
          </div>
          <div className="text-zinc-500 truncate">Body: {payload.slice(0, 48)}{payload.length > 48 ? "…" : ""}</div>
        </div>
      ),
    },
    {
      label: "Compute HMAC-SHA256",
      content: (
        <div className="space-y-1 font-mono text-[11px]">
          <div className="flex items-center gap-1 text-zinc-500">
            <Lock className="size-3" /> HMAC-SHA256(secret, timestamp + payload)
          </div>
          <div className="text-zinc-600 dark:text-zinc-300">= {truncateSig(computedSig, 20)}</div>
        </div>
      ),
    },
    {
      label: "Compare Signatures",
      content: (
        <div className="space-y-1 font-mono text-[11px]">
          <div><span className="text-zinc-500">Received: </span><span className={result === "rejected" ? "text-red-600" : "text-zinc-600"}>{truncateSig(receivedSig, 20)}</span></div>
          <div><span className="text-zinc-500">Computed: </span><span className="text-zinc-600">{truncateSig(computedSig, 20)}</span></div>
          {result !== null && (
            <div className={cn(
              "mt-1 px-2 py-1 rounded-md font-semibold text-xs transition-all duration-500",
              sigMatch ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700" : "bg-red-100 dark:bg-red-900/40 text-red-700"
            )}>
              {sigMatch ? "✓ MATCH — authentic" : "✗ MISMATCH — rejected"}
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-2 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800">
        <ShieldCheck className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex-1">Webhook Security — {provider}</span>
        {result !== null && (
          <span className={cn(
            "flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full transition-all duration-500",
            result === "verified" ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700" : "bg-red-100 dark:bg-red-900/40 text-red-700"
          )}>
            {result === "verified" ? <CheckCircle2 className="size-3" /> : <XCircle className="size-3" />}
            {result === "verified" ? "Verified" : "Rejected"}
          </span>
        )}
      </div>

      <div className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        Never trust webhook payloads — verify the HMAC signature before processing.
      </div>

      <div className="px-4 py-2 flex gap-1 border-b border-zinc-100 dark:border-zinc-800">
        {(["valid", "tampered"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              "px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all duration-500",
              mode === m
                ? m === "valid"
                  ? "bg-emerald-100 dark:bg-emerald-900/40 border-emerald-300 text-emerald-700"
                  : "bg-red-100 dark:bg-red-900/40 border-red-300 text-red-700"
                : "border-zinc-200 dark:border-zinc-700 text-zinc-500"
            )}
          >
            {m === "valid" ? "Valid signature" : "Tampered payload"}
          </button>
        ))}
      </div>

      <div className="min-h-[240px] px-4 py-4 space-y-2">
        {steps.map((s, i) => {
          const state = stepState(i);
          return (
            <div
              key={i}
              className={cn(
                "rounded-lg border p-3 transition-all duration-500",
                state === "active" ? "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/30" :
                state === "done" ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/10" :
                state === "error" ? "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/20" :
                "border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20"
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                {state === "active" ? <Circle className="size-3.5 text-blue-500 animate-pulse" /> :
                 state === "done" ? <CheckCircle2 className="size-3.5 text-emerald-500" /> :
                 state === "error" ? <XCircle className="size-3.5 text-red-500" /> :
                 <Circle className="size-3.5 text-zinc-300" />}
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Step {i + 1}: {s.label}</span>
              </div>
              <div className={cn("transition-opacity duration-500", state === "idle" ? "opacity-40" : "opacity-100")}>{s.content}</div>
            </div>
          );
        })}

        {result === "rejected" && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 transition-all duration-500">
            <ShieldX className="size-4 text-red-600 shrink-0" />
            <span className="text-sm font-bold text-red-700">REJECTED — signatures don&apos;t match</span>
          </div>
        )}
      </div>

      <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-3">
        <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">
          {result === "verified" ? "Request authenticated — safe to process" :
           result === "rejected" ? "Attack blocked — do not process payload" :
           `Mode: ${isTampered ? "tampered signature" : "valid signature"}`}
        </span>
        <button
          onClick={runVerification}
          disabled={running}
          className="flex items-center gap-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <ShieldCheck className="size-3.5" />
          Verify Signature
        </button>
      </div>
    </div>
  );
}
