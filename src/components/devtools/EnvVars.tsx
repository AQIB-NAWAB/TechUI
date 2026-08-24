"use client";

import { useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, Copy, Check, Lock, Key } from "lucide-react";

export const EnvVarsSchema = z.object({
  vars: z.array(
    z.object({
      key: z.string(),
      value: z.string(),
      description: z.string().optional(),
      required: z.boolean().optional().default(false),
      sensitive: z.boolean().optional().default(false),
      example: z.string().optional(),
    })
  ),
  title: z.string().optional().default(".env"),
  showValues: z.boolean().optional().default(false),
  format: z.enum(["dotenv", "shell", "docker"]).optional().default("dotenv"),
});

export type EnvVarsProps = z.infer<typeof EnvVarsSchema>;

const SENSITIVE_PATTERNS = /SECRET|PASSWORD|TOKEN|KEY|PWD|PASS|AUTH|PRIVATE|CREDENTIAL|CERT|SIGNING/i;

function isSensitive(key: string, explicitSensitive?: boolean): boolean {
  return explicitSensitive ?? SENSITIVE_PATTERNS.test(key);
}

function maskValue(value: string): string {
  if (value.length <= 4) return "•".repeat(8);
  return value.slice(0, 4) + "•".repeat(Math.min(value.length - 4, 12));
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
      className="p-1 rounded text-zinc-400 hover:text-zinc-600 transition-all duration-500 opacity-0 group-hover:opacity-100"
    >
      {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
    </button>
  );
}

export function EnvVars({
  vars,
  title = ".env",
  showValues: initShowValues = false,
  format = "dotenv",
}: EnvVarsProps) {
  const [showAll, setShowAll] = useState(initShowValues);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  function toggleReveal(key: string) {
    setRevealed((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  const hasSecrets = vars.some((v) => isSensitive(v.key, v.sensitive));
  const formatPrefix = format === "shell" ? "export " : "";
  const secretCount = vars.filter((v) => isSensitive(v.key, v.sensitive)).length;
  const requiredCount = vars.filter((v) => v.required).length;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800">
        <Key className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">{title}</span>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">{format}</span>
        <span className="text-xs text-zinc-400 tabular-nums">{vars.length} vars</span>
      </div>

      <p className="text-sm text-zinc-500 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        Environment variables configure your app — never commit secrets to git.
      </p>

      <div className="min-h-[240px] max-h-[320px] overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
        {vars.map((v) => {
          const sensitive = isSensitive(v.key, v.sensitive);
          const visible = showAll || revealed.has(v.key);
          const displayValue = sensitive && !visible ? maskValue(v.value) : v.value;

          return (
            <div key={v.key} className="group px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all duration-500">
              <div className="flex items-start gap-3">
                <div className="flex items-center gap-1.5 min-w-0 shrink-0" style={{ width: "45%" }}>
                  <span className="font-mono text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                    {formatPrefix}{v.key}
                  </span>
                  {v.required && <span className="text-red-500 text-[10px] font-bold">*</span>}
                  {sensitive && <Lock className="size-3 text-zinc-400 shrink-0" />}
                </div>
                <span className="text-zinc-300 dark:text-zinc-700 text-xs font-mono shrink-0">=</span>
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <span className={cn(
                    "font-mono text-xs truncate flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-md px-2.5 py-1 transition-all duration-500",
                    sensitive && !visible ? "text-zinc-400 tracking-widest" : "text-emerald-600 dark:text-emerald-400"
                  )}>
                    {displayValue || <span className="text-zinc-300 italic text-[10px]">empty</span>}
                  </span>
                  {sensitive && (
                    <button
                      onClick={() => toggleReveal(v.key)}
                      className="shrink-0 p-1 rounded text-zinc-400 hover:text-zinc-600 transition-all duration-500 opacity-0 group-hover:opacity-100"
                    >
                      {revealed.has(v.key) || showAll ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                    </button>
                  )}
                  <CopyBtn text={v.value} />
                </div>
              </div>
              {(v.description || v.example) && (
                <div className="mt-1 text-[11px] text-zinc-400 font-sans">
                  {v.description}
                  {v.example && <span className="ml-2 font-mono">e.g. {v.example}</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-3">
        <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">
          {requiredCount} required · {secretCount} sensitive
          {vars.filter((v) => !v.value).length > 0 && (
            <span className="text-amber-500 ml-1">· {vars.filter((v) => !v.value).length} unset</span>
          )}
        </span>
        {hasSecrets && (
          <button
            onClick={() => { setShowAll((v) => !v); setRevealed(new Set()); }}
            className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5"
          >
            {showAll ? <><EyeOff className="size-3.5" /> Hide all</> : <><Eye className="size-3.5" /> Reveal all</>}
          </button>
        )}
      </div>
    </div>
  );
}
