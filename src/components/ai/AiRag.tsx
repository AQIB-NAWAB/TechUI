"use client";

import { useState, useEffect, useRef } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Brain, Play } from "lucide-react";

export const AiRagSchema = z.object({
  query: z.string().default("What is our return policy?"),
  topK: z.number().default(3),
  documents: z.array(z.object({
    id: z.string(),
    title: z.string(),
    snippet: z.string(),
    similarity: z.number(),
  })).default([
    { id: "doc1", title: "Return Policy",    snippet: "Items can be returned within 30 days with receipt...", similarity: 0.94 },
    { id: "doc2", title: "Shipping FAQ",     snippet: "Standard shipping takes 3-5 business days...",         similarity: 0.71 },
    { id: "doc3", title: "Customer Support", snippet: "Contact us at support@freshmarket.com...",              similarity: 0.58 },
  ]),
  answer: z.string().default("Based on our policy, you can return items within 30 days of purchase with a valid receipt. Refunds are processed within 3-5 business days."),
});

export type AiRagProps = z.infer<typeof AiRagSchema>;

const STEPS = [
  { id: 1, label: "Query",   short: "Query"  },
  { id: 2, label: "Embed",   short: "Embed"  },
  { id: 3, label: "Search",  short: "Search" },
  { id: 4, label: "Retrieve",short: "Retrieve"},
  { id: 5, label: "LLM",     short: "LLM"   },
];

const VECTOR_SAMPLE = "[0.23, -0.71, 0.44, 0.12, -0.38, 0.91, ...]";

