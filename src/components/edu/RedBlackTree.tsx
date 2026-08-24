"use client";

import { useState, useMemo } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { GitBranch, RefreshCw } from "lucide-react";

export const RedBlackTreeSchema = z.object({
  name: z.string().optional().default("Red-Black Tree"),
  insertSequence: z.array(z.number()).optional().default([10, 20, 30, 15, 25, 5, 1]),
  interactive: z.boolean().optional().default(true),
});

export type RedBlackTreeProps = z.infer<typeof RedBlackTreeSchema>;

type Color = "red" | "black";

type TreeNode = {
  value: number;
  color: Color;
  left: TreeNode | null;
  right: TreeNode | null;
};

type TreeSnapshot = {
  nodes: TreeNode;
  inserted: number;
  action: string;
};

function cloneTree(node: TreeNode | null): TreeNode | null {
  if (!node) return null;
  return {
    value: node.value,
    color: node.color,
    left: cloneTree(node.left),
    right: cloneTree(node.right),
  };
}

function rotateLeft(root: TreeNode): TreeNode {
  const right = root.right!;
  root.right = right.left;
  right.left = root;
  return right;
}

function rotateRight(root: TreeNode): TreeNode {
  const left = root.left!;
  root.left = left.right;
  left.right = root;
  return left;
}

function insertNode(root: TreeNode | null, value: number): TreeNode {
  if (!root) return { value, color: "red", left: null, right: null };

  if (value < root.value) {
    root.left = insertNode(root.left, value);
  } else if (value > root.value) {
    root.right = insertNode(root.right, value);
  } else {
    return root;
  }

  let node = root;

  if (node.right?.color === "red" && node.left?.color !== "red") {
    node = rotateLeft(node);
  }
  if (node.left?.color === "red" && node.left.left?.color === "red") {
    node = rotateRight(node);
  }
  if (node.left?.color === "red" && node.right?.color === "red") {
    node.color = "red";
    node.left!.color = "black";
    node.right!.color = "black";
  }

  return node;
}

function colorRootBlack(root: TreeNode | null): TreeNode | null {
  if (!root) return null;
  root.color = "black";
  return root;
}

function buildSnapshots(sequence: number[]): TreeSnapshot[] {
  const snapshots: TreeSnapshot[] = [];
  let root: TreeNode | null = null;

  for (const value of sequence) {
    root = insertNode(root, value);
    root = colorRootBlack(cloneTree(root));
    const action =
      value === 30
        ? "Right-heavy — rotate left to rebalance"
        : value === 15 || value === 25
          ? "Recolor parent and children"
          : `Inserted ${value} as red, then fix violations`;
    snapshots.push({
      nodes: cloneTree(root)!,
      inserted: value,
      action,
    });
  }

  return snapshots;
}

type LayoutNode = {
  value: number;
  color: Color;
  x: number;
  y: number;
};

function layoutTree(root: TreeNode | null, depth = 0, x = 0, spacing = 48): { nodes: LayoutNode[]; nextX: number } {
  if (!root) return { nodes: [], nextX: x };

  const left = layoutTree(root.left, depth + 1, x, spacing / 2);
  const nodeX = left.nextX;
  const right = layoutTree(root.right, depth + 1, nodeX + spacing, spacing / 2);

  return {
    nodes: [
      ...left.nodes,
      { value: root.value, color: root.color, x: nodeX, y: depth },
      ...right.nodes,
    ],
    nextX: right.nextX,
  };
}

function TreeEdge({ from, to }: { from: LayoutNode; to: LayoutNode }) {
  const x1 = from.x;
  const y1 = from.y * 56 + 28;
  const x2 = to.x;
  const y2 = to.y * 56 + 28;
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke="currentColor"
      strokeWidth={1.5}
      className="text-zinc-200 dark:text-zinc-700"
    />
  );
}

function collectEdges(node: TreeNode | null, layout: LayoutNode[], edges: Array<[LayoutNode, LayoutNode]>) {
  if (!node) return;
  const current = layout.find((n) => n.value === node.value);
  if (!current) return;
  if (node.left) {
    const left = layout.find((n) => n.value === node.left!.value);
    if (left) edges.push([current, left]);
    collectEdges(node.left, layout, edges);
  }
  if (node.right) {
    const right = layout.find((n) => n.value === node.right!.value);
    if (right) edges.push([current, right]);
    collectEdges(node.right, layout, edges);
  }
}

