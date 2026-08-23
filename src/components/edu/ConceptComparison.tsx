"use client";

import { useState } from "react";
import { z } from "zod";
import { Scale, Database, Server, Code2, Globe, Lock, Zap } from "lucide-react";
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

  const LeftIcon = leftIcon && ICON_MAP[leftIcon] ? ICON_MAP[leftIcon] : null;
  const RightIcon = rightIcon && ICON_MAP[rightIcon] ? ICON_MAP[rightIcon] : null;

  function getCellClass(winner: string | undefined, side: "left" | "right") {
    if (!winner || winner === "tie") {
      return "text-zinc-700 dark:text-zinc-300";
    }
    if (winner === "depends") {
      return side === "left"
        ? "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30"
        : "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30";
    }
    if (winner === side) {
      return "text-emerald-700 dark:text-emerald-400 font-semibold";
    }
    return "text-zinc-500 dark:text-zinc-500";
  }

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {title && (
        <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">{title}</h3>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 w-1/3">
                Concern
              </th>
              <th className="px-4 py-2 text-center w-1/3">
                <div className="flex items-center justify-center gap-1.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 rounded-lg px-3 py-1.5">
                  {LeftIcon && <LeftIcon className="w-3.5 h-3.5 text-blue-500" />}
                  <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">{leftLabel}</span>
                </div>
              </th>
              <th className="px-4 py-2 text-center w-1/3">
                <div className="flex items-center justify-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900 rounded-lg px-3 py-1.5">
                  {RightIcon && <RightIcon className="w-3.5 h-3.5 text-emerald-500" />}
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">{rightLabel}</span>
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
                  className={[
                    "cursor-pointer transition-all duration-500 border-t border-zinc-100 dark:border-zinc-800",
                    isOdd ? "bg-zinc-50 dark:bg-zinc-800/30" : "",
                    isHighlighted ? "ring-2 ring-inset ring-blue-300 dark:ring-blue-700" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50",
                  ].join(" ")}
                >
                  <td className="px-4 py-2.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    {row.concern}
                  </td>
                  <td className={`px-4 py-2.5 text-xs text-center ${getCellClass(row.winner, "left")}`}>
                    {row.winner === "left" && <span className="mr-1">✓</span>}
                    {row.left}
                  </td>
                  <td className={`px-4 py-2.5 text-xs text-center ${getCellClass(row.winner, "right")}`}>
                    {row.winner === "right" && <span className="mr-1">✓</span>}
                    {row.right}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {verdict && (
        <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3">
          <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg px-3 py-2 flex items-start gap-2">
            <Scale className="w-4 h-4 text-zinc-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{verdict}</p>
          </div>
        </div>
      )}
    </div>
  );
}
