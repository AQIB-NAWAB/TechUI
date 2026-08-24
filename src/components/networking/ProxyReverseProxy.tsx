"use client";

import { z } from "zod";
import { useState, useEffect, useRef } from "react";
import { ArrowLeftRight, Shield, Scale, Zap, Monitor, Server } from "lucide-react";
import { cn } from "@/lib/utils";

export const ProxyReverseProxySchema = z.object({
  type: z.enum(["forward", "reverse"]).default("forward"),
});

export type ProxyReverseProxyProps = z.infer<typeof ProxyReverseProxySchema>;

type ProxyType = "forward" | "reverse";

const TABS: { id: ProxyType; label: string }[] = [
  { id: "forward", label: "Forward Proxy" },
  { id: "reverse", label: "Reverse Proxy" },
];

const CONFIG = {
  forward: {
    subtitle: "You set it up — it protects your identity from the server",
    insight: "Client configures the proxy (VPN, corporate proxy, Tor)",
    nodes: [
      { id: "client", label: "Your Client", sublabel: "192.168.1.5", icon: "client", color: "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800" },
      { id: "proxy", label: "Forward Proxy", sublabel: "proxy.corp.com", icon: "proxy", color: "bg-violet-50 dark:bg-violet-950 border-violet-200 dark:border-violet-800" },
      { id: "server", label: "Web Server", sublabel: "93.184.216.34", icon: "server", color: "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700" },
    ],
    seenAs: {
      label: "What the server sees",
      value: "Proxy IP: proxy.corp.com",
      note: "Your real IP is hidden from the server",
      color: "text-blue-600 dark:text-blue-400",
    },
    benefits: [
      { icon: "shield", label: "Anonymity", desc: "Server sees proxy IP, not your IP" },
      { icon: "scale", label: "Content Filter", desc: "Blocks access to certain sites" },
      { icon: "zap", label: "Caching", desc: "Caches responses for repeat visits" },
    ],
    examples: ["Corporate VPN", "Squid proxy", "Tor network"],
    arrow1: "Request →",
    arrow2: "Forwarded →",
    arrowColor1: "text-blue-500",
    arrowColor2: "text-violet-500",
  },
  reverse: {
    subtitle: "They set it up — it protects their infrastructure from you",
    insight: "Server configures the proxy (nginx, Cloudflare, AWS ALB)",
    nodes: [
      { id: "client", label: "Internet Client", sublabel: "any IP", icon: "client", color: "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700" },
      { id: "proxy", label: "Reverse Proxy", sublabel: "nginx / ALB", icon: "proxy", color: "bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800" },
      { id: "server", label: "Backend Servers", sublabel: "10.0.0.x (private)", icon: "servers", color: "bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800" },
    ],
    seenAs: {
      label: "What the client sees",
      value: "One IP: api.example.com",
      note: "Real backend IPs are hidden from clients",
      color: "text-emerald-600 dark:text-emerald-400",
    },
    benefits: [
      { icon: "scale", label: "Load Balancing", desc: "Spreads requests across backends" },
      { icon: "shield", label: "Hides Topology", desc: "Client never sees real server IPs" },
      { icon: "zap", label: "SSL Termination", desc: "Handles HTTPS for backends" },
    ],
    examples: ["nginx", "Cloudflare", "AWS ALB", "HAProxy"],
    arrow1: "Request →",
    arrow2: "Routes →",
    arrowColor1: "text-zinc-500",
    arrowColor2: "text-emerald-500",
  },
};

function BenefitIcon({ icon }: { icon: string }) {
  if (icon === "shield") return <Shield className="w-3.5 h-3.5 text-blue-500" />;
  if (icon === "scale") return <Scale className="w-3.5 h-3.5 text-emerald-500" />;
  if (icon === "zap") return <Zap className="w-3.5 h-3.5 text-amber-500" />;
  return null;
}

function NodeIcon({ icon }: { icon: string }) {
  if (icon === "client") return <Monitor className="w-5 h-5 text-zinc-500" />;
  if (icon === "proxy") return <ArrowLeftRight className="w-5 h-5 text-violet-500" />;
  if (icon === "server" || icon === "servers") return <Server className="w-5 h-5 text-zinc-500" />;
  return null;
}

