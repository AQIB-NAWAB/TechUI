"use client";

import { useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Network, Monitor, Server, CheckCircle, XCircle } from "lucide-react";

export const TcpVsUdpSchema = z.object({
  protocol: z.enum(["tcp", "udp"]).optional().default("tcp"),
  interactive: z.boolean().optional().default(true),
});

export type TcpVsUdpProps = z.infer<typeof TcpVsUdpSchema>;

type Protocol = "tcp" | "udp";

interface Packet {
  id: number;
  label: string;
  delivered: boolean;
  order: number;
}

const FEATURES: Record<Protocol, Array<{ label: string; value: string; good: boolean }>> = {
  tcp: [
    { label: "Reliability", value: "Guaranteed delivery", good: true },
    { label: "Order", value: "In-order", good: true },
    { label: "Setup", value: "3-way handshake", good: false },
    { label: "Use case", value: "HTTP, email, files", good: true },
  ],
  udp: [
    { label: "Reliability", value: "Best effort", good: false },
    { label: "Order", value: "May arrive out of order", good: false },
    { label: "Setup", value: "No handshake", good: true },
    { label: "Use case", value: "Video, DNS, games", good: true },
  ],
};

function buildTcpPackets(batch: number): Packet[] {
  return ["A", "B", "C"].map((label, i) => ({
    id: batch * 10 + i,
    label,
    delivered: true,
    order: i + 1,
  }));
}

function buildUdpPackets(batch: number): Packet[] {
  const lost = batch % 2 === 1;
  const packets: Packet[] = [
    { id: batch * 10, label: "A", delivered: !lost, order: lost ? 2 : 1 },
    { id: batch * 10 + 1, label: "B", delivered: true, order: lost ? 1 : 2 },
    { id: batch * 10 + 2, label: "C", delivered: true, order: 3 },
  ];
  return packets;
}

