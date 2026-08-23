"use client";

import { useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Table2 } from "lucide-react";

export const SqlJoinsSchema = z.object({
  leftTable: z.string().default("orders"),
  rightTable: z.string().default("customers"),
  joinType: z.enum(["inner", "left", "right", "full"]).default("inner"),
  leftRows: z
    .array(
      z.object({
        id: z.number(),
        label: z.string(),
        hasMatch: z.boolean(),
      })
    )
    .default([
      { id: 1, label: "Order #1001", hasMatch: true },
      { id: 2, label: "Order #1002", hasMatch: true },
      { id: 3, label: "Order #1003", hasMatch: false },
      { id: 4, label: "Order #1004", hasMatch: false },
    ]),
  rightRows: z
    .array(
      z.object({
        id: z.number(),
        label: z.string(),
        hasMatch: z.boolean(),
      })
    )
    .default([
      { id: 1, label: "Alice", hasMatch: true },
      { id: 2, label: "Bob", hasMatch: true },
      { id: 3, label: "Carol", hasMatch: false },
    ]),
});

export type SqlJoinsProps = z.infer<typeof SqlJoinsSchema>;

type JoinType = "inner" | "left" | "right" | "full";

type JoinConfig = {
  label: string;
  short: string;
  color: string;
  description: string;
  sql: (left: string, right: string) => string;
  leftIncluded: (hasMatch: boolean) => boolean;
  rightIncluded: (hasMatch: boolean) => boolean;
};

const JOIN_CONFIGS: Record<JoinType, JoinConfig> = {
  inner: {
    label: "INNER JOIN",
    short: "INNER",
    color: "blue",
    description: "Only rows that have a match in BOTH tables",
    sql: (l, r) => `SELECT * FROM ${l}\nINNER JOIN ${r}\n  ON ${l}.customer_id = ${r}.id`,
    leftIncluded: (m) => m,
    rightIncluded: (m) => m,
  },
  left: {
    label: "LEFT JOIN",
    short: "LEFT",
    color: "emerald",
    description: "All rows from the LEFT table + matched rows from the right",
    sql: (l, r) => `SELECT * FROM ${l}\nLEFT JOIN ${r}\n  ON ${l}.customer_id = ${r}.id`,
    leftIncluded: () => true,
    rightIncluded: (m) => m,
  },
  right: {
    label: "RIGHT JOIN",
    short: "RIGHT",
    color: "violet",
    description: "Matched rows from the left + ALL rows from the RIGHT table",
    sql: (l, r) => `SELECT * FROM ${l}\nRIGHT JOIN ${r}\n  ON ${l}.customer_id = ${r}.id`,
    leftIncluded: (m) => m,
    rightIncluded: () => true,
  },
  full: {
    label: "FULL OUTER",
    short: "FULL",
    color: "amber",
    description: "ALL rows from BOTH tables — NULL fills gaps where there's no match",
    sql: (l, r) => `SELECT * FROM ${l}\nFULL OUTER JOIN ${r}\n  ON ${l}.customer_id = ${r}.id`,
    leftIncluded: () => true,
    rightIncluded: () => true,
  },
};

