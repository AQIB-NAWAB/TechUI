"use client";

import { useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

export const IndexTypesSchema = z.object({
  indexType: z.enum(["btree", "hash", "fulltext"]).default("btree"),
  tableName: z.string().default("products"),
  column: z.string().default("price"),
});

export type IndexTypesProps = z.infer<typeof IndexTypesSchema>;

// ─── B-Tree Tab ───────────────────────────────────────────────────────────────

type BTreeNode = {
  id: string;
  label: string;
  values: number[];
  level: number;
};

const BTREE_NODES: BTreeNode[] = [
  { id: "root",    label: "Root",   values: [50],                  level: 0 },
  { id: "l1",      label: "L1",     values: [10, 15, 22, 28],      level: 1 },
  { id: "r1",      label: "R1",     values: [50, 75, 89, 120],     level: 1 },
  { id: "ll",      label: "LL",     values: [10, 12],              level: 2 },
  { id: "lm",      label: "LM",     values: [15, 20, 22],          level: 2 },
  { id: "lr",      label: "LR",     values: [25, 28],              level: 2 },
  { id: "rl",      label: "RL",     values: [50, 60, 75],          level: 2 },
  { id: "rr",      label: "RR",     values: [89, 110, 120],        level: 2 },
];

// Path traversed to find 28: root → l1 → lr
const SEARCH_PATH = ["root", "l1", "lr"];

function BTreeTab({ column }: { column: string }) {
  const [searching, setSearching] = useState(false);
  const [step, setStep] = useState(-1);

  function runSearch() {
    if (searching) return;
    setSearching(true);
    setStep(0);
    let s = 0;
    const id = setInterval(() => {
      s++;
      if (s >= SEARCH_PATH.length) {
        clearInterval(id);
        setSearching(false);
      }
      setStep(s);
    }, 1200);
  }

  function reset() {
    setStep(-1);
    setSearching(false);
  }

  const highlightedIds = step >= 0 ? SEARCH_PATH.slice(0, step + 1) : [];

  function NodeBox({ node }: { node: BTreeNode }) {
    const active = highlightedIds.includes(node.id);
    const found  = step >= SEARCH_PATH.length - 1 && node.id === SEARCH_PATH[SEARCH_PATH.length - 1];
    return (
      <div className={cn(
        "rounded border px-2 py-1 text-[11px] font-mono transition-all duration-500 text-center min-w-[90px]",
        found
          ? "border-emerald-400 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300"
          : active
            ? "border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
            : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
      )}>
        {node.values.join(" · ")}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Balanced tree — each level halves the search space. <strong className="text-zinc-700 dark:text-zinc-300">O(log n)</strong> lookup.
      </p>

      {/* Tree visual */}
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/30 p-3 space-y-2">
        {/* Level 0 */}
        <div className="flex justify-center">
          <NodeBox node={BTREE_NODES[0]!} />
        </div>
        {/* Connector */}
        <div className="flex justify-center gap-16">
          <div className="w-px h-3 bg-zinc-300 dark:bg-zinc-600 ml-[-64px]" />
          <div className="w-px h-3 bg-zinc-300 dark:bg-zinc-600 mr-[-64px]" />
        </div>
        {/* Level 1 */}
        <div className="flex justify-center gap-4">
          <NodeBox node={BTREE_NODES[1]!} />
          <NodeBox node={BTREE_NODES[2]!} />
        </div>
        {/* Level 2 */}
        <div className="flex justify-center gap-2">
          {BTREE_NODES.slice(3).map((n) => (
            <NodeBox key={n.id} node={n} />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={searching ? undefined : (step >= 0 ? reset : runSearch)}
          className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          {searching ? "Searching…" : step >= 0 ? "Reset" : `Search: ${column} = 28`}
        </button>
        {step >= 0 && !searching && (
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            Found in {SEARCH_PATH.length} comparisons
          </span>
        )}
      </div>

      {step >= 0 && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Path: Root (28 &lt; 50 → left) → L1 (28 between 22–50 → right) → <span className="text-emerald-600 dark:text-emerald-400 font-semibold">28 found in LR leaf</span>
        </p>
      )}
    </div>
  );
}

// ─── Hash Tab ─────────────────────────────────────────────────────────────────

const HASH_BUCKETS: { items: string[]; highlight?: boolean }[] = [
  { items: ["banana", "strawberry"] },
  { items: ["mango"] },
  { items: [] },
  { items: ["apple", "avocado"] },
];

const SEARCH_TERM = "apple";
const SEARCH_BUCKET = 3;

function HashTab({ column }: { column: string }) {
  const [phase, setPhase] = useState<"idle" | "hashing" | "found">("idle");
  const [highlightBucket, setHighlightBucket] = useState(-1);

  function runSearch() {
    if (phase !== "idle") { setPhase("idle"); setHighlightBucket(-1); return; }
    setPhase("hashing");
    setTimeout(() => {
      setHighlightBucket(SEARCH_BUCKET);
      setPhase("found");
    }, 1200);
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Hash function maps key → bucket directly. <strong className="text-zinc-700 dark:text-zinc-300">O(1)</strong> lookup — but only exact matches.
      </p>

      {phase === "hashing" && (
        <div className="rounded-md border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 text-xs text-amber-700 dark:text-amber-300 font-mono animate-pulse">
          hash(&quot;{SEARCH_TERM}&quot;) → computing… → bucket 3
        </div>
      )}
      {phase === "found" && (
        <div className="rounded-md border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 text-xs text-blue-700 dark:text-blue-300 font-mono">
          hash(&quot;{SEARCH_TERM}&quot;) = <strong>3</strong> → jump directly to bucket 3
        </div>
      )}

      {/* Buckets */}
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/30 p-3 space-y-1.5">
        {HASH_BUCKETS.map((bucket, i) => (
          <div
            key={i}
            className={cn(
              "flex items-center gap-2 rounded border px-2 py-1.5 transition-all duration-500",
              highlightBucket === i
                ? "border-emerald-400 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
            )}
          >
            <span className="text-[11px] font-mono font-bold text-zinc-400 dark:text-zinc-500 w-16 shrink-0">
              Bucket {i}:
            </span>
            <div className="flex gap-1.5 flex-wrap">
              {bucket.items.length === 0 ? (
                <span className="text-[11px] text-zinc-300 dark:text-zinc-600 italic">empty</span>
              ) : (
                bucket.items.map((item) => (
                  <span
                    key={item}
                    className={cn(
                      "text-[11px] font-mono px-1.5 py-0.5 rounded transition-all duration-500",
                      highlightBucket === i && item === SEARCH_TERM
                        ? "bg-emerald-500 text-white"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                    )}
                  >
                    {item}
                  </span>
                ))
              )}
            </div>
            {highlightBucket === i && (
              <span className="ml-auto text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold shrink-0">← found!</span>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={runSearch}
          className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          {phase === "idle" ? `Search: ${column} = '${SEARCH_TERM}'` : "Reset"}
        </button>
      </div>
    </div>
  );
}

// ─── Full-Text Tab ────────────────────────────────────────────────────────────

const INVERTED_INDEX = [
  { word: "fresh",   rows: [1, 4, 9] },
  { word: "market",  rows: [1, 7] },
  { word: "apple",   rows: [3, 4, 8] },
  { word: "organic", rows: [2, 5, 9] },
  { word: "juice",   rows: [3, 6, 8] },
];

const QUERY_WORDS = ["fresh", "apple"];
const RESULT_ROW = 4;

function FullTextTab({ column }: { column: string }) {
  const [phase, setPhase] = useState<"idle" | "searching" | "found">("idle");

  function runSearch() {
    if (phase !== "idle") { setPhase("idle"); return; }
    setPhase("searching");
    setTimeout(() => setPhase("found"), 1200);
  }

  const highlighted = phase !== "idle" ? QUERY_WORDS : [];

  return (
    <div className="space-y-3">
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Inverted index maps each word to the rows it appears in. Supports <strong className="text-zinc-700 dark:text-zinc-300">WHERE ... LIKE</strong> and full-text search.
      </p>

      {/* Inverted index table */}
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/30 p-3 space-y-1.5">
        {INVERTED_INDEX.map(({ word, rows }) => {
          const isHighlighted = highlighted.includes(word);
          return (
            <div key={word} className={cn(
              "flex items-center gap-2 rounded border px-2 py-1.5 transition-all duration-500",
              isHighlighted
                ? "border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
            )}>
              <span className={cn(
                "text-[11px] font-mono font-bold w-16 shrink-0 transition-colors duration-500",
                isHighlighted ? "text-blue-600 dark:text-blue-400" : "text-zinc-500 dark:text-zinc-400"
              )}>
                &quot;{word}&quot;
              </span>
              <span className="text-[11px] text-zinc-400 mx-1">→</span>
              <div className="flex gap-1 flex-wrap">
                {rows.map((r) => (
                  <span
                    key={r}
                    className={cn(
                      "text-[11px] font-mono px-1.5 py-0.5 rounded transition-all duration-500",
                      phase === "found" && isHighlighted && r === RESULT_ROW
                        ? "bg-emerald-500 text-white"
                        : isHighlighted
                          ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                    )}
                  >
                    row {r}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {phase === "found" && (
        <div className="rounded-md border border-emerald-200 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300 font-mono">
          Query &quot;fresh apple&quot; → intersect rows → <strong>row 4</strong> contains both words
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={runSearch}
          className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          {phase === "idle" ? `Search: ${column} @@ 'fresh apple'` : "Reset"}
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

const TABS = [
  { id: "btree"    as const, label: "B-Tree" },
  { id: "hash"     as const, label: "Hash" },
  { id: "fulltext" as const, label: "Full-Text" },
];

const PROS_CONS = {
  btree:    "✓ Range queries  ✓ Sort  ✓ Prefix match  ✗ Slower than hash on exact match",
  hash:     "✓ O(1) exact match  ✗ No range queries  ✗ No sorting  ✗ No prefix match",
  fulltext: "✓ Word search  ✓ Ranking  ✗ Not for exact match  ✗ Not for numeric range",
};

export function IndexTypes({
  indexType = "btree",
  tableName = "products",
  column = "price",
}: IndexTypesProps) {
  const [activeTab, setActiveTab] = useState<"btree" | "hash" | "fulltext">(indexType);

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden text-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <Search className="size-4 text-zinc-600 dark:text-zinc-400" />
          <span className="font-semibold text-zinc-800 dark:text-zinc-200">Index Types</span>
          <span className="text-xs text-zinc-400 dark:text-zinc-500 font-mono">{tableName}.{column}</span>
        </div>
        <div className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-300",
                activeTab === tab.id
                  ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                  : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="min-h-[260px] p-4">
        {activeTab === "btree"    && <BTreeTab column={column} />}
        {activeTab === "hash"     && <HashTab column={column} />}
        {activeTab === "fulltext" && <FullTextTab column={column} />}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 leading-relaxed">
          {PROS_CONS[activeTab]}
        </p>
      </div>
    </div>
  );
}
