"use client";

import { useState, useRef, useEffect } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Cable, Monitor, Server, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";

export const TcpHandshakeSchema = z.object({
  clientLabel: z.string().default("Browser"),
  serverLabel: z.string().default("Server"),
  serverIp: z.string().optional().default("93.184.216.34"),
  port: z.number().optional().default(443),
  interactive: z.boolean().optional().default(true),
});

export type TcpHandshakeProps = z.infer<typeof TcpHandshakeSchema>;

type Step = {
  packet: string;
  dir: "ltr" | "rtl";
  summary: string;
  description: string;
  clientState: string;
  serverState: string;
};

function buildSteps(clientLabel: string, serverLabel: string): Step[] {
  return [
    {
      packet: "SYN",
      dir: "ltr",
      summary: "I want to connect",
      description: `${clientLabel} says: "I want to connect! Starting with sequence number 1000."`,
      clientState: "SYN_SENT",
      serverState: "LISTEN",
    },
    {
      packet: "SYN-ACK",
      dir: "rtl",
      summary: "OK! Here's my sequence",
      description: `${serverLabel} replies: "OK! My sequence is 2000 — and I got your 1000 (confirming as 1001)."`,
      clientState: "SYN_SENT",
      serverState: "SYN_RCVD",
    },
    {
      packet: "ACK",
      dir: "ltr",
      summary: "Got it! Connection open!",
      description: `${clientLabel} confirms: "Got it! Acknowledging your 2001. Connection established!"`,
      clientState: "ESTABLISHED",
      serverState: "ESTABLISHED",
    },
  ];
}

function Arrow({ dir, visible, packet }: { dir: "ltr" | "rtl"; visible: boolean; packet: string }) {
  const isLtr = dir === "ltr";
  return (
    <div className="relative flex items-center gap-2 py-3">
      {/* Packet badge */}
      <div
        className={cn(
          "absolute top-1/2 -translate-y-1/2 z-10 transition-all duration-500",
          isLtr ? "left-1/2 -translate-x-1/2" : "left-1/2 -translate-x-1/2"
        )}
      >
        <span
          className={cn(
            "px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono shadow-sm transition-all duration-500",
            isLtr
              ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
              : "bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800"
          )}
        >
          {packet}
        </span>
      </div>

      {/* Arrow line */}
      <div className="w-full flex items-center relative h-6">
        <div
          className={cn(
            "absolute inset-y-1/2 h-px transition-all duration-700",
            isLtr ? "left-0 origin-left" : "right-0 origin-right",
            isLtr
              ? "bg-blue-400 dark:bg-blue-600"
              : "bg-violet-400 dark:bg-violet-600",
            visible ? "w-full scale-x-100" : "w-full scale-x-0"
          )}
          style={{
            transformOrigin: isLtr ? "left" : "right",
          }}
        />
        {/* Arrowhead */}
        <div
          className={cn(
            "absolute transition-all duration-700",
            isLtr ? "right-0" : "left-0",
            visible ? "opacity-100" : "opacity-0"
          )}
        >
          {isLtr ? (
            <span className="text-blue-400 dark:text-blue-600 text-xs leading-none">▶</span>
          ) : (
            <span className="text-violet-400 dark:text-violet-600 text-xs leading-none">◀</span>
          )}
        </div>
      </div>
    </div>
  );
}

