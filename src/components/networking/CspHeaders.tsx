"use client";

import { useState } from "react";
import { z } from "zod";
import { Shield, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export const CspHeadersSchema = z.object({
  policy: z.string().default(
    "default-src 'self'; script-src 'self' cdn.example.com; img-src *; style-src 'self' 'unsafe-inline'"
  ),
  directives: z
    .array(
      z.object({
        name: z.string(),
        value: z.string(),
        description: z.string(),
        blocks: z.array(z.string()).optional().default([]),
        allows: z.array(z.string()).optional().default([]),
      })
    )
    .default([
      {
        name: "default-src",
        value: "'self'",
        description: "Fallback for all content types",
        allows: ["same-origin scripts", "same-origin styles"],
        blocks: ["inline scripts", "external CDNs"],
      },
      {
        name: "script-src",
        value: "'self' cdn.example.com",
        description: "Controls where scripts can load from",
        allows: ["same-origin JS", "cdn.example.com"],
        blocks: ["inline <script>", "arbitrary CDNs"],
      },
      {
        name: "img-src",
        value: "*",
        description: "Images can load from anywhere",
        allows: ["all image sources"],
        blocks: [],
      },
      {
        name: "style-src",
        value: "'self' 'unsafe-inline'",
        description: "Styles: same-origin + inline allowed",
        allows: ["same-origin CSS", "style attributes"],
        blocks: ["external stylesheet CDNs"],
      },
      {
        name: "connect-src",
        value: "'self' api.example.com",
        description: "Controls fetch/XHR destinations",
        allows: ["same-origin", "api.example.com"],
        blocks: ["arbitrary API calls"],
      },
    ]),
});

export type CspHeadersProps = z.infer<typeof CspHeadersSchema>;

export function CspHeaders({
  policy = "default-src 'self'; script-src 'self' cdn.example.com; img-src *; style-src 'self' 'unsafe-inline'",
  directives = [],
}: CspHeadersProps) {
  const [selected, setSelected] = useState<number>(0);
  const [xssFlash, setXssFlash] = useState(false);
  const [xssDone, setXssDone] = useState(false);

  const activeDirective = directives[selected];

  function simulateXss() {
    setXssFlash(true);
    setXssDone(false);
    setTimeout(() => {
      setXssFlash(false);
      setXssDone(true);
    }, 1500);
    setTimeout(() => setXssDone(false), 4000);
  }

  // Build formatted policy lines
  const policyLines = policy
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 h-11 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
        <Shield className="size-3.5 text-zinc-400 shrink-0" />
        <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex-1">
          Content Security Policy
        </span>
        <span className="text-[10px] font-mono text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
          CSP Level 3
        </span>
      </div>

      {/* Policy code box */}
      <div className="px-4 pt-3 pb-2">
        <div className="rounded-lg bg-zinc-950 dark:bg-zinc-950 border border-zinc-800 px-3 py-2.5 font-mono text-[11px] leading-relaxed">
          <span className="text-zinc-500">Content-Security-Policy:</span>
          {policyLines.map((line, i) => (
            <div key={i} className="text-emerald-400 pl-4">
              {line}
              {i < policyLines.length - 1 ? ";" : ""}
            </div>
          ))}
        </div>
      </div>

      {/* Directive pills */}
      <div className="px-4 pt-1 pb-2">
        <p className="text-[10px] text-zinc-400 mb-2">Click a directive to see what it controls</p>
        <div className="flex flex-wrap gap-1.5">
          {directives.map((d, i) => (
            <button
              key={d.name}
              onClick={() => setSelected(i)}
              className={cn(
                "px-2.5 py-1 rounded-md text-[11px] font-mono font-medium transition-all duration-500 border",
                selected === i
                  ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500"
              )}
            >
              {d.name}
            </button>
          ))}
        </div>
      </div>

      {/* Selected directive detail — fixed height, no layout shift */}
      <div className="px-4 pb-3 min-h-[148px]">
        {activeDirective && (
          <div className="rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 p-3 transition-all duration-500">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <span className="font-mono text-xs font-bold text-zinc-800 dark:text-zinc-100">
                  {activeDirective.name}
                </span>
                <span className="font-mono text-xs text-blue-600 dark:text-blue-400 ml-2">
                  {activeDirective.value}
                </span>
              </div>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">{activeDirective.description}</p>
            <div className="flex gap-4">
              <div className="flex-1 space-y-1">
                {activeDirective.allows?.map((a) => (
                  <div key={a} className="flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400">
                    <CheckCircle className="size-3 shrink-0" />
                    {a}
                  </div>
                ))}
                {(!activeDirective.allows || activeDirective.allows.length === 0) && (
                  <div className="text-[11px] text-zinc-400 italic">No explicit allows</div>
                )}
              </div>
              <div className="flex-1 space-y-1">
                {activeDirective.blocks?.map((b) => (
                  <div key={b} className="flex items-center gap-1.5 text-[11px] text-red-600 dark:text-red-400">
                    <XCircle className="size-3 shrink-0" />
                    {b}
                  </div>
                ))}
                {(!activeDirective.blocks || activeDirective.blocks.length === 0) && (
                  <div className="text-[11px] text-zinc-400 italic">Nothing explicitly blocked</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* XSS simulation footer */}
      <div className="px-4 pb-4 border-t border-zinc-100 dark:border-zinc-800 pt-3 flex items-center gap-3 min-h-[56px]">
        <button
          onClick={simulateXss}
          disabled={xssFlash}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-500",
            xssFlash
              ? "bg-red-600 text-white opacity-90 cursor-wait"
              : "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90"
          )}
        >
          <AlertTriangle className="size-3" />
          {xssFlash ? "Blocked by CSP" : "Simulate XSS Attack"}
        </button>

        <div
          className={cn(
            "flex-1 font-mono text-[11px] transition-all duration-500",
            xssFlash
              ? "text-red-600 dark:text-red-400 opacity-100"
              : xssDone
              ? "text-emerald-600 dark:text-emerald-400 opacity-100"
              : "opacity-0"
          )}
        >
          {xssFlash
            ? "Refused to execute inline script. Violates CSP directive: script-src 'self' cdn.example.com"
            : xssDone
            ? "✓ CSP blocked the attack — attacker's inline script was never executed"
            : ""}
        </div>
      </div>
    </div>
  );
}
