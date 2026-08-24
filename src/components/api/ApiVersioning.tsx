"use client";

import { useState } from "react";
import { z } from "zod";
import { GitBranch, CheckCircle, XCircle, AlertTriangle, Monitor, Server, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const ApiVersioningSchema = z.object({
  strategy: z.enum(["url", "header", "content-negotiation"]).default("url"),
  currentVersion: z.string().default("v2"),
  deprecatedVersion: z.string().optional().default("v1"),
  endpoint: z.string().default("/products"),
});

export type ApiVersioningProps = z.infer<typeof ApiVersioningSchema>;

type Strategy = "url" | "header" | "content-negotiation";

const STRATEGY_LABELS: Record<Strategy, string> = {
  url: "URL",
  header: "Header",
  "content-negotiation": "Accept",
};

const FEATURES: Record<Strategy, { label: string; ok: boolean }[]> = {
  url: [
    { label: "Visible in browser", ok: true },
    { label: "Easy to test", ok: true },
    { label: "Clean URLs", ok: false },
  ],
  header: [
    { label: "Stable URLs", ok: true },
    { label: "REST-compliant", ok: true },
    { label: "Visible in browser", ok: false },
  ],
  "content-negotiation": [
    { label: "HTTP standard", ok: true },
    { label: "Fine-grained", ok: true },
    { label: "Beginner-friendly", ok: false },
  ],
};

function RequestBlock({ strategy, currentVersion, endpoint }: { strategy: Strategy; currentVersion: string; endpoint: string }) {
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  if (strategy === "url") {
    return (
      <div className="font-mono text-sm leading-relaxed">
        <span className="text-blue-500 dark:text-blue-400">GET </span>
        <span className="text-zinc-400">/api/</span>
        <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-1 rounded">{currentVersion}</span>
        <span className="text-zinc-700 dark:text-zinc-300">{path}</span>
      </div>
    );
  }
  if (strategy === "header") {
    return (
      <div className="font-mono text-sm leading-relaxed space-y-1">
        <div><span className="text-blue-500">GET </span><span className="text-zinc-400">/api{path}</span></div>
        <div>
          <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-1 rounded">Accept-Version: </span>
          <span className="text-zinc-700 dark:text-zinc-300">{currentVersion}</span>
        </div>
      </div>
    );
  }
  return (
    <div className="font-mono text-sm leading-relaxed space-y-1">
      <div><span className="text-blue-500">GET </span><span className="text-zinc-400">/api{path}</span></div>
      <div>
        <span className="text-zinc-500">Accept: </span>
        <span className="text-zinc-700">application/vnd.example.</span>
        <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-1 rounded">{currentVersion}</span>
        <span className="text-zinc-700">+json</span>
      </div>
    </div>
  );
}

export function ApiVersioning({
  strategy: initialStrategy = "url",
  currentVersion = "v2",
  deprecatedVersion = "v1",
  endpoint = "/products",
}: ApiVersioningProps) {
  const [activeStrategy, setActiveStrategy] = useState<Strategy>(initialStrategy);
  const [sent, setSent] = useState(false);
  const [animating, setAnimating] = useState(false);

  function sendRequest() {
    if (animating) return;
    setSent(false);
    setAnimating(true);
    setTimeout(() => {
      setSent(true);
      setAnimating(false);
    }, 1200);
  }

  const features = FEATURES[activeStrategy];

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden w-full">
      <div className="flex items-center gap-2 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800">
        <GitBranch className="size-4 text-zinc-500 dark:text-zinc-400 shrink-0" />
        <span className="font-semibold text-sm text-zinc-800 dark:text-zinc-100 flex-1">API Versioning</span>
        <span className="text-xs font-mono text-zinc-400">{currentVersion}</span>
        {deprecatedVersion && (
          <span className="flex items-center gap-1 text-[10px] bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">
            <AlertTriangle className="size-3" /> {deprecatedVersion} deprecated
          </span>
        )}
      </div>

      <div className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        APIs evolve — versioning tells the server which contract the client expects.
      </div>

      <div className="flex border-b border-zinc-100 dark:border-zinc-800">
        {(Object.keys(STRATEGY_LABELS) as Strategy[]).map((s) => (
          <button
            key={s}
            onClick={() => { setActiveStrategy(s); setSent(false); }}
            className={cn(
              "flex-1 px-2 py-2 text-xs font-semibold transition-all duration-500",
              activeStrategy === s
                ? "text-zinc-900 dark:text-zinc-100 border-b-2 border-zinc-900 dark:border-white bg-zinc-50 dark:bg-zinc-800"
                : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300"
            )}
          >
            {STRATEGY_LABELS[s]}
          </button>
        ))}
      </div>

      <div className="min-h-[260px] px-4 py-4 flex flex-col justify-center gap-4">
        <div className="flex items-center justify-center gap-3">
          <div className="flex flex-col items-center gap-1">
            <div className="size-10 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
              <Monitor className="size-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-[10px] font-semibold text-zinc-500">Client</span>
          </div>

          <div className="flex-1 relative h-8 flex items-center">
            <div className={cn("absolute inset-y-1/2 h-0.5 bg-zinc-200 dark:bg-zinc-700 transition-all duration-700", sent || animating ? "w-full" : "w-0")} />
            {(animating || sent) && (
              <div
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 size-2.5 rounded-full transition-all duration-700",
                  sent ? "left-full -translate-x-full bg-emerald-500" : "left-0 bg-blue-500 animate-pulse"
                )}
                style={animating ? { animation: "none", left: "50%" } : undefined}
              />
            )}
            <ArrowRight className={cn("absolute right-0 size-4 transition-all duration-500", sent ? "text-emerald-500" : "text-zinc-300")} />
          </div>

          <div className={cn(
            "flex flex-col items-center gap-1 transition-all duration-500",
            sent && "scale-105"
          )}>
            <div className={cn(
              "size-10 rounded-lg border flex items-center justify-center transition-all duration-500",
              sent
                ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/30"
                : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
            )}>
              <Server className={cn("size-5 transition-colors duration-500", sent ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-500")} />
            </div>
            <span className="text-[10px] font-semibold text-zinc-500">API {currentVersion}</span>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-950 px-4 py-3 transition-all duration-500">
          <RequestBlock strategy={activeStrategy} currentVersion={currentVersion} endpoint={endpoint} />
        </div>

        {sent && (
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-400 transition-all duration-500">
            <CheckCircle className="size-3.5 inline mr-1.5 -mt-0.5" />
            200 OK — server routed to <span className="font-mono font-bold">{currentVersion}</span> handlers
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {features.map((f) => (
            <div
              key={f.label}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium border transition-all duration-500",
                f.ok
                  ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400"
                  : "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-zinc-400"
              )}
            >
              {f.ok ? <CheckCircle className="size-3" /> : <XCircle className="size-3" />}
              {f.label}
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
        <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">
          {sent ? "Request delivered to the correct API version" : `Version sent via ${STRATEGY_LABELS[activeStrategy].toLowerCase()}`}
        </span>
        <button
          onClick={sendRequest}
          disabled={animating}
          className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          Send Request
        </button>
      </div>
    </div>
  );
}