export function TcpHandshake({
  clientLabel = "Browser",
  serverLabel = "Server",
  serverIp = "93.184.216.34",
  port = 443,
  interactive = true,
}: TcpHandshakeProps) {
  const steps = buildSteps(clientLabel, serverLabel);
  const [currentStep, setCurrentStep] = useState<number>(-1); // -1 = not started
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isConnected = currentStep >= steps.length - 1 && currentStep >= 0;
  const clientPort = 52341;

  function runAll() {
    if (running) return;
    setCurrentStep(-1);
    setRunning(true);
    let i = 0;
    setTimeout(() => setCurrentStep(0), 100);
    intervalRef.current = setInterval(() => {
      i++;
      if (i >= steps.length) {
        clearInterval(intervalRef.current!);
        setRunning(false);
        setCurrentStep(steps.length - 1);
      } else {
        setCurrentStep(i);
      }
    }, 1200);
  }

  function reset() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setCurrentStep(-1);
    setRunning(false);
  }

  function prev() {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  }

  function next() {
    if (currentStep < steps.length - 1) setCurrentStep((s) => s + 1);
    else if (currentStep === -1) setCurrentStep(0);
  }

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const step = currentStep >= 0 ? steps[currentStep] : null;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 h-11 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <Cable className="size-3.5 text-zinc-400 shrink-0" />
        <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex-1">TCP Handshake</span>

        {/* Step dots */}
        <div className="flex items-center gap-1.5">
          {steps.map((_, i) => (
            <span
              key={i}
              className={cn(
                "size-2 rounded-full transition-all duration-500",
                i < currentStep
                  ? "bg-emerald-500"
                  : i === currentStep
                  ? "bg-blue-500 scale-125"
                  : "bg-zinc-200 dark:bg-zinc-700"
              )}
            />
          ))}
        </div>

        {currentStep >= 0 && (
          <span className="text-[10px] font-mono text-zinc-400">
            {Math.min(currentStep + 1, steps.length)}/{steps.length}
          </span>
        )}

        {interactive && (
          <button
            onClick={isConnected ? reset : runAll}
            disabled={running}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {running ? <RefreshCw className="size-3 animate-spin" /> : <Cable className="size-3" />}
            {running ? "Connecting…" : isConnected ? "Reset" : "Connect"}
          </button>
        )}
      </div>

      {/* Actors */}
      <div className="flex items-stretch border-b border-zinc-100 dark:border-zinc-800">
        {/* Client actor */}
        <div className="flex-1 flex flex-col items-center justify-center py-3 gap-1">
          <div
            className={cn(
              "size-10 rounded-lg flex items-center justify-center transition-all duration-500",
              isConnected
                ? "bg-emerald-100 dark:bg-emerald-900/30 border-2 border-emerald-400 dark:border-emerald-600"
                : "bg-zinc-100 dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700"
            )}
          >
            <Monitor className={cn("size-5 transition-colors duration-500", isConnected ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-500 dark:text-zinc-400")} />
          </div>
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{clientLabel}</span>
          <span className="text-[10px] font-mono text-zinc-400">:{clientPort}</span>
          {isConnected && (
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
              Connected
            </span>
          )}
        </div>

        {/* Arrow area */}
        <div className="flex-[2] px-4 py-2 flex flex-col justify-center">
          {currentStep === -1 ? (
            <div className="flex items-center justify-center h-full min-h-[80px]">
              <p className="text-xs text-zinc-400 text-center">
                {interactive ? 'Click "Connect" to animate' : "TCP 3-way handshake"}
              </p>
            </div>
          ) : step ? (
            <div>
              <div className="text-[10px] font-mono text-zinc-400 text-center mb-1">
                Step {currentStep + 1} of {steps.length}: <span className="font-bold text-zinc-600 dark:text-zinc-300">{step.packet}</span>
              </div>
              <Arrow dir={step.dir} visible={true} packet={step.packet} />
            </div>
          ) : null}
        </div>

        {/* Server actor */}
        <div className="flex-1 flex flex-col items-center justify-center py-3 gap-1">
          <div
            className={cn(
              "size-10 rounded-lg flex items-center justify-center transition-all duration-500",
              isConnected
                ? "bg-emerald-100 dark:bg-emerald-900/30 border-2 border-emerald-400 dark:border-emerald-600"
                : "bg-zinc-100 dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700"
            )}
          >
            <Server className={cn("size-5 transition-colors duration-500", isConnected ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-500 dark:text-zinc-400")} />
          </div>
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{serverLabel}</span>
          <span className="text-[10px] font-mono text-zinc-400">:{port}</span>
          {isConnected && (
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
              Connected
            </span>
          )}
        </div>
      </div>

      {/* Step description + states */}
      <div className="min-h-[120px] px-4 py-3 flex flex-col gap-2">
        {step ? (
          <>
            <div className="border border-zinc-100 dark:border-zinc-800 rounded-lg p-3 bg-zinc-50 dark:bg-zinc-800/50 transition-all duration-500">
              <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-snug">{step.description}</p>
            </div>
            <div className="flex gap-2 text-[10px] font-mono">
              <span className="px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
                {clientLabel}: {step.clientState}
              </span>
              <span className="px-2 py-1 rounded bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-800">
                {serverLabel}: {step.serverState}
              </span>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-zinc-400">After 3 steps: reliable channel established</p>
          </div>
        )}

        {isConnected && (
          <div className="mt-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 transition-all duration-500">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              Reliable channel established — {serverIp}:{port}
            </span>
          </div>
        )}
      </div>

      {/* Manual controls + footer */}
      {interactive && !running && (
        <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-2.5 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/30">
          <p className="text-[10px] text-zinc-400">After 3 steps: reliable channel established</p>
          <div className="flex items-center gap-1">
            <button
              onClick={prev}
              disabled={currentStep <= 0}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 disabled:opacity-30 transition-opacity"
            >
              <ChevronLeft className="size-3.5" />
            </button>
            <button
              onClick={next}
              disabled={currentStep >= steps.length - 1}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 disabled:opacity-30 transition-opacity"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
