"use client";

import { useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Copy, Check, MessageSquare } from "lucide-react";

const MessageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string(),
});

export const PromptTemplateSchema = z.object({
  title: z.string().optional().default("Prompt Template"),
  messages: z.array(MessageSchema),
  variables: z.record(z.string(), z.string()).optional(),
  model: z.string().optional(),
  interactive: z.boolean().optional().default(true),
});

export type PromptTemplateProps = z.infer<typeof PromptTemplateSchema>;

const ROLE_CFG = {
  system: {
    label: "[SYSTEM]",
    bg: "bg-violet-50 dark:bg-violet-950/40",
    border: "border-l-4 border-l-violet-500",
    labelColor: "text-violet-700 dark:text-violet-400",
    textColor: "text-zinc-700 dark:text-zinc-300",
  },
  user: {
    label: "[USER]",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    border: "border-l-4 border-l-blue-500",
    labelColor: "text-blue-700 dark:text-blue-400",
    textColor: "text-zinc-700 dark:text-zinc-300",
  },
  assistant: {
    label: "[ASSISTANT]",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-l-4 border-l-emerald-500",
    labelColor: "text-emerald-700 dark:text-emerald-400",
    textColor: "text-zinc-700 dark:text-zinc-300",
  },
};

function highlightVars(
  text: string,
  vars: Record<string, string>,
  filled: boolean,
  fillMode: boolean,
  onVarChange: (name: string, val: string) => void
): React.ReactNode[] {
  const parts = text.split(/({{[^}]+}})/g);
  return parts.map((part, i) => {
    const match = part.match(/^{{(.+)}}$/);
    if (!match) return <span key={i}>{part}</span>;
    const varName = match[1]!;
    const value = vars[varName];

    if (fillMode) {
      return (
        <input
          key={i}
          type="text"
          value={value ?? ""}
          onChange={(e) => onVarChange(varName, e.target.value)}
          placeholder={`{{${varName}}}`}
          className="inline-block bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 rounded px-1.5 py-0.5 font-mono text-xs border border-amber-300 dark:border-amber-700 focus:outline-none focus:ring-1 focus:ring-amber-400 mx-0.5"
          style={{ minWidth: `${Math.max(8, varName.length + 4) * 7}px` }}
        />
      );
    }

    if (filled && value !== undefined) {
      return (
        <span key={i} className="bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 rounded px-1 font-mono text-xs">
          {value}
        </span>
      );
    }

    return (
      <span key={i} className="bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 rounded px-1 font-mono text-xs">
        {`{{${varName}}}`}
      </span>
    );
  });
}

function estimateTokens(messages: { role: string; content: string }[], vars: Record<string, string>, filled: boolean): number {
  const text = messages.map((m) => {
    const content = filled
      ? m.content.replace(/{{([^}]+)}}/g, (_, k) => vars[k] ?? `{{${k}}}`)
      : m.content;
    return `${m.role}: ${content}`;
  }).join("\n");
  return Math.round(text.length / 4);
}

export function PromptTemplate({
  title = "Prompt Template",
  messages,
  variables = {},
  model,
  interactive = true,
}: PromptTemplateProps) {
  const [filled, setFilled] = useState(false);
  const [fillMode, setFillMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [liveVars, setLiveVars] = useState<Record<string, string>>(variables);

  const varNames = [...new Set(
    messages.flatMap((m) => [...m.content.matchAll(/{{([^}]+)}}/g)].map((x) => x[1]!))
  )];
  const hasVars = varNames.length > 0;
  const tokenCount = estimateTokens(messages, liveVars, filled || fillMode);

  function handleVarChange(name: string, val: string) {
    setLiveVars((prev) => ({ ...prev, [name]: val }));
  }

  function copyPrompt() {
    const text = messages
      .map((m) => {
        const content = (filled || fillMode)
          ? m.content.replace(/{{([^}]+)}}/g, (_, k) => liveVars[k] ?? `{{${k}}}`)
          : m.content;
        return `<${m.role}>\n${content}\n</${m.role}>`;
      })
      .join("\n\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden text-sm">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/40">
        <MessageSquare className="size-3.5 text-zinc-400 shrink-0" />
        <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex-1">{title}</span>
        {model && (
          <span className="text-[10px] font-mono text-zinc-400 border border-zinc-200 dark:border-zinc-700 px-1.5 py-0.5 rounded">
            {model}
          </span>
        )}
        {/* Token count */}
        <span className="text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-2 py-0.5 rounded">
          ~{tokenCount} tokens
        </span>
        {interactive && hasVars && (
          <button
            onClick={() => {
              setFillMode((v) => !v);
              if (!fillMode) setFilled(false);
            }}
            className={cn(
              "text-[11px] px-2.5 py-1 rounded font-semibold transition-all duration-500",
              fillMode
                ? "bg-amber-500 text-white"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            )}
          >
            {fillMode ? "Preview" : "Fill vars"}
          </button>
        )}
        {interactive && hasVars && !fillMode && (
          <button
            onClick={() => setFilled((v) => !v)}
            className={cn(
              "text-[11px] px-2.5 py-1 rounded font-semibold transition-all duration-500",
              filled
                ? "bg-blue-600 text-white"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            )}
          >
            {filled ? "Template" : "Preview"}
          </button>
        )}
        <button
          onClick={copyPrompt}
          className="p-1.5 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
          title="Copy template"
        >
          {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
        </button>
      </div>

      {/* Messages */}
      <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
        {messages.map((msg, i) => {
          const cfg = ROLE_CFG[msg.role];
          return (
            <div key={i} className={cn("px-4 py-3", cfg.border, cfg.bg)}>
              <div className={cn("text-[10px] font-mono font-bold uppercase tracking-wider mb-1.5", cfg.labelColor)}>
                {cfg.label}
              </div>
              <p className={cn("text-[12px] leading-relaxed whitespace-pre-wrap", cfg.textColor)}>
                {highlightVars(msg.content, liveVars, filled, fillMode, handleVarChange)}
              </p>
            </div>
          );
        })}
      </div>

      {/* Variable summary when not in fill/preview mode */}
      {hasVars && !fillMode && !filled && (
        <div className="border-t border-zinc-100 dark:border-zinc-900 px-4 py-2.5 flex items-center gap-2 flex-wrap bg-amber-50/50 dark:bg-amber-950/10">
          <span className="text-[10px] text-zinc-400 shrink-0">Variables:</span>
          {varNames.map((v) => (
            <span key={v} className="text-[10px] font-mono bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 px-1.5 py-0.5 rounded">
              {`{{${v}}}`}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
