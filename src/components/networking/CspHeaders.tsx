"use client";

import { useState } from "react";
import { z } from "zod";
import { Shield, CheckCircle, XCircle, AlertTriangle, Monitor, Lock } from "lucide-react";
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
    setTimeout(() => setXssDone(false), 5000);
  }

  const policyLines = policy.split(";").map((s) => s.trim()).filter(Boolean);

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800">
        <Shield className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex-1">Content Security Policy</span>
        <span className="text-[10px] font-mono text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">CSP Level 3</span>
      </div>

      <div className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        CSP tells the browser which scripts, styles, and resources are allowed to load.
      </div>

      <div className="min-h-[280px] flex flex-col">
        <div className="px-4 pt-3 pb-2">
          <div className="rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2.5 font-mono text-[11px] leading-relaxed">
            <span className="text-zinc-500">Content-Security-Policy:</span>
            {policyLines.map((line, i) => (
              <div key={i} className="text-emerald-400 pl-4">{line}{i < policyLines.length - 1 ? ";" : ""}</div>
            ))}
          </div>
        </div>

        <div className="px-4 pb-2">
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
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
                )}
              >
                {d.name}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 pb-3 flex-1">
          {activeDirective && (
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/40 p-3 min-h-[120px] transition-all duration-500">
              <div className="mb-2">
                <span className="font-mono text-xs font-bold text-zinc-800 dark:text-zinc-100">{activeDirective.name}</span>
                <span className="font-mono text-xs text-blue-600 dark:text-blue-400 ml-2">{activeDirective.value}</span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">{activeDirective.description}</p>
              <div className="flex gap-4">
                <div className="flex-1 space-y-1">
                  {activeDirective.allows?.map((a) => (
                    <div key={a} className="flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400">
                      <CheckCircle className="size-3 shrink-0" />{a}
                    </div>
                  ))}
                </div>
                <div className="flex-1 space-y-1">
                  {activeDirective.blocks?.map((b) => (
                    <div key={b} className="flex items-center gap-1.5 text-[11px] text-red-600 dark:text-red-400">
                      <XCircle className="size-3 shrink-0" />{b}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {(xssFlash || xssDone) && (
          <div className="px-4 pb-3">
            <div className={cn(
              "rounded-lg border px-3 py-2 flex items-center gap-2 transition-all duration-500",
              xssFlash ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800" : "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800"
            )}>
              <Monitor className={cn("size-4 shrink-0", xssFlash ? "text-red-500" : "text-emerald-500")} />
              <div className="font-mono text-[11px]">
                {xssFlash ? (
                  <span className="text-red-600 dark:text-red-400">
                    <Lock className="size-3 inline mr-1" />
                    Refused inline script — violates script-src
                  </span>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400">✓ CSP blocked the XSS attack</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
        <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">
          {xssDone ? "Attack blocked — inline script never executed" : "Test whether CSP blocks a malicious inline script"}
        </span>
        <button
          onClick={simulateXss}
          disabled={xssFlash}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-500",
            xssFlash ? "bg-red-600 text-white opacity-90" : "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90"
          )}
        >
          <AlertTriangle className="size-3.5" />
          {xssFlash ? "Blocked!" : "Simulate XSS"}
        </button>
      </div>
    </div>
  );
}
