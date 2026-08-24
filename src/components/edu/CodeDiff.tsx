"use client";

import { useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { GitCompareArrows, Copy, Check } from "lucide-react";

export const CodeDiffSchema = z.object({
  title: z.string().optional(),
  language: z.string().default("javascript"),
  before: z.string(),
  after: z.string(),
  beforeLabel: z.string().optional().default("Before"),
  afterLabel: z.string().optional().default("After"),
  description: z.string().optional(),
});

export type CodeDiffProps = z.infer<typeof CodeDiffSchema>;

type LineType = "added" | "removed" | "context";

interface DiffLine {
  text: string;
  type: LineType;
}

function computeLineDiff(before: string, after: string): { beforeLines: DiffLine[]; afterLines: DiffLine[] } {
  const beforeLines = before.split("\n");
  const afterLines = after.split("\n");
  const beforeSet = new Set(beforeLines);
  const afterSet = new Set(afterLines);

  return {
    beforeLines: beforeLines.map((line) => ({
      text: line,
      type: afterSet.has(line) ? "context" : "removed",
    })),
    afterLines: afterLines.map((line) => ({
      text: line,
      type: beforeSet.has(line) ? "context" : "added",
    })),
  };
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button onClick={handleCopy} className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all duration-500 text-zinc-400">
      {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
    </button>
  );
}

export function CodeDiff({
  title,
  language = "javascript",
  before,
  after,
  beforeLabel = "Before",
  afterLabel = "After",
  description,
}: CodeDiffProps) {
  const [highlighted, setHighlighted] = useState(false);
  const { beforeLines, afterLines } = computeLineDiff(before, after);
  const changeCount = beforeLines.filter((l) => l.type === "removed").length + afterLines.filter((l) => l.type === "added").length;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800">
        <GitCompareArrows className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">{title ?? "Code Diff"}</span>
        <span className="text-[10px] font-mono text-zinc-400 border border-zinc-200 dark:border-zinc-700 px-2 py-0.5 rounded">{language}</span>
      </div>

      {description && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">{description}</p>
      )}

      <div className="min-h-[220px] p-4 flex gap-3 flex-col sm:flex-row">
        <div className="flex-1 rounded-lg border-l-4 border-l-red-400 border border-zinc-200 dark:border-zinc-700 overflow-hidden min-w-0">
          <div className="bg-red-50 dark:bg-red-950/50 px-3 py-2 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-700">
            <span className="text-xs font-semibold text-red-600 dark:text-red-400">{beforeLabel}</span>
            <CopyButton text={before} />
          </div>
          <pre className="font-mono text-xs leading-6 p-3 min-h-[160px]">
            {beforeLines.map((line, i) => (
              <div
                key={i}
                className={cn(
                  "px-1 -mx-1 rounded transition-all duration-500",
                  highlighted && line.type === "removed" ? "bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300" : "text-zinc-700 dark:text-zinc-300",
                  !highlighted && line.type === "removed" ? "bg-red-50 dark:bg-red-950/50 text-red-700" : ""
                )}
              >
                <span className="select-none text-zinc-400 w-4 inline-block mr-2">{line.type === "removed" ? "−" : " "}</span>
                {line.text || "\u00a0"}
              </div>
            ))}
          </pre>
        </div>

        <div className="flex-1 rounded-lg border-l-4 border-l-emerald-400 border border-zinc-200 dark:border-zinc-700 overflow-hidden min-w-0">
          <div className="bg-emerald-50 dark:bg-emerald-950/50 px-3 py-2 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-700">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{afterLabel}</span>
            <CopyButton text={after} />
          </div>
          <pre className="font-mono text-xs leading-6 p-3 min-h-[160px]">
            {afterLines.map((line, i) => (
              <div
                key={i}
                className={cn(
                  "px-1 -mx-1 rounded transition-all duration-500",
                  highlighted && line.type === "added" ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300" : "text-zinc-700 dark:text-zinc-300",
                  !highlighted && line.type === "added" ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700" : ""
                )}
              >
                <span className="select-none text-zinc-400 w-4 inline-block mr-2">{line.type === "added" ? "+" : " "}</span>
                {line.text || "\u00a0"}
              </div>
            ))}
          </pre>
        </div>
      </div>

      <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
        <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">
          {highlighted ? `${changeCount} line${changeCount !== 1 ? "s" : ""} changed` : "Red = removed, green = added"}
        </span>
        <button
          onClick={() => setHighlighted((h) => !h)}
          className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity shrink-0"
        >
          {highlighted ? "Show All" : "Highlight Changes"}
        </button>
      </div>
    </div>
  );
}
