"use client";

import { useState, useEffect, useRef } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Brain, Database, Server } from "lucide-react";

export const AiRagSchema = z.object({
  query: z.string().default("What is our return policy?"),
  topK: z.number().default(3),
  documents: z.array(z.object({
    id: z.string(),
    title: z.string(),
    snippet: z.string(),
    similarity: z.number(),
  })).default([
    { id: "doc1", title: "Return Policy", snippet: "Items can be returned within 30 days with receipt...", similarity: 0.94 },
    { id: "doc2", title: "Shipping FAQ", snippet: "Standard shipping takes 3-5 business days...", similarity: 0.71 },
    { id: "doc3", title: "Customer Support", snippet: "Contact us at support@freshmarket.com...", similarity: 0.58 },
  ]),
  answer: z.string().default("Based on our policy, you can return items within 30 days of purchase with a valid receipt. Refunds are processed within 3-5 business days."),
});

export type AiRagProps = z.infer<typeof AiRagSchema>;

const STEPS = [
  { id: 1, label: "Query" },
  { id: 2, label: "Embed" },
  { id: 3, label: "Search" },
  { id: 4, label: "Retrieve" },
  { id: 5, label: "Answer" },
];

const VECTOR_SAMPLE = "[0.23, -0.71, 0.44, 0.12, -0.38, 0.91, …]";

export function AiRag({
  query = "What is our return policy?",
  topK = 3,
  documents = [
    { id: "doc1", title: "Return Policy", snippet: "Items can be returned within 30 days with receipt...", similarity: 0.94 },
    { id: "doc2", title: "Shipping FAQ", snippet: "Standard shipping takes 3-5 business days...", similarity: 0.71 },
    { id: "doc3", title: "Customer Support", snippet: "Contact us at support@freshmarket.com...", similarity: 0.58 },
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
        let idx = 0;
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
      timerRef.current = setTimeout(advance, 1200);
    };

    timerRef.current = setTimeout(advance, 500);
  };

  useEffect(() => () => clearTimers(), []);

  const colorForSim = (sim: number) => {
    if (sim >= 0.85) return "bg-emerald-500";
    if (sim >= 0.65) return "bg-blue-500";
    return "bg-zinc-400";
  };

  const stepLabels = ["", "User asks a question", "Query becomes a vector", "Find similar documents", "Build prompt with context", "LLM generates answer"];
  const footerStatus = activeStep === 0
    ? "Click Ask to walk through the RAG pipeline"
    : activeStep === 5 && !running
    ? "Answer grounded in your documents — no fine-tuning needed"
    : `Step ${activeStep}/5: ${stepLabels[activeStep]}`;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800">
        <Brain className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">RAG Pipeline</span>
        <span className="text-[10px] font-mono text-zinc-400 border border-zinc-200 dark:border-zinc-700 px-2 py-0.5 rounded">
          top-{topK}
        </span>
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        Retrieval-Augmented Generation — the AI looks up your docs before answering.
      </p>

      <div className="flex border-b border-zinc-100 dark:border-zinc-800">
        {STEPS.map((s) => (
          <div
            key={s.id}
            className={cn(
              "flex-1 flex flex-col items-center py-2 gap-1 transition-all duration-500",
              activeStep >= s.id ? "bg-blue-50 dark:bg-blue-950/20" : ""
            )}
          >
            <div className={cn(
              "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-500",
              activeStep >= s.id ? "bg-blue-500 text-white" : "bg-zinc-200 dark:bg-zinc-700 text-zinc-500"
            )}>
              {s.id}
            </div>
            <span className={cn("text-[9px] font-semibold transition-all duration-500", activeStep >= s.id ? "text-blue-600" : "text-zinc-400")}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      <div className="min-h-[220px] p-4">
        {activeStep === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center gap-3 min-h-[180px]">
            <div className="flex items-center gap-3 text-zinc-400">
              <Database className="size-6" />
              <span className="text-xs">→</span>
              <Brain className="size-6" />
              <span className="text-xs">→</span>
              <Server className="size-6" />
            </div>
            <p className="text-xs text-zinc-400 max-w-[240px]">Documents → Vector search → LLM answer</p>
            <div className="px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 text-sm text-blue-900 dark:text-blue-200">
              &ldquo;{query}&rdquo;
            </div>
          </div>
        ) : (
          <div className="space-y-3 min-h-[180px]">
            {activeStep >= 1 && (
              <div className="border border-zinc-100 dark:border-zinc-800 rounded-lg p-3 bg-zinc-50 dark:bg-zinc-800/50 transition-all duration-500">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-1">Query</p>
                <p className="text-sm text-blue-900 dark:text-blue-200">&ldquo;{query}&rdquo;</p>
              </div>
            )}
            {activeStep >= 2 && (
              <div className="border border-zinc-100 dark:border-zinc-800 rounded-lg p-3 bg-zinc-50 dark:bg-zinc-800/50 transition-all duration-500">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-1">Vector</p>
                <code className="font-mono text-[10px] text-violet-700 dark:text-violet-300">{VECTOR_SAMPLE}</code>
              </div>
            )}
            {activeStep >= 3 && (
              <div className="border border-zinc-100 dark:border-zinc-800 rounded-lg p-3 bg-zinc-50 dark:bg-zinc-800/50 transition-all duration-500">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-2">Top matches</p>
                <div className="space-y-1.5">
                  {topDocs.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-2">
                      <span className="w-24 text-[10px] truncate">{doc.title}</span>
                      <div className="flex-1 h-2 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                        <div className={cn("h-full rounded-full transition-all duration-700", colorForSim(doc.similarity))} style={{ width: `${Math.round(doc.similarity * 100)}%` }} />
                      </div>
                      <span className="text-[10px] font-mono w-8 text-right">{Math.round(doc.similarity * 100)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeStep >= 4 && activeStep < 5 && (
              <div className="border border-zinc-100 dark:border-zinc-800 rounded-lg p-3 bg-zinc-50 dark:bg-zinc-800/50 font-mono text-[10px] transition-all duration-500">
                <p className="text-emerald-600 mb-1">// context + query assembled</p>
                {topDocs.slice(0, 1).map((doc) => (
                  <p key={doc.id} className="text-zinc-600 truncate">— {doc.snippet}</p>
                ))}
              </div>
            )}
            {activeStep >= 5 && (
              <div className="border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 bg-emerald-50 dark:bg-emerald-950/20 transition-all duration-500 min-h-[52px]">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-600 mb-1">Answer</p>
                <p className="text-sm text-emerald-900 dark:text-emerald-200">
                  {typedAnswer}
                  {running && <span className="inline-block w-0.5 h-3.5 bg-emerald-600 ml-0.5 animate-pulse align-text-bottom" />}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
        <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1 truncate">{footerStatus}</span>
        <button
          onClick={runAnimation}
          disabled={running}
          className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0"
        >
          {running ? "Running…" : activeStep >= 5 ? "Re-run" : "Ask"}
        </button>
      </div>
    </div>
  );
}
