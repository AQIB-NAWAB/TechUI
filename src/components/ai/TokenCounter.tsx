"use client";

import { useState, useMemo } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";

export const TokenCounterSchema = z.object({
  title: z.string().optional().default("Token Counter"),
  text: z.string(),
  model: z.string().optional().default("gpt-4o"),
  contextWindow: z.number().optional().default(128000),
  costPer1kInput: z.number().optional(),
  costPer1kOutput: z.number().optional(),
  interactive: z.boolean().optional().default(true),
});

export type TokenCounterProps = z.infer<typeof TokenCounterSchema>;

function approximateTokenize(text: string): string[] {
  if (!text.trim()) return [];
  const tokens: string[] = [];
  const chunks = text.match(/\s+|[^\s\w]+|\w+/g) ?? [];
  for (const chunk of chunks) {
    if (chunk.length <= 4) {
      tokens.push(chunk);
    } else {
      let i = 0;
      while (i < chunk.length) {
        const len = chunk.length - i > 6 ? (Math.random() > 0.5 ? 3 : 4) : chunk.length - i;
        tokens.push(chunk.slice(i, i + len));
        i += len;
      }
    }
  }
  return tokens;
}

const TOKEN_COLORS = [
  "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300",
  "bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300",
  "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300",
  "bg-violet-100 dark:bg-violet-950/60 text-violet-800 dark:text-violet-300",
  "bg-pink-100 dark:bg-pink-950/60 text-pink-800 dark:text-pink-300",
  "bg-cyan-100 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300",
];

// Static reference pricing per 1M tokens (input)
const MODEL_PRICES: { model: string; input: number; output: number }[] = [
  { model: "GPT-3.5 Turbo", input: 0.50,  output: 1.50  },
  { model: "GPT-4o",        input: 2.50,  output: 10.00 },
  { model: "Claude Haiku",  input: 0.25,  output: 1.25  },
  { model: "Claude Sonnet", input: 3.00,  output: 15.00 },
];

function Stat({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] text-zinc-400 uppercase tracking-wide">{label}</span>
      <span className={cn("text-xs font-semibold text-zinc-700 dark:text-zinc-300", mono && "font-mono")}>{value}</span>
    </div>
  );
}

export function TokenCounter({
  title = "Token Counter",
  text: initialText,
  model = "gpt-4o",
  contextWindow = 128000,
  interactive = true,
}: TokenCounterProps) {
  const [text, setText] = useState(initialText);
  const tokens = useMemo(() => approximateTokenize(text), [text]);
  const count = tokens.length;
  const pct = Math.min(100, (count / contextWindow) * 100);

  const barColor =
    pct >= 95 ? "bg-red-500" :
    pct >= 80 ? "bg-amber-500" :
    "bg-emerald-500";

  const usageLabel =
    pct >= 95 ? "Near limit" :
    pct >= 80 ? "High usage" :
    pct >= 50 ? "Moderate" : "Low usage";

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden text-sm">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/40">
        <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex-1">{title}</span>
        <span className="text-[10px] font-mono text-zinc-400 border border-zinc-200 dark:border-zinc-700 px-1.5 py-0.5 rounded">
          {model}
        </span>
      </div>

      {/* Input area */}
      {interactive ? (
        <div className="px-4 pt-3 pb-0">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full resize-none rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-[12px] text-zinc-700 dark:text-zinc-300 px-3 py-2.5 leading-relaxed focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 placeholder:text-zinc-300 dark:placeholder:text-zinc-600 font-mono"
            rows={4}
            placeholder="Type or paste text to tokenize…"
          />
        </div>
      ) : (
        <div className="px-4 pt-3">
          <div className="text-[12px] text-zinc-600 dark:text-zinc-400 leading-relaxed font-mono whitespace-pre-wrap bg-zinc-50 dark:bg-zinc-900 rounded border border-zinc-100 dark:border-zinc-800 px-3 py-2.5">
            {text || <span className="text-zinc-300 dark:text-zinc-600">No text provided</span>}
          </div>
        </div>
      )}

      {/* Color-coded token visualization */}
      {tokens.length > 0 && (
        <div className="px-4 py-3">
          <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-2">
            Tokens ({count.toLocaleString()})
          </div>
          <div className="flex flex-wrap gap-x-0.5 gap-y-1 max-h-28 overflow-y-auto">
            {tokens.slice(0, 200).map((tok, i) => (
              <span
                key={i}
                className={cn(
                  "inline-block text-[11px] font-mono rounded px-0.5 leading-5",
                  TOKEN_COLORS[i % TOKEN_COLORS.length]
                )}
              >
                {tok === " " ? " " : tok}
              </span>
            ))}
            {tokens.length > 200 && (
              <span className="text-[11px] text-zinc-400 italic">+{tokens.length - 200} more</span>
            )}
          </div>
        </div>
      )}

      {/* Context window meter with danger zones */}
      <div className="px-4 pb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] text-zinc-400">Context window usage</span>
          <span className={cn(
            "text-[10px] font-semibold",
            pct >= 95 ? "text-red-500" : pct >= 80 ? "text-amber-500 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
          )}>
            {usageLabel} · {pct.toFixed(1)}%
          </span>
        </div>
        {/* Segmented bar showing danger zones */}
        <div className="h-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden relative">
          {/* Green zone (0-80%) */}
          <div className="absolute inset-y-0 left-0 w-4/5 bg-emerald-100 dark:bg-emerald-950/30" />
          {/* Amber zone (80-95%) */}
          <div className="absolute inset-y-0 bg-amber-100 dark:bg-amber-950/30" style={{ left: "80%", width: "15%" }} />
          {/* Red zone (95-100%) */}
          <div className="absolute inset-y-0 right-0 w-[5%] bg-red-100 dark:bg-red-950/30" />
          {/* Fill bar */}
          <div
            className={cn("absolute inset-y-0 left-0 rounded-full transition-all duration-500", barColor)}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[10px] font-mono text-zinc-400">{count.toLocaleString()} / {contextWindow.toLocaleString()} tokens</span>
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-emerald-500">●</span><span className="text-[9px] text-zinc-400">Safe</span>
            <span className="text-[9px] text-amber-500">●</span><span className="text-[9px] text-zinc-400">&gt;80%</span>
            <span className="text-[9px] text-red-500">●</span><span className="text-[9px] text-zinc-400">&gt;95%</span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="border-t border-zinc-100 dark:border-zinc-900 px-4 py-2.5 flex items-center gap-4 flex-wrap">
        <Stat label="Characters" value={text.length.toLocaleString()} />
        <Stat label="Words" value={text.split(/\s+/).filter(Boolean).length.toLocaleString()} />
        <Stat label="Tokens" value={count.toLocaleString()} mono />
        <Stat label="Chars/token" value={count > 0 ? (text.length / count).toFixed(1) : "—"} />
      </div>

      {/* Cost comparison table */}
      {count > 0 && (
        <div className="border-t border-zinc-100 dark:border-zinc-900 px-4 py-3">
          <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-2">Cost Estimate (per request)</div>
          <div className="space-y-1.5">
            {MODEL_PRICES.map((m) => {
              const inputCost = ((count / 1_000_000) * m.input).toFixed(6);
              return (
                <div key={m.model} className="flex items-center gap-3">
                  <span className="text-[11px] text-zinc-600 dark:text-zinc-400 w-28 shrink-0">{m.model}</span>
                  <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">${inputCost} input</span>
                  <span className="text-[10px] text-zinc-400 ml-auto">${m.input.toFixed(2)}/1M in · ${m.output.toFixed(2)}/1M out</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
