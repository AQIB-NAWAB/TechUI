"use client";

import { useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { TrendingUp } from "lucide-react";

export const BigONotationSchema = z.object({
  selectedComplexity: z.enum(["O1", "Ologn", "On", "Onlogn", "On2"]).optional().default("On"),
  inputSize: z.number().default(10),
});

export type BigONotationProps = z.infer<typeof BigONotationSchema>;

const COMPLEXITIES = [
  { key: "O1",     label: "O(1)",       color: "emerald", computeOps: (n: number) => 1,                    desc: "Constant — same no matter the input" },
  { key: "Ologn",  label: "O(log n)",   color: "blue",    computeOps: (n: number) => Math.log2(n),         desc: "Logarithmic — halves the problem each step" },
  { key: "On",     label: "O(n)",       color: "amber",   computeOps: (n: number) => n,                    desc: "Linear — one operation per element" },
  { key: "Onlogn", label: "O(n log n)", color: "orange",  computeOps: (n: number) => n * Math.log2(n),     desc: "Linearithmic — divide and conquer" },
  { key: "On2",    label: "O(n²)",      color: "red",     computeOps: (n: number) => n * n,                desc: "Quadratic — nested loops" },
] as const;

const EXAMPLES: Record<string, string[]> = {
  O1:     ["Array access by index", "Hash map get/set", "Stack push/pop"],
  Ologn:  ["Binary search", "Balanced BST lookup", "Skip list search"],
  On:     ["Linear search", "Array traversal", "String comparison"],
  Onlogn: ["Merge sort", "Heap sort", "Quick sort (average)"],
  On2:    ["Bubble sort", "Insertion sort", "Nested loop comparison"],
};

const COLOR_CLASSES: Record<string, { tab: string; tabActive: string; bar: string; text: string; badge: string }> = {
  emerald: {
    tab:       "border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20",
    tabActive: "bg-emerald-100 dark:bg-emerald-900/40 border-emerald-400 dark:border-emerald-500 text-emerald-800 dark:text-emerald-300 font-bold",
    bar:       "bg-emerald-400 dark:bg-emerald-500",
    text:      "text-emerald-700 dark:text-emerald-400",
    badge:     "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300",
  },
  blue: {
    tab:       "border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20",
    tabActive: "bg-blue-100 dark:bg-blue-900/40 border-blue-400 dark:border-blue-500 text-blue-800 dark:text-blue-300 font-bold",
    bar:       "bg-blue-400 dark:bg-blue-500",
    text:      "text-blue-700 dark:text-blue-400",
    badge:     "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
  },
  amber: {
    tab:       "border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20",
    tabActive: "bg-amber-100 dark:bg-amber-900/40 border-amber-400 dark:border-amber-500 text-amber-800 dark:text-amber-300 font-bold",
    bar:       "bg-amber-400 dark:bg-amber-500",
    text:      "text-amber-700 dark:text-amber-400",
    badge:     "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
  },
  orange: {
    tab:       "border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20",
    tabActive: "bg-orange-100 dark:bg-orange-900/40 border-orange-400 dark:border-orange-500 text-orange-800 dark:text-orange-300 font-bold",
    bar:       "bg-orange-400 dark:bg-orange-500",
    text:      "text-orange-700 dark:text-orange-400",
    badge:     "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300",
  },
  red: {
    tab:       "border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20",
    tabActive: "bg-red-100 dark:bg-red-900/40 border-red-400 dark:border-red-500 text-red-800 dark:text-red-300 font-bold",
    bar:       "bg-red-400 dark:bg-red-500",
    text:      "text-red-700 dark:text-red-400",
    badge:     "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300",
  },
};

const INPUT_SIZES = [10, 100, 1000];

function formatOps(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return Math.round(n).toString();
}

export function BigONotation({
  selectedComplexity: initialComplexity = "On",
  inputSize: initialInputSize = 10,
}: BigONotationProps) {
  const [selected, setSelected] = useState<string>(initialComplexity);
  const [inputSize, setInputSize] = useState<number>(initialInputSize);

  const ops = COMPLEXITIES.map((c) => ({ key: c.key, ops: c.computeOps(inputSize) }));
  const maxOps = Math.max(...ops.map((o) => o.ops));

  const selectedDef = COMPLEXITIES.find((c) => c.key === selected) ?? COMPLEXITIES[2];
  const examples = EXAMPLES[selected] ?? [];

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <TrendingUp className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">Big-O Notation</span>
        <span className="text-[10px] font-mono text-zinc-400">n = {inputSize}</span>
      </div>

      {/* Complexity tabs */}
      <div className="px-4 pt-3 pb-2 flex flex-wrap gap-1.5">
        {COMPLEXITIES.map((c) => {
          const colors = COLOR_CLASSES[c.color];
          const isActive = selected === c.key;
          return (
            <button
              key={c.key}
              onClick={() => setSelected(c.key)}
              className={cn(
                "px-2.5 py-1 rounded-lg border text-[11px] font-mono transition-all duration-300 cursor-pointer",
                isActive ? colors.tabActive : colors.tab
              )}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      {/* Input size selector */}
      <div className="px-4 pb-3 flex items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Input size n:</span>
        <div className="flex gap-1">
          {INPUT_SIZES.map((s) => (
            <button
              key={s}
              onClick={() => setInputSize(s)}
              className={cn(
                "px-2.5 py-1 rounded-lg border text-[11px] font-mono transition-all duration-300 cursor-pointer",
                inputSize === s
                  ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white"
                  : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-500"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Bar chart */}
      <div className="min-h-[300px] px-4 pb-3 space-y-2">
        {COMPLEXITIES.map((c) => {
          const { ops: opCount } = ops.find((o) => o.key === c.key) ?? { ops: 1 };
          const colors = COLOR_CLASSES[c.color];
          const isSelected = selected === c.key;
          // Use log scale for bar widths to prevent O(n²) from completely dominating
          const logOps = Math.log10(opCount + 1);
          const logMax = Math.log10(maxOps + 1);
          const barPct = logMax > 0 ? Math.min((logOps / logMax) * 100, 100) : 4;
          const isOverflow = opCount >= 10_000;

          return (
            <div
              key={c.key}
              onClick={() => setSelected(c.key)}
              className={cn(
                "cursor-pointer rounded-lg p-2.5 transition-all duration-300",
                isSelected
                  ? "bg-zinc-50 dark:bg-zinc-800/60 ring-1 ring-zinc-200 dark:ring-zinc-700"
                  : "hover:bg-zinc-50 dark:hover:bg-zinc-800/30"
              )}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className={cn("text-[11px] font-mono w-20 shrink-0", isSelected ? colors.text : "text-zinc-500 dark:text-zinc-400")}>
                  {c.label}
                </span>
                <div className="flex-1 h-5 bg-zinc-100 dark:bg-zinc-800 rounded overflow-hidden relative">
                  <div
                    className={cn("h-full rounded transition-all duration-500", colors.bar)}
                    style={{ width: `${Math.max(barPct, 2)}%` }}
                  />
                  {isOverflow && (
                    <span className="absolute right-1 top-0.5 text-[9px] font-bold text-zinc-500 dark:text-zinc-400">...</span>
                  )}
                </div>
                <span className={cn("text-[10px] font-mono shrink-0 w-14 text-right", isSelected ? colors.text : "text-zinc-400 dark:text-zinc-500")}>
                  {formatOps(opCount)} op{opCount !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          );
        })}

        {/* Selected complexity detail */}
        <div className={cn(
          "rounded-lg border px-3 py-2.5 transition-all duration-500",
          COLOR_CLASSES[selectedDef.color].badge,
          "border-current/20"
        )}>
          <div className={cn("text-xs font-semibold mb-1", COLOR_CLASSES[selectedDef.color].text)}>
            {selectedDef.label} — {selectedDef.desc}
          </div>
          <ul className="space-y-0.5">
            {examples.map((ex) => (
              <li key={ex} className="text-[11px] text-zinc-600 dark:text-zinc-400 flex items-start gap-1.5">
                <span className="mt-0.5 shrink-0">•</span>
                {ex}
              </li>
            ))}
          </ul>
        </div>

        {/* Key insight */}
        <div className="text-[10px] text-zinc-400 dark:text-zinc-500 bg-zinc-50 dark:bg-zinc-800/40 rounded-lg px-3 py-2">
          At n={inputSize.toLocaleString()}: O(1) always does <strong className="text-zinc-600 dark:text-zinc-400">1 op</strong>{" "}
          while O(n²) does <strong className="text-red-500">{formatOps(inputSize * inputSize)} ops</strong>
          {inputSize >= 1000 && " — 1,000,000x more work!"}
        </div>
      </div>
    </div>
  );
}