const colorMap: Record<string, { tab: string; badge: string; border: string; venn: string }> = {
  blue:    { tab: "bg-blue-600 text-white dark:bg-blue-500",   badge: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",   border: "border-l-blue-500",   venn: "bg-blue-200 dark:bg-blue-800/60" },
  emerald: { tab: "bg-emerald-600 text-white dark:bg-emerald-500", badge: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300", border: "border-l-emerald-500", venn: "bg-emerald-200 dark:bg-emerald-800/60" },
  violet:  { tab: "bg-violet-600 text-white dark:bg-violet-500",   badge: "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300",   border: "border-l-violet-500",   venn: "bg-violet-200 dark:bg-violet-800/60" },
  amber:   { tab: "bg-amber-500 text-white dark:bg-amber-500",   badge: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",   border: "border-l-amber-500",   venn: "bg-amber-200 dark:bg-amber-800/60" },
};

type RowItem = { id: number; label: string; hasMatch: boolean };

function RowList({
  rows,
  included,
  color,
  label,
}: {
  rows: RowItem[];
  included: (hasMatch: boolean) => boolean;
  color: string;
  label: string;
}) {
  const clr = colorMap[color] ?? colorMap["blue"]!;
  return (
    <div className="flex flex-col gap-1.5 min-w-0 flex-1">
      <div className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-0.5">
        {label}
      </div>
      {rows.map((row) => {
        const isIn = included(row.hasMatch);
        return (
          <div
            key={row.id}
            className={cn(
              "flex items-center gap-2 px-2.5 py-1.5 rounded-lg border-l-4 text-xs font-medium transition-all duration-500",
              isIn
                ? cn("bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200", clr.border)
                : "border-l-transparent bg-transparent text-zinc-400 dark:text-zinc-600 opacity-30"
            )}
          >
            {isIn && (
              <span className={cn("text-[9px] font-bold px-1 py-0.5 rounded shrink-0", clr.badge)}>
                IN
              </span>
            )}
            <span className="truncate">{row.label}</span>
            {isIn && !row.hasMatch && (
              <span className="text-[9px] text-zinc-400 shrink-0">NULL →</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function VennDiagram({ joinType, color }: { joinType: JoinType; color: string }) {
  const clr = colorMap[color] ?? colorMap["blue"]!;
  const leftFill =
    joinType === "left" || joinType === "full" ? clr.venn : "bg-transparent";
  const rightFill =
    joinType === "right" || joinType === "full" ? clr.venn : "bg-transparent";
  const centerFill =
    joinType === "inner" || joinType === "left" || joinType === "right" || joinType === "full"
      ? clr.venn
      : "bg-transparent";

  return (
    <div className="flex items-center justify-center py-1 shrink-0">
      <div className="relative flex items-center w-24 h-10">
        {/* Left circle */}
        <div
          className={cn(
            "absolute left-0 size-9 rounded-full border-2 border-zinc-300 dark:border-zinc-600 transition-all duration-500",
            leftFill
          )}
        />
        {/* Right circle */}
        <div
          className={cn(
            "absolute right-0 size-9 rounded-full border-2 border-zinc-300 dark:border-zinc-600 transition-all duration-500",
            rightFill
          )}
        />
        {/* Center overlap indicator */}
        <div
          className={cn(
            "absolute left-1/2 -translate-x-1/2 w-5 h-9 transition-all duration-500 rounded-sm",
            centerFill
          )}
        />
      </div>
    </div>
  );
}

export function SqlJoins({
  leftTable = "orders",
  rightTable = "customers",
  joinType: joinTypeProp = "inner",
  leftRows = [
    { id: 1, label: "Order #1001", hasMatch: true },
    { id: 2, label: "Order #1002", hasMatch: true },
    { id: 3, label: "Order #1003", hasMatch: false },
    { id: 4, label: "Order #1004", hasMatch: false },
  ],
  rightRows = [
    { id: 1, label: "Alice", hasMatch: true },
    { id: 2, label: "Bob", hasMatch: true },
    { id: 3, label: "Carol", hasMatch: false },
  ],
}: SqlJoinsProps) {
  const [joinType, setJoinType] = useState<JoinType>(joinTypeProp);

  const cfg = JOIN_CONFIGS[joinType];
  const clr = colorMap[cfg.color] ?? colorMap["blue"]!;

  const leftIncluded = leftRows.filter((r) => cfg.leftIncluded(r.hasMatch));
  const rightIncluded = rightRows.filter((r) => cfg.rightIncluded(r.hasMatch));
  const resultCount = Math.max(leftIncluded.length, rightIncluded.length);

  const allTypes: JoinType[] = ["inner", "left", "right", "full"];

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 h-11 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <Table2 className="size-3.5 text-zinc-400 shrink-0" />
        <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex-1">SQL Joins</span>
      </div>

      {/* Tab buttons */}
      <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20">
        {allTypes.map((t) => {
          const c = JOIN_CONFIGS[t];
          const isActive = t === joinType;
          const activeClr = colorMap[c.color] ?? colorMap["blue"]!;
          return (
            <button
              key={t}
              onClick={() => setJoinType(t)}
              className={cn(
                "px-2.5 py-1 rounded-md text-[11px] font-bold transition-all duration-300",
                isActive
                  ? activeClr.tab
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              )}
            >
              {c.short}
            </button>
          );
        })}
        <span className="ml-auto text-[10px] text-zinc-400 hidden sm:block">{cfg.description}</span>
      </div>

      {/* Main content area */}
      <div className="px-4 py-3 min-h-[220px] flex flex-col gap-3">
        {/* Venn + table names */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-300 font-mono">{leftTable}</span>
          </div>
          <VennDiagram joinType={joinType} color={cfg.color} />
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-300 font-mono">{rightTable}</span>
          </div>
        </div>

        {/* Row columns */}
        <div className="flex gap-4">
          <RowList
            rows={leftRows}
            included={cfg.leftIncluded}
            color={cfg.color}
            label={leftTable}
          />
          <div className="w-px bg-zinc-100 dark:bg-zinc-800 self-stretch" />
          <RowList
            rows={rightRows}
            included={cfg.rightIncluded}
            color={cfg.color}
            label={rightTable}
          />
        </div>

        {/* Result badge */}
        <div className="flex items-center gap-2 mt-auto">
          <span className={cn("text-[11px] font-bold px-2 py-0.5 rounded", clr.badge)}>
            {resultCount} row{resultCount !== 1 ? "s" : ""}
          </span>
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400">{cfg.description}</span>
        </div>
      </div>

      {/* SQL footer */}
      <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900/30">
        <pre className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 leading-relaxed whitespace-pre-wrap">
          {cfg.sql(leftTable, rightTable)}
        </pre>
      </div>
    </div>
  );
}
