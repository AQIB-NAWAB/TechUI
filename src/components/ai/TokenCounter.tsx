"use client";

import { useState, useMemo } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Hash } from "lucide-react";

const SAMPLE_TEXT =
  "The attention mechanism in transformers computes a weighted sum of values, where weights are determined by the compatibility of queries and keys. This allows the model to focus on relevant parts of the input sequence regardless of distance.";

export const TokenCounterSchema = z.object({
  title: z.string().optional().default("Token Counter"),
  text: z.string().optional().default(SAMPLE_TEXT),
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
        const len = chunk.length - i > 6 ? (i % 2 === 0 ? 3 : 4) : chunk.length - i;
        tokens.push(chunk.slice(i, i + len));
        i += len;
      }
    }
  }
  return tokens;
}

const TOKEN_COLORS = [
  "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  "bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  "bg-violet-100 dark:bg-violet-950/60 text-violet-800 dark:text-violet-300 border-violet-200 dark:border-violet-800",
  "bg-pink-100 dark:bg-pink-950/60 text-pink-800 dark:text-pink-300 border-pink-200 dark:border-pink-800",
  "bg-cyan-100 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800",
];

const MODEL_PRICES: { model: string; match: RegExp; input: number; output: number }[] = [
  { model: "GPT-3.5 Turbo", match: /gpt-3\.5|3\.5-turbo/i, input: 0.50,  output: 1.50  },
  { model: "GPT-4o",        match: /gpt-4o|4o/i,             input: 2.50,  output: 10.00 },
  { model: "Claude Haiku",  match: /haiku/i,                   input: 0.25,  output: 1.25  },
  { model: "Claude Sonnet", match: /sonnet|claude-3/i,         input: 3.00,  output: 15.00 },
];

function Stat({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] text-zinc-400 uppercase tracking-wide">{label}</span>
      <span className={cn("text-xs font-semibold text-zinc-700 dark:text-zinc-300", mono && "font-mono")}>{value}</span>
    </div>
  );
}

function matchesModel(selected: string, entry: typeof MODEL_PRICES[0]): boolean {
  return entry.match.test(selected);
}

export function TokenCounter({
  title = "Token Counter",
  text: initialText = SAMPLE_TEXT,
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

  const footerStatus = count === 0
    ? "Load sample text to see how LLMs split input into tokens"
    : `${count.toLocaleString()} tokens · ${usageLabel.toLowerCase()} for ${model}`;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden text-sm">
      <div className="flex items-center gap-3 h-12 px-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
        <Hash className="size-4 text-violet-500 shrink-0" />
        <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex-1">{title}</span>
        <span className="text-[10px] font-mono text-zinc-400 border border-zinc-200 dark:border-zinc-700 px-1.5 py-0.5 rounded">
          {model}
        </span>
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        LLMs charge and truncate by tokens — not characters or words.
      </p>

      <div className="min-h-[220px] px-4 py-3 flex flex-col gap-3">
        {interactive ? (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full resize-none rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-[12px] text-zinc-700 dark:text-zinc-300 px-3 py-2 leading-relaxed focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 placeholder:text-zinc-300 dark:placeholder:text-zinc-600 font-mono transition-all duration-500"
            rows={2}
            placeholder="Type or paste text to tokenize…"
          />
        ) : (
          <div className="text-[12px] text-zinc-600 dark:text-zinc-400 leading-relaxed font-mono whitespace-pre-wrap bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-100 dark:border-zinc-800 px-3 py-2 line-clamp-2">
            {text || <span className="text-zinc-300 dark:text-zinc-600">No text provided</span>}
          </div>
        )}

        <div className="flex-1 min-h-0 flex flex-col gap-2">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
            Tokens ({count.toLocaleString()})
          </div>
          {tokens.length > 0 ? (
            <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto border border-zinc-100 dark:border-zinc-800 rounded-lg p-2 bg-zinc-50 dark:bg-zinc-800/50">
              {tokens.slice(0, 80).map((tok, i) => (
                <span
                  key={i}
                  className={cn(
                    "inline-block text-[11px] font-mono rounded px-1 py-0.5 border leading-5 transition-all duration-500",
                    TOKEN_COLORS[i % TOKEN_COLORS.length]
                  )}
                >
                  {tok === " " ? "\u00a0" : tok}
                </span>
              ))}
              {tokens.length > 80 && (
                <span className="text-[11px] text-zinc-400 italic self-center">+{tokens.length - 80} more</span>
              )}
            </div>
          ) : (
            <div className="text-[11px] text-zinc-400 italic h-12 flex items-center justify-center border border-dashed border-zinc-200 dark:border-zinc-700 rounded-lg">
              Tokens appear here
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Context window</span>
              <span className={cn(
                "text-[10px] font-semibold transition-all duration-500",
                pct >= 95 ? "text-red-500" : pct >= 80 ? "text-amber-500 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
              )}>
                {usageLabel} · {pct.toFixed(1)}%
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden relative border border-zinc-200 dark:border-zinc-700">
              <div className="absolute inset-y-0 left-0 w-4/5 bg-emerald-100/80 dark:bg-emerald-950/30" />
              <div className="absolute inset-y-0 bg-amber-100/80 dark:bg-amber-950/30" style={{ left: "80%", width: "15%" }} />
              <div className="absolute inset-y-0 right-0 w-[5%] bg-red-100/80 dark:bg-red-950/30" />
              <div
                className={cn("absolute inset-y-0 left-0 rounded-full transition-all duration-500", barColor)}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="text-[10px] font-mono text-zinc-400 mt-1">
              {count.toLocaleString()} / {contextWindow.toLocaleString()} tokens
            </div>
          </div>

          <div className="flex items-center gap-4 flex-wrap border-t border-zinc-100 dark:border-zinc-800 pt-2">
            <Stat label="Chars" value={text.length.toLocaleString()} />
            <Stat label="Words" value={text.split(/\s+/).filter(Boolean).length.toLocaleString()} />
            <Stat label="Tokens" value={count.toLocaleString()} mono />
            <Stat label="Chars/token" value={count > 0 ? (text.length / count).toFixed(1) : "—"} />
          </div>

          {count > 0 && (
            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-2 space-y-1 max-h-[72px] overflow-y-auto">
              {MODEL_PRICES.filter((m) => matchesModel(model, m) || count > 0).slice(0, 2).map((m) => {
                const inputCost = ((count / 1_000_000) * m.input).toFixed(6);
                const isSelected = matchesModel(model, m);
                return (
                  <div
                    key={m.model}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-2 py-1 transition-all duration-500 text-[10px]",
                      isSelected
                        ? "bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800"
                        : "text-zinc-400"
                    )}
                  >
                    <span className={cn("w-24 shrink-0 truncate", isSelected && "font-semibold text-violet-700 dark:text-violet-400")}>
                      {m.model}
                    </span>
                    <span className="font-mono">${inputCost} input</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {interactive && (
        <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/30">
          <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1 truncate">{footerStatus}</span>
          <button
            type="button"
            onClick={() => setText(SAMPLE_TEXT)}
            className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity shrink-0"
          >
            Load Sample
          </button>
        </div>
      )}
    </div>
  );
}
