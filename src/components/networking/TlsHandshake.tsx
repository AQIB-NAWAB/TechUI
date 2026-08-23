"use client";

import { useState, useEffect, useRef } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Handshake, Key, ShieldCheck, Lock, RefreshCw, Monitor, Server, ChevronDown } from "lucide-react";

export const TlsHandshakeSchema = z.object({
  version: z.enum(["TLS 1.2", "TLS 1.3"]).optional().default("TLS 1.3"),
  cipher: z.string().optional().default("TLS_AES_128_GCM_SHA256"),
  serverName: z.string().optional().default("api.example.com"),
  interactive: z.boolean().optional().default(true),
});

export type TlsHandshakeProps = z.infer<typeof TlsHandshakeSchema>;

type StepDir = "client-to-server" | "server-to-client" | "client-internal" | "both";

type HandshakeStep = {
  id: number;
  title: string;
  dir: StepDir;
  icon: React.ReactNode;
  description: string;
  techDetails: string;
};

function buildSteps(version: string, cipher: string, serverName: string): HandshakeStep[] {
  return [
    {
      id: 1,
      title: "Say Hello",
      dir: "client-to-server",
      icon: <Handshake className="size-6" />,
      description: "Your browser tells the server which TLS versions and cipher suites it supports.",
      techDetails: `ClientHello: supported_versions=[${version}], key_share=[X25519], cipher_suites=[${cipher}], SNI=${serverName}`,
    },
    {
      id: 2,
      title: "Share Keys",
      dir: "server-to-client",
      icon: <Key className="size-6" />,
      description: "The server sends its certificate and agrees on which cipher to use.",
      techDetails: `ServerHello: cipher_suite=${cipher}, key_share=[X25519]\nCertificate: subject=*.${serverName}, issuer=Let's Encrypt\nServerFinished: HMAC over handshake`,
    },
    {
      id: 3,
      title: "Verify",
      dir: "client-internal",
      icon: <ShieldCheck className="size-6" />,
      description: "The browser checks that the certificate is signed by a trusted Certificate Authority.",
      techDetails: `Verify cert chain: ${serverName} → Let's Encrypt R3 → ISRG Root X1\nCheck expiry, hostname match, revocation (OCSP)\nDerive session keys using HKDF`,
    },
    {
      id: 4,
      title: "Encrypted!",
      dir: "both",
      icon: <Lock className="size-6" />,
      description: "Both sides now share the same secret key. All traffic is encrypted end-to-end.",
      techDetails: `ClientFinished: HMAC over handshake\nApplication data encrypted with ${cipher}\nConnection: 1-RTT, forward secrecy via ephemeral X25519`,
    },
  ];
}

function TechDetails({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors duration-500"
      >
        <ChevronDown className={cn("size-3 transition-transform duration-500", open && "rotate-180")} />
        Technical details
      </button>
      {open && (
        <pre className="mt-1.5 text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800 rounded p-2 text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
          {text}
        </pre>
      )}
    </div>
  );
}

