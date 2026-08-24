"use client";

import { useState, useCallback, useRef } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Layers, Lock, Globe, ChevronRight, X, Network } from "lucide-react";

export const KubernetesIngressSchema = z.object({
  ingressName: z.string().default("freshmarket-ingress"),
  rules: z.array(z.object({
    host: z.string().optional(),
    path: z.string(),
    pathType: z.enum(["Prefix", "Exact"]).optional().default("Prefix"),
    serviceName: z.string(),
    servicePort: z.number(),
    color: z.enum(["blue", "emerald", "violet", "amber"]).optional().default("blue"),
  })).default([
    { path: "/api",    pathType: "Prefix", serviceName: "api-service",      servicePort: 3000, color: "blue"    },
    { path: "/admin",  pathType: "Prefix", serviceName: "admin-service",    servicePort: 4000, color: "violet"  },
    { path: "/static", pathType: "Prefix", serviceName: "static-service",   servicePort: 80,   color: "amber"   },
    { path: "/",       pathType: "Prefix", serviceName: "frontend-service", servicePort: 3000, color: "emerald" },
  ]),
  tls: z.boolean().default(true),
});

export type KubernetesIngressProps = z.infer<typeof KubernetesIngressSchema>;

type Color = "blue" | "emerald" | "violet" | "amber";

