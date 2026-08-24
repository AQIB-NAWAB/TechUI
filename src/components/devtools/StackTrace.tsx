"use client";

import { useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { AlertTriangle, ChevronDown, ChevronRight, Copy, Check } from "lucide-react";

export const StackTraceSchema = z.object({
  error: z.string().optional().default("TypeError"),
  message: z.string().optional().default("Cannot read properties of undefined (reading 'id')"),
  language: z.enum(["javascript", "typescript", "python", "java", "go", "rust"]).optional().default("javascript"),
  frames: z.array(
    z.object({
      function: z.string(),
      file: z.string(),
      line: z.number().optional(),
      column: z.number().optional(),
      isApp: z.boolean().optional().default(true),
      context: z.string().optional(),
    })
  ),
  cause: z.string().optional(),
  timestamp: z.string().optional(),
});

export type StackTraceProps = z.infer<typeof StackTraceSchema>;

const ERROR_COLOR = {
  TypeError: "text-red-600 dark:text-red-400",
  ReferenceError: "text-red-600 dark:text-red-400",
  SyntaxError: "text-amber-600 dark:text-amber-400",
  Error: "text-red-600 dark:text-red-400",
  Exception: "text-red-600 dark:text-red-400",
  RuntimeException: "text-red-600 dark:text-red-400",
  panic: "text-red-600 dark:text-red-400",
};

export function StackTrace({
  error = "TypeError",
  message = "Cannot read properties of undefined (reading 'id')",
  language = "javascript",
  frames,
  cause,
  timestamp,
}: StackTraceProps) {
  const [showAll, setShowAll] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expandedContext, setExpandedContext] = useState<Set<number>>(new Set([0]));

  const appFrames = frames.filter((f) => f.isApp);
  const displayed = showAll ? frames : frames.slice(0, 8);
  const hiddenCount = frames.length - 8;

  function copyError() {
    const text = `${error}: ${message}\n${frames.map((f) => `  at ${f.function} (${f.file}:${f.line ?? "?"}:${f.column ?? "?"})`).join("\n")}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function toggleContext(i: number) {
    setExpandedContext((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  const errorColor = (ERROR_COLOR as Record<string, string>)[error] ?? "text-red-600 dark:text-red-400";

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800">
        <AlertTriangle className="size-4 text-red-500 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">Stack Trace</span>
        <span className={cn("text-xs font-bold", errorColor)}>{error}</span>
        {timestamp && <span className="text-[10px] text-zinc-400 font-mono">{timestamp}</span>}
        <button
          onClick={copyError}
          className="p-1 rounded text-zinc-400 hover:text-zinc-600 transition-all duration-500"
        >
          {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
        </button>
      </div>

      <p className="text-sm text-zinc-500 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        {message}
        {cause && <span className="text-zinc-400"> · Caused by: {cause}</span>}
      </p>

      <div className="min-h-[240px] max-h-[320px] overflow-y-auto">
        {appFrames.length > 0 && (
          <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Origin</span>
            <span className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400 truncate">
              {appFrames[0]!.function} ({appFrames[0]!.file}:{appFrames[0]!.line})
            </span>
          </div>
        )}

        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {displayed.map((frame, i) => {
            const hasCtx = !!frame.context;
            const ctxOpen = expandedContext.has(i);
            return (
              <div key={i} className={cn(frame.isApp ? "" : "opacity-50")}>
                <div
                  className={cn(
                    "flex items-start gap-2 px-4 py-2 text-xs font-mono transition-all duration-500",
                    hasCtx && "cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  )}
                  onClick={hasCtx ? () => toggleContext(i) : undefined}
                >
                  {hasCtx ? (
                    ctxOpen ? <ChevronDown className="size-3 text-zinc-400 shrink-0 mt-0.5" />
                      : <ChevronRight className="size-3 text-zinc-400 shrink-0 mt-0.5" />
                  ) : (
                    <span className="size-3 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <span className={cn(
                      "font-semibold truncate block",
                      frame.isApp ? "text-zinc-800 dark:text-zinc-200" : "text-zinc-500"
                    )}>
                      {frame.function}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-zinc-400">
                      <span className={frame.isApp ? "text-blue-500 dark:text-blue-400" : undefined}>{frame.file}</span>
                      {frame.line && <span>:{frame.line}{frame.column ? `:${frame.column}` : ""}</span>}
                    </div>
                  </div>
                  {i === 0 && (
                    <span className="text-[10px] font-semibold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 px-1.5 py-0.5 rounded-md shrink-0">
                      here
                    </span>
                  )}
                </div>
                {hasCtx && ctxOpen && (
                  <div className="mx-4 mb-2 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                    <pre className="p-3 text-[11px] font-mono text-zinc-600 dark:text-zinc-400 leading-5 overflow-x-auto">
                      {frame.context}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}

          {!showAll && hiddenCount > 0 && (
            <button
              onClick={() => setShowAll(true)}
              className="w-full px-4 py-2 text-[10px] text-zinc-400 hover:text-zinc-600 text-center hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all duration-500"
            >
              + {hiddenCount} more frame{hiddenCount !== 1 ? "s" : ""}
            </button>
          )}
        </div>
      </div>

      <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-3 text-sm text-zinc-500">
        <span>{frames.length} frames</span>
        <span>·</span>
        <span>{appFrames.length} in app</span>
        <span>·</span>
        <span>{language}</span>
      </div>
    </div>
  );
}
