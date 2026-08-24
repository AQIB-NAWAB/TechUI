"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { GitCompare } from "lucide-react";

export const VirtualDomSchema = z.object({
  scenario: z.enum(["text-change", "add-node", "remove-node", "reorder"]).default("text-change"),
});

export type VirtualDomProps = z.infer<typeof VirtualDomSchema>;

type NodeStatus = "same" | "modified" | "added" | "removed";

interface TreeNode {
  tag: string;
  text?: string;
  status: NodeStatus;
  key?: string;
}

interface Scenario {
  label: string;
  before: TreeNode[];
  after: TreeNode[];
  patch: string[];
  domOps: number;
  insight: string;
}

const SCENARIOS: Record<string, Scenario> = {
  "text-change": {
    label: "Text Change",
    before: [
      { tag: "div", status: "same" },
      { tag: "h1", text: "Hello", status: "same" },
      { tag: "p",  text: "old text", status: "modified" },
      { tag: "button", text: "OK", status: "same" },
    ],
    after: [
      { tag: "div", status: "same" },
      { tag: "h1", text: "Hello", status: "same" },
      { tag: "p",  text: "new text", status: "modified" },
      { tag: "button", text: "OK", status: "same" },
    ],
    patch: [
      'textContent of <p> → "new text"',
    ],
    domOps: 1,
    insight: "Only the changed text node is updated — React skips identical siblings.",
  },
  "add-node": {
    label: "Add Node",
    before: [
      { tag: "ul", status: "same" },
      { tag: "li", text: "Apple",  status: "same" },
      { tag: "li", text: "Banana", status: "same" },
    ],
    after: [
      { tag: "ul", status: "same" },
      { tag: "li", text: "Apple",  status: "same" },
      { tag: "li", text: "Banana", status: "same" },
      { tag: "li", text: "Cherry", status: "added" },
    ],
    patch: [
      'appendChild(<li>Cherry</li>)',
    ],
    domOps: 1,
    insight: "React inserts only the new node — existing nodes are untouched.",
  },
  "remove-node": {
    label: "Remove Node",
    before: [
      { tag: "ul", status: "same" },
      { tag: "li", text: "Apple",  status: "same" },
      { tag: "li", text: "Banana", status: "removed" },
      { tag: "li", text: "Cherry", status: "same" },
    ],
    after: [
      { tag: "ul", status: "same" },
      { tag: "li", text: "Apple",  status: "same" },
      { tag: "li", text: "Cherry", status: "same" },
    ],
    patch: [
      'removeChild(<li>Banana</li>)',
    ],
    domOps: 1,
    insight: "Only the removed node gets a removeChild call — everything else stays.",
  },
  "reorder": {
    label: "Reorder (keys)",
    before: [
      { tag: "ul", status: "same" },
      { tag: "li", text: "Alice",   status: "same",     key: "1" },
      { tag: "li", text: "Bob",     status: "modified", key: "2" },
      { tag: "li", text: "Charlie", status: "same",     key: "3" },
    ],
    after: [
      { tag: "ul", status: "same" },
      { tag: "li", text: "Alice",   status: "same",  key: "1" },
      { tag: "li", text: "Charlie", status: "same",  key: "3" },
      { tag: "li", text: "Bob",     status: "added", key: "2" },
    ],
    patch: [
      'insertBefore(<li key="2">Bob</li>, null)',
      'Without keys: 3 textContent updates',
    ],
    domOps: 1,
    insight: 'Keys let React move Bob to the end with 1 op — without keys it would re-render all 3.',
  },
};

