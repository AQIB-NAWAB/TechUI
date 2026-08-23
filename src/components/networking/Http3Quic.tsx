"use client";

import { useState, useEffect, useRef } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Wifi } from "lucide-react";

export const Http3QuicSchema = z.object({
  protocol: z.enum(["http2", "http3"]).default("http2"),
  packetLoss: z.boolean().default(true),
});

export type Http3QuicProps = z.infer<typeof Http3QuicSchema>;

// Stream animation state
interface StreamState {
  id: number;
  label: string;
  phase: "idle" | "request" | "transfer" | "stalled" | "done";
  progress: number;  // 0–100
  stalled: boolean;
  done: boolean;
}

const STREAM_COLORS = [
  { base: "bg-blue-500",   stall: "bg-zinc-300 dark:bg-zinc-600",  done: "bg-blue-300 dark:bg-blue-700"   },
  { base: "bg-violet-500", stall: "bg-zinc-300 dark:bg-zinc-600",  done: "bg-violet-300 dark:bg-violet-700" },
  { base: "bg-emerald-500",stall: "bg-zinc-300 dark:bg-zinc-600",  done: "bg-emerald-300 dark:bg-emerald-700"},
];

type Protocol = "http2" | "http3";

const RTT_INFO: Record<Protocol, { handshakes: { label: string; rtt: string }[]; total: string; zeroRtt: string }> = {
  http2: {
    handshakes: [
      { label: "TCP 3-way handshake", rtt: "1.5 RTT" },
      { label: "TLS 1.3 handshake",   rtt: "1 RTT"   },
    ],
    total:   "2.5 RTT before first byte",
    zeroRtt: "",
  },
  http3: {
    handshakes: [
      { label: "QUIC + TLS combined", rtt: "1 RTT" },
      { label: "Cached session (0-RTT)", rtt: "0 RTT!" },
    ],
    total:   "0–1 RTT before first byte",
    zeroRtt: "Known server: ZERO roundtrips!",
  },
};

function buildInitialStreams(): StreamState[] {
  return [
    { id: 1, label: "Stream 1 (img.jpg)", phase: "idle", progress: 0, stalled: false, done: false },
    { id: 2, label: "Stream 2 (style.css)", phase: "idle", progress: 0, stalled: false, done: false },
    { id: 3, label: "Stream 3 (app.js)", phase: "idle", progress: 0, stalled: false, done: false },
  ];
}

