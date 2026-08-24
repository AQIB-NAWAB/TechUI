"use client";

import { useState, useEffect, useRef } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Globe, Monitor, Server, RefreshCw, MapPin, CheckCircle2 } from "lucide-react";

export const DnsLookupSchema = z.object({
  domain: z.string().optional().default("api.example.com"),
  recordType: z.enum(["A", "AAAA", "CNAME", "MX", "TXT", "NS", "PTR"]).optional().default("A"),
  result: z.string().optional().default("93.184.216.34"),
  ttl: z.number().optional().default(300),
  interactive: z.boolean().optional().default(true),
  steps: z
    .array(
      z.object({
        from: z.string(),
        to: z.string(),
        toLabel: z.string().optional(),
        query: z.string(),
        answer: z.string().optional(),
        cached: z.boolean().optional().default(false),
        ms: z.number().optional(),
      })
    )
    .optional(),
});

export type DnsLookupProps = z.infer<typeof DnsLookupSchema>;

type HopId = "app" | "stub" | "recursive" | "root" | "tld" | "auth";

type Hop = {
  id: HopId;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
};

const HOPS: Hop[] = [
  { id: "app",       label: "Your App",         sublabel: "localhost",       icon: <Monitor className="size-5" /> },
  { id: "stub",      label: "Stub Resolver",    sublabel: "127.0.0.1",       icon: <Server className="size-5" /> },
  { id: "recursive", label: "Recursive",        sublabel: "8.8.8.8",         icon: <RefreshCw className="size-5" /> },
  { id: "root",      label: "Root NS",          sublabel: ". (root)",        icon: <Globe className="size-5" /> },
  { id: "tld",       label: "TLD NS",           sublabel: ".com",            icon: <Globe className="size-5" /> },
  { id: "auth",      label: "Auth NS",          sublabel: "ns1.example.com", icon: <MapPin className="size-5" /> },
];

type StepExplanation = {
  title: string;
  query?: string;
  answer?: string;
};

function buildExplanations(domain: string, result: string, ttl: number): StepExplanation[] {
  const parts = domain.split(".");
  const tld = parts.slice(-1)[0] ?? "com";
  const sld = parts.slice(-2).join(".");
  return [
    { title: `Your app asks the local stub resolver: "${domain} ${result.includes(":") ? "AAAA" : "A"}?"`, query: `${domain} A?` },
    { title: "The stub resolver forwards the query to the recursive resolver at Google's DNS.", query: `${domain} A?` },
    { title: `The recursive resolver doesn't know the answer, so it asks a Root Nameserver who handles .${tld} domains.`, query: `${domain} A?`, answer: `.${tld} NS → a.gtld-servers.net` },
    { title: `The recursive resolver asks the .${tld} nameserver: who is authoritative for ${sld}?`, query: `${domain} A?`, answer: `${sld} NS → ns1.${sld}` },
    { title: `The recursive resolver asks the authoritative nameserver for the final IP address.`, query: `${domain} A?`, answer: `${domain} A ${result} TTL=${ttl}` },
    { title: `The recursive resolver caches the result and returns it back through the chain to your app.`, answer: result },
  ];
}

function HopBox({ hop, active, done, index }: { hop: Hop; active: boolean; done: boolean; index: number }) {
  return (
    <div className="flex flex-col items-center gap-1 shrink-0">
      <div
        className={cn(
          "w-[80px] h-[72px] rounded-lg border-2 flex flex-col items-center justify-center gap-1 transition-all duration-500",
          active
            ? "border-blue-400 bg-blue-50 dark:bg-blue-950/40 dark:border-blue-500 scale-105 shadow-md shadow-blue-200 dark:shadow-blue-900/30"
            : done
            ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/20"
            : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
        )}
      >
        <span
          className={cn(
            "transition-colors duration-500",
            active ? "text-blue-600 dark:text-blue-400" : done ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400 dark:text-zinc-500"
          )}
        >
          {hop.icon}
        </span>
        <span className={cn("text-[10px] font-semibold leading-tight text-center px-1 transition-colors duration-500", active ? "text-blue-700 dark:text-blue-300" : done ? "text-emerald-700 dark:text-emerald-300" : "text-zinc-500 dark:text-zinc-400")}>
          {hop.label}
        </span>
        <span className="text-[9px] text-zinc-400 dark:text-zinc-600 font-mono leading-none">{hop.sublabel}</span>
      </div>
      <span className="text-[9px] text-zinc-400 dark:text-zinc-600 font-mono">#{index + 1}</span>
    </div>
  );
}

function Arrow({ active, done, direction }: { active: boolean; done: boolean; direction?: "forward" | "back" }) {
  return (
    <div className="flex flex-col items-center justify-center gap-0.5 shrink-0 w-10 relative h-8">
      <div className={cn("h-px w-full transition-all duration-500 relative overflow-visible", active ? "bg-blue-400" : done ? "bg-emerald-300 dark:bg-emerald-700" : "bg-zinc-200 dark:bg-zinc-700")}>
        {active && direction === "forward" && (
          <span className="absolute top-1/2 -translate-y-1/2 size-2 rounded-full bg-blue-500 dns-dot-forward" />
        )}
        {active && direction === "back" && (
          <span className="absolute top-1/2 -translate-y-1/2 size-2 rounded-full bg-emerald-500 dns-dot-back" />
        )}
      </div>
    </div>
  );
}

