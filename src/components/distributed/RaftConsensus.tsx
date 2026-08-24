"use client";

import { useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Crown, RefreshCw, Server, CheckCircle } from "lucide-react";

export const RaftConsensusSchema = z.object({
  title: z.string().optional().default("Raft Consensus"),
  leaderId: z.string().optional().default("n2"),
  nodes: z
    .array(z.object({ id: z.string(), name: z.string() }))
    .optional()
    .default([
      { id: "n1", name: "Node A" },
      { id: "n2", name: "Node B" },
      { id: "n3", name: "Node C" },
    ]),
  initialLog: z.array(z.string()).optional().default(["SET x=1"]),
  interactive: z.boolean().optional().default(true),
});

export type RaftConsensusProps = z.infer<typeof RaftConsensusSchema>;

type NodeState = {
  id: string;
  name: string;
  role: "leader" | "follower";
  log: string[];
  ack: boolean;
  committed: boolean;
};

type Phase = "idle" | "proposing" | "replicating" | "committed";

export function RaftConsensus({
  title = "Raft Consensus",
  leaderId = "n2",
  nodes: nodeDefs = [
    { id: "n1", name: "Node A" },
    { id: "n2", name: "Node B" },
    { id: "n3", name: "Node C" },
  ],
  initialLog = ["SET x=1"],
  interactive = true,
}: RaftConsensusProps) {
  const [nodes, setNodes] = useState<NodeState[]>(() =>
    nodeDefs.map((n) => ({
      ...n,
      role: n.id === leaderId ? "leader" : "follower",
      log: [...initialLog],
      ack: false,
      committed: false,
    }))
  );
  const [phase, setPhase] = useState<Phase>("idle");
  const [status, setStatus] = useState("Click Propose Entry — the leader replicates to followers and commits after a majority ack.");
  const [activeEdge, setActiveEdge] = useState<string | null>(null);
  const [proposal, setProposal] = useState<string | null>(null);
  const [term] = useState(7);

  const leader = nodes.find((n) => n.role === "leader");

  function reset() {
    setNodes(
      nodeDefs.map((n) => ({
        ...n,
        role: n.id === leaderId ? "leader" : "follower",
        log: [...initialLog],
        ack: false,
        committed: false,
      }))
    );
    setPhase("idle");
    setStatus("Click Propose Entry — the leader replicates to followers and commits after a majority ack.");
    setActiveEdge(null);
    setProposal(null);
  }

  function proposeEntry() {
    if (phase !== "idle" || !leader) return;
    const entry = `SET y=${Math.floor(Math.random() * 90) + 10}`;
    setProposal(entry);
    setPhase("proposing");
    setStatus(`Leader ${leader.name} received client write: ${entry}`);
    setNodes((prev) =>
      prev.map((n) => ({ ...n, ack: false, committed: false }))
    );

    setTimeout(() => {
      setPhase("replicating");
      setStatus(`Leader appends to local log and sends AppendEntries to followers (term ${term}).`);
      setNodes((prev) =>
        prev.map((n) =>
          n.role === "leader" ? { ...n, log: [...n.log, entry] } : n
        )
      );

      const followers = nodeDefs.filter((n) => n.id !== leaderId);
      followers.forEach((f, idx) => {
        setTimeout(() => {
          setActiveEdge(`${leaderId}-${f.id}`);
          setTimeout(() => {
            setNodes((prev) =>
              prev.map((n) =>
                n.id === f.id ? { ...n, log: [...n.log, entry], ack: true } : n
              )
            );
            setActiveEdge(null);
            if (idx === followers.length - 1) {
              setTimeout(() => {
                setPhase("committed");
                setStatus(`Majority ack received — entry committed on all nodes.`);
                setNodes((prev) =>
                  prev.map((n) => ({ ...n, committed: true }))
                );
                setTimeout(() => setPhase("idle"), 1200);
              }, 1000);
            }
          }, 1000);
        }, idx * 1200);
      });
    }, 1000);
  }

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/50">
        <Crown className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">{title}</span>
        <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">term {term}</span>
        {interactive && (
          <button onClick={reset} className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all duration-500">
            <RefreshCw className="size-3.5" />
          </button>
        )}
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-900">
        Raft keeps servers in sync: one leader accepts writes, copies them to followers, and commits only after a majority confirms.
      </p>

      <div className="p-4 min-h-[280px] flex flex-col gap-4 relative">
        <div className="flex items-center justify-center gap-4">
          {nodes.map((node) => (
            <div key={node.id} className="flex flex-col items-center gap-2 relative">
              {node.role === "leader" && activeEdge?.startsWith(`${node.id}-`) && (
                <div
                  className="absolute top-1/2 left-full w-8 h-0.5 bg-blue-400 transition-all duration-500"
                  style={{ animation: "travel 1s ease-out forwards" }}
                />
              )}
              <div
                className={cn(
                  "w-24 rounded-xl border-2 p-3 transition-all duration-500",
                  node.role === "leader"
                    ? "border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-950/40"
                    : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900",
                  node.committed && "ring-2 ring-emerald-400 ring-offset-1 dark:ring-offset-zinc-950"
                )}
              >
                <div className="flex items-center justify-center gap-1 mb-2">
                  <Server className={cn("size-4", node.role === "leader" ? "text-amber-600 dark:text-amber-400" : "text-zinc-400")} />
                  {node.role === "leader" && <Crown className="size-3 text-amber-500" />}
                </div>
                <div className="text-[10px] font-semibold text-center text-zinc-700 dark:text-zinc-300">{node.name}</div>
                <div className="text-[9px] text-center text-zinc-400 mt-0.5 uppercase">{node.role}</div>
                {node.ack && node.role === "follower" && (
                  <div className="flex justify-center mt-1">
                    <CheckCircle className="size-3 text-emerald-500 transition-all duration-500" />
                  </div>
                )}
              </div>
              <div className="w-full min-h-[52px] border border-zinc-100 dark:border-zinc-800 rounded-lg p-1.5 bg-zinc-50 dark:bg-zinc-900/50">
                <div className="text-[9px] font-semibold uppercase tracking-widest text-zinc-400 mb-1">Log</div>
                <div className="space-y-0.5">
                  {node.log.map((entry, i) => (
                    <div
                      key={`${node.id}-${i}`}
                      className={cn(
                        "text-[9px] font-mono px-1.5 py-0.5 rounded transition-all duration-500",
                        proposal && entry === proposal
                          ? "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                      )}
                    >
                      {entry}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-3 text-[10px]">
          <span className={cn("px-2 py-1 rounded border transition-all duration-500", phase === "idle" ? "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500" : "opacity-40")}>
            1. Propose
          </span>
          <span className="text-zinc-300">→</span>
          <span className={cn("px-2 py-1 rounded border transition-all duration-500", phase === "replicating" || phase === "proposing" ? "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400" : "opacity-40")}>
            2. Replicate
          </span>
          <span className="text-zinc-300">→</span>
          <span className={cn("px-2 py-1 rounded border transition-all duration-500", phase === "committed" ? "bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400" : "opacity-40")}>
            3. Commit
          </span>
        </div>
      </div>

      <style>{`
        @keyframes travel {
          from { transform: scaleX(0); opacity: 0; }
          to { transform: scaleX(1); opacity: 1; }
        }
      `}</style>

      {interactive && (
        <div className="border-t border-zinc-100 dark:border-zinc-900 px-4 py-3 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/30 min-h-[52px]">
          <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">{status}</span>
          <button
            type="button"
            onClick={proposeEntry}
            disabled={phase !== "idle"}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 transition-all duration-500 shrink-0 hover:opacity-90 disabled:opacity-50"
          >
            {phase !== "idle" ? "Replicating…" : "Propose Entry"}
          </button>
        </div>
      )}
    </div>
  );
}
