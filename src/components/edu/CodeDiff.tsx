"use client";

import { useState } from "react";
import { z } from "zod";
import { Copy, Check } from "lucide-react";

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
    <button
      onClick={handleCopy}
      className="p-1 rounded hover:bg-white/10 transition-colors text-zinc-400 hover:text-zinc-200"
      title="Copy code"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function CodePanel({
  label,
  lines,
  code,
  language,
  labelColor,
  borderColor,
  headerBg,
}: {
  label: string;
  lines: DiffLine[];
  code: string;
  language: string;
  labelColor: string;
  borderColor: string;
  headerBg: string;
}) {
  return (
    <div className={`flex-1 rounded-xl border-l-4 ${borderColor} border border-zinc-200 dark:border-zinc-700 overflow-hidden min-w-0`}>
      <div className={`${headerBg} px-3 py-2 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-700`}>
        <span className={`text-xs font-semibold ${labelColor}`}>{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-zinc-400">{language}</span>
          <CopyButton text={code} />
        </div>
      </div>
      <div className="overflow-x-auto">
        <pre className="font-mono text-xs leading-6 p-4">
          {lines.map((line, i) => (
            <div
              key={i}
              className={[
                "px-1 -mx-1 rounded",
                line.type === "removed" ? "bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300" : "",
                line.type === "added" ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300" : "",
                line.type === "context" ? "text-zinc-700 dark:text-zinc-300" : "",
              ].join(" ")}
            >
              <span className="select-none text-zinc-400 dark:text-zinc-600 w-4 inline-block mr-2">
                {line.type === "removed" ? "-" : line.type === "added" ? "+" : " "}
              </span>
              {line.text || " "}
            </div>
          ))}
        </pre>
      </div>
    </div>
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
  const { beforeLines, afterLines } = computeLineDiff(before, after);

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {(title || description) && (
        <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
          {title && <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{title}</h3>}
          {description && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{description}</p>
          )}
        </div>
      )}

      <div className="p-4 flex gap-3 flex-col sm:flex-row">
        <CodePanel
          label={beforeLabel ?? "Before"}
          lines={beforeLines}
          code={before}
          language={language}
          labelColor="text-red-600 dark:text-red-400"
          borderColor="border-l-red-400"
          headerBg="bg-red-50 dark:bg-red-950/50"
        />
        <CodePanel
          label={afterLabel ?? "After"}
          lines={afterLines}
          code={after}
          language={language}
          labelColor="text-emerald-600 dark:text-emerald-400"
          borderColor="border-l-emerald-400"
          headerBg="bg-emerald-50 dark:bg-emerald-950/50"
        />
      </div>
    </div>
  );
}