const COLOR_MAP: Record<Color, {
  badge: string;
  dot: string;
  border: string;
  row: string;
  text: string;
}> = {
  blue: {
    badge: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    dot: "bg-blue-500",
    border: "border-l-blue-500",
    row: "hover:bg-blue-50 dark:hover:bg-blue-950/10",
    text: "text-blue-600 dark:text-blue-400",
  },
  emerald: {
    badge: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    dot: "bg-emerald-500",
    border: "border-l-emerald-500",
    row: "hover:bg-emerald-50 dark:hover:bg-emerald-950/10",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  violet: {
    badge: "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800",
    dot: "bg-violet-500",
    border: "border-l-violet-500",
    row: "hover:bg-violet-50 dark:hover:bg-violet-950/10",
    text: "text-violet-600 dark:text-violet-400",
  },
  amber: {
    badge: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    dot: "bg-amber-500",
    border: "border-l-amber-500",
    row: "hover:bg-amber-50 dark:hover:bg-amber-950/10",
    text: "text-amber-600 dark:text-amber-400",
  },
};

type AnimState = {
  phase: "idle" | "arriving" | "matching" | "forwarding" | "done";
  matchedRuleIdx: number | null;
  requestPath: string;
};

function matchRule(
  path: string,
  rules: KubernetesIngressProps["rules"]
): number {
  for (let i = 0; i < rules.length; i++) {
    const r = rules[i]!;
    if (r.pathType === "Exact") {
      if (path === r.path) return i;
    } else {
      // Prefix
      if (path === r.path || path.startsWith(r.path === "/" ? "/" : r.path + "/") || path === r.path) {
        return i;
      }
    }
  }
  return rules.length - 1; // fallback to last (usually /)
}

export function KubernetesIngress({
  ingressName = "freshmarket-ingress",
  rules = [
    { path: "/api",    pathType: "Prefix" as const, serviceName: "api-service",      servicePort: 3000, color: "blue"    as const },
    { path: "/admin",  pathType: "Prefix" as const, serviceName: "admin-service",    servicePort: 4000, color: "violet"  as const },
    { path: "/static", pathType: "Prefix" as const, serviceName: "static-service",   servicePort: 80,   color: "amber"   as const },
    { path: "/",       pathType: "Prefix" as const, serviceName: "frontend-service", servicePort: 3000, color: "emerald" as const },
  ],
  tls = true,
}: KubernetesIngressProps) {
  const [anim, setAnim] = useState<AnimState>({ phase: "idle", matchedRuleIdx: null, requestPath: "" });
  const [selectedRule, setSelectedRule] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const animateRequest = useCallback((ruleIdx: number) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const rule = rules[ruleIdx]!;
    const examplePath = rule.path === "/" ? "/" : rule.path + "/example";

    setSelectedRule(null);
    setAnim({ phase: "arriving", matchedRuleIdx: null, requestPath: examplePath });

    timerRef.current = setTimeout(() => {
      setAnim((prev) => ({ ...prev, phase: "matching", matchedRuleIdx: ruleIdx }));
      timerRef.current = setTimeout(() => {
        setAnim((prev) => ({ ...prev, phase: "forwarding" }));
        timerRef.current = setTimeout(() => {
          setAnim((prev) => ({ ...prev, phase: "done" }));
        }, 900);
      }, 900);
    }, 800);
  }, [rules]);

  const reset = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setAnim({ phase: "idle", matchedRuleIdx: null, requestPath: "" });
    setSelectedRule(null);
  };

  const matchedRule = anim.matchedRuleIdx !== null ? rules[anim.matchedRuleIdx] : null;
  const matchedColor = matchedRule ? (matchedRule.color ?? "blue") as Color : "blue";

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <Layers className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">Kubernetes Ingress</span>
        <code className="text-[10px] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
          {ingressName}
        </code>
        {tls && (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.5 rounded-full">
            <Lock className="size-2.5" /> TLS
          </span>
        )}
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        One front door for your cluster — routes incoming URLs to the right internal service.
      </p>

      <div className="min-h-[220px] p-4 flex flex-col gap-3">

        {/* Ingress controller box */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-zinc-400 dark:text-zinc-500">
            <Globe className="size-3.5" />
            <span className="text-[10px] font-semibold">Internet</span>
          </div>
          <ChevronRight className="size-3.5 text-zinc-300 dark:text-zinc-600" />
          <div className={cn(
            "flex-1 flex items-center gap-2 border rounded-lg px-3 py-2 transition-all duration-500",
            anim.phase !== "idle"
              ? "bg-blue-50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-700"
              : "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700"
          )}>
            <Network className={cn("size-3.5 transition-all duration-500", anim.phase !== "idle" ? "text-blue-500" : "text-zinc-400")} />
            <div>
              <p className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">Ingress Controller</p>
              <p className="text-[9px] text-zinc-400 dark:text-zinc-500">nginx · routes by path/host</p>
            </div>
            {tls && (
              <div className="ml-auto flex items-center gap-1 text-[9px] text-emerald-600 dark:text-emerald-400">
                <Lock className="size-2.5" />
                <span>HTTPS → HTTP (inside cluster)</span>
              </div>
            )}
          </div>
        </div>

        {/* Request animation banner */}
        {anim.phase !== "idle" && (
          <div className={cn(
            "rounded-lg border px-3 py-2 transition-all duration-500 flex items-center gap-2",
            anim.phase === "done" && matchedRule
              ? `${COLOR_MAP[matchedColor].badge}`
              : "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700"
          )}>
            <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
              GET <span className="font-bold text-zinc-700 dark:text-zinc-200">{anim.requestPath}</span>
            </span>
            <ChevronRight className="size-3 text-zinc-300" />
            {anim.phase === "arriving" && <span className="text-[10px] text-zinc-400 animate-pulse">arriving at ingress...</span>}
            {anim.phase === "matching" && matchedRule && (
              <span className={cn("text-[10px] font-semibold animate-pulse", COLOR_MAP[matchedColor].text)}>
                matches {matchedRule.path} → {matchedRule.serviceName}
              </span>
            )}
            {anim.phase === "forwarding" && matchedRule && (
              <span className={cn("text-[10px] font-semibold", COLOR_MAP[matchedColor].text)}>
                forwarding to {matchedRule.serviceName}:{matchedRule.servicePort}...
              </span>
            )}
            {anim.phase === "done" && matchedRule && (
              <span className={cn("text-[10px] font-bold", COLOR_MAP[matchedColor].text)}>
                ✓ routed to {matchedRule.serviceName}:{matchedRule.servicePort}
              </span>
            )}
            <button onClick={reset} className="ml-auto p-0.5 text-zinc-400 hover:text-zinc-600 transition-colors">
              <X className="size-3" />
            </button>
          </div>
        )}

        {/* Routing rules table */}
        <div className="flex-1">
          <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-1.5">
            Routing rules (matched top-to-bottom):
          </p>
          <div className="border border-zinc-100 dark:border-zinc-800 rounded-lg overflow-hidden">
            {rules.map((rule, i) => {
              const color = (rule.color ?? "blue") as Color;
              const colors = COLOR_MAP[color];
              const isMatched = anim.matchedRuleIdx === i;
              const isSelected = selectedRule === i;

              return (
                <div
                  key={i}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 border-l-2 cursor-pointer transition-all duration-500",
                    i > 0 ? "border-t border-zinc-50 dark:border-zinc-800/60" : "",
                    colors.border,
                    isMatched || isSelected
                      ? `${colors.row} bg-opacity-100`
                      : "hover:bg-zinc-50 dark:hover:bg-zinc-800/40",
                    isMatched && "ring-1 ring-inset ring-blue-200 dark:ring-blue-800"
                  )}
                  onClick={() => setSelectedRule(isSelected ? null : i)}
                >
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-600 w-4 shrink-0">{i + 1}</span>

                  {/* Path */}
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    {rule.host && (
                      <code className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 shrink-0">{rule.host}</code>
                    )}
                    <code className={cn("text-[11px] font-mono font-bold", colors.text)}>{rule.path}</code>
                    <span className="text-[9px] text-zinc-300 dark:text-zinc-600">
                      {rule.pathType === "Exact" ? "[Exact]" : "[Prefix]"}
                    </span>
                  </div>

                  <ChevronRight className="size-3 text-zinc-300 dark:text-zinc-600 shrink-0" />

                  {/* Service */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={cn("text-[10px] font-semibold border px-1.5 py-0.5 rounded-md", colors.badge)}>
                      {rule.serviceName}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">:{rule.servicePort}</span>
                  </div>

                  {/* Route button removed — use footer action */}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected rule examples — fixed height slot */}
        <div className="min-h-[60px]">
          {selectedRule !== null && rules[selectedRule] && (
            <div className={cn(
              "rounded-lg border px-3 py-2 transition-all duration-500",
              COLOR_MAP[(rules[selectedRule]!.color ?? "blue") as Color].badge
            )}>
              <p className="text-[10px] font-semibold">
                URLs matching <code className="font-mono">{rules[selectedRule]!.path}</code>:
              </p>
              <code className="block text-[10px] font-mono text-emerald-700 dark:text-emerald-300 mt-0.5">
                ✓ {rules[selectedRule]!.path}/…
              </code>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/30">
        <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">
          {anim.phase === "done" && matchedRule
            ? `✓ Routed to ${matchedRule.serviceName}:${matchedRule.servicePort}`
            : "Select a rule and route a test request through the ingress"}
        </span>
        <button
          onClick={() => animateRequest(selectedRule ?? 0)}
          className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Route Request
        </button>
      </div>
    </div>
  );
}
