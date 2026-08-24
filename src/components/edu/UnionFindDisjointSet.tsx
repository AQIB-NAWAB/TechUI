"use client";

import { useState, useMemo } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { GitMerge, RefreshCw, Search } from "lucide-react";

export const UnionFindDisjointSetSchema = z.object({
  nodeCount: z.number().int().min(4).max(8).optional().default(6),
  interactive: z.boolean().optional().default(true),
});

export type UnionFindDisjointSetProps = z.infer<typeof UnionFindDisjointSetSchema>;

const GROUP_COLORS = [
  "bg-blue-100 dark:bg-blue-900/40 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300",
  "bg-emerald-100 dark:bg-emerald-900/40 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300",
  "bg-violet-100 dark:bg-violet-900/40 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300",
  "bg-amber-100 dark:bg-amber-900/40 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300",
  "bg-rose-100 dark:bg-rose-900/40 border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300",
  "bg-cyan-100 dark:bg-cyan-900/40 border-cyan-300 dark:border-cyan-700 text-cyan-700 dark:text-cyan-300",
];

const NODE_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H"];

class UnionFind {
  parent: number[];
  rank: number[];

  constructor(n: number) {
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.rank = Array(n).fill(0);
  }

  find(x: number): number {
    if (this.parent[x] !== x) {
      this.parent[x] = this.find(this.parent[x]);
    }
    return this.parent[x];
  }

  union(a: number, b: number): boolean {
    const rootA = this.find(a);
    const rootB = this.find(b);
    if (rootA === rootB) return false;
    if (this.rank[rootA] < this.rank[rootB]) {
      this.parent[rootA] = rootB;
    } else if (this.rank[rootA] > this.rank[rootB]) {
      this.parent[rootB] = rootA;
    } else {
      this.parent[rootB] = rootA;
      this.rank[rootA]++;
    }
    return true;
  }

  connected(a: number, b: number): boolean {
    return this.find(a) === this.find(b);
  }
}

