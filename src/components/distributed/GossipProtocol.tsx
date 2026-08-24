"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Radio, RefreshCw, Server } from "lucide-react";

export const GossipProtocolSchema = z.object({
  title: z.string().optional().default("Gossip Protocol"),
  nodeCount: z.number().int().min(3).max(8).optional().default(5),
  interactive: z.boolean().optional().default(true),
});

export type GossipProtocolProps = z.infer<typeof GossipProtocolSchema>;

type NodeState = {
  id: number;
  label: string;
  value: string;
  knowsUpdate: boolean;
  round: number | null;
};

const DEFAULT_VALUE = "v1";
const GOSSIP_VALUE = "v2";

function buildNodes(count: number): NodeState[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    label: `Node ${String.fromCharCode(65 + i)}`,
    value: DEFAULT_VALUE,
    knowsUpdate: i === 0,
    round: i === 0 ? 0 : null,
  }));
}

export function GossipProtocol({
  title = "Gossip Protocol",
  nodeCount = 5,
  interactive = true,
}: GossipProtocolProps) {
  const [nodes, setNodes] = useState<NodeState[]>(() => buildNodes(nodeCount));
  const [round, setRound] = useState(0);
  const [animating, setAnimating] = useState<number | null>(null);

  useEffect(() => {
    reset();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeCount]);

  const synced = nodes.filter((n) => n.knowsUpdate).length;
  const allSynced = synced === nodes.length;

  function reset() {
    setNodes(buildNodes(nodeCount));
    setRound(0);
    setAnimating(null);
  }

  function gossipRound() {
    if (allSynced || animating !== null) return;

    setNodes((prev) => {
      const nextRound = round + 1;
      const updated = new Set<number>();
      const result = prev.map((node) => {
        if (!node.knowsUpdate) return node;
        const left = (node.id - 1 + prev.length) % prev.length;
        const right = (node.id + 1) % prev.length;
        updated.add(left);
        updated.add(right);
        return node;
      });

      return result.map((node) => {
        if (!updated.has(node.id) || node.knowsUpdate) return node;
        return {
          ...node,
          value: GOSSIP_VALUE,
          knowsUpdate: true,
          round: nextRound,
        };
      });
    });

    setRound((r) => r + 1);
    setAnimating(round + 1);
    setTimeout(() => setAnimating(null), 1000);
  }

  const statusText = allSynced
    ? `All ${nodes.length} nodes converged on ${GOSSIP_VALUE} — no central coordinator needed.`
    : synced === 1
    ? "Node A has the update. Each gossip round spreads it to immediate neighbors."
    : `${synced}/${nodes.length} nodes know the update. Keep gossiping until everyone converges.`;

  return (
    <>
      <style>{`
        @keyframes pulseRing {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.5); }
          70% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
      `}</style>
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
        <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
          <Radio className="size-4 text-zinc-400 shrink-0" />
          <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">{title}</span>
          <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
            round {round}
          </span>
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

        <div className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
          Nodes share state with random neighbors — eventually every node learns the same value.
        </div>

        <div className="p-4 min-h-[240px] flex flex-col justify-center">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {nodes.map((node, i) => (
              <div key={node.id} className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-lg border p-3 min-w-[72px] transition-all duration-500",
                    node.knowsUpdate
                      ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/30"
                      : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900",
                    animating !== null && node.round === animating && "ring-2 ring-emerald-400"
                  )}
                  style={
                    animating !== null && node.round === animating
                      ? { animation: "pulseRing 1s ease-out" }
                      : undefined
                  }
                >
                  <Server
                    className={cn(
                      "size-5 transition-all duration-500",
                      node.knowsUpdate ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400"
                    )}
                  />
                  <span className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-400">{node.label}</span>
                  <span
                    className={cn(
                      "text-xs font-mono font-bold px-1.5 py-0.5 rounded",
                      node.knowsUpdate
                        ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                    )}
                  >
                    {node.value}
                  </span>
                </div>
                {i < nodes.length - 1 && (
                  <span className="text-zinc-300 dark:text-zinc-600 text-lg select-none">↔</span>
                )}
              </div>
            ))}
          </div>

          <div className="mt-5 px-2">
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-zinc-400 uppercase tracking-wide font-semibold">Convergence</span>
              <span className="font-mono text-zinc-500">
                {synced}/{nodes.length} nodes
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-700",
                  allSynced ? "bg-emerald-500" : "bg-blue-500"
                )}
                style={{ width: `${(synced / nodes.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {interactive && (
          <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/30 min-h-[52px]">
            <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">{statusText}</span>
            <button
              type="button"
              onClick={allSynced ? reset : gossipRound}
              disabled={animating !== null}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-500 shrink-0 hover:opacity-90",
                "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900",
                animating !== null && "opacity-60 cursor-not-allowed"
              )}
            >
              {allSynced ? "Run Again" : animating !== null ? "Spreading…" : "Gossip Round"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
