"use client";

import { useState, useEffect, useRef } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Wrench, Brain, Server, RefreshCw, ArrowDown, CheckCircle } from "lucide-react";

export const ToolCallingFlowSchema = z.object({
  title: z.string().optional().default("Tool Calling Flow"),
  userQuery: z.string().optional().default("What's the weather in Tokyo?"),
  toolName: z.string().optional().default("get_weather"),
  toolResult: z.string().optional().default('{"city":"Tokyo","temp_c":24,"condition":"Partly cloudy"}'),
  finalAnswer: z.string().optional().default("It's 24°C and partly cloudy in Tokyo right now."),
  interactive: z.boolean().optional().default(true),
});

export type ToolCallingFlowProps = z.infer<typeof ToolCallingFlowSchema>;

type Phase = "idle" | "thinking" | "tool-call" | "executing" | "result" | "answer";

const STEPS: { id: Phase; label: string; icon: React.ReactNode }[] = [
  { id: "thinking", label: "LLM decides", icon: <Brain className="size-4" /> },
  { id: "tool-call", label: "Call tool", icon: <Wrench className="size-4" /> },
  { id: "executing", label: "Tool runs", icon: <Server className="size-4" /> },
  { id: "result", label: "Return data", icon: <ArrowDown className="size-4" /> },
  { id: "answer", label: "Final reply", icon: <CheckCircle className="size-4" /> },
];

export function ToolCallingFlow({
  title = "Tool Calling Flow",
  userQuery = "What's the weather in Tokyo?",
  toolName = "get_weather",
  toolResult = '{"city":"Tokyo","temp_c":24,"condition":"Partly cloudy"}',
  finalAnswer = "It's 24°C and partly cloudy in Tokyo right now.",
  interactive = true,
}: ToolCallingFlowProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [typedAnswer, setTypedAnswer] = useState("");
  const [running, setRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typeRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (typeRef.current) clearInterval(typeRef.current);
  };

  useEffect(() => () => clearTimers(), []);

  function reset() {
    clearTimers();
    setPhase("idle");
    setTypedAnswer("");
    setRunning(false);
  }

  function handlePrimary() {
    if (running) return;
    if (phase === "answer") reset();
    runFlow();
  }

  function runFlow() {
    clearTimers();
    setRunning(true);
    setTypedAnswer("");
    setPhase("thinking");

    const sequence: Phase[] = ["thinking", "tool-call", "executing", "result", "answer"];
    let idx = 0;

    const advance = () => {
      idx++;
      if (idx >= sequence.length) {
        let char = 0;
        typeRef.current = setInterval(() => {
          char++;
          setTypedAnswer(finalAnswer.slice(0, char));
          if (char >= finalAnswer.length) {
            if (typeRef.current) clearInterval(typeRef.current);
            setRunning(false);
          }
        }, 18);
        return;
      }
      setPhase(sequence[idx]);
      timerRef.current = setTimeout(advance, 1200);
    };

    timerRef.current = setTimeout(advance, 1200);
  }

  const activeIdx = STEPS.findIndex((s) => s.id === phase);
  const footerText =
    phase === "idle"
      ? "Run shows how an LLM calls an external tool instead of guessing."
      : phase === "thinking"
      ? "The model reads your question and picks a tool…"
      : phase === "tool-call"
      ? `Structured call: ${toolName}({ city: "Tokyo" })`
      : phase === "executing"
      ? "The tool runs on a server — real data, not hallucination."
      : phase === "result"
      ? "Tool output is injected back into the conversation."
      : running
      ? "Composing the final answer from tool data…"
      : "Answer grounded in live tool output.";

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <Wrench className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">{title}</span>
        <span className="text-[10px] font-mono text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/50 border border-violet-200 dark:border-violet-800 px-2 py-0.5 rounded">
          function calling
        </span>
        {interactive && (
          <button type="button" onClick={reset} className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all duration-500">
            <RefreshCw className="size-3.5" />
          </button>
        )}
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        Instead of guessing, the model calls a real tool (weather API, database, etc.), waits for the result, then writes its answer from that data.
      </p>

      <div className="p-4 min-h-[260px] flex flex-col gap-4">
        {/* User query bubble */}
        <div className="flex justify-end">
          <div className="max-w-[85%] rounded-lg px-3 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm">
            {userQuery}
          </div>
        </div>

        {/* Step pipeline */}
        <div className="flex items-center justify-between gap-1">
          {STEPS.map((step, i) => {
            const done = activeIdx > i || (phase === "answer" && !running);
            const active = step.id === phase;
            return (
              <div key={step.id} className="flex flex-col items-center flex-1 min-w-0">
                <div
                  className={cn(
                    "size-8 rounded-full flex items-center justify-center border-2 transition-all duration-500",
                    done ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400" :
                    active ? "border-violet-500 bg-violet-50 dark:bg-violet-950 text-violet-600 dark:text-violet-400 animate-pulse" :
                    "border-zinc-200 dark:border-zinc-700 text-zinc-300 dark:text-zinc-600"
                  )}
                >
                  {step.icon}
                </div>
                <span className={cn(
                  "text-[9px] mt-1 text-center truncate w-full",
                  active ? "text-violet-600 dark:text-violet-400 font-semibold" : "text-zinc-400"
                )}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Detail panel — fixed height */}
        <div className="min-h-[120px] border border-zinc-100 dark:border-zinc-800 rounded-lg p-3 bg-zinc-50 dark:bg-zinc-800/50">
          {phase === "idle" && (
            <p className="text-xs text-zinc-400 text-center py-6">Click Run to watch the tool-calling loop</p>
          )}

          {phase === "thinking" && (
            <div className="space-y-2 transition-opacity duration-500">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">LLM reasoning</div>
              <p className="text-xs text-zinc-600 dark:text-zinc-300">User wants weather → I need live data → call <span className="font-mono text-violet-600 dark:text-violet-400">{toolName}</span></p>
            </div>
          )}

          {(phase === "tool-call" || phase === "executing") && (
            <div className="space-y-2 transition-opacity duration-500">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Tool invocation</div>
              <pre className="text-xs font-mono bg-zinc-100 dark:bg-zinc-900 rounded-md px-2.5 py-2 text-violet-700 dark:text-violet-300 overflow-x-auto">
{`{
  "tool": "${toolName}",
  "arguments": { "city": "Tokyo" }
}`}
              </pre>
              {phase === "executing" && (
                <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                  <Server className="size-3.5" />
                  Weather API executing…
                </div>
              )}
            </div>
          )}

          {phase === "result" && (
            <div className="space-y-2 transition-opacity duration-500">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Tool result</div>
              <pre className="text-xs font-mono bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-md px-2.5 py-2 text-emerald-700 dark:text-emerald-300 overflow-x-auto">
                {toolResult}
              </pre>
            </div>
          )}

          {phase === "answer" && (
            <div className="space-y-2 transition-opacity duration-500">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Assistant reply</div>
              <p className="text-sm text-zinc-700 dark:text-zinc-300">
                {typedAnswer || finalAnswer}
                {running && typedAnswer.length < finalAnswer.length && <span className="animate-pulse">|</span>}
              </p>
            </div>
          )}
        </div>
      </div>

      {interactive && (
        <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/30 min-h-[52px]">
          <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">{footerText}</span>
          <button
            type="button"
            onClick={handlePrimary}
            disabled={running}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 transition-all duration-500 shrink-0 disabled:opacity-40"
          >
            {running ? "Running…" : phase === "answer" ? "Run Again" : "Run"}
          </button>
        </div>
      )}
    </div>
  );
}
