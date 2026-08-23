"use client";

import { useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { ArrowRight, ChevronDown } from "lucide-react";

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
}: ModelCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const tc = TASK_CFG[task] ?? TASK_CFG["text-generation"]!;
  const numBlocks = parameters ? paramToBlocks(parameters) : 3;

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden text-sm">

      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-900">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-sm font-semibold font-mono text-zinc-900 dark:text-zinc-100 flex-1 truncate">{name}</h2>
          {version && (
            <span className="text-[10px] font-mono text-zinc-400 border border-zinc-200 dark:border-zinc-700 px-1.5 py-0.5 rounded shrink-0">
              {version}
            </span>
          )}
          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded border", tc.color, tc.bg)}>
            {tc.label}
          </span>
          <button
            onClick={() => setShowDetails((v) => !v)}
            className="flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all duration-500 shrink-0"
          >
            {showDetails ? "Less" : "Details"}
            <ChevronDown className={cn("size-3 transition-transform duration-500", showDetails && "rotate-180")} />
          </button>
        </div>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400">{provider}</span>
          {parameters && <><span className="text-zinc-300 dark:text-zinc-700">·</span><span className="text-[11px] text-zinc-500 dark:text-zinc-400">{parameters} params</span></>}
          {license && <><span className="text-zinc-300 dark:text-zinc-700">·</span><span className="text-[11px] text-zinc-500 dark:text-zinc-400">{license}</span></>}
        </div>
      </div>

      {/* Architecture visual */}
      <div className="px-4 py-4 border-b border-zinc-100 dark:border-zinc-900">
        <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-3">Architecture</div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Input */}
          <div className="flex flex-col items-center gap-1">
            <div className="px-2 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 text-[10px] font-semibold text-blue-700 dark:text-blue-400">
              Input tokens
            </div>
            <div className="flex gap-0.5">
              {inputModalities.map((m) => (
                <span key={m} className="text-[8px] text-zinc-400">{m}</span>
              ))}
            </div>
          </div>

          <ArrowRight className="size-4 text-zinc-300 dark:text-zinc-600 shrink-0" />

          {/* Transformer blocks */}
          <div className="flex items-center gap-1">
            {Array.from({ length: numBlocks }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-0.5"
                style={{ opacity: 1 - i * (0.08) }}
              >
                <div className="w-8 h-10 rounded border-2 border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-950/40 flex items-center justify-center">
                  <span className="text-[8px] font-bold text-violet-600 dark:text-violet-400 rotate-90 whitespace-nowrap">Layer</span>
                </div>
              </div>
            ))}
            <span className="text-[10px] text-zinc-400 ml-1">×{numBlocks > 3 ? "32+" : "12+"}</span>
          </div>

          <ArrowRight className="size-4 text-zinc-300 dark:text-zinc-600 shrink-0" />

          {/* Output */}
          <div className="flex flex-col items-center gap-1">
            <div className="px-2 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
              Output tokens
            </div>
            <div className="flex gap-0.5">
              {outputModalities.map((m) => (
                <span key={m} className="text-[8px] text-zinc-400">{m}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-2 text-[10px] text-zinc-400 font-mono">{architecture}</div>
      </div>

      {/* Context window */}
      {showDetails && contextLength && (
        <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-900 transition-all duration-500">
          <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-2">Context Window</div>
          <div className="h-3 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden relative">
            {/* Your typical prompt (~2K tokens) */}
            <div
              className="absolute h-full rounded-full bg-blue-500"
              style={{ width: `${Math.min(100, (2000 / contextLength) * 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5 text-[10px]">
            <span className="text-blue-500 dark:text-blue-400">Typical prompt (~2K tokens)</span>
            <span className="font-mono font-semibold text-zinc-600 dark:text-zinc-400">{contextLength.toLocaleString()} tokens max</span>
          </div>
        </div>
      )}

      {/* Benchmark bars */}
      {showDetails && metrics && metrics.length > 0 && (
        <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-900 transition-all duration-500">
          <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-3">Benchmarks</div>
          <div className="space-y-2.5">
            {metrics.map((m, i) => {
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
                  <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
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

      {/* Footer */}
      <div className="px-4 py-2 flex items-center gap-3 text-[10px] text-zinc-400 flex-wrap">
        {languages && languages.length > 0 && (
          <span>Languages: {languages.slice(0, 3).join(", ")}{languages.length > 3 ? ` +${languages.length - 3}` : ""}</span>
        )}
      </div>
    </div>
  );
}
