"use client";

import { useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { ArrowRight, ChevronDown, Brain } from "lucide-react";

const MetricSchema = z.object({
  name: z.string(),
  value: z.string(),
  benchmark: z.string().optional(),
  description: z.string().optional(),
});

export const ModelCardSchema = z.object({
  name: z.string().default("llama-3-8b-instruct"),
  provider: z.string().optional().default("Meta"),
  version: z.string().optional(),
  task: z.enum([
    "text-generation", "text-classification", "embeddings",
    "image-classification", "object-detection", "speech-to-text",
    "code-generation", "question-answering", "summarization",
  ]).default("text-generation"),
  architecture: z.string().optional().default("Transformer (decoder-only)"),
  parameters: z.string().optional(),
  contextLength: z.number().optional(),
  license: z.string().optional().default("Apache 2.0"),
  languages: z.array(z.string()).optional(),
  metrics: z.array(MetricSchema).optional(),
  inputModalities: z.array(z.string()).optional().default(["text"]),
  outputModalities: z.array(z.string()).optional().default(["text"]),
  intendedUse: z.string().optional(),
  limitations: z.string().optional(),
  interactive: z.boolean().optional().default(true),
});

export type ModelCardProps = z.infer<typeof ModelCardSchema>;

const TASK_CFG: Record<string, { label: string; color: string; bg: string }> = {
  "text-generation":    { label: "Text Gen",      color: "text-blue-700 dark:text-blue-400",    bg: "bg-blue-100 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800"       },
  "text-classification":{ label: "Classification", color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800" },
  "embeddings":         { label: "Embeddings",    color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800" },
  "image-classification":{ label: "Vision",       color: "text-amber-700 dark:text-amber-400",  bg: "bg-amber-100 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800"   },
  "object-detection":   { label: "Vision",        color: "text-amber-700 dark:text-amber-400",  bg: "bg-amber-100 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800"   },
  "speech-to-text":     { label: "Speech",        color: "text-pink-700 dark:text-pink-400",    bg: "bg-pink-100 dark:bg-pink-950/40 border-pink-200 dark:border-pink-800"       },
  "code-generation":    { label: "Code",          color: "text-violet-700 dark:text-violet-400", bg: "bg-violet-100 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800" },
  "question-answering": { label: "Q&A",           color: "text-blue-700 dark:text-blue-400",    bg: "bg-blue-100 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800"       },
  "summarization":      { label: "Summarization", color: "text-cyan-700 dark:text-cyan-400",    bg: "bg-cyan-100 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800"       },
};

function paramToBlocks(params: string): number {
  const n = parseFloat(params);
  if (params.includes("70") || n >= 70) return 5;
  if (params.includes("30") || n >= 30) return 4;
  if (params.includes("13") || n >= 13) return 3;
  if (params.includes("7") || n >= 7) return 3;
  return 2;
}

function parseMetricValue(val: string): number {
  const n = parseFloat(val.replace("%", ""));
  return isNaN(n) ? 0 : Math.min(100, n);
}

export function ModelCard({
  name = "llama-3-8b-instruct",
  provider = "Meta",
  version,
  task = "text-generation",
  architecture = "Transformer (decoder-only)",
  parameters,
  contextLength,
  license = "Apache 2.0",
  languages,
  metrics,
  inputModalities = ["text"],
  outputModalities = ["text"],
  intendedUse,
  limitations,
  interactive = true,
}: ModelCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const tc = TASK_CFG[task] ?? TASK_CFG["text-generation"]!;
  const numBlocks = parameters ? paramToBlocks(parameters) : 3;
  const typicalPromptPct = contextLength ? Math.min(100, (2000 / contextLength) * 100) : 0;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden text-sm">

      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800">
        <Brain className="size-4 text-violet-500 shrink-0" />
        <h2 className="text-sm font-semibold font-mono text-zinc-900 dark:text-zinc-100 flex-1 truncate">{name}</h2>
        {version && (
          <span className="text-[10px] font-mono text-zinc-400 border border-zinc-200 dark:border-zinc-700 px-1.5 py-0.5 rounded shrink-0">
            {version}
          </span>
        )}
        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded border shrink-0", tc.color, tc.bg)}>
          {tc.label}
        </span>
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        {provider}{parameters ? ` · ${parameters} parameters` : ""} — how this AI model is built and what it can do.
      </p>

      <div className="min-h-[220px] px-4 py-4 space-y-4">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2">Architecture</div>
          <div className="flex items-center justify-center gap-2 flex-wrap border border-zinc-100 dark:border-zinc-800 rounded-lg p-4 bg-zinc-50 dark:bg-zinc-800/50 min-h-[88px]">
            <div className="flex flex-col items-center gap-1">
              <div className="px-2.5 py-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 text-[10px] font-semibold text-blue-700 dark:text-blue-400">
                Input
              </div>
              <div className="flex gap-0.5">
                {inputModalities.map((m) => (
                  <span key={m} className="text-[8px] text-zinc-400">{m}</span>
                ))}
              </div>
            </div>

            <ArrowRight className="size-4 text-zinc-300 dark:text-zinc-600 shrink-0" />

            <div className="flex flex-col items-center gap-1">
              <div className="flex items-end gap-0.5">
                {Array.from({ length: numBlocks }).map((_, i) => (
                  <div
                    key={i}
                    className="w-6 rounded-sm border border-violet-300 dark:border-violet-700 bg-violet-100 dark:bg-violet-950/50 flex flex-col items-center justify-end overflow-hidden transition-all duration-500"
                    style={{ height: `${28 + i * 4}px`, opacity: 1 - i * 0.08 }}
                  >
                    <div className="w-full h-1 bg-violet-400/40 dark:bg-violet-600/40" />
                    <div className="w-full h-1 bg-violet-300/30 dark:bg-violet-700/30 mt-px" />
                    <span className="text-[7px] font-bold text-violet-600 dark:text-violet-400 py-0.5">T</span>
                  </div>
                ))}
              </div>
              <span className="text-[9px] text-zinc-400 font-mono">×{numBlocks > 3 ? "32" : "12"} layers</span>
            </div>

            <ArrowRight className="size-4 text-zinc-300 dark:text-zinc-600 shrink-0" />

            <div className="flex flex-col items-center gap-1">
              <div className="px-2.5 py-2 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                Output
              </div>
              <div className="flex gap-0.5">
                {outputModalities.map((m) => (
                  <span key={m} className="text-[8px] text-zinc-400">{m}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-2 text-[10px] text-zinc-400 font-mono text-center">{architecture}</div>
        </div>

        {contextLength && (
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2">Context Window</div>
            <div className="relative h-4 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden border border-zinc-200 dark:border-zinc-700">
              <div className="absolute inset-0 flex">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="flex-1 border-r border-zinc-200/50 dark:border-zinc-700/50 last:border-r-0" />
                ))}
              </div>
              <div
                className="absolute h-full rounded-full bg-blue-500 transition-all duration-700"
                style={{ width: `${typicalPromptPct}%` }}
              />
              <div
                className="absolute top-0 bottom-0 w-px bg-blue-700 dark:bg-blue-300 transition-all duration-700"
                style={{ left: `${typicalPromptPct}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-1.5 text-[10px]">
              <span className="text-blue-500 dark:text-blue-400">Typical prompt (~2K tokens)</span>
              <span className="font-mono font-semibold text-zinc-600 dark:text-zinc-400">{contextLength.toLocaleString()} max</span>
            </div>
          </div>
        )}

        {metrics && metrics.length > 0 && (
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2">Benchmarks</div>
            <div className="space-y-2.5">
              {metrics.slice(0, 3).map((m, i) => {
                const pct = parseMetricValue(m.value);
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <span className="text-[11px] text-zinc-600 dark:text-zinc-400">{m.name}</span>
                        {m.benchmark && <span className="text-[10px] text-zinc-400 ml-1.5 font-mono">{m.benchmark}</span>}
                      </div>
                      <span className="text-[11px] font-semibold font-mono text-zinc-800 dark:text-zinc-200">{m.value}</span>
                    </div>
                    <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-violet-500 transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className={cn(
          "rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 p-3 min-h-[52px] transition-all duration-500",
          !showDetails && "opacity-50"
        )}>
          {showDetails && (intendedUse || limitations || (metrics && metrics.length > 3)) ? (
            <div className="space-y-2">
              {intendedUse && (
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">{intendedUse}</p>
              )}
              {limitations && (
                <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">{limitations}</p>
              )}
              {metrics && metrics.length > 3 && metrics.slice(3).map((m, i) => {
                const pct = parseMetricValue(m.value);
                return (
                  <div key={i + 3}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] text-zinc-600 dark:text-zinc-400">{m.name}</span>
                      <span className="text-[11px] font-semibold font-mono text-zinc-800 dark:text-zinc-200">{m.value}</span>
                    </div>
                    <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                      <div className="h-full rounded-full bg-violet-500 transition-all duration-700" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              {languages && languages.length > 0 && (
                <p className="text-[10px] text-zinc-400">
                  Languages: {languages.slice(0, 3).join(", ")}{languages.length > 3 ? ` +${languages.length - 3}` : ""}
                </p>
              )}
            </div>
          ) : (
            <p className="text-[11px] text-zinc-400 italic">
              {showDetails ? "No extra details provided." : "Tap Show Details for use cases and limits."}
            </p>
          )}
        </div>
      </div>

      {interactive && (
        <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/30">
          <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">
            {showDetails ? `${license} license · details expanded` : `${license} license · architecture at a glance`}
          </span>
          <button
            type="button"
            onClick={() => setShowDetails((v) => !v)}
            className="flex items-center gap-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity shrink-0"
          >
            {showDetails ? "Hide Details" : "Show Details"}
            <ChevronDown className={cn("size-4 transition-transform duration-500", showDetails && "rotate-180")} />
          </button>
        </div>
      )}
    </div>
  );
}
