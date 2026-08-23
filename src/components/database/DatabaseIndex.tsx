"use client";

import { useState, useEffect, useRef } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Search, CheckCircle2 } from "lucide-react";

export const DatabaseIndexSchema = z.object({
  tableName: z.string().optional().default("orders"),
  indexColumn: z.string().optional().default("user_id"),
  searchValue: z.string().optional().default("1042"),
  totalRows: z.number().optional().default(10000),
  rowsToScan: z.number().optional().default(42),
  indexDepth: z.number().optional().default(3),
});

export type DatabaseIndexProps = z.infer<typeof DatabaseIndexSchema>;

type Phase = "idle" | "scanning" | "done";

const VISIBLE_ROWS = 8;

function makeRows(searchValue: string, rowsToScan: number) {
  const target = parseInt(searchValue, 10) || 1042;
  const base = target - rowsToScan + 1;
  const rows: string[] = [];
  for (let i = 0; i < VISIBLE_ROWS - 1; i++) {
    rows.push(String(base + Math.floor(i * (rowsToScan / VISIBLE_ROWS))));
  }
  rows.push(searchValue);
  return rows;
}

export function DatabaseIndex({
  tableName = "orders",
  indexColumn = "user_id",
  searchValue = "1042",
  totalRows = 10000,
  rowsToScan = 42,
  indexDepth = 3,
}: DatabaseIndexProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [scanIndex, setScanIndex] = useState(-1);
  const [treeStep, setTreeStep] = useState(-1);
  const [rowCount, setRowCount] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const rows = makeRows(searchValue, rowsToScan);
  const speedFactor = Math.max(1, Math.floor(rowsToScan / VISIBLE_ROWS));

  const treeNodes = Array.from({ length: indexDepth }, (_, i) => {
    if (i === 0) return { label: "Root", range: `[${Math.floor(parseInt(searchValue) * 0.5)}–${Math.ceil(parseInt(searchValue) * 1.5)}]` };
    if (i === indexDepth - 2) return { label: "Branch", range: `[${parseInt(searchValue) - 10}–${parseInt(searchValue) + 5}]` };
    return { label: "Leaf", range: `[${parseInt(searchValue) - 4}–${parseInt(searchValue) + 4}]` };
  });
  const clampedNodes = treeNodes.slice(0, Math.min(indexDepth, 3));

  function runSearch() {
    if (phase === "scanning") return;
    setPhase("scanning");
    setScanIndex(-1);
    setTreeStep(-1);
    setRowCount(0);

    let currentRow = 0;
    let currentTree = 0;

    function stepScan() {
      if (currentRow < VISIBLE_ROWS) {
        setScanIndex(currentRow);
        setRowCount(Math.round((currentRow + 1) * speedFactor));
        currentRow++;
        timerRef.current = setTimeout(stepScan, 300);
      } else {
        setScanIndex(VISIBLE_ROWS - 1);
        setRowCount(rowsToScan);
        maybeFinish();
      }
    }

    function stepTree() {
      if (currentTree < clampedNodes.length) {
        setTreeStep(currentTree);
        currentTree++;
        timerRef.current = setTimeout(stepTree, 600);
      } else {
        maybeFinish();
      }
    }

    let finishCount = 0;
    function maybeFinish() {
      finishCount++;
      if (finishCount >= 2) {
        setPhase("done");
      }
    }

    stepScan();
    stepTree();
  }

  function reset() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPhase("idle");
    setScanIndex(-1);
    setTreeStep(-1);
    setRowCount(0);
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const speedup = Math.round(rowsToScan / clampedNodes.length);

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <Search className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">Database Index</span>
        <span className="text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-2 py-0.5 rounded">B-Tree</span>
      </div>

      <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20">
        <code className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
          SELECT * FROM {tableName} WHERE {indexColumn} = {searchValue}
        </code>
      </div>

      <div className="min-h-[260px] flex">
        <div className="flex-1 px-3 py-3 border-r border-zinc-100 dark:border-zinc-800">
          <div className="text-[10px] font-bold uppercase tracking-wide text-zinc-400 mb-0.5">Without Index</div>
          <div className="text-[10px] text-red-500 dark:text-red-400 mb-2">Sequential Scan</div>
          <div className="space-y-0.5">
            {rows.map((row, idx) => {
              const isTarget = idx === VISIBLE_ROWS - 1;
              const isScanned = scanIndex >= idx;
              const isActive = scanIndex === idx;
              const isDone = phase === "done" && isTarget;

              return (
                <div
                  key={idx}
                  className={cn(
                    "flex items-center gap-2 px-2 py-1 rounded text-xs font-mono transition-all duration-500",
                    isActive && !isTarget && "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
                    isDone && "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300",
                    isScanned && !isActive && !isDone && "bg-zinc-50 dark:bg-zinc-800/50 text-zinc-400",
                    !isScanned && "text-zinc-500 dark:text-zinc-400"
                  )}
                >
                  <span className="w-4 text-center text-[9px]">
                    {isDone ? "✓" : isActive ? "→" : ""}
                  </span>
                  <span>{indexColumn}={row}</span>
                  {isDone && <span className="ml-auto text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">FOUND</span>}
                </div>
              );
            })}
          </div>
          <div className={cn(
            "mt-2 text-[10px] font-mono transition-all duration-500",
            rowCount > 0 ? "text-zinc-500" : "text-zinc-300 dark:text-zinc-700"
          )}>
            Read {rowCount > 0 ? rowCount : "—"} rows
          </div>
        </div>

        <div className="flex-1 px-3 py-3">
          <div className="text-[10px] font-bold uppercase tracking-wide text-zinc-400 mb-0.5">With Index</div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mb-3">B-Tree Lookup</div>

          <div className="flex flex-col items-center gap-0">
            {clampedNodes.map((node, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <div className={cn(
                  "px-3 py-1.5 rounded-lg border text-xs font-mono transition-all duration-500 text-center",
                  treeStep >= idx
                    ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                    : "border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50"
                )}>
                  <div className="text-[9px] font-bold uppercase tracking-wide opacity-70 mb-0.5">{node.label}</div>
                  <div>{node.range}</div>
                </div>
                {idx < clampedNodes.length - 1 && (
                  <div className={cn(
                    "w-px h-4 transition-all duration-500",
                    treeStep > idx ? "bg-emerald-400" : "bg-zinc-200 dark:bg-zinc-700"
                  )} />
                )}
              </div>
            ))}

            {phase === "done" && (
              <div className="flex items-center gap-1.5 mt-2 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 transition-all duration-500">
                <CheckCircle2 className="size-3.5" />
                FOUND {indexColumn}={searchValue}
              </div>
            )}
            <div className={cn(
              "mt-1.5 text-[10px] font-mono transition-all duration-500",
              treeStep >= 0 ? "text-zinc-500" : "text-zinc-300 dark:text-zinc-700"
            )}>
              Read {treeStep >= 0 ? clampedNodes.length : "—"} nodes
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
        <span className="text-xs text-zinc-500 flex-1">
          {phase === "done"
            ? `Sequential: ${rowsToScan} rows · Index: ${clampedNodes.length} nodes — ${speedup}× faster`
            : phase === "scanning"
            ? "Searching…"
            : `Table: ${totalRows.toLocaleString()} rows · Index depth: ${clampedNodes.length}`}
        </span>
        <button
          onClick={phase === "done" ? reset : runSearch}
          disabled={phase === "scanning"}
          className={cn(
            "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity",
            phase === "scanning" && "opacity-50 cursor-not-allowed"
          )}
        >
          {phase === "done" ? "Reset" : "Search"}
        </button>
      </div>
    </div>
  );
}