export function Http3Quic({
  protocol: initialProtocol = "http2",
  packetLoss: initialPacketLoss = true,
}: Http3QuicProps) {
  const [protocol, setProtocol] = useState<Protocol>(initialProtocol);
  const [packetLoss, setPacketLoss] = useState(initialPacketLoss);
  const [streams, setStreams] = useState<StreamState[]>(buildInitialStreams());
  const [running, setRunning] = useState(false);
  const [lostStream, setLostStream] = useState<number | null>(null);
  const animFrameRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset streams when protocol/packetLoss changes
  useEffect(() => {
    stop();
    setStreams(buildInitialStreams());
    setLostStream(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [protocol, packetLoss]);

  function stop() {
    if (animFrameRef.current) clearTimeout(animFrameRef.current);
    setRunning(false);
  }

  function runSimulation() {
    stop();
    const initial = buildInitialStreams();
    setStreams(initial);
    setLostStream(null);
    setRunning(true);

    // Animate over ~4 seconds using timed steps
    let step = 0;
    const totalSteps = 40; // 40 steps × 100ms = 4s
    const packetLossStep = 10; // at 25% through, packet lost on stream 2

    function tick() {
      step++;
      setStreams((prev) => {
        return prev.map((s) => {
          const base = step / totalSteps;

          if (s.id === 1) {
            // Stream 1 always progresses normally
            const progress = Math.min(base * 100, 100);
            return { ...s, progress, done: progress >= 100, phase: progress >= 100 ? "done" : "transfer" };
          }

          if (s.id === 2) {
            // Stream 2 loses packet at step 10
            if (packetLoss && step >= packetLossStep && step < packetLossStep + 8) {
              return { ...s, progress: (packetLossStep / totalSteps) * 100, stalled: true, phase: "stalled" };
            }
            // After stall resolves, continue
            const effectiveStep = packetLoss ? Math.max(0, step - 8) : step;
            const progress = Math.min((effectiveStep / totalSteps) * 100, 100);
            return { ...s, progress, stalled: false, done: progress >= 100, phase: progress >= 100 ? "done" : "transfer" };
          }

          if (s.id === 3) {
            if (protocol === "http2" && packetLoss && step >= packetLossStep && step < packetLossStep + 8) {
              // HTTP/2: head-of-line blocking — stream 3 also stalls!
              return { ...s, progress: (packetLossStep / totalSteps) * 100, stalled: true, phase: "stalled" };
            }
            // HTTP/3: stream 3 is unaffected even with packet loss on stream 2
            const progress = Math.min(base * 100, 100);
            return { ...s, progress, done: progress >= 100, phase: progress >= 100 ? "done" : "transfer" };
          }

          return s;
        });
      });

      if (packetLoss && step === packetLossStep) {
        setLostStream(2);
        setTimeout(() => setLostStream(null), 800);
      }

      if (step < totalSteps) {
        animFrameRef.current = setTimeout(tick, 100);
      } else {
        setRunning(false);
      }
    }

    animFrameRef.current = setTimeout(tick, 100);
  }

  const rttInfo = RTT_INFO[protocol];

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <Wifi className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">HTTP/3 &amp; QUIC</span>
        <span className={cn(
          "text-[10px] font-bold px-2 py-0.5 rounded",
          protocol === "http3"
            ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400"
            : "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400"
        )}>
          {protocol === "http3" ? "UDP · QUIC" : "TCP"}
        </span>
      </div>

      <div className="min-h-[300px] p-4 space-y-4">
        {/* Protocol tabs + packet loss toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          {(["http2", "http3"] as Protocol[]).map((p) => (
            <button
              key={p}
              onClick={() => setProtocol(p)}
              className={cn(
                "px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all duration-300 cursor-pointer",
                protocol === p
                  ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white"
                  : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              )}
            >
              {p === "http2" ? "HTTP/2" : "HTTP/3"}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[10px] text-zinc-400">Packet loss</span>
            <button
              onClick={() => setPacketLoss((v) => !v)}
              className={cn(
                "w-9 h-5 rounded-full border-2 transition-all duration-300 relative cursor-pointer",
                packetLoss
                  ? "bg-red-400 dark:bg-red-500 border-red-400 dark:border-red-500"
                  : "bg-zinc-200 dark:bg-zinc-700 border-zinc-300 dark:border-zinc-600"
              )}
            >
              <span className={cn(
                "absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all duration-300",
                packetLoss ? "left-4" : "left-0.5"
              )} />
            </button>
          </div>
        </div>

        {/* Stream Gantt chart */}
        <div className="rounded-lg border border-zinc-100 dark:border-zinc-800 overflow-hidden">
          <div className="px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800/50 flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Stream multiplexing</span>
            {packetLoss && (
              <span className="text-[10px] text-red-500 font-semibold">
                {protocol === "http2" ? "Packet loss → ALL streams blocked!" : "Packet loss → only that stream waits"}
              </span>
            )}
          </div>
          <div className="p-3 space-y-2">
            {streams.map((s, idx) => {
              const colors = STREAM_COLORS[idx];
              const isLost = lostStream === s.id;
              return (
                <div key={s.id} className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-400 w-28 shrink-0 truncate">{s.label}</span>
                  <div className="flex-1 h-6 rounded bg-zinc-100 dark:bg-zinc-800 overflow-hidden relative">
                    {/* Progress bar */}
                    <div
                      className={cn(
                        "h-full rounded transition-all duration-100",
                        s.stalled ? colors.stall : s.done ? colors.done : colors.base
                      )}
                      style={{ width: `${s.progress}%` }}
                    />
                    {/* Lost packet flash */}
                    {isLost && (
                      <div className="absolute inset-0 bg-red-400 dark:bg-red-600 opacity-70 animate-pulse rounded" />
                    )}
                    {/* Status label */}
                    {s.stalled && (
                      <span className="absolute right-1 top-0.5 text-[9px] font-bold text-zinc-500 dark:text-zinc-400">
                        {protocol === "http2" ? "⏸ blocked" : "⏸ waiting"}
                      </span>
                    )}
                    {s.done && (
                      <span className="absolute right-1 top-0.5 text-[9px] font-bold text-white/80">done</span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Legend */}
            <div className="flex items-center gap-3 pt-1">
              <div className="flex items-center gap-1"><span className="w-3 h-2 rounded bg-zinc-300 dark:bg-zinc-600 inline-block" /><span className="text-[9px] text-zinc-400">stalled</span></div>
              <div className="flex items-center gap-1"><span className="w-3 h-2 rounded bg-blue-500 inline-block" /><span className="text-[9px] text-zinc-400">transferring</span></div>
              {packetLoss && protocol === "http2" && (
                <span className="text-[9px] text-red-500 font-semibold">Head-of-line blocking: 1 lost packet stalls ALL streams</span>
              )}
              {packetLoss && protocol === "http3" && (
                <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold">Stream 3 continues unaffected</span>
              )}
            </div>
          </div>
        </div>

        {/* Connection RTT comparison */}
        <div className="rounded-lg border border-zinc-100 dark:border-zinc-800 overflow-hidden">
          <div className="px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800/50 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
            Connection setup
          </div>
          <div className="p-3 space-y-1.5">
            {rttInfo.handshakes.map((h, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-zinc-500 dark:text-zinc-400">{h.label}</span>
                <span className={cn(
                  "font-mono font-semibold text-[11px]",
                  h.rtt === "0 RTT!" ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-600 dark:text-zinc-300"
                )}>{h.rtt}</span>
              </div>
            ))}
            <div className="pt-1 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-600 dark:text-zinc-300">Total</span>
              <span className={cn(
                "font-mono font-bold",
                protocol === "http3" ? "text-emerald-600 dark:text-emerald-400" : "text-blue-600 dark:text-blue-400"
              )}>{rttInfo.total}</span>
            </div>
            {rttInfo.zeroRtt && (
              <div className="rounded bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-2 py-1 text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">
                {rttInfo.zeroRtt}
              </div>
            )}
          </div>
        </div>

        {/* Key insight */}
        <div className="text-[10px] text-zinc-400 dark:text-zinc-500 bg-zinc-50 dark:bg-zinc-800/40 rounded-lg px-3 py-2">
          HTTP/3 runs over UDP — each QUIC stream is independent, so one lost packet doesn&apos;t block others.
        </div>

        {/* Simulate button */}
        <button
          onClick={runSimulation}
          disabled={running}
          className={cn(
            "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity",
            running && "opacity-50 cursor-not-allowed"
          )}
        >
          {running ? "Simulating…" : "Simulate request streams"}
        </button>
      </div>
    </div>
  );
}
