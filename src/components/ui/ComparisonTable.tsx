"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { CheckCircle, XCircle, Minus, Star, Table2, Trophy } from "lucide-react";
import { Fragment } from "react";

const CellValueEnum = z.union([
  z.boolean(),
  z.string(),
  z.number(),
  z.null(),
]);

export const ComparisonTableSchema = z.object({
  title: z.string().optional(),
  options: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      sublabel: z.string().optional(),
      recommended: z.boolean().optional().default(false),
      color: z.enum(["blue", "violet", "emerald", "amber", "cyan", "rose", "zinc"]).optional().default("zinc"),
    })
  ),
  criteria: z.array(
    z.object({
      label: z.string(),
      description: z.string().optional(),
      group: z.string().optional(),
      values: z.record(z.string(), CellValueEnum),
    })
  ),
});

export type ComparisonTableProps = z.infer<typeof ComparisonTableSchema>;

function isPartialValue(value: z.infer<typeof CellValueEnum>): boolean {
  if (typeof value === "string") {
    const lower = value.toLowerCase();
    return lower.includes("partial") || lower.includes("limited") || lower.includes("sometimes");
  }
  return false;
}

function CellValue({ value, winner }: { value: z.infer<typeof CellValueEnum>; winner?: boolean }) {
  if (value === true) {
    return (
      <span className={cn(
        "inline-flex items-center justify-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold transition-all duration-500",
        winner && "scale-125"
      )}>
        <CheckCircle className="size-4 shrink-0" />
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="inline-flex items-center justify-center">
        <XCircle className="size-4 text-zinc-300 dark:text-zinc-600" />
      </span>
    );
  }
  if (value === null) {
    return <Minus className="size-4 text-zinc-300 dark:text-zinc-600 mx-auto" />;
  }
  if (typeof value === "number") {
    return <span className="text-xs font-mono font-semibold text-zinc-600 dark:text-zinc-400">{value}</span>;
  }
  if (isPartialValue(value)) {
    return <span className="text-xs text-amber-500 font-medium text-center leading-tight">{value}</span>;
  }
  return <span className="text-xs text-zinc-600 dark:text-zinc-400 text-center leading-tight">{value}</span>;
}

function scoreOption(
  optId: string,
  criteria: ComparisonTableProps["criteria"]
): number {
  let score = 0;
  for (const c of criteria) {
    const v = c.values[optId];
    if (v === true) score += 2;
    else if (typeof v === "string" && !isPartialValue(v)) score += 1;
    else if (typeof v === "number") score += 1;
  }
  return score;
}