export function AiRag({
  query = "What is our return policy?",
  topK = 3,
  documents = [
    { id: "doc1", title: "Return Policy",    snippet: "Items can be returned within 30 days with receipt...", similarity: 0.94 },
    { id: "doc2", title: "Shipping FAQ",     snippet: "Standard shipping takes 3-5 business days...",         similarity: 0.71 },
    { id: "doc3", title: "Customer Support", snippet: "Contact us at support@freshmarket.com...",              similarity: 0.58 },
  ],
  answer = "Based on our policy, you can return items within 30 days of purchase with a valid receipt. Refunds are processed within 3-5 business days.",
}: AiRagProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [running, setRunning] = useState(false);
  const [typedAnswer, setTypedAnswer] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const topDocs = documents.slice(0, topK);

  const clearTimers = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (typeTimerRef.current) clearInterval(typeTimerRef.current);
  };

  const runAnimation = () => {
    if (running) return;
    clearTimers();
    setRunning(true);
    setActiveStep(0);
    setTypedAnswer("");

    let step = 1;
    const advance = () => {
      setActiveStep(step);
      if (step === 5) {
        // typewriter
        let idx = 0;
        setTypedAnswer("");
        typeTimerRef.current = setInterval(() => {
          idx++;
          setTypedAnswer(answer.slice(0, idx));
          if (idx >= answer.length) {
            if (typeTimerRef.current) clearInterval(typeTimerRef.current);
            setRunning(false);
          }
        }, 18);
        return;
      }
      step++;
      timerRef.current = setTimeout(advance, 1000);
    };

    timerRef.current = setTimeout(advance, 200);
  };

  useEffect(() => () => clearTimers(), []);

  const colorForSim = (sim: number) => {
    if (sim >= 0.85) return "bg-emerald-500";
    if (sim >= 0.65) return "bg-blue-500";
    return "bg-zinc-400";
  };

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <Brain className="size-4 text-blue-500" />
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">RAG Pipeline</span>
        </div>
        <button
          onClick={runAnimation}
          disabled={running}
          className={cn(
            "flex items-center gap-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity",
            running && "opacity-50 cursor-not-allowed"
          )}
        >
          <Play className="size-3.5" />
          {running ? "Running…" : activeStep === 5 ? "Re-run" : "Ask"}
        </button>
      </div>

      {/* Step progress bar */}
      <div className="flex border-b border-zinc-100 dark:border-zinc-800">
        {STEPS.map((s) => (
          <div
            key={s.id}
            className={cn(
              "flex-1 flex flex-col items-center py-2 gap-1 transition-all duration-500",
              activeStep >= s.id
                ? "bg-blue-50 dark:bg-blue-950/20"
                : "bg-transparent"
            )}
          >
            <div className={cn(
              "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-500",
              activeStep >= s.id
                ? "bg-blue-500 text-white"
                : "bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400"
            )}>
              {s.id}
            </div>
            <span className={cn(
              "text-[9px] font-semibold tracking-wide transition-all duration-500",
              activeStep >= s.id ? "text-blue-600 dark:text-blue-400" : "text-zinc-400 dark:text-zinc-600"
            )}>
              {s.short}
            </span>
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="min-h-[300px] p-4 space-y-3">

        {/* Step 1: Query */}
        <div className={cn("transition-all duration-500", activeStep >= 1 ? "opacity-100" : "opacity-0 pointer-events-none h-0 overflow-hidden")}>
          <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-1.5">Step 1 — User Query</div>
          <div className="px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 text-sm text-blue-900 dark:text-blue-200 font-medium">
            &ldquo;{query}&rdquo;
          </div>
        </div>

        {/* Step 2: Embed */}
        <div className={cn("transition-all duration-500", activeStep >= 2 ? "opacity-100" : "opacity-0 pointer-events-none h-0 overflow-hidden")}>
          <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-1.5">Step 2 — Embed Query → Vector</div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 font-medium truncate max-w-[140px]">
              &ldquo;{query.slice(0, 20)}&hellip;&rdquo;
            </div>
            <span className="text-zinc-400 text-xs">→</span>
            <div className="px-2.5 py-1.5 rounded-lg bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 font-mono text-[10px] text-violet-700 dark:text-violet-300">
              {VECTOR_SAMPLE}
            </div>
          </div>
        </div>

        {/* Step 3: Vector search results */}
        <div className={cn("transition-all duration-500", activeStep >= 3 ? "opacity-100" : "opacity-0 pointer-events-none h-0 overflow-hidden")}>
          <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-1.5">Step 3 — Vector Search → Top {topK} Results</div>
          <div className="space-y-1.5">
            {topDocs.map((doc) => (
              <div key={doc.id} className="flex items-center gap-2">
                <div className="w-28 text-[10px] text-zinc-600 dark:text-zinc-400 truncate shrink-0">{doc.title}</div>
                <div className="flex-1 h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-700", colorForSim(doc.similarity))}
                    style={{ width: `${Math.round(doc.similarity * 100)}%` }}
                  />
                </div>
                <div className="text-[10px] font-mono font-semibold text-zinc-600 dark:text-zinc-400 w-8 text-right shrink-0">
                  {Math.round(doc.similarity * 100)}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Step 4: Retrieved context */}
        <div className={cn("transition-all duration-500", activeStep >= 4 ? "opacity-100" : "opacity-0 pointer-events-none h-0 overflow-hidden")}>
          <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-1.5">Step 4 — Assembled Prompt</div>
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 p-2.5 font-mono text-[10px] space-y-1">
            <div className="text-emerald-600 dark:text-emerald-400">{"// System prompt"}</div>
            <div className="text-zinc-500 dark:text-zinc-400">You are a helpful assistant. Use the context below.</div>
            <div className="text-blue-600 dark:text-blue-400 mt-1">{"// Retrieved context"}</div>
            {topDocs.slice(0, 2).map((doc) => (
              <div key={doc.id} className="text-zinc-600 dark:text-zinc-300 truncate">— {doc.snippet}</div>
            ))}
            <div className="text-amber-600 dark:text-amber-400 mt-1">{"// User query"}</div>
            <div className="text-zinc-700 dark:text-zinc-200">{query}</div>
          </div>
        </div>

        {/* Step 5: LLM answer */}
        <div className={cn("transition-all duration-500", activeStep >= 5 ? "opacity-100" : "opacity-0 pointer-events-none h-0 overflow-hidden")}>
          <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-1.5">Step 5 — LLM Answer</div>
          <div className="px-3 py-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-sm text-emerald-900 dark:text-emerald-200 min-h-[52px]">
            {typedAnswer}
            {running && activeStep === 5 && (
              <span className="inline-block w-0.5 h-3.5 bg-emerald-600 dark:bg-emerald-400 ml-0.5 animate-pulse align-text-bottom" />
            )}
          </div>
        </div>

        {/* Idle state */}
        {activeStep === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-center text-zinc-400 text-xs gap-2">
            <Brain className="size-8 opacity-30" />
            <span>Click <strong>Ask</strong> to animate the RAG pipeline</span>
          </div>
        )}
      </div>

      {/* Insight footer */}
      <div className="px-4 py-2.5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40">
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
          <strong className="text-zinc-700 dark:text-zinc-300">Key insight:</strong> RAG gives the LLM relevant facts at query time — no fine-tuning needed.
        </p>
      </div>
    </div>
  );
}