export function DnsLookup({
  domain = "api.example.com",
  recordType = "A",
  result = "93.184.216.34",
  ttl = 300,
  interactive = true,
}: DnsLookupProps) {
  const [activeHop, setActiveHop] = useState<number>(-1);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const explanations = buildExplanations(domain, result, ttl);
  const TOTAL_MS = 39;

  function resolve() {
    if (running) return;
    setDone(false);
    setActiveHop(-1);
    setRunning(true);
    let hop = 0;
    setActiveHop(0);
    intervalRef.current = setInterval(() => {
      hop++;
      if (hop >= HOPS.length) {
        clearInterval(intervalRef.current!);
        setRunning(false);
        setDone(true);
        setActiveHop(HOPS.length - 1);
      } else {
        setActiveHop(hop);
      }
    }, 1200);
  }

  function reset() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setActiveHop(-1);
    setRunning(false);
    setDone(false);
  }

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const currentExplanation = activeHop >= 0 && activeHop < explanations.length ? explanations[activeHop] : null;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <style>{`
        @keyframes dns-forward {
          from { left: 0; opacity: 1; }
          to   { left: calc(100% - 8px); opacity: 0.8; }
        }
        @keyframes dns-back {
          from { left: calc(100% - 8px); opacity: 1; }
          to   { left: 0; opacity: 0.8; }
        }
        .dns-dot-forward { animation: dns-forward 800ms ease-in-out infinite; }
        .dns-dot-back { animation: dns-back 800ms ease-in-out infinite; }
      `}</style>
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-900">
        <Globe className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex-1">DNS Lookup</span>
        <code className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 truncate max-w-[140px]">{domain}</code>
        <span className="text-[10px] font-mono font-semibold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded shrink-0">
          {recordType}
        </span>
      </div>

      <div className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-900">
        Your app asks a chain of nameservers to turn a domain name into an IP address.
      </div>

      <div className="px-4 py-5 flex items-center justify-center gap-1 overflow-x-auto min-h-[200px]">
        {HOPS.map((hop, i) => (
          <div key={hop.id} className="flex items-center gap-1">
            <HopBox
              hop={hop}
              active={activeHop === i}
              done={done || activeHop > i}
              index={i}
            />
            {i < HOPS.length - 1 && (
              <Arrow
                active={activeHop === i || (done && i === HOPS.length - 2)}
                done={done || activeHop > i}
                direction={activeHop === i ? "forward" : done && i >= activeHop ? "back" : "forward"}
              />
            )}
          </div>
        ))}
      </div>

      <div className="mx-4 mb-4 min-h-[100px] rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 px-4 py-3 flex flex-col justify-center transition-all duration-500">
        {!currentExplanation && !done && (
          <p className="text-xs text-zinc-400 text-center">
            {interactive ? 'Click "Resolve" to trace the DNS resolution chain' : "DNS resolution chain diagram"}
          </p>
        )}
        {currentExplanation && (
          <div className="space-y-1.5">
            <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-snug">{currentExplanation.title}</p>
            {currentExplanation.query && (
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <span className="text-zinc-400">ask:</span>
                <span className="text-blue-600 dark:text-blue-400">{currentExplanation.query}</span>
              </div>
            )}
            {currentExplanation.answer && (
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <span className="text-zinc-400">→</span>
                <span className="text-emerald-600 dark:text-emerald-400">{currentExplanation.answer}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-zinc-100 dark:border-zinc-900 px-4 py-3 flex items-center gap-3">
        <span className={cn(
          "text-sm flex-1 transition-all duration-500",
          done ? "text-emerald-700 dark:text-emerald-400 font-semibold" : "text-zinc-500 dark:text-zinc-400"
        )}>
          {done ? (
            <span className="flex items-center gap-2 flex-wrap">
              <CheckCircle2 className="size-4 shrink-0" />
              Resolved: <code className="font-mono">{result}</code>
              <span className="text-xs font-normal text-emerald-600 dark:text-emerald-500">TTL {ttl}s · {TOTAL_MS}ms</span>
            </span>
          ) : (
            <>Step {Math.max(0, activeHop + 1)} of {HOPS.length}{running ? " — resolving…" : ""}</>
          )}
        </span>
        {interactive && (
          <button
            onClick={done ? reset : resolve}
            disabled={running}
            className="flex items-center gap-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0"
          >
            {running ? <RefreshCw className="size-3.5 animate-spin" /> : <Globe className="size-3.5" />}
            {running ? "Resolving…" : done ? "Resolve Again" : "Resolve"}
          </button>
        )}
      </div>
    </div>
  );
}