export function TcpVsUdp({
  protocol: initialProtocol = "tcp",
  interactive = true,
}: TcpVsUdpProps) {
  const [protocol, setProtocol] = useState<Protocol>(initialProtocol);
  const [connected, setConnected] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [packets, setPackets] = useState<Packet[]>([]);
  const [batch, setBatch] = useState(0);
  const [handshakeStep, setHandshakeStep] = useState(0);

  function reset() {
    setConnected(false);
    setAnimating(false);
    setPackets([]);
    setBatch(0);
    setHandshakeStep(0);
  }

  function switchProtocol(p: Protocol) {
    setProtocol(p);
    reset();
  }

  function connectOrSend() {
    if (animating) return;

    if (protocol === "tcp" && !connected) {
      setAnimating(true);
      setHandshakeStep(1);
      setTimeout(() => {
        setHandshakeStep(2);
        setTimeout(() => {
          setHandshakeStep(3);
          setConnected(true);
          setAnimating(false);
        }, 1000);
      }, 1000);
      return;
    }

    setAnimating(true);
    const nextBatch = batch + 1;
    const newPackets = protocol === "tcp" ? buildTcpPackets(nextBatch) : buildUdpPackets(nextBatch);

    setTimeout(() => {
      setPackets(newPackets);
      setBatch(nextBatch);
      setAnimating(false);
    }, 1000);
  }

  const sorted = [...packets].sort((a, b) => a.order - b.order);
  const deliveredCount = packets.filter((p) => p.delivered).length;
  const statusText =
    protocol === "tcp" && !connected
      ? handshakeStep === 0
        ? "TCP needs a handshake before data can flow — click Connect."
        : handshakeStep === 1
        ? "SYN sent — client opens the connection."
        : handshakeStep === 2
        ? "SYN-ACK received — server agrees."
        : "ACK sent — connection established."
      : protocol === "tcp"
      ? packets.length === 0
        ? "All packets arrive in order with acknowledgments."
        : `Delivered ${deliveredCount}/${packets.length} in order — every packet ACKed.`
      : packets.length === 0
      ? "UDP fires datagrams with no handshake — some may be lost."
      : deliveredCount < packets.length
      ? `Only ${deliveredCount}/${packets.length} arrived — no retransmit, app must handle gaps.`
      : "All arrived, but order may differ from send order.";

  const primaryLabel =
    protocol === "tcp" && !connected
      ? animating
        ? "Handshaking…"
        : "Connect"
      : packets.length > 0 && !animating
      ? "Send Again"
      : animating
      ? "Sending…"
      : "Send Packets";

  function handlePrimary() {
    if (packets.length > 0 && !animating && protocol === "tcp" && connected) {
      reset();
      setTimeout(connectOrSend, 500);
      return;
    }
    if (packets.length > 0 && !animating && protocol === "udp") {
      reset();
      setTimeout(connectOrSend, 500);
      return;
    }
    connectOrSend();
  }

  return (
    <>
      <style>{`
        @keyframes packet-travel {
          from { left: 18%; opacity: 1; }
          to { left: 78%; opacity: 0.4; }
        }
      `}</style>
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
        <div className="h-12 px-4 flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
          <Network className="size-4 text-cyan-500 shrink-0" />
          <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">TCP vs UDP</span>
          <div className="flex rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
            {(["tcp", "udp"] as Protocol[]).map((p) => (
              <button
                key={p}
                onClick={() => switchProtocol(p)}
                className={cn(
                  "px-2.5 py-1 text-[10px] font-semibold uppercase transition-all duration-500",
                  protocol === p
                    ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                )}
              >
                {p}
              </button>
            ))}
          </div>
          <span
            className={cn(
              "text-[10px] font-semibold px-2 py-0.5 rounded-full transition-all duration-500",
              protocol === "tcp" && connected
                ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400"
                : protocol === "udp"
                ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
            )}
          >
            {protocol === "tcp" ? (connected ? "● Connected" : "○ Handshake") : "● Datagram"}
          </span>
        </div>

        <div className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
          TCP is reliable and ordered; UDP is fast with no guarantees — pick one and send data.
        </div>

        <div className="min-h-[220px] px-4 py-4 flex flex-col gap-3">
          <div className="flex items-center justify-between relative h-10">
            <div className="flex items-center gap-1.5">
              <Monitor className="size-4 text-blue-500" />
              <span className="text-[10px] font-semibold text-zinc-500">Client</span>
            </div>
            <div className="flex-1 mx-3 relative h-0.5 bg-zinc-200 dark:bg-zinc-700 rounded">
              {animating && packets.length === 0 && protocol === "udp" && (
                <div
                  className="absolute top-1/2 -translate-y-1/2 size-2 rounded-full bg-blue-500"
                  style={{ animation: "packet-travel 1s ease-out forwards" }}
                />
              )}
              {animating && protocol === "tcp" && connected && (
                <div
                  className="absolute top-1/2 -translate-y-1/2 size-2 rounded-full bg-emerald-500"
                  style={{ animation: "packet-travel 1s ease-out forwards" }}
                />
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <Server className="size-4 text-emerald-500" />
              <span className="text-[10px] font-semibold text-zinc-500">Server</span>
            </div>
          </div>

          {protocol === "tcp" && !connected && (
            <div className="rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 px-3 py-2 flex justify-center gap-4">
              {["SYN", "SYN-ACK", "ACK"].map((step, i) => (
                <div
                  key={step}
                  className={cn(
                    "text-[10px] font-mono font-semibold px-2 py-1 rounded transition-all duration-500",
                    handshakeStep > i
                      ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
                  )}
                >
                  {step}
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-4 gap-2">
            {FEATURES[protocol].map((f) => (
              <div
                key={f.label}
                className="rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 px-2 py-1.5 text-center"
              >
                <div className="text-[9px] text-zinc-400 uppercase">{f.label}</div>
                <div
                  className={cn(
                    "text-[10px] font-semibold mt-0.5",
                    f.good ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                  )}
                >
                  {f.value}
                </div>
              </div>
            ))}
          </div>

          <div className="flex-1 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 p-3 min-h-[72px]">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-2">
              {protocol === "tcp" ? "Received (ordered)" : "Received (best effort)"}
            </div>
            {sorted.length === 0 ? (
              <div className="text-[11px] text-zinc-400 text-center py-3">No packets sent yet</div>
            ) : (
              <div className="flex gap-2 flex-wrap">
                {sorted.map((p) => (
                  <div
                    key={p.id}
                    className={cn(
                      "flex items-center gap-1 rounded-md px-2.5 py-1 font-mono text-xs border transition-all duration-500",
                      p.delivered
                        ? "bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400"
                        : "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 line-through opacity-60"
                    )}
                  >
                    {p.delivered ? <CheckCircle className="size-3" /> : <XCircle className="size-3" />}
                    {p.label}
                    {protocol === "tcp" && p.delivered && (
                      <span className="text-[9px] text-emerald-500 ml-0.5">ACK</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {interactive && (
          <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/30">
            <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">{statusText}</span>
            <button
              onClick={handlePrimary}
              disabled={animating || (protocol === "tcp" && !connected && handshakeStep > 0 && handshakeStep < 3)}
              className={cn(
                "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity shrink-0",
                animating && "opacity-50 cursor-not-allowed"
              )}
            >
              {primaryLabel}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
