"use client";

import { useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Crown, RefreshCw, Server } from "lucide-react";

export const LeaderElectionSchema = z.object({
  title: z.string().optional().default("Leader Election"),
  algorithm: z.enum(["bully", "ring"]).optional().default("bully"),
  nodes: z.array(z.object({
    id: z.string(),
    name: z.string(),
    priority: z.number().int(),
  })).optional().default([
    { id: "n1", name: "Node A", priority: 1 },
    { id: "n2", name: "Node B", priority: 3 },
    { id: "n3", name: "Node C", priority: 2 },
    { id: "n4", name: "Node D", priority: 4 },
    { id: "n5", name: "Node E", priority: 5 },
  ]),
  interactive: z.boolean().optional().default(true),
});

export type LeaderElectionProps = z.infer<typeof LeaderElectionSchema>;

type NodeState = "idle" | "candidate" | "voting" | "leader" | "defeated";

type ElectionNode = LeaderElectionProps["nodes"][number] & { state: NodeState };

export function LeaderElection({
  title = "Leader Election",
  algorithm = "bully",
  nodes: initialNodes = [
    { id: "n1", name: "Node A", priority: 1 },
    { id: "n2", name: "Node B", priority: 3 },
    { id: "n3", name: "Node C", priority: 2 },
    { id: "n4", name: "Node D", priority: 4 },
    { id: "n5", name: "Node E", priority: 5 },
  ],
  interactive = true,
}: LeaderElectionProps) {
  const [nodes, setNodes] = useState<ElectionNode[]>(() =>
    initialNodes.map((n) => ({ ...n, state: "idle" as NodeState }))
  );
  const [phase, setPhase] = useState<"idle" | "running" | "done">("idle");
  const [statusText, setStatusText] = useState(
    "Click Start Election — the highest-priority node wins and becomes leader."
  );
  const [activeEdge, setActiveEdge] = useState<string | null>(null);

  const leader = nodes.find((n) => n.state === "leader");

  function reset() {
    setNodes(initialNodes.map((n) => ({ ...n, state: "idle" as NodeState })));
    setPhase("idle");
    setActiveEdge(null);
    setStatusText("Click Start Election — the highest-priority node wins and becomes leader.");
  }

  function setNodeStates(updates: Record<string, NodeState>) {
    setNodes((prev) =>
      prev.map((n) => ({ ...n, state: updates[n.id] ?? n.state }))
    );
  }

  function runBullyElection() {
    setPhase("running");
    const sorted = [...initialNodes].sort((a, b) => b.priority - a.priority);
    const initiator = initialNodes[0];
    const winner = sorted[0];

    setNodeStates({ [initiator.id]: "candidate" });
    setStatusText(`${initiator.name} detects no leader — starts election.`);

    setTimeout(() => {
      const higher = sorted.filter((n) => n.priority > initiator.priority);
      if (higher.length > 0) {
        setActiveEdge(`${initiator.id}-${higher[0].id}`);
        setStatusText(`${initiator.name} asks ${higher.map((n) => n.name).join(", ")} to take over.`);
        setNodeStates({
          [initiator.id]: "defeated",
          ...Object.fromEntries(higher.map((n) => [n.id, "voting" as NodeState])),
        });
      }

      setTimeout(() => {
        setActiveEdge(null);
        setNodeStates(
          Object.fromEntries(initialNodes.map((n) => [n.id, n.id === winner.id ? "leader" : "defeated"]))
        );
        setStatusText(`${winner.name} (priority ${winner.priority}) wins — elected leader.`);
        setPhase("done");
      }, 1200);
    }, 1000);
  }

  function runRingElection() {
    setPhase("running");
    const sorted = [...initialNodes].sort((a, b) => b.priority - a.priority);
    const winner = sorted[0];
    const ring = [...initialNodes];

    setNodeStates({ [ring[0].id]: "candidate" });
    setStatusText(`${ring[0].name} passes election token around the ring.`);

    let step = 0;
    function nextStep() {
      if (step >= ring.length) {
        setActiveEdge(null);
        setNodeStates(
          Object.fromEntries(initialNodes.map((n) => [n.id, n.id === winner.id ? "leader" : "defeated"]))
        );
        setStatusText(`Token circled the ring — ${winner.name} (priority ${winner.priority}) is leader.`);
        setPhase("done");
        return;
      }

      const current = ring[step];
      const next = ring[(step + 1) % ring.length];
      setActiveEdge(`${current.id}-${next.id}`);
      setNodeStates(
        Object.fromEntries(ring.map((n, i) => [n.id, i <= step ? "voting" : "idle"]))
      );
      setStatusText(`Token at ${current.name} → forwarding to ${next.name}.`);
      step++;
      setTimeout(nextStep, 1200);
    }

    setTimeout(nextStep, 1000);
  }

  function startElection() {
    if (phase === "running") return;
    reset();
    setTimeout(() => {
      if (algorithm === "bully") runBullyElection();
      else runRingElection();
    }, 300);
  }

  const stateStyles: Record<NodeState, string> = {
    idle: "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900",
    candidate: "border-amber-400 bg-amber-50 dark:bg-amber-950/40 ring-2 ring-amber-300 dark:ring-amber-700",
    voting: "border-blue-400 bg-blue-50 dark:bg-blue-950/40",
    leader: "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 ring-2 ring-emerald-300 dark:ring-emerald-700",
    defeated: "border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800/50 opacity-60",
  };

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/50">
        <Crown className="size-4 text-amber-500 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">{title}</span>
        <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
          {algorithm}
        </span>
        {interactive && (
          <button onClick={reset} className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all duration-500">
            <RefreshCw className="size-3.5" />
          </button>
        )}
      </div>

      <div className="px-4 py-2 text-sm text-zinc-500 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-900">
        Distributed nodes elect one leader to coordinate work — no single point of failure.
      </div>

      <div className="p-4 min-h-[220px] flex flex-col justify-center">
        <div className="flex flex-wrap justify-center gap-3">
          {nodes.map((node) => (
            <div
              key={node.id}
              className={cn(
                "relative flex flex-col items-center gap-1.5 rounded-lg border px-4 py-3 min-w-[88px] transition-all duration-500",
                stateStyles[node.state]
              )}
            >
              {node.state === "leader" && (
                <Crown className="absolute -top-2.5 size-4 text-amber-500 fill-amber-400" />
              )}
              <Server className={cn(
                "size-5 transition-all duration-500",
                node.state === "leader" ? "text-emerald-500" :
                node.state === "candidate" ? "text-amber-500" :
                node.state === "voting" ? "text-blue-500" :
                "text-zinc-400"
              )} />
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{node.name}</span>
              <span className="text-[10px] font-mono text-zinc-400">p={node.priority}</span>
              {node.state !== "idle" && (
                <span className={cn(
                  "text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded",
                  node.state === "leader" && "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300",
                  node.state === "candidate" && "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300",
                  node.state === "voting" && "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300",
                  node.state === "defeated" && "bg-zinc-200 dark:bg-zinc-700 text-zinc-500",
                )}>
                  {node.state}
                </span>
              )}
            </div>
          ))}
        </div>

        {activeEdge && (
          <div className="mt-4 text-center">
            <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-1 rounded border border-blue-200 dark:border-blue-800 animate-pulse">
              message → {activeEdge.replace("-", " → ")}
            </span>
          </div>
        )}

        {leader && phase === "done" && (
          <div className="mt-4 mx-auto text-center px-4 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800">
            <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
              {leader.name} is the elected leader
            </span>
          </div>
        )}
      </div>

      {interactive && (
        <div className="border-t border-zinc-100 dark:border-zinc-900 px-4 py-3 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/30">
          <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">{statusText}</span>
          <button
            onClick={startElection}
            disabled={phase === "running"}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-500 shrink-0 hover:opacity-90",
              phase === "running"
                ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-400 cursor-not-allowed"
                : "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
            )}
          >
            {phase === "done" ? "Run Again" : "Start Election"}
          </button>
        </div>
      )}
    </div>
  );
}
