"use client";

import { useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import {
  Lock,
  RefreshCw,
  Monitor,
  Server,
  ShieldCheck,
  Key,
  FileBadge,
} from "lucide-react";

export const MtlsHandshakeSchema = z.object({
  name: z.string().optional().default("Mutual TLS Handshake"),
  clientName: z.string().optional().default("payments-service"),
  serverName: z.string().optional().default("api.internal"),
  interactive: z.boolean().optional().default(true),
});

export type MtlsHandshakeProps = z.infer<typeof MtlsHandshakeSchema>;

type StepId = "hello" | "server-cert" | "client-cert" | "verify" | "secure";

const STEPS: { id: StepId; title: string; description: string }[] = [
  {
    id: "hello",
    title: "Hello + request certs",
    description: "Both sides agree on TLS and ask for each other's certificates.",
  },
  {
    id: "server-cert",
    title: "Server presents cert",
    description: "The server sends its certificate so the client knows who it's talking to.",
  },
  {
    id: "client-cert",
    title: "Client presents cert",
    description: "The client sends its own certificate — this is what makes it mutual.",
  },
  {
    id: "verify",
    title: "Both verify identity",
    description: "Each side checks the other's certificate against a trusted CA list.",
  },
  {
    id: "secure",
    title: "Encrypted channel",
    description: "Both identities confirmed — traffic is encrypted in both directions.",
  },
];

function CertCard({
  label,
  subject,
  verified,
  active,
}: {
  label: string;
  subject: string;
  verified: boolean;
  active: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-2.5 transition-all duration-500 min-w-[120px]",
        active
          ? "border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 ring-2 ring-amber-400/50"
          : verified
            ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/20"
            : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/40"
      )}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <FileBadge className="size-3 text-zinc-400" />
        <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">{label}</span>
      </div>
      <div className="text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-300 truncate">{subject}</div>
      {verified && (
        <div className="flex items-center gap-1 mt-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
          <ShieldCheck className="size-3" />
          Verified
        </div>
      )}
    </div>
  );
}

