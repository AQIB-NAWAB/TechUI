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

const LANG_COMMENT = {
  javascript: "//",
  typescript: "//",
  python: "#",
  java: "//",
  go: "//",
  rust: "//",
};

const ERROR_COLOR = {
  TypeError:         "text-red-600 dark:text-red-400",
  ReferenceError:    "text-red-600 dark:text-red-400",
  SyntaxError:       "text-amber-600 dark:text-amber-400",
  Error:             "text-red-600 dark:text-red-400",
  Exception:         "text-red-600 dark:text-red-400",
  RuntimeException:  "text-red-600 dark:text-red-400",
  panic:             "text-red-600 dark:text-red-400",
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
    const text = `${error}: ${message}\n${frames.map((f) => `  at ${f.function} (${f.file}:${f.line ?? "?"}:${f.column ?? "?"})` ).join("\n")}`;
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
    <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-white dark:bg-zinc-950 overflow-hidden">
      {/* Error header */}
      <div className="flex items-start gap-3 px-4 py-3 bg-red-50 dark:bg-red-950/20 border-b border-red-200 dark:border-red-900/40">
        <AlertTriangle className="size-4 text-red-500 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn("text-sm font-bold", errorColor)}>{error}</span>
            {timestamp && (
              <span className="text-[10px] text-zinc-400 font-mono">{timestamp}</span>
            )}
          </div>
          <p className="text-xs text-zinc-700 dark:text-zinc-300 mt-0.5 leading-5">{message}</p>
          {cause && (
            <p className="text-[11px] text-zinc-500 dark:text-zinc-500 mt-1">
              Caused by: {cause}
            </p>
          )}
        </div>
        <button
          onClick={copyError}
          className="p-1.5 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors shrink-0"
        >
          {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
        </button>
      </div>

      {/* App frames summary */}
      {appFrames.length > 0 && (
        <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-900 flex items-center gap-2">
          <span className="text-[10px] text-zinc-400">Origin:</span>
          <span className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400 truncate">
            {appFrames[0]!.function} ({appFrames[0]!.file}:{appFrames[0]!.line})
          </span>
        </div>
      )}

      {/* Stack frames */}
      <div className="divide-y divide-zinc-50 dark:divide-zinc-900/60">
        {displayed.map((frame, i) => {
          const hasCtx = !!frame.context;
          const ctxOpen = expandedContext.has(i);
          return (
            <div key={i} className={cn(frame.isApp ? "" : "opacity-50")}>
              <div
                className={cn(
                  "flex items-start gap-2 px-4 py-2 text-xs font-mono",
                  hasCtx && "cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/30"
                )}
                onClick={hasCtx ? () => toggleContext(i) : undefined}
              >
                {hasCtx ? (
                  ctxOpen
                    ? <ChevronDown className="size-3 text-zinc-400 shrink-0 mt-0.5" />
                    : <ChevronRight className="size-3 text-zinc-400 shrink-0 mt-0.5" />
                ) : (
                  <span className="size-3 shrink-0" />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn(
                      "font-semibold truncate",
                      frame.isApp
                        ? "text-zinc-800 dark:text-zinc-200"
                        : "text-zinc-500 dark:text-zinc-600"
                    )}>
                      {frame.function}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-zinc-400">
                    <span className={frame.isApp ? "text-blue-500 dark:text-blue-400" : undefined}>
                      {frame.file}
                    </span>
                    {frame.line && (
                      <span>:{frame.line}{frame.column ? `:${frame.column}` : ""}</span>
                    )}
                  </div>
                </div>

                {i === 0 && (
                  <span className="text-[10px] font-semibold text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-1.5 py-0.5 rounded shrink-0">
                    ← here
                  </span>
                )}
              </div>

              {/* Context code */}
              {hasCtx && ctxOpen && (
                <div className="mx-4 mb-2 rounded-lg bg-zinc-950 border border-zinc-800 overflow-hidden">
                  <pre className="p-3 text-[11px] font-mono text-zinc-400 leading-5 overflow-x-auto">
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
            className="w-full px-4 py-2 text-[10px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 text-center hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors"
          >
            + {hiddenCount} more frame{hiddenCount !== 1 ? "s" : ""}
          </button>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-zinc-50 dark:border-zinc-900 px-4 py-2 flex items-center gap-3 text-[10px] text-zinc-400">
        <span>{frames.length} frame{frames.length !== 1 ? "s" : ""}</span>
        <span>·</span>
        <span>{appFrames.length} in app</span>
        <span>·</span>
        <span>{language}</span>
      </div>
    </div>
  );
}