export function ComparisonTable({ title, options, criteria }: ComparisonTableProps) {
  const recommendedId = options.find((o) => o.recommended)?.id ?? options[0]?.id;
  const winnerId =
    options.reduce((best, opt) =>
      scoreOption(opt.id, criteria) > scoreOption(best.id, criteria) ? opt : best
    ).id;

  const [revealing, setRevealing] = useState(false);
  const [visibleRows, setVisibleRows] = useState<number>(criteria.length);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  const groups = [...new Set(criteria.map((c) => c.group ?? ""))];
  const activeWinner = highlightId ?? winnerId;
  const showingWinner = highlightId !== null || revealing;

  useEffect(() => {
    if (!revealing) {
      setVisibleRows(criteria.length);
      return;
    }
    setVisibleRows(0);
    setHighlightId(null);
    let row = 0;
    const timer = setInterval(() => {
      row += 1;
      setVisibleRows(row);
      if (row >= criteria.length) {
        clearInterval(timer);
        setHighlightId(recommendedId ?? winnerId);
        setTimeout(() => setRevealing(false), 500);
      }
    }, 1200);
    return () => clearInterval(timer);
  }, [revealing, criteria.length, recommendedId, winnerId]);

  function startReveal() {
    if (revealing) return;
    setRevealing(true);
  }

  let rowIndex = 0;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <Table2 className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">{title ?? "Comparison"}</span>
        <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
          {options.length} options
        </span>
      </div>

      <div className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        Compare options side by side — the highlighted column wins on the most features.
      </div>

      <div className="overflow-x-auto min-h-[220px]">
        <table className="w-full">
          <thead>
            <tr className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900">
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest w-36">
                Feature
              </th>
              {options.map((opt) => {
                const isWinner = showingWinner && activeWinner === opt.id;
                return (
                  <th
                    key={opt.id}
                    className={cn(
                      "px-4 py-3 text-center font-bold transition-all duration-700 relative",
                      isWinner && "bg-blue-600 dark:bg-blue-500 text-white dark:text-white"
                    )}
                  >
                    {isWinner && (
                      <div className="absolute inset-0 ring-2 ring-inset ring-blue-300 dark:ring-blue-400 animate-pulse pointer-events-none" />
                    )}
                    <div className="flex flex-col items-center gap-1 relative">
                      {opt.recommended && (
                        <div className={cn(
                          "flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide transition-all duration-500",
                          isWinner ? "text-blue-100" : "text-blue-300 dark:text-blue-700"
                        )}>
                          <Trophy className="size-2.5" />
                          Winner
                        </div>
                      )}
                      <span className="text-xs">{opt.label}</span>
                      {opt.sublabel && (
                        <span className="text-[10px] font-normal opacity-70">{opt.sublabel}</span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {groups.map((group) => {
              const groupCriteria = criteria.filter((c) => (c.group ?? "") === group);
              return (
                <Fragment key={group || "default"}>
                  {group && (
                    <tr>
                      <td
                        colSpan={options.length + 1}
                        className="px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800 border-t border-zinc-200 dark:border-zinc-700"
                      >
                        {group}
                      </td>
                    </tr>
                  )}
                  {groupCriteria.map((c, ci) => {
                    const currentRow = rowIndex++;
                    const isVisible = currentRow < visibleRows;
                    const rowWinner = options.find((opt) => c.values[opt.id] === true)?.id
                      ?? options.find((opt) => typeof c.values[opt.id] === "string" && !isPartialValue(c.values[opt.id] as string))?.id;

                    return (
                      <tr
                        key={c.label}
                        className={cn(
                          "border-t border-zinc-100 dark:border-zinc-800 transition-all duration-500",
                          ci % 2 === 0 ? "bg-white dark:bg-zinc-900" : "bg-zinc-50 dark:bg-zinc-800/40",
                          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                        )}
                      >
                        <td className="px-4 py-2.5">
                          <div className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{c.label}</div>
                          {c.description && (
                            <div className="text-[10px] text-zinc-400 mt-0.5">{c.description}</div>
                          )}
                        </td>
                        {options.map((opt) => {
                          const value = c.values[opt.id] ?? null;
                          const colHighlight = showingWinner && activeWinner === opt.id;
                          const cellWinner = rowWinner === opt.id && showingWinner;
                          return (
                            <td
                              key={opt.id}
                              className={cn(
                                "px-4 py-2.5 text-center transition-all duration-700",
                                colHighlight && "bg-blue-50/80 dark:bg-blue-950/40",
                                cellWinner && activeWinner === opt.id && "ring-2 ring-inset ring-emerald-300 dark:ring-emerald-700"
                              )}
                            >
                              <CellValue value={value} winner={cellWinner && value === true} />
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/30 min-h-[52px]">
        <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">
          {revealing
            ? `Revealing row ${visibleRows} of ${criteria.length}…`
            : showingWinner
              ? `${options.find((o) => o.id === activeWinner)?.label ?? "Winner"} leads on features`
              : `${criteria.length} features — click to reveal and highlight the winner`}
        </span>
        <button
          type="button"
          onClick={startReveal}
          disabled={revealing}
          className={cn(
            "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-all duration-500 shrink-0 flex items-center gap-1.5",
            revealing && "opacity-60 cursor-not-allowed"
          )}
        >
          <Star className="size-3.5" />
          {revealing ? "Revealing…" : "Reveal Winner"}
        </button>
      </div>
    </div>
  );
}
