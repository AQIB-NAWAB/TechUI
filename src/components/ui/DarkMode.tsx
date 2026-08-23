"use client";

import { useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Moon } from "lucide-react";

export const DarkModeSchema = z.object({
  implementation: z.enum(["css-variables", "class-toggle", "media-query", "system"]).default("css-variables"),
});

export type DarkModeProps = z.infer<typeof DarkModeSchema>;

type Tab = "css-variables" | "class-toggle" | "media-query" | "system";

const TAB_LABELS: Record<Tab, string> = {
  "css-variables": "CSS Variables",
  "class-toggle":  "Class Toggle",
  "media-query":   "Media Query",
  "system":        "System Pref",
};

const TRADEOFFS = [
  { impl: "CSS Variables",  flexible: true,  zeroJs: false, userOverride: true,  persistent: true  },
  { impl: "Class Toggle",   flexible: true,  zeroJs: false, userOverride: true,  persistent: true  },
  { impl: "Media Query",    flexible: false, zeroJs: true,  userOverride: false, persistent: false },
  { impl: "System Pref",    flexible: true,  zeroJs: false, userOverride: true,  persistent: false },
];

export function DarkMode({ implementation = "css-variables" }: DarkModeProps) {
  const [activeTab, setActiveTab] = useState<Tab>(implementation);
  const [isDark, setIsDark] = useState(false);
  const [hasClass, setHasClass] = useState(false);
  const [systemDark, setSystemDark] = useState(false);

  function renderCssVariables() {
    return (
      <div className="flex flex-col gap-3">
        <pre className={cn(
          "text-[11px] font-mono rounded-lg p-3 leading-5 overflow-x-auto transition-all duration-500",
          "bg-zinc-900 dark:bg-zinc-800 text-zinc-300"
        )}>{`:root {
  --bg:     ${isDark ? "#09090b" : "#ffffff"};
  --text:   ${isDark ? "#fafafa" : "#09090b"};
  --border: ${isDark ? "#27272a" : "#e4e4e7"};
}

.dark {
  --bg:     #09090b;
  --text:   #fafafa;
  --border: #27272a;
}`}</pre>

        {/* Live mini preview */}
        <div
          className="rounded-lg border p-4 transition-all duration-500"
          style={{
            background: isDark ? "#09090b" : "#ffffff",
            borderColor: isDark ? "#27272a" : "#e4e4e7",
            color: isDark ? "#fafafa" : "#09090b",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold" style={{ color: isDark ? "#fafafa" : "#09090b" }}>
              Mini Preview
            </span>
            <div
              className="w-16 h-4 rounded-full"
              style={{ background: isDark ? "#27272a" : "#f4f4f5" }}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            {["Primary text", "Secondary text"].map((t, i) => (
              <div
                key={t}
                className="h-2.5 rounded"
                style={{
                  width: i === 0 ? "80%" : "60%",
                  background: isDark ? (i === 0 ? "#a1a1aa" : "#52525b") : (i === 0 ? "#18181b" : "#71717a"),
                }}
              />
            ))}
          </div>
        </div>

        <button
          onClick={() => setIsDark((v) => !v)}
          className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity self-start"
        >
          Toggle CSS vars ({isDark ? "dark" : "light"})
        </button>
      </div>
    );
  }

  function renderClassToggle() {
    return (
      <div className="flex flex-col gap-3">
        <pre className="text-[11px] font-mono rounded-lg p-3 leading-5 bg-zinc-900 dark:bg-zinc-800 text-zinc-300 overflow-x-auto">{`// Toggle dark class on <html>
document.documentElement
  .classList.toggle('dark')

// Persist preference
localStorage.setItem(
  'theme',
  isDark ? 'dark' : 'light'
)

// Restore on load
const saved = localStorage.getItem('theme')
if (saved === 'dark') {
  document.documentElement
    .classList.add('dark')
}`}</pre>

        {/* DOM tree visual */}
        <div className="bg-zinc-50 dark:bg-zinc-800/60 rounded-lg p-3 font-mono text-[11px] leading-6">
          <div className="text-zinc-400">&lt;html</div>
          <div className="ml-4 transition-all duration-500">
            {hasClass ? (
              <span className="text-blue-500 font-bold"> class=&quot;dark&quot;</span>
            ) : (
              <span className="text-zinc-400"> class=&quot;&quot;</span>
            )}
          </div>
          <div className="text-zinc-400">&gt;</div>
          <div className="ml-4 text-zinc-500">&lt;body&gt;...&lt;/body&gt;</div>
          <div className="text-zinc-400">&lt;/html&gt;</div>
        </div>

        <button
          onClick={() => setHasClass((v) => !v)}
          className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity self-start"
        >
          {hasClass ? "Remove .dark class" : "Add .dark class"}
        </button>
      </div>
    );
  }

  function renderMediaQuery() {
    return (
      <div className="flex flex-col gap-3">
        <pre className="text-[11px] font-mono rounded-lg p-3 leading-5 bg-zinc-900 dark:bg-zinc-800 text-zinc-300 overflow-x-auto">{`/* Follows OS dark mode automatically */
@media (prefers-color-scheme: dark) {
  body {
    background: #09090b;
    color: #fafafa;
  }

  .card {
    border-color: #27272a;
    background: #18181b;
  }
}`}</pre>

        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2.5 text-[11px] text-amber-700 dark:text-amber-300">
          <span className="font-bold">Trade-off: </span>
          Zero JS needed — follows system setting automatically. But users cannot override it (no toggle). Best for simple sites.
        </div>

        <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-lg px-3 py-2.5 text-[11px] text-zinc-500 dark:text-zinc-400">
          <Moon className="size-4 text-zinc-400 shrink-0" />
          <span>Your OS is currently in <span className="font-semibold text-zinc-700 dark:text-zinc-300">dark mode</span> — this page adapts automatically.</span>
        </div>
      </div>
    );
  }

  function renderSystem() {
    return (
      <div className="flex flex-col gap-3">
        <pre className="text-[11px] font-mono rounded-lg p-3 leading-5 bg-zinc-900 dark:bg-zinc-800 text-zinc-300 overflow-x-auto">{`// Listen to OS preference changes
const prefersDark = window.matchMedia(
  '(prefers-color-scheme: dark)'
)

// Apply immediately
applyTheme(prefersDark.matches)

// React to OS changes in real-time
prefersDark.addEventListener(
  'change',
  (e) => applyTheme(e.matches)
)

function applyTheme(dark: boolean) {
  document.documentElement
    .classList.toggle('dark', dark)
}`}</pre>

        {/* System preference indicator */}
        <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-lg px-3 py-2.5">
          <div className="flex items-center gap-2 flex-1 text-[11px]">
            <span className="text-zinc-500 dark:text-zinc-400">Simulated OS preference:</span>
            <span className={cn(
              "font-bold px-2 py-0.5 rounded text-[10px] transition-all duration-500",
              systemDark
                ? "bg-zinc-800 text-zinc-100"
                : "bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
            )}>
              {systemDark ? "dark" : "light"}
            </span>
          </div>
          <button
            onClick={() => setSystemDark((v) => !v)}
            className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-3 py-1.5 text-xs font-semibold hover:opacity-90 transition-opacity shrink-0"
          >
            Toggle OS
          </button>
        </div>
        <div className={cn(
          "rounded-lg border p-3 transition-all duration-500 text-[11px]",
          systemDark
            ? "bg-zinc-900 border-zinc-700 text-zinc-100"
            : "bg-white border-zinc-200 text-zinc-800"
        )}>
          <div className="font-semibold mb-1">App responds to OS: {systemDark ? "dark" : "light"}</div>
          <div className={systemDark ? "text-zinc-400" : "text-zinc-500"}>
            The listener fires and updates the DOM class in real-time.
          </div>
        </div>
      </div>
    );
  }

  const tabContent: Record<Tab, React.ReactNode> = {
    "css-variables": renderCssVariables(),
    "class-toggle":  renderClassToggle(),
    "media-query":   renderMediaQuery(),
    "system":        renderSystem(),
  };

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/50">
        <Moon className="size-3.5 text-zinc-400 shrink-0" />
        <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex-1">Dark Mode</span>
        <span className="text-[10px] text-zinc-400">4 implementation approaches</span>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-4 border-b border-zinc-100 dark:border-zinc-800">
        {(Object.keys(TAB_LABELS) as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "py-2 text-[10px] font-semibold transition-all duration-500 border-r last:border-r-0 border-zinc-100 dark:border-zinc-800",
              activeTab === tab
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border-b-2 border-b-zinc-900 dark:border-b-zinc-100"
                : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 bg-zinc-50 dark:bg-zinc-900/50"
            )}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      <div className="p-4 min-h-[280px] flex flex-col gap-3">
        <div className="transition-all duration-500">
          {tabContent[activeTab]}
        </div>
      </div>

      {/* Trade-offs table */}
      <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 bg-zinc-50 dark:bg-zinc-900/30">
        <div className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wide mb-2">Approach comparison</div>
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="text-zinc-400">
                <th className="text-left pb-1 font-semibold">Approach</th>
                <th className="text-center pb-1 font-semibold">Flexible</th>
                <th className="text-center pb-1 font-semibold">Zero JS</th>
                <th className="text-center pb-1 font-semibold">User Override</th>
                <th className="text-center pb-1 font-semibold">Persistent</th>
              </tr>
            </thead>
            <tbody>
              {TRADEOFFS.map((row) => (
                <tr key={row.impl} className={cn(
                  "transition-all duration-500",
                  TAB_LABELS[activeTab] === row.impl ? "text-zinc-800 dark:text-zinc-200 font-bold" : "text-zinc-500 dark:text-zinc-400"
                )}>
                  <td className="py-0.5 pr-2">{row.impl}</td>
                  {[row.flexible, row.zeroJs, row.userOverride, row.persistent].map((v, i) => (
                    <td key={i} className="text-center py-0.5">
                      <span className={v ? "text-emerald-500" : "text-zinc-300 dark:text-zinc-600"}>{v ? "✓" : "✗"}</span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-2 text-[10px] text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/60 rounded-md px-2 py-1.5">
          <span className="font-semibold text-zinc-700 dark:text-zinc-300">Best practice: </span>
          CSS variables + class toggle + localStorage = flexible, user-controlled, AND persistent.
        </div>
      </div>
    </div>
  );
}