export function RedBlackTree({
  name = "Red-Black Tree",
  insertSequence = [10, 20, 30, 15, 25, 5, 1],
  interactive = true,
}: RedBlackTreeProps) {
  const snapshots = useMemo(() => buildSnapshots(insertSequence), [insertSequence]);
  const [stepIndex, setStepIndex] = useState(-1);

  const current = stepIndex >= 0 ? snapshots[stepIndex] : null;
  const layout = useMemo(() => {
    if (!current) return { nodes: [] as LayoutNode[], width: 280, edges: [] as Array<[LayoutNode, LayoutNode]> };
    const { nodes } = layoutTree(current.nodes, 0, 20, 56);
    const minX = Math.min(...nodes.map((n) => n.x), 0);
    const maxX = Math.max(...nodes.map((n) => n.x), 280);
    const normalized = nodes.map((n) => ({ ...n, x: n.x - minX + 24 }));
    const edges: Array<[LayoutNode, LayoutNode]> = [];
    collectEdges(current.nodes, normalized, edges);
    return { nodes: normalized, width: maxX - minX + 48, edges };
  }, [current]);

  const isDone = stepIndex >= snapshots.length - 1;
  const blackCount = layout.nodes.filter((n) => n.color === "black").length;
  const redCount = layout.nodes.filter((n) => n.color === "red").length;

  function insertNext() {
    if (isDone) {
      setStepIndex(-1);
      return;
    }
    setStepIndex((i) => i + 1);
  }

  function reset() {
    setStepIndex(-1);
  }

  const footerStatus =
    stepIndex < 0
      ? "Each insert starts red — rotations and recoloring keep the tree balanced."
      : current
        ? current.action
        : "";

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/50">
        <GitBranch className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">{name}</span>
        <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">BST + balance</span>
        {interactive && (
          <button
            type="button"
            onClick={reset}
            className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all duration-500"
          >
            <RefreshCw className="size-3.5" />
          </button>
        )}
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-900">
        A self-balancing search tree — new nodes start red, then colors flip and nodes rotate to keep height low.
      </p>

      <div className="p-4 min-h-[280px] flex flex-col gap-3">
        <div className="flex items-center justify-center gap-3 text-[10px]">
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
            <span className="size-3 rounded-full bg-red-500" />
            Red ({redCount})
          </span>
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
            <span className="size-3 rounded-full bg-zinc-900 dark:bg-zinc-100" />
            Black ({blackCount})
          </span>
          {current && (
            <span className="font-mono font-semibold text-amber-600 dark:text-amber-400">
              +{current.inserted}
            </span>
          )}
        </div>

        <div className="flex-1 flex items-center justify-center min-h-[180px] rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30 overflow-hidden">
          {stepIndex < 0 ? (
            <span className="text-sm text-zinc-400">Empty tree — click Insert First to add values one by one</span>
          ) : (
            <svg width={Math.max(layout.width, 280)} height={180} className="overflow-visible">
              {layout.edges.map(([from, to], i) => (
                <TreeEdge key={`${from.value}-${to.value}-${i}`} from={from} to={to} />
              ))}
              {layout.nodes.map((node) => (
                <g key={node.value} transform={`translate(${node.x}, ${node.y * 56 + 16})`}>
                  <circle
                    r={16}
                    className={cn(
                      "transition-all duration-500",
                      node.color === "red"
                        ? "fill-red-500 stroke-red-600"
                        : "fill-zinc-900 dark:fill-zinc-100 stroke-zinc-700 dark:stroke-zinc-300",
                      current?.inserted === node.value && "ring-4 ring-amber-400/60"
                    )}
                    strokeWidth={2}
                  />
                  <text
                    textAnchor="middle"
                    dy="0.35em"
                    className={cn(
                      "text-[11px] font-bold font-mono transition-all duration-500",
                      node.color === "red" ? "fill-white" : "fill-white dark:fill-zinc-900"
                    )}
                  >
                    {node.value}
                  </text>
                </g>
              ))}
            </svg>
          )}
        </div>

        <div className="flex gap-1 flex-wrap justify-center">
          {insertSequence.map((val, i) => (
            <span
              key={`${val}-${i}`}
              className={cn(
                "size-7 rounded-md flex items-center justify-center text-[10px] font-mono font-bold transition-all duration-500",
                i <= stepIndex
                  ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border border-zinc-200 dark:border-zinc-700"
              )}
            >
              {val}
            </span>
          ))}
        </div>
      </div>

      {interactive && (
        <div className="border-t border-zinc-100 dark:border-zinc-900 px-4 py-3 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/30 min-h-[52px]">
          <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">{footerStatus}</span>
          <button
            type="button"
            onClick={insertNext}
            className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-all duration-500 shrink-0"
          >
            {stepIndex < 0 ? "Insert First" : isDone ? "Reset" : "Insert Next"}
          </button>
        </div>
      )}
    </div>
  );
}
