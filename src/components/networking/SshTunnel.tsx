"use client";

import { useState, useEffect, useRef } from "react";
import { z } from "zod";
import { Lock, Terminal, Monitor, Server } from "lucide-react";
import { cn } from "@/lib/utils";

export const SshTunnelSchema = z.object({
  tunnelType: z.enum(["local", "remote", "dynamic"]).default("local"),
  localPort: z.number().default(5433),
  remotePort: z.number().default(5432),
  remoteHost: z.string().default("db.internal"),
  sshServer: z.string().default("bastion.example.com"),
});

export type SshTunnelProps = z.infer<typeof SshTunnelSchema>;

type TunnelType = "local" | "remote" | "dynamic";

interface TunnelConfig {
  label: string;
  command: (p: SshTunnelProps) => string;
  useCase: string;
  leftLabel: (p: SshTunnelProps) => string;
  rightLabel: (p: SshTunnelProps) => string;
  targetLabel: (p: SshTunnelProps) => string;
  flowDesc: (p: SshTunnelProps) => string;
  packetLabel: string;
}

const TUNNEL_CONFIGS: Record<TunnelType, TunnelConfig> = {
  local: {
    label: "Local",
    command: (p) => `ssh -L ${p.localPort}:${p.remoteHost}:${p.remotePort} ${p.sshServer}`,
    useCase: "Access private DB through a jump host",
    leftLabel: (p) => `Your Machine\n:${p.localPort}`,
    rightLabel: (p) => p.sshServer,
    targetLabel: (p) => `${p.remoteHost}\n:${p.remotePort}`,
    flowDesc: (p) => `localhost:${p.localPort} → SSH tunnel → ${p.sshServer} → ${p.remoteHost}:${p.remotePort}`,
    packetLabel: "psql query",
  },
  remote: {
    label: "Remote",
    command: (p) => `ssh -R ${p.remotePort}:localhost:${p.localPort} ${p.sshServer}`,
    useCase: "Expose local dev server to internet",
    leftLabel: (p) => `Your Machine\n:${p.localPort}`,
    rightLabel: (p) => p.sshServer,
    targetLabel: (p) => `${p.sshServer}\n:${p.remotePort}`,
    flowDesc: (p) => `${p.sshServer}:${p.remotePort} → SSH tunnel → localhost:${p.localPort}`,
    packetLabel: "HTTP request",
  },
  dynamic: {
    label: "SOCKS",
    command: (p) => `ssh -D ${p.localPort} ${p.sshServer}`,
    useCase: "Route all browser traffic through SSH server",
    leftLabel: (p) => `Your Machine\nSOCKS5 :${p.localPort}`,
    rightLabel: (p) => p.sshServer,
    targetLabel: () => "any destination",
    flowDesc: (p) => `Browser → SOCKS5 localhost:${p.localPort} → SSH tunnel → ${p.sshServer} → any destination`,
    packetLabel: "HTTPS traffic",
  },
};

export function SshTunnel({
  tunnelType: initialType = "local",
  localPort = 5433,
  remotePort = 5432,
  remoteHost = "db.internal",
  sshServer = "bastion.example.com",
}: SshTunnelProps) {
  const props = { tunnelType: initialType, localPort, remotePort, remoteHost, sshServer };
  const [tab, setTab] = useState<TunnelType>(initialType);
  const [packetPos, setPacketPos] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const config = TUNNEL_CONFIGS[tab];

  useEffect(() => {
    setTab(initialType);
  }, [initialType]);

  function sendPacket() {
    if (sending) return;
    setSending(true);
    setPacketPos(0);
    let step = 0;
    const advance = () => {
      step++;
      setPacketPos(step);
      if (step < 3) {
        timeoutRef.current = setTimeout(advance, 1200);
      } else {
        setTimeout(() => {
          setSending(false);
          setPacketPos(null);
        }, 1000);
      }
    };
    timeoutRef.current = setTimeout(advance, 1200);
  }

  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

  const tabs: TunnelType[] = ["local", "remote", "dynamic"];
  const packetLeftPct =
    packetPos === 0 ? "2%"
    : packetPos === 1 ? "28%"
    : packetPos === 2 ? "60%"
    : "88%";
  const isForward = tab !== "remote";

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <Lock className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">SSH Tunnel</span>
        <div className="flex gap-1">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setSending(false); setPacketPos(null); if (timeoutRef.current) clearTimeout(timeoutRef.current); }}
              className={cn(
                "px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all duration-500",
                tab === t
                  ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              )}
            >
              {TUNNEL_CONFIGS[t].label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-zinc-500 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        {config.useCase}
      </p>

      <div className="min-h-[240px] px-4 py-3 flex flex-col gap-3">
        <div className="rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2 font-mono text-[11px] text-emerald-400 overflow-x-auto whitespace-nowrap">
          <span className="text-zinc-500">$ </span>
          {config.command(props)}
        </div>

        <div className="relative flex items-center justify-between gap-2 flex-1">
          <div className="flex flex-col items-center gap-1 z-10">
            <div className="rounded-lg border-2 border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950 px-2.5 py-2 text-center min-w-[80px]">
              <Monitor className="size-4 text-blue-500 mx-auto mb-1" />
              <span className="text-[10px] font-mono font-semibold text-blue-700 dark:text-blue-300 whitespace-pre-line leading-tight block">
                {config.leftLabel(props)}
              </span>
            </div>
          </div>

          <div className="flex-1 relative h-10 flex items-center">
            <div className="absolute inset-x-0 top-3 h-px bg-zinc-300 dark:bg-zinc-600" />
            <div className="absolute inset-x-0 top-5 h-px bg-zinc-300 dark:bg-zinc-600" />
            <div className="absolute left-1/2 -translate-x-1/2 top-1/2 z-10 bg-white dark:bg-zinc-900 px-1">
              <div className="rounded-full bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-1">
                <Lock className="size-3 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <div className={cn(
              "absolute text-[10px] font-mono top-[-2px] w-full text-center transition-all duration-500",
              isForward ? "text-blue-400" : "text-violet-400"
            )}>
              {isForward ? "encrypted ▶" : "◀ encrypted"}
            </div>
            {packetPos !== null && (
              <div
                className="absolute top-1/2 -translate-y-1/2 z-20 transition-all duration-700"
                style={{ left: packetLeftPct }}
              >
                <div className="rounded-full bg-blue-500 size-3 shadow-lg shadow-blue-500/50" />
              </div>
            )}
          </div>

          <div className="flex flex-col items-center gap-1 z-10">
            <div className="rounded-lg border-2 border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-2.5 py-2 text-center min-w-[80px]">
              <Server className="size-4 text-zinc-500 mx-auto mb-1" />
              <span className="text-[10px] font-mono font-semibold text-zinc-600 dark:text-zinc-300 block leading-tight">
                {config.rightLabel(props)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <div className="rounded-lg border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1.5 text-center">
            <span className="text-[10px] font-mono font-semibold text-emerald-700 dark:text-emerald-300 whitespace-pre-line leading-tight block">
              {config.targetLabel(props)}
            </span>
          </div>
        </div>
      </div>

      <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/30">
        <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1 truncate">
          {sending ? "Packet traveling through encrypted tunnel…" : config.flowDesc(props)}
        </span>
        <button
          onClick={sendPacket}
          disabled={sending}
          className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0"
        >
          {sending ? "Sending…" : `Send ${config.packetLabel}`}
        </button>
      </div>
    </div>
  );
}
