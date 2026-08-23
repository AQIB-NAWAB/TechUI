"use client";

import { useState } from "react";
import { z } from "zod";
import { GitBranch, Copy, CheckCircle, AlertTriangle } from "lucide-react";
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
  "content-negotiation": "Content Negotiation",
};

interface StrategyInfo {
  title: string;
  description: string;
  pros: string[];
  cons: string[];
}

const STRATEGY_INFO: Record<Strategy, StrategyInfo> = {
  url: {
    title: "URL Versioning",
    description: "The API version is embedded directly in the URL path.",
    pros: ["Simple and explicit", "Visible in browser & logs", "Easy to test in browser"],
    cons: ["URL changes on version bump", "Not considered 'pure REST'"],
  },
  header: {
    title: "Header Versioning",
    description: "The version is specified in a custom request header.",
    pros: ["Clean, stable URLs", "REST-compliant resource identity"],
    cons: ["Harder to test in browser", "Not visible in access logs"],
  },
  "content-negotiation": {
    title: "Content Negotiation",
    description: "The version is embedded in the Accept media type.",
    pros: ["HTTP-standard approach", "Fine-grained content control"],
    cons: ["Verbose — long header values", "Hard to understand for beginners"],
  },
};

function RequestBlock({
  strategy,
  currentVersion,
  endpoint,
}: {
  strategy: Strategy;
  currentVersion: string;
  endpoint: string;
}) {
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  if (strategy === "url") {
    return (
      <div className="font-mono text-sm leading-relaxed">
        <div className="flex flex-wrap gap-1">
          <span className="text-blue-500 dark:text-blue-400">GET</span>
          <span className="text-zinc-400 dark:text-zinc-500">/api/</span>
          <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-1 rounded">
            {currentVersion}
          </span>
          <span className="text-zinc-700 dark:text-zinc-300">{path}</span>
        </div>
        <div className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500">
          <span className="text-amber-500 dark:text-amber-400">↑</span> version in path
        </div>
      </div>
    );
  }

  if (strategy === "header") {
    return (
      <div className="font-mono text-sm leading-relaxed">
        <div className="flex flex-wrap gap-1">
          <span className="text-blue-500 dark:text-blue-400">GET</span>
          <span className="text-zinc-400 dark:text-zinc-500">/api{path}</span>
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1">
          <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-1 rounded">
            Accept-Version:
          </span>
          <span className="text-zinc-700 dark:text-zinc-300">{currentVersion}</span>
        </div>
        <div className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500">
          <span className="text-amber-500 dark:text-amber-400">↑</span> version in header
        </div>
      </div>
    );
  }

  // content-negotiation
  const vendor = "application/vnd.example";
  return (
    <div className="font-mono text-sm leading-relaxed">
      <div className="flex flex-wrap gap-1">
        <span className="text-blue-500 dark:text-blue-400">GET</span>
        <span className="text-zinc-400 dark:text-zinc-500">/api{path}</span>
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1 items-center">
        <span className="text-zinc-500 dark:text-zinc-400">Accept:</span>
        <span className="text-zinc-700 dark:text-zinc-300">{vendor}.</span>
        <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-1 rounded">
          {currentVersion}
        </span>
        <span className="text-zinc-700 dark:text-zinc-300">+json</span>
      </div>
      <div className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500">
        <span className="text-amber-500 dark:text-amber-400">↑</span> version in media type
      </div>
    </div>
  );
}

function getRequestText(strategy: Strategy, currentVersion: string, endpoint: string): string {
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  if (strategy === "url") return `GET /api/${currentVersion}${path}`;
  if (strategy === "header") return `GET /api${path}\nAccept-Version: ${currentVersion}`;
  return `GET /api${path}\nAccept: application/vnd.example.${currentVersion}+json`;
}

export function ApiVersioning({
  strategy: initialStrategy = "url",
  currentVersion = "v2",
  deprecatedVersion = "v1",
  endpoint = "/products",
}: ApiVersioningProps) {
  const [activeStrategy, setActiveStrategy] = useState<Strategy>(initialStrategy);
  const [copied, setCopied] = useState(false);

  const info = STRATEGY_INFO[activeStrategy];

  const handleCopy = () => {
    const text = getRequestText(activeStrategy, currentVersion, endpoint);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden w-full max-w-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
          <span className="font-semibold text-sm text-zinc-800 dark:text-zinc-100">API Versioning</span>
          <span className="text-xs font-mono text-zinc-400 dark:text-zinc-500">{currentVersion}</span>
        </div>
        {deprecatedVersion && (
          <span className="flex items-center gap-1 text-xs bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">
            <AlertTriangle className="w-3 h-3" /> Deprecated: {deprecatedVersion}
          </span>
        )}
      </div>

      {/* Tab buttons */}
      <div className="flex border-b border-zinc-100 dark:border-zinc-800">
        {(Object.keys(STRATEGY_LABELS) as Strategy[]).map((s) => (
          <button
            key={s}
            onClick={() => setActiveStrategy(s)}
            className={cn(
              "flex-1 px-2 py-2.5 text-xs font-semibold transition-colors",
              activeStrategy === s
                ? "text-zinc-900 dark:text-zinc-100 border-b-2 border-zinc-900 dark:border-white bg-zinc-50 dark:bg-zinc-800"
                : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300"
            )}
          >
            {STRATEGY_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="px-4 pt-4 min-h-[260px]">
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">{info.description}</p>

        {/* Request block */}
        <div className="bg-zinc-950 dark:bg-zinc-950 rounded-lg px-4 py-3 mb-4 relative">
          <RequestBlock
            strategy={activeStrategy}
            currentVersion={currentVersion}
            endpoint={endpoint}
          />
          <button
            onClick={handleCopy}
            className="absolute top-2.5 right-2.5 text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded"
            title="Copy request"
          >
            {copied ? (
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Pros & Cons */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <p className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-1.5">Pros</p>
            <div className="space-y-1">
              {info.pros.map((pro) => (
                <div
                  key={pro}
                  className="flex items-start gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900 rounded-md px-2 py-1"
                >
                  <span className="shrink-0 mt-0.5">✓</span>
                  <span>{pro}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-1.5">Cons</p>
            <div className="space-y-1">
              {info.cons.map((con) => (
                <div
                  key={con}
                  className="flex items-start gap-1.5 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border border-red-100 dark:border-red-900 rounded-md px-2 py-1"
                >
                  <span className="shrink-0 mt-0.5">✗</span>
                  <span>{con}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer note */}
        <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3 pb-3">
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            Our API uses URL versioning —{" "}
            <span className="font-mono text-zinc-600 dark:text-zinc-400">/api/{currentVersion}/...</span>
          </p>
        </div>
      </div>
    </div>
  );
}