const STATUS_STYLES: Record<NodeStatus, { bg: string; border: string; text: string; badge: string; badgeText: string }> = {
  same:     { bg: "bg-emerald-50 dark:bg-emerald-950/20",  border: "border-emerald-200 dark:border-emerald-800", text: "text-emerald-700 dark:text-emerald-300",  badge: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400", badgeText: "same" },
  modified: { bg: "bg-amber-50 dark:bg-amber-950/20",      border: "border-amber-200 dark:border-amber-800",     text: "text-amber-700 dark:text-amber-300",      badge: "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400",       badgeText: "patch!" },
  added:    { bg: "bg-blue-50 dark:bg-blue-950/20",        border: "border-blue-200 dark:border-blue-800",       text: "text-blue-700 dark:text-blue-300",        badge: "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400",         badgeText: "added" },
  removed:  { bg: "bg-red-50 dark:bg-red-950/20",          border: "border-red-200 dark:border-red-800",         text: "text-red-700 dark:text-red-300",          badge: "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400",           badgeText: "removed" },
};

function TreeView({ nodes, diffingIdx, side }: { nodes: TreeNode[]; diffingIdx: number; side: "before" | "after" }) {
  return (
    <div className="space-y-1.5">
      {nodes.map((node, i) => {
        const style = STATUS_STYLES[node.status];
        const isRoot = node.tag === "div" || node.tag === "ul";
        const isHighlighted = diffingIdx === i;
        return (
          <div
            key={`${side}-${i}-${node.tag}-${node.text}`}
            className={cn(
              "flex items-center gap-2 rounded-md border px-2 py-1 text-xs font-mono transition-all duration-500",
              style.bg, style.border, style.text,
              isRoot ? "font-bold" : "ml-4",
              isHighlighted && "ring-2 ring-violet-500 ring-offset-1 scale-[1.02]",
            )}
          >
            <span className="opacity-60">&lt;</span>
            <span>{node.tag}</span>
            {node.key && <span className="text-[9px] opacity-60">key=&quot;{node.key}&quot;</span>}
            <span className="opacity-60">&gt;</span>
            {node.text && (
              <span className="truncate text-zinc-600 dark:text-zinc-300 font-sans font-normal">{node.text}</span>
            )}
            <span className={cn("ml-auto text-[9px] font-semibold px-1.5 py-0.5 rounded", style.badge)}>
              {style.badgeText}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function VirtualDom({ scenario = "text-change" }: VirtualDomProps) {
  const [activeScenario, setActiveScenario] = useState<string>(scenario);
  const [diffingIdx, setDiffingIdx] = useState<number>(-1);
  const [showPatch, setShowPatch] = useState(false);
  const [diffing, setDiffing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const data = SCENARIOS[activeScenario] ?? SCENARIOS["text-change"];

  const clearTimers = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const runDiff = useCallback(() => {
    if (diffing) return;
    clearTimers();
    setDiffing(true);
    setShowPatch(false);
    setDiffingIdx(-1);

    const nodes = data.before;
    let i = 0;

    const step = () => {
      if (i >= nodes.length) {
        setDiffingIdx(-1);
        setShowPatch(true);
        setDiffing(false);
        return;
      }
      setDiffingIdx(i);
      i++;
      timerRef.current = setTimeout(step, 1200);
    };

    timerRef.current = setTimeout(step, 200);
  }, [diffing, data]);

  useEffect(() => {
    setDiffingIdx(-1);
    setShowPatch(false);
    setDiffing(false);
    clearTimers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeScenario]);

  useEffect(() => () => clearTimers(), []);

  const TABS = ["text-change", "add-node", "remove-node", "reorder"] as const;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <GitCompare className="size-4 text-blue-500" />
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Virtual DOM</span>
        </div>
        <button
          onClick={runDiff}
          disabled={diffing}
          className={cn(
            "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity",
            diffing && "opacity-50 cursor-not-allowed"
          )}
        >
          {diffing ? "Diffing…" : showPatch ? "Re-diff" : "Diff"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-100 dark:border-zinc-800 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveScenario(tab)}
            className={cn(
              "px-3 py-2 text-xs font-medium whitespace-nowrap transition-all duration-500",
              activeScenario === tab
                ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
            )}
          >
            {SCENARIOS[tab].label}
          </button>
        ))}
      </div>

      {/* Tree comparison */}
      <div className="min-h-[280px] p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-2">Before (VDOM)</div>
            <TreeView nodes={data.before} diffingIdx={diffingIdx} side="before" />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-2">After (VDOM)</div>
            <TreeView nodes={data.after} diffingIdx={diffingIdx} side="after" />
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3">
          {(["same", "modified", "added", "removed"] as NodeStatus[]).map((s) => (
            <span key={s} className={cn("text-[9px] font-semibold px-1.5 py-0.5 rounded", STATUS_STYLES[s].badge)}>
              {s}
            </span>
          ))}
        </div>

        {/* Patch operations */}
        <div className={cn("mt-4 transition-all duration-500", showPatch ? "opacity-100" : "opacity-0")}>
          <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-2">
            Patch operations — Real DOM ops: <span className="text-blue-500">{data.domOps}</span>
          </div>
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 p-2.5 space-y-1">
            {data.patch.map((op, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <span className="text-blue-500 font-semibold shrink-0">›</span>
                <code className="font-mono text-zinc-700 dark:text-zinc-300">{op}</code>
              </div>
            ))}
          </div>
        </div>

        {/* Idle hint */}
        {!diffing && !showPatch && (
          <p className="mt-4 text-[11px] text-zinc-400 dark:text-zinc-500">
            Click <strong>Diff</strong> to animate the comparison — nodes highlight one at a time
          </p>
        )}
      </div>

      {/* Insight footer */}
      <div className="px-4 py-2.5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40">
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
          <strong className="text-zinc-700 dark:text-zinc-300">Key insight:</strong>{" "}
          {data.insight}
        </p>
      </div>
    </div>
  );
}