export function UnionFindDisjointSet({
  nodeCount = 6,
  interactive = true,
}: UnionFindDisjointSetProps) {
  const n = Math.min(8, Math.max(4, nodeCount));
  const labels = NODE_LABELS.slice(0, n);

  const [uf, setUf] = useState(() => new UnionFind(n));
  const [selected, setSelected] = useState<number | null>(null);
  const [lastAction, setLastAction] = useState<string>("Click two nodes to merge their groups.");
  const [flash, setFlash] = useState<"union" | "same" | "find" | null>(null);

  const roots = useMemo(() => labels.map((_, i) => uf.find(i)), [uf, labels]);

  const rootToColor = useMemo(() => {
    const map = new Map<number, number>();
    let idx = 0;
    roots.forEach((r) => {
      if (!map.has(r)) map.set(r, idx++);
    });
    return map;
  }, [roots]);

  const groupCount = rootToColor.size;

  function unionNodes(a: number, b: number): boolean {
    const next = new UnionFind(n);
    next.parent = [...uf.parent];
    next.rank = [...uf.rank];
    const merged = next.union(a, b);
    if (merged) setUf(next);
    return merged;
  }

  function reset() {
    setUf(new UnionFind(n));
    setSelected(null);
    setLastAction("Click two nodes to merge their groups.");
    setFlash(null);
  }

  function handleNodeClick(i: number) {
    if (!interactive) return;

    if (selected === null) {
      setSelected(i);
      setLastAction(`Selected ${labels[i]} — click another node to union or find.`);
      setFlash("find");
      setTimeout(() => setFlash(null), 700);
      return;
    }

    if (selected === i) {
      setSelected(null);
      setLastAction("Selection cleared.");
      return;
    }

    const a = selected;
    const b = i;
    const alreadyConnected = uf.connected(a, b);

    if (alreadyConnected) {
      setLastAction(`Find(${labels[a]}, ${labels[b]}) → same group (root ${labels[uf.find(a)]}).`);
      setFlash("same");
    } else {
      unionNodes(a, b);
      setLastAction(`Union(${labels[a]}, ${labels[b]}) → merged into one group.`);
      setFlash("union");
    }

    setSelected(null);
    setTimeout(() => setFlash(null), 700);
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden transition-all duration-500",
        flash === "union" && "border-emerald-300 dark:border-emerald-800",
        flash === "same" && "border-blue-300 dark:border-blue-800"
      )}
    >
      <div className="h-12 px-4 flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <GitMerge className="size-4 text-violet-500 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">Union-Find (Disjoint Set)</span>
        <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
          {groupCount} group{groupCount !== 1 ? "s" : ""}
        </span>
        {interactive && (
          <button
            onClick={reset}
            className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all duration-500"
          >
            <RefreshCw className="size-3.5" />
          </button>
        )}
      </div>

      <div className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        Track which nodes belong together — union merges groups, find checks if two nodes share a root.
      </div>

      <div className="min-h-[220px] px-4 py-4 flex flex-col gap-4">
        <div className="flex flex-wrap justify-center gap-3">
          {labels.map((label, i) => {
            const root = roots[i];
            const colorIdx = rootToColor.get(root) ?? 0;
            const isSelected = selected === i;
            const parentLabel = uf.parent[i] === i ? "self" : labels[uf.parent[i]];

            return (
              <button
                key={label}
                onClick={() => handleNodeClick(i)}
                disabled={!interactive}
                className={cn(
                  "relative flex flex-col items-center gap-1 transition-all duration-500",
                  interactive && "cursor-pointer hover:scale-105",
                  !interactive && "cursor-default"
                )}
              >
                <div
                  className={cn(
                    "size-12 rounded-full border-2 flex items-center justify-center font-bold text-sm transition-all duration-500",
                    GROUP_COLORS[colorIdx % GROUP_COLORS.length],
                    isSelected && "ring-2 ring-zinc-900 dark:ring-white ring-offset-2 dark:ring-offset-zinc-900 scale-110"
                  )}
                >
                  {label}
                </div>
                <span className="text-[9px] font-mono text-zinc-400">
                  parent → {parentLabel}
                </span>
              </button>
            );
          })}
        </div>

        <div className="rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 p-3 min-h-[72px]">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-2">Groups</div>
          <div className="flex flex-wrap gap-2 min-h-[36px]">
            {Array.from(rootToColor.entries())
              .sort(([a], [b]) => a - b)
              .map(([root, colorIdx]) => {
                const members = labels.filter((_, i) => roots[i] === root);
                return (
                  <div
                    key={root}
                    className={cn(
                      "rounded-md border px-2.5 py-1 text-[11px] font-mono font-semibold transition-all duration-500",
                      GROUP_COLORS[colorIdx % GROUP_COLORS.length]
                    )}
                  >
                    {"{"}{members.join(", ")}{"}"}
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {interactive && (
        <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/30">
          <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">{lastAction}</span>
          <button
            onClick={() => {
              const unconnected: [number, number] | null = (() => {
                for (let i = 0; i < n; i++) {
                  for (let j = i + 1; j < n; j++) {
                    if (!uf.connected(i, j)) return [i, j];
                  }
                }
                return null;
              })();
              if (unconnected) {
                const [a, b] = unconnected;
                unionNodes(a, b);
                setLastAction(`Union(${labels[a]}, ${labels[b]}) → merged remaining groups.`);
                setFlash("union");
                setSelected(null);
                setTimeout(() => setFlash(null), 700);
              } else {
                setLastAction("All nodes are already in one group.");
                setFlash("same");
                setTimeout(() => setFlash(null), 700);
              }
            }}
            className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-all duration-500 shrink-0 flex items-center gap-1.5"
          >
            <Search className="size-3.5" />
            Quick Union
          </button>
        </div>
      )}
    </div>
  );
}