export function MtlsHandshake({
  name = "Mutual TLS Handshake",
  clientName = "payments-service",
  serverName = "api.internal",
  interactive = true,
}: MtlsHandshakeProps) {
  const [stepIndex, setStepIndex] = useState(-1);

  const currentStep = stepIndex >= 0 ? STEPS[stepIndex] : null;
  const isDone = stepIndex >= STEPS.length - 1;
  const stepId = currentStep?.id;

  const clientVerified = stepId === "verify" || stepId === "secure";
  const serverVerified = stepId === "verify" || stepId === "secure";
  const clientCertSent = ["client-cert", "verify", "secure"].includes(stepId ?? "");
  const serverCertSent = ["server-cert", "client-cert", "verify", "secure"].includes(stepId ?? "");
  const encrypted = stepId === "secure";

  function advance() {
    if (isDone) {
      setStepIndex(-1);
      return;
    }
    setStepIndex((i) => i + 1);
  }

  function reset() {
    setStepIndex(-1);
  }

  const footerStatus =
    stepIndex < 0
      ? "Regular TLS only verifies the server — mTLS verifies both sides."
      : isDone
        ? "Both identities confirmed. Only trusted services can connect."
        : currentStep?.description ?? "";

  return (
    <div
      className={cn(
        "rounded-xl border bg-white dark:bg-zinc-950 overflow-hidden transition-all duration-500",
        encrypted ? "border-emerald-300 dark:border-emerald-800" : "border-zinc-200 dark:border-zinc-800"
      )}
    >
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/50">
        <Lock className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">{name}</span>
        <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">mTLS</span>
        {interactive && (
          <button
            type="button"
            onClick={reset}
            className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all duration-500"
          >
            <RefreshCw className="size-3.5" />
          </button>
        )}
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-900">
        Regular TLS checks only the server. mTLS makes both sides show certificates — only trusted services can connect.
      </p>

      <div className="p-4 min-h-[280px] flex flex-col justify-center gap-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col items-center gap-2 shrink-0">
            <div
              className={cn(
                "size-12 rounded-xl border-2 flex items-center justify-center transition-all duration-500",
                clientCertSent
                  ? "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/30"
                  : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900"
              )}
            >
              <Monitor className="size-5 text-blue-500" />
            </div>
            <span className="text-[10px] font-mono text-zinc-500">{clientName}</span>
            {clientCertSent && (
              <CertCard
                label="Client cert"
                subject={clientName}
                verified={clientVerified}
                active={stepId === "client-cert"}
              />
            )}
          </div>

          <div className="flex-1 flex flex-col items-center gap-2 px-2">
            <div className="relative w-full h-8 flex items-center">
              <div
                className={cn(
                  "absolute inset-y-3 left-0 right-0 rounded-full transition-all duration-700",
                  encrypted
                    ? "bg-emerald-200 dark:bg-emerald-900/50"
                    : stepIndex >= 0
                      ? "bg-amber-100 dark:bg-amber-900/30"
                      : "bg-zinc-100 dark:bg-zinc-800"
                )}
              />
              {stepId === "hello" && (
                <div
                  className="absolute top-1/2 -translate-y-1/2 size-2.5 rounded-full bg-blue-500"
                  style={{ animation: "travelRight 1s ease-in-out infinite alternate" }}
                />
              )}
              {stepId === "server-cert" && (
                <div
                  className="absolute top-1/2 -translate-y-1/2 size-2.5 rounded-full bg-violet-500"
                  style={{ animation: "travelLeft 1s ease-in-out infinite alternate", right: "10%" }}
                />
              )}
              {stepId === "client-cert" && (
                <div
                  className="absolute top-1/2 -translate-y-1/2 size-2.5 rounded-full bg-blue-500"
                  style={{ animation: "travelRight 1s ease-in-out infinite alternate", left: "10%" }}
                />
              )}
              {encrypted && (
                <div className="absolute inset-0 flex items-center justify-center gap-1.5">
                  <Lock className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">Encrypted</span>
                </div>
              )}
            </div>
            <div className="text-center min-h-[36px]">
              {currentStep ? (
                <>
                  <div className="text-[10px] font-mono text-zinc-400 mb-0.5">
                    Step {stepIndex + 1}/{STEPS.length}
                  </div>
                  <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{currentStep.title}</div>
                </>
              ) : (
                <span className="text-xs text-zinc-400">Click Start Handshake to walk through each step</span>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 shrink-0">
            <div
              className={cn(
                "size-12 rounded-xl border-2 flex items-center justify-center transition-all duration-500",
                serverCertSent
                  ? "border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-950/30"
                  : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900"
              )}
            >
              <Server className="size-5 text-violet-500" />
            </div>
            <span className="text-[10px] font-mono text-zinc-500">{serverName}</span>
            {serverCertSent && (
              <CertCard
                label="Server cert"
                subject={serverName}
                verified={serverVerified}
                active={stepId === "server-cert"}
              />
            )}
          </div>
        </div>

        <div className="grid grid-cols-5 gap-1.5">
          {STEPS.map((step, i) => (
            <div
              key={step.id}
              className={cn(
                "h-1.5 rounded-full transition-all duration-500",
                i <= stepIndex ? "bg-emerald-500" : "bg-zinc-100 dark:bg-zinc-800"
              )}
            />
          ))}
        </div>

        <div className="flex items-center justify-center gap-4 text-[10px]">
          <div className="flex items-center gap-1 text-zinc-400">
            <Key className="size-3" />
            <span>Server cert only = TLS</span>
          </div>
          <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
            <Lock className="size-3" />
            <span>Both certs = mTLS</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes travelRight {
          from { left: 5%; opacity: 1; }
          to { left: 85%; opacity: 0.6; }
        }
        @keyframes travelLeft {
          from { right: 5%; opacity: 1; }
          to { right: 85%; opacity: 0.6; }
        }
      `}</style>

      {interactive && (
        <div className="border-t border-zinc-100 dark:border-zinc-900 px-4 py-3 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/30 min-h-[52px]">
          <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">{footerStatus}</span>
          <button
            type="button"
            onClick={advance}
            className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-all duration-500 shrink-0"
          >
            {stepIndex < 0 ? "Start Handshake" : isDone ? "Restart" : "Next Step"}
          </button>
        </div>
      )}
    </div>
  );
}