function StepRow({
  step,
  active,
  done,
  isLast,
}: {
  step: HandshakeStep;
  active: boolean;
  done: boolean;
  isLast: boolean;
}) {
  const visible = active || done;

  return (
    <div
      className={cn(
        "transition-all duration-500",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
      )}
    >
      <div
        className={cn(
          "flex items-start gap-3 p-3 rounded-lg border-2 transition-all duration-500",
          active
            ? "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/30"
            : done
            ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/10"
            : "border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900"
        )}
      >
        {/* Icon */}
        <div
          className={cn(
            "shrink-0 size-10 rounded-lg flex items-center justify-center transition-all duration-500",
            active
              ? "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400"
              : done
              ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
          )}
        >
          {step.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono text-zinc-400">Step {step.id}</span>
            <span
              className={cn(
                "text-sm font-bold transition-colors duration-500",
                active ? "text-blue-700 dark:text-blue-300" : done ? "text-emerald-700 dark:text-emerald-300" : "text-zinc-600 dark:text-zinc-400"
              )}
            >
              {step.title}
              {isLast && done && " 🔒"}
            </span>
            {/* Direction arrow */}
            <span
              className={cn(
                "text-[10px] px-1.5 py-0.5 rounded font-mono shrink-0 transition-colors duration-500",
                step.dir === "client-to-server"
                  ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"
                  : step.dir === "server-to-client"
                  ? "bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400"
                  : step.dir === "client-internal"
                  ? "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400"
                  : "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400"
              )}
            >
              {step.dir === "client-to-server" && "Client → Server"}
              {step.dir === "server-to-client" && "Server → Client"}
              {step.dir === "client-internal" && "Client verifies"}
              {step.dir === "both" && "↔ Encrypted"}
            </span>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-snug">{step.description}</p>
          {visible && <TechDetails text={step.techDetails} />}
        </div>
      </div>
      {!isLast && (
        <div
          className={cn(
            "ml-8 w-px h-3 my-0.5 transition-colors duration-500",
            done ? "bg-emerald-300 dark:bg-emerald-700" : "bg-zinc-200 dark:bg-zinc-700"
          )}
        />
      )}
    </div>
  );
}

export function TlsHandshake({
  version = "TLS 1.3",
  cipher = "TLS_AES_128_GCM_SHA256",
  serverName = "api.example.com",
  interactive = true,
}: TlsHandshakeProps) {
  const steps = buildSteps(version, cipher, serverName);
  const [activeStep, setActiveStep] = useState<number>(interactive ? -1 : steps.length - 1);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const done = activeStep >= steps.length - 1 && activeStep >= 0;

  function run() {
    if (running) return;
    setActiveStep(-1);
    setRunning(true);
    let i = 0;
    setActiveStep(0);
    intervalRef.current = setInterval(() => {
      i++;
      if (i >= steps.length) {
        clearInterval(intervalRef.current!);
        setRunning(false);
        setActiveStep(steps.length - 1);
      } else {
        setActiveStep(i);
      }
    }, 1200);
  }

  function reset() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setActiveStep(-1);
    setRunning(false);
  }

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/50">
        <Lock className="size-3.5 text-zinc-400 shrink-0" />
        <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex-1">{serverName}</span>
        <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
          {version}
        </span>
        {interactive && (
          <button
            onClick={done ? reset : run}
            disabled={running}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all duration-500 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 disabled:opacity-50"
          >
            {running ? <RefreshCw className="size-3 animate-spin" /> : done ? <RefreshCw className="size-3" /> : <ShieldCheck className="size-3" />}
            {running ? "Handshaking…" : done ? "Reset" : "Simulate"}
          </button>
        )}
      </div>

      {/* Participants */}
      <div className="flex items-center border-b border-zinc-100 dark:border-zinc-900">
        <div className="flex-1 flex items-center justify-center gap-2 py-3">
          <Monitor className="size-4 text-blue-500" />
          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">Client</span>
        </div>
        <div className="text-zinc-200 dark:text-zinc-700 text-lg select-none">⇌</div>
        <div className="flex-1 flex items-center justify-center gap-2 py-3">
          <Server className="size-4 text-violet-500" />
          <span className="text-xs font-semibold text-violet-600 dark:text-violet-400">Server</span>
        </div>
      </div>

      {/* Steps — fixed min height to prevent layout shift */}
      <div className="px-4 py-4 min-h-[320px] space-y-0.5">
        {activeStep === -1 && !running && (
          <div className="flex items-center justify-center h-full min-h-[260px]">
            <p className="text-xs text-zinc-400">
              {interactive ? 'Click "Simulate" to animate the TLS handshake' : "TLS Handshake steps"}
            </p>
          </div>
        )}
        {steps.map((step, i) => (
          <StepRow
            key={step.id}
            step={step}
            active={activeStep === i}
            done={activeStep > i || (!interactive && i <= activeStep)}
            isLast={i === steps.length - 1}
          />
        ))}
      </div>

      {/* Footer */}
      <div
        className={cn(
          "border-t px-4 py-3 flex items-center gap-3 transition-all duration-700",
          done
            ? "border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/10"
            : "border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/20"
        )}
      >
        {done ? (
          <>
            <Lock className="size-4 text-emerald-500 shrink-0" />
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex-1">
              Encrypted tunnel established
            </span>
            <code className="text-[10px] font-mono text-emerald-600 dark:text-emerald-500 truncate max-w-[160px]">{cipher}</code>
          </>
        ) : (
          <p className="text-[11px] text-zinc-400">
            {running ? `Step ${activeStep + 1} of ${steps.length} — handshaking…` : "TLS handshake not started"}
          </p>
        )}
      </div>
    </div>
  );
}
