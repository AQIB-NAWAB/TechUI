"use client";

import { useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Scale, Database, Server, Code2, Globe, Lock, Zap, CheckCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const ConceptComparisonSchema = z.object({
  title: z.string().optional(),
  leftLabel: z.string(),
  rightLabel: z.string(),
  rows: z.array(z.object({
    concern: z.string(),
    left: z.string(),
    right: z.string(),
    winner: z.enum(["left", "right", "tie", "depends"]).optional(),
  })),
  leftIcon: z.string().optional(),
  rightIcon: z.string().optional(),
  verdict: z.string().optional(),
});

export type ConceptComparisonProps = z.infer<typeof ConceptComparisonSchema>;

const ICON_MAP: Record<string, LucideIcon> = {
  database: Database,
  server: Server,
  code: Code2,
  globe: Globe,
  lock: Lock,
  zap: Zap,
};

export function ConceptComparison({
  title,
  leftLabel,
  rightLabel,
  rows,
  leftIcon,
  rightIcon,
  verdict,
}: ConceptComparisonProps) {
  const [highlightedRow, setHighlightedRow] = useState<number | null>(null);
  const [showVerdict, setShowVerdict] = useState(false);

  const LeftIcon = leftIcon && ICON_MAP[leftIcon] ? ICON_MAP[leftIcon] : null;
  const RightIcon = rightIcon && ICON_MAP[rightIcon] ? ICON_MAP[rightIcon] : null;

  function getCellClass(winner: string | undefined, side: "left" | "right") {
    if (!winner || winner === "tie") {
      return "text-zinc-700 dark:text-zinc-300";
    }
    if (winner === "depends") {
      return "text-amber-600 dark:text-amber-400 font-medium";
    }
    if (winner === side) {
      return "text-emerald-600 dark:text-emerald-400 font-semibold";
    }
    return "text-zinc-400 dark:text-zinc-600";
  }

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800">
        <Scale className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">
          {title ?? "Concept Comparison"}
        </span>
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        Side-by-side tradeoffs — click a row to highlight it.
      </p>

      <div className="overflow-x-auto min-h-[220px]">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900">
              <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest w-1/3">
                Concern
              </th>
              <th className="px-4 py-3 text-center w-1/3 font-bold">
                <div className="flex items-center justify-center gap-1.5">
                  {LeftIcon && <LeftIcon className="size-3.5" />}
                  <span className="text-xs">{leftLabel}</span>
                </div>
              </th>
              <th className="px-4 py-3 text-center w-1/3 font-bold">
                <div className="flex items-center justify-center gap-1.5">
                  {RightIcon && <RightIcon className="size-3.5" />}
                  <span className="text-xs">{rightLabel}</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const isHighlighted = highlightedRow === i;
              const isOdd = i % 2 === 1;
              return (
                <tr
                  key={i}
                  onClick={() => setHighlightedRow(isHighlighted ? null : i)}
                  className={cn(
                    "cursor-pointer transition-all duration-500 border-t border-zinc-100 dark:border-zinc-800",
                    isOdd ? "bg-zinc-50 dark:bg-zinc-800/40" : "bg-white dark:bg-zinc-900",
                    isHighlighted && "ring-2 ring-inset ring-blue-200 dark:ring-blue-800"
                  )}
                >
                  <td className="px-4 py-2.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    {row.concern}
                  </td>
                  <td className={cn("px-4 py-2.5 text-xs text-center", getCellClass(row.winner, "left"))}>
                    {row.winner === "left" && (
                      <CheckCircle className="size-3.5 inline mr-1 text-emerald-500 align-text-bottom" />
                    )}
                    {row.left}
                  </td>
                  <td className={cn("px-4 py-2.5 text-xs text-center", getCellClass(row.winner, "right"))}>
                    {row.winner === "right" && (
                      <CheckCircle className="size-3.5 inline mr-1 text-emerald-500 align-text-bottom" />
                    )}
                    {row.right}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {verdict && (
        <div className="min-h-[72px] px-4 border-t border-zinc-100 dark:border-zinc-800">
          <div className={cn(
            "py-3 transition-all duration-500",
            showVerdict ? "opacity-100" : "opacity-0"
          )}>
            <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 rounded-lg px-3 py-2 flex items-start gap-2">
              <Scale className="size-4 text-zinc-400 mt-0.5 shrink-0" />
              <p className="text-sm text-zinc-600 dark:text-zinc-400">{verdict}</p>
            </div>
          </div>
        </div>
      )}

      <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/30">
        <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">
          {highlightedRow !== null
            ? `Comparing: ${rows[highlightedRow]?.concern}`
            : "Click a row to highlight a tradeoff"}
        </span>
        <button
          onClick={() => {
            if (verdict) {
              setShowVerdict((v) => !v);
            } else if (highlightedRow === null) {
              setHighlightedRow(0);
            } else {
              setHighlightedRow((r) => (r === null || r >= rows.length - 1 ? 0 : r + 1));
            }
          }}
          className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-all duration-500 shrink-0"
        >
          {verdict ? (showVerdict ? "Hide Verdict" : "Show Verdict") : highlightedRow === null ? "Start Compare" : "Next Row"}
        </button>
      </div>
    </div>
  );
}
