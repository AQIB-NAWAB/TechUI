"use client";

import { useState, useRef, useEffect } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Cable, Monitor, Server, RefreshCw } from "lucide-react";

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
      description: `${serverLabel} replies: "OK! My sequence is 2000 — confirming your 1000 (as 1001)."`,
      clientState: "SYN_SENT",
      serverState: "SYN_RCVD",
    },
    {
      packet: "ACK",
      dir: "ltr",
      summary: "Got it! Connection open!",
      description: `${clientLabel} confirms: "Acknowledging your 2001. Connection established!"`,
      clientState: "ESTABLISHED",
      serverState: "ESTABLISHED",
    },
  ];
}

function PacketArrow({ dir, active, packet }: { dir: "ltr" | "rtl"; active: boolean; packet: string }) {
  const isLtr = dir === "ltr";
  return (
    <div className="relative py-4">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
        <span className={cn(
          "px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono border transition-all duration-500",
          isLtr
            ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
            : "bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800",
          active && "scale-110"
        )}>
          {packet}
        </span>
      </div>
      <div className="relative h-6 flex items-center">
        <div
          className={cn(
            "absolute inset-y-1/2 h-0.5 transition-all duration-700",
            isLtr ? "left-0 origin-left bg-blue-400" : "right-0 origin-right bg-violet-400",
            active ? "w-full" : "w-0"
          )}
        />
        {active && (
          <div
            className={cn(
              "absolute top-1/2 -translate-y-1/2 size-2 rounded-full transition-all duration-500",
              isLtr ? "bg-blue-500 animate-pulse" : "bg-violet-500 animate-pulse"
            )}
            style={isLtr ? { left: "50%" } : { right: "50%" }}
          />
        )}
        <span className={cn("absolute text-xs leading-none transition-all duration-500", isLtr ? "right-0 text-blue-400" : "left-0 text-violet-400", active ? "opacity-100" : "opacity-0")}>
          {isLtr ? "▶" : "◀"}
        </span>
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
  const [currentStep, setCurrentStep] = useState<number>(-1);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isConnected = currentStep >= steps.length - 1 && currentStep >= 0;
  const clientPort = 52341;
  const step = currentStep >= 0 ? steps[currentStep] : null;

  function runAll() {
    if (running) return;
    setCurrentStep(-1);
    setRunning(true);
    let i = 0;
    setTimeout(() => setCurrentStep(0), 200);
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

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const statusText =
    currentStep === -1 ? "Click Connect to animate the 3-way handshake"
    : isConnected ? `Reliable channel established — ${serverIp}:${port}`
    : `Step ${currentStep + 1}/${steps.length}: ${step?.packet}`;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-2 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800">
        <Cable className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex-1">TCP Handshake</span>
        <div className="flex items-center gap-1.5">
          {steps.map((_, i) => (
            <span
              key={i}
              className={cn(
                "size-2 rounded-full transition-all duration-500",
                i <= currentStep ? "bg-emerald-500" : i === currentStep ? "bg-blue-500 scale-125" : "bg-zinc-200 dark:bg-zinc-700"
              )}
            />
          ))}
        </div>
        {isConnected && !running && (
          <button onClick={reset} className="p-1 text-zinc-400 hover:text-zinc-600 transition-all duration-500">
            <RefreshCw className="size-3.5" />
          </button>
        )}
      </div>

      <div className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        Before data flows, client and server exchange three packets to establish a reliable connection.
      </div>

      <div className="min-h-[280px] flex flex-col">
        <div className="flex items-stretch flex-1 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex-1 flex flex-col items-center justify-center py-4 gap-1">
            <div className={cn(
              "size-12 rounded-lg flex items-center justify-center border-2 transition-all duration-500",
              isConnected ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/30" : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
            )}>
              <Monitor className={cn("size-6 transition-colors duration-500", isConnected ? "text-emerald-600" : "text-zinc-500")} />
            </div>
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{clientLabel}</span>
            <span className="text-[10px] font-mono text-zinc-400">:{clientPort}</span>
          </div>

          <div className="flex-[2] px-4 flex flex-col justify-center">
            {currentStep === -1 ? (
              <p className="text-xs text-zinc-400 text-center">SYN → SYN-ACK → ACK</p>
            ) : step ? (
              <PacketArrow dir={step.dir} active={true} packet={step.packet} />
            ) : null}
          </div>

          <div className="flex-1 flex flex-col items-center justify-center py-4 gap-1">
            <div className={cn(
              "size-12 rounded-lg flex items-center justify-center border-2 transition-all duration-500",
              isConnected ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/30" : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
            )}>
              <Server className={cn("size-6 transition-colors duration-500", isConnected ? "text-emerald-600" : "text-zinc-500")} />
            </div>
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{serverLabel}</span>
            <span className="text-[10px] font-mono text-zinc-400">:{port}</span>
          </div>
        </div>

        <div className="px-4 py-3 min-h-[100px] flex flex-col justify-center">
          {step ? (
            <>
              <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 p-3 transition-all duration-500">
                <p className="text-xs text-zinc-700 dark:text-zinc-300">{step.description}</p>
              </div>
              <div className="flex gap-2 mt-2 text-[10px] font-mono">
                <span className="px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 border border-blue-100 dark:border-blue-800">
                  {clientLabel}: {step.clientState}
                </span>
                <span className="px-2 py-1 rounded bg-violet-50 dark:bg-violet-900/20 text-violet-600 border border-violet-100 dark:border-violet-800">
                  {serverLabel}: {step.serverState}
                </span>
              </div>
            </>
          ) : (
            <p className="text-xs text-zinc-400 text-center">Three steps to open a reliable TCP channel</p>
          )}
        </div>
      </div>

      {interactive && (
        <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-3">
          <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">{statusText}</span>
          <button
            onClick={isConnected && !running ? reset : runAll}
            disabled={running}
            className="flex items-center gap-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {running ? <RefreshCw className="size-3.5 animate-spin" /> : <Cable className="size-3.5" />}
            {running ? "Connecting…" : isConnected ? "Reset" : "Connect"}
          </button>
        </div>
      )}
    </div>
  );
}