export function ProxyReverseProxy({ type: typeProp = "forward" }: ProxyReverseProxyProps) {
  const [activeTab, setActiveTab] = useState<ProxyType>(typeProp);
  const [animating, setAnimating] = useState(false);
  const [packetPos, setPacketPos] = useState<number>(0);
  const animRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setActiveTab(typeProp);
  }, [typeProp]);

  useEffect(() => {
    setAnimating(false);
    setPacketPos(0);
    if (animRef.current) clearTimeout(animRef.current);
  }, [activeTab]);

  const cfg = CONFIG[activeTab];

  function handleSend() {
    if (animating) return;
    setAnimating(true);
    setPacketPos(1);

    animRef.current = setTimeout(() => {
      setPacketPos(2);
      animRef.current = setTimeout(() => {
        setPacketPos(3);
        animRef.current = setTimeout(() => {
          setPacketPos(0);
          setAnimating(false);
        }, 1200);
      }, 1200);
    }, 1200);
  }

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800">
        <ArrowLeftRight className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">Proxy vs Reverse Proxy</span>
        <div className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-2.5 py-1 text-[10px] font-semibold rounded-md transition-all duration-500",
                activeTab === tab.id
                  ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-zinc-500 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        {cfg.subtitle}
      </p>

      <div className="min-h-[280px] px-4 py-3 flex flex-col gap-3">
        <div className="flex items-center gap-2 flex-wrap justify-center">
          {cfg.nodes.map((node, idx) => (
            <div key={node.id} className="flex items-center gap-2">
              <div
                className={cn(
                  "rounded-lg border px-3 py-2 flex flex-col items-center gap-1 min-w-[90px] transition-all duration-500",
                  node.color,
                  (idx === 0 && packetPos >= 1) || (idx === 1 && packetPos >= 1) || (idx === 2 && packetPos >= 2)
                    ? "scale-105 shadow-sm"
                    : ""
                )}
              >
                <NodeIcon icon={node.icon} />
                <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 text-center leading-tight">
                  {node.label}
                </span>
                <span className="text-[10px] text-zinc-400 font-mono text-center">{node.sublabel}</span>
              </div>

              {idx < cfg.nodes.length - 1 && (
                <div className="flex flex-col items-center gap-0.5">
                  <span className={cn(
                    "text-[10px] font-mono transition-all duration-500",
                    idx === 0
                      ? packetPos === 1 ? cfg.arrowColor1 + " font-bold" : "text-zinc-300 dark:text-zinc-600"
                      : packetPos === 2 ? cfg.arrowColor2 + " font-bold" : "text-zinc-300 dark:text-zinc-600"
                  )}>
                    {idx === 0 ? cfg.arrow1 : cfg.arrow2}
                  </span>
                  <div className={cn(
                    "w-3 h-3 rounded-full transition-all duration-500",
                    idx === 0 && packetPos === 1 ? "bg-blue-500 shadow-lg shadow-blue-500/50 scale-110"
                      : idx === 1 && packetPos === 2 ? "bg-emerald-500 shadow-lg shadow-emerald-500/50 scale-110"
                      : "bg-transparent"
                  )} />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1">
            {cfg.seenAs.label}
          </p>
          <p className={cn("text-sm font-semibold font-mono", cfg.seenAs.color)}>{cfg.seenAs.value}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{cfg.seenAs.note}</p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {cfg.benefits.map((b) => (
            <div key={b.label} className="rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 px-2 py-2 flex flex-col gap-1">
              <div className="flex items-center gap-1">
                <BenefitIcon icon={b.icon} />
                <span className="text-[10px] font-semibold text-zinc-700 dark:text-zinc-300">{b.label}</span>
              </div>
              <p className="text-[10px] text-zinc-400 leading-tight">{b.desc}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-1 mt-auto">
          {cfg.examples.map((ex) => (
            <span key={ex} className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-full px-2 py-0.5 border border-zinc-200 dark:border-zinc-700">
              {ex}
            </span>
          ))}
        </div>
      </div>

      <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-3">
        <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">
          {animating ? "Request traveling through proxy…" : cfg.insight}
        </span>
        <button
          onClick={handleSend}
          disabled={animating}
          className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          {animating ? "Sending…" : "Send Request"}
        </button>
      </div>
    </div>
  );
}
