"use client";

import { useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Copy, Check, MessageSquare, Bot, User } from "lucide-react";

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
    label: "SYSTEM",
    icon: Bot,
    bg: "bg-violet-50 dark:bg-violet-950/40",
    border: "border-l-4 border-l-violet-500",
    labelColor: "text-violet-700 dark:text-violet-400",
    textColor: "text-zinc-700 dark:text-zinc-300",
    badge: "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-400",
  },
  user: {
    label: "USER",
    icon: User,
    bg: "bg-blue-50 dark:bg-blue-950/40",
    border: "border-l-4 border-l-blue-500",
    labelColor: "text-blue-700 dark:text-blue-400",
    textColor: "text-zinc-700 dark:text-zinc-300",
    badge: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400",
  },
  assistant: {
    label: "ASSISTANT",
    icon: MessageSquare,
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-l-4 border-l-emerald-500",
    labelColor: "text-emerald-700 dark:text-emerald-400",
    textColor: "text-zinc-700 dark:text-zinc-300",
    badge: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400",
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
          className="inline-block bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 rounded px-1.5 py-0.5 font-mono text-xs border border-amber-300 dark:border-amber-700 focus:outline-none focus:ring-1 focus:ring-amber-400 mx-0.5 transition-all duration-500"
          style={{ minWidth: `${Math.max(8, varName.length + 4) * 7}px` }}
        />
      );
    }

    if (filled && value !== undefined) {
      return (
        <span key={i} className="bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 rounded px-1 font-mono text-xs font-semibold">
          {value}
        </span>
      );
    }

    return (
      <span key={i} className="bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 rounded px-1 font-mono text-xs font-semibold">
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

  const footerStatus = copied
    ? "Copied to clipboard!"
    : filled || fillMode
    ? "Variables filled — ready to copy"
    : hasVars
    ? "Use Fill or Preview in the header, then copy"
    : "Copy this prompt to use with any LLM";

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden text-sm">

      <div className="flex items-center gap-3 h-12 px-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <MessageSquare className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex-1 truncate">{title}</span>
        {model && (
          <span className="text-[10px] font-mono text-zinc-400 border border-zinc-200 dark:border-zinc-700 px-1.5 py-0.5 rounded shrink-0">
            {model}
          </span>
        )}
        <span className="text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-2 py-0.5 rounded shrink-0">
          ~{tokenCount} tok
        </span>
        {interactive && hasVars && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => {
                setFillMode((v) => !v);
                if (!fillMode) setFilled(false);
              }}
              className={cn(
                "text-[10px] px-2 py-1 rounded font-semibold border transition-all duration-500",
                fillMode
                  ? "border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300"
                  : "border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              )}
            >
              {fillMode ? "Lock" : "Fill"}
            </button>
            {!fillMode && (
              <button
                type="button"
                onClick={() => setFilled((v) => !v)}
                className={cn(
                  "text-[10px] px-2 py-1 rounded font-semibold border transition-all duration-500",
                  filled
                    ? "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300"
                    : "border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                )}
              >
                {filled ? "Template" : "Preview"}
              </button>
            )}
          </div>
        )}
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        A reusable chat prompt with color-coded roles and fill-in variables.
      </p>

      <div className="min-h-[220px] max-h-[220px] overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
        {messages.map((msg, i) => {
          const cfg = ROLE_CFG[msg.role];
          const Icon = cfg.icon;
          return (
            <div key={i} className={cn("px-4 py-3", cfg.border, cfg.bg)}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Icon className={cn("size-3.5", cfg.labelColor)} />
                <span className={cn("text-[10px] font-mono font-bold uppercase tracking-wider", cfg.labelColor)}>
                  {cfg.label}
                </span>
                <span className={cn("text-[9px] font-semibold px-1.5 py-0.5 rounded", cfg.badge)}>
                  {msg.role}
                </span>
              </div>
              <p className={cn("text-[12px] leading-relaxed whitespace-pre-wrap", cfg.textColor)}>
                {highlightVars(msg.content, liveVars, filled, fillMode, handleVarChange)}
              </p>
            </div>
          );
        })}
      </div>

      {hasVars && !fillMode && !filled && (
        <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-2 flex items-center gap-2 flex-wrap bg-amber-50/50 dark:bg-amber-950/10 min-h-[36px]">
          <span className="text-[10px] text-zinc-400 shrink-0">Variables:</span>
          {varNames.map((v) => (
            <span key={v} className="text-[10px] font-mono bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 px-1.5 py-0.5 rounded font-semibold">
              {`{{${v}}}`}
            </span>
          ))}
        </div>
      )}

      {interactive && (
        <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/30">
          <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1 truncate">{footerStatus}</span>
          <button
            type="button"
            onClick={copyPrompt}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-500 shrink-0 hover:opacity-90",
              copied
                ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                : "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
            )}
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? "Copied" : "Copy Prompt"}
          </button>
        </div>
      )}
    </div>
  );
}
