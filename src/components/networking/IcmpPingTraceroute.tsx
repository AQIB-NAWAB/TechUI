"use client";

import { useState, useRef, useEffect } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Network, RefreshCw, Radio } from "lucide-react";

export const IcmpPingTracerouteSchema = z.object({
  name: z.string().optional().default("ICMP Ping & Traceroute"),
  target: z.string().optional().default("api.example.com"),
  mode: z.enum(["ping", "traceroute"]).optional().default("ping"),
  pingRttMs: z.number().optional().default(24),
  hops: z
    .array(
      z.object({
        hop: z.number(),
        host: z.string(),
        rttMs: z.number(),
      })
    )
    .optional()
    .default([
      { hop: 1, host: "192.168.1.1", rttMs: 2 },
      { hop: 2, host: "10.0.0.1", rttMs: 8 },
      { hop: 3, host: "isp-gw.net", rttMs: 14 },
      { hop: 4, host: "core-router.net", rttMs: 22 },
      { hop: 5, host: "api.example.com", rttMs: 24 },
    ]),
  interactive: z.boolean().optional().default(true),
});

export type IcmpPingTracerouteProps = z.infer<typeof IcmpPingTracerouteSchema>;

type Phase = "idle" | "running" | "done";

export function IcmpPingTraceroute({
  name = "ICMP Ping & Traceroute",
  target = "api.example.com",
  mode = "ping",
  pingRttMs = 24,
  hops = [
    { hop: 1, host: "192.168.1.1", rttMs: 2 },
    { hop: 2, host: "10.0.0.1", rttMs: 8 },
    { hop: 3, host: "isp-gw.net", rttMs: 14 },
    { hop: 4, host: "core-router.net", rttMs: 22 },
    { hop: 5, host: "api.example.com", rttMs: 24 },
  ],
  interactive = true,
}: IcmpPingTracerouteProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [activeHop, setActiveHop] = useState<number | null>(null);
  const [displayRtt, setDisplayRtt] = useState<number | null>(null);
  const [packetPos, setPacketPos] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const addLog = (msg: string) => setLog((prev) => [msg, ...prev].slice(0, 6));

  const reset = () => {
    clearTimer();
    setPhase("idle");
    setActiveHop(null);
    setDisplayRtt(null);
    setPacketPos(0);
    setLog([]);
  };

  useEffect(() => () => clearTimer(), []);

  const runPing = () => {
    if (phase === "running") return;
    clearTimer();
    setPhase("running");
    setActiveHop(null);
    setDisplayRtt(null);
    setPacketPos(0);
    setLog([]);
    addLog(`PING ${target} — 64 bytes`);

    setPacketPos(50);
    timerRef.current = setTimeout(() => {
      setDisplayRtt(pingRttMs);
      setPhase("done");
      addLog(`64 bytes from ${target}: time=${pingRttMs}ms TTL=56`);
    }, 800);
  };

  const runTraceroute = () => {
    if (phase === "running") return;
    clearTimer();
    setPhase("running");
    setActiveHop(null);
    setDisplayRtt(null);
    setPacketPos(0);
    setLog([]);
    addLog(`traceroute to ${target}, 30 hops max`);

    let i = 0;
    const step = () => {
      const hop = hops[i];
      setActiveHop(hop.hop);
      setDisplayRtt(hop.rttMs);
      setPacketPos(((i + 1) / hops.length) * 100);
      addLog(`${hop.hop}  ${hop.host}  ${hop.rttMs} ms`);
      i++;
      if (i < hops.length) {
        timerRef.current = setTimeout(step, 700);
      } else {
        timerRef.current = setTimeout(() => setPhase("done"), 400);
      }
    };
    step();
  };

  const run = () => (mode === "ping" ? runPing() : runTraceroute());

  const maxRtt = mode === "ping" ? pingRttMs : Math.max(...hops.map((h) => h.rttMs));

  return (
    <>
      <style>{`
        @keyframes packetTravel {
          0% { left: 8%; opacity: 1; }
          50% { opacity: 1; }
          100% { left: 92%; opacity: 0.3; }
        }
      `}</style>
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
        <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
          <Network className="size-4 text-zinc-400 shrink-0" />
          <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">{name}</span>
          <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
            {mode}
          </span>
          {interactive && (
            <button
              onClick={reset}
              className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all duration-500"
            >
              <RefreshCw className="size-3.5" />
            </button>
          )}
        </div>

        <p className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
          {mode === "ping"
            ? "Ping sends a small ICMP echo packet and measures round-trip time to check if a host is reachable."
            : "Traceroute sends packets with increasing TTL — each router along the path replies, revealing the route."}
        </p>

        <div className="p-4 min-h-[220px] space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div className="size-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                <Radio className="size-4 text-zinc-500" />
              </div>
              <span className="text-[10px] text-zinc-400">You</span>
            </div>

            <div className="flex-1 relative h-10 flex items-center">
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-zinc-200 dark:bg-zinc-700" />
              {phase === "running" && (
                <div
                  className="absolute top-1/2 -translate-y-1/2 size-3 rounded-full bg-blue-500 shadow-sm transition-all duration-500"
                  style={{
                    left: `${packetPos}%`,
                    animation: mode === "ping" ? "packetTravel 0.8s ease-in-out" : undefined,
                  }}
                />
              )}
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-1">
                {mode === "traceroute" &&
                  hops.map((h) => (
                    <div
                      key={h.hop}
                      className={cn(
                        "size-2 rounded-full transition-all duration-500",
                        activeHop !== null && h.hop <= activeHop
                          ? "bg-blue-500 scale-125"
                          : "bg-zinc-300 dark:bg-zinc-600"
                      )}
                    />
                  ))}
              </div>
            </div>

            <div className="flex flex-col items-center gap-1 shrink-0">
              <div
                className={cn(
                  "size-8 rounded-lg flex items-center justify-center transition-all duration-500",
                  phase === "done"
                    ? "bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800"
                    : "bg-zinc-100 dark:bg-zinc-800"
                )}
              >
                <Network
                  className={cn(
                    "size-4 transition-all duration-500",
                    phase === "done" ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-500"
                  )}
                />
              </div>
              <span className="text-[10px] text-zinc-400 max-w-[72px] truncate">{target}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div
              className={cn(
                "rounded-xl border px-4 py-3 text-center min-w-[100px] transition-all duration-500",
                displayRtt !== null
                  ? "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800"
                  : "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700"
              )}
            >
              <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">RTT</div>
              <div
                className={cn(
                  "text-2xl font-bold font-mono mt-0.5 transition-all duration-500",
                  displayRtt !== null ? "text-blue-600 dark:text-blue-400" : "text-zinc-300 dark:text-zinc-600"
                )}
              >
                {displayRtt !== null ? `${displayRtt}` : "—"}
                <span className="text-sm font-normal ml-0.5">ms</span>
              </div>
            </div>

            {mode === "traceroute" && (
              <div className="flex-1 min-w-0 space-y-1 max-h-[88px] overflow-y-auto">
                {hops.map((h) => (
                  <div
                    key={h.hop}
                    className={cn(
                      "flex items-center gap-2 text-[10px] font-mono rounded px-2 py-1 transition-all duration-500",
                      activeHop !== null && h.hop <= activeHop
                        ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300"
                        : "text-zinc-400"
                    )}
                  >
                    <span className="w-4 shrink-0">{h.hop}</span>
                    <span className="flex-1 truncate">{h.host}</span>
                    <span className="shrink-0">{h.rttMs} ms</span>
                  </div>
                ))}
              </div>
            )}

            {mode === "ping" && (
              <div className="flex-1">
                <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-1">Terminal</div>
                <div className="space-y-0.5 min-h-[52px]">
                  {log.length === 0 && (
                    <span className="text-[10px] text-zinc-400">No output yet — click below</span>
                  )}
                  {log.map((line, i) => (
                    <div key={i} className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 truncate">
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {mode === "ping" && displayRtt !== null && (
            <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-700"
                style={{ width: `${Math.min(100, (displayRtt / maxRtt) * 100)}%` }}
              />
            </div>
          )}
        </div>

        {interactive && (
          <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/30 min-h-[52px]">
            <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">
              {phase === "running"
                ? mode === "ping"
                  ? "Sending ICMP echo request…"
                  : `Probing hop ${activeHop ?? 1} of ${hops.length}…`
                : phase === "done"
                  ? mode === "ping"
                    ? `${target} is reachable in ${displayRtt} ms.`
                    : `Route traced — ${hops.length} hops to ${target}.`
                  : mode === "ping"
                    ? "Click to ping the target and measure round-trip time."
                    : "Click to trace the network path hop by hop."}
            </span>
            <button
              onClick={run}
              disabled={phase === "running"}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-500 shrink-0 hover:opacity-90",
                phase === "running"
                  ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-400 cursor-not-allowed"
                  : "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
              )}
            >
              {mode === "ping" ? "Ping Host" : "Trace Route"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
