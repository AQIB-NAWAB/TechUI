"use client";

import { useState, useEffect, useRef } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Database, RefreshCw, Zap, AlertTriangle, Check } from "lucide-react";

export const DataReplicationSchema = z.object({
  mode: z.enum(["async", "sync"]).default("async"),
  replicas: z.number().int().min(1).max(4).default(2),
  lagMs: z.number().int().min(10).max(1000).default(150),
});

export type DataReplicationProps = z.infer<typeof DataReplicationSchema>;

type NodeStatus = "idle" | "writing" | "acked" | "replicating" | "synced" | "crashed" | "promoted";

interface DBNode {
  id: string;
  label: string;
  role: "primary" | "replica";
  status: NodeStatus;
  writes: number;
}

function buildNodes(replicas: number): DBNode[] {
  return [
    { id: "primary", label: "Primary DB", role: "primary", status: "idle", writes: 0 },
    ...Array.from({ length: replicas }, (_, i) => ({
      id: `replica-${i + 1}`,
      label: `Replica ${i + 1}`,
      role: "replica" as const,
      status: "idle" as NodeStatus,
      writes: 0,
    })),
  ];
}

const STATUS_STYLE: Record<NodeStatus, string> = {
  idle:        "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900",
  writing:     "border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-950/20",
  acked:       "border-emerald-500 dark:border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20",
  replicating: "border-amber-400 dark:border-amber-500 bg-amber-50 dark:bg-amber-950/20",
  synced:      "border-emerald-400 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20",
  crashed:     "border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-950/20",
  promoted:    "border-violet-500 dark:border-violet-400 bg-violet-50 dark:bg-violet-950/20",
};

const STATUS_LABEL: Record<NodeStatus, string> = {
  idle:        "ready",
  writing:     "writing...",
  acked:       "acknowledged ✓",
  replicating: "replicating...",
  synced:      "synced ✓",
  crashed:     "CRASHED",
  promoted:    "PRIMARY (promoted)",
};

function NodeBox({ node, lagMs }: { node: DBNode; lagMs: number }) {
  return (
    <div className={cn(
      "rounded-lg border-2 px-3 py-2.5 transition-all duration-500 min-w-[120px]",
      STATUS_STYLE[node.status]
    )}>
      <div className="flex items-center gap-1.5 mb-1">
        <Database className={cn(
          "size-3.5 shrink-0",
          node.role === "primary" ? "text-zinc-600 dark:text-zinc-300" : "text-zinc-400"
        )} />
        <span className={cn(
          "text-[11px] font-bold",
          node.role === "primary" ? "text-zinc-700 dark:text-zinc-200" : "text-zinc-500 dark:text-zinc-400"
        )}>
          {node.label}
        </span>
        {node.role === "primary" && node.status !== "crashed" && node.status !== "promoted" && (
          <span className="ml-auto text-[9px] font-bold px-1 rounded bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900">
            leader
          </span>
        )}
        {(node.status === "promoted") && (
          <span className="ml-auto text-[9px] font-bold px-1 rounded bg-violet-600 text-white">
            leader
          </span>
        )}
      </div>
      <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
        {STATUS_LABEL[node.status]}
      </div>
      {node.role === "replica" && node.status === "replicating" && (
        <div className="text-[9px] text-amber-600 dark:text-amber-400 mt-0.5">
          lag ~{lagMs}ms
        </div>
      )}
      <div className="text-[9px] text-zinc-400 mt-0.5">writes: {node.writes}</div>
    </div>
  );
}

export function DataReplication({
  mode: initialMode = "async",
  replicas = 2,
  lagMs: initialLagMs = 150,
}: DataReplicationProps) {
  const [mode, setMode] = useState<"async" | "sync">(initialMode);
  const [lagMs, setLagMs] = useState(initialLagMs);
  const [nodes, setNodes] = useState<DBNode[]>(() => buildNodes(Math.min(Math.max(replicas, 1), 4)));
  const [animating, setAnimating] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [crashed, setCrashed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Rebuild nodes when replicas prop changes
  useEffect(() => {
    const count = Math.min(Math.max(replicas, 1), 4);
    setNodes(buildNodes(count));
    setCrashed(false);
    setLog([]);
  }, [replicas]);

  function updateNode(id: string, patch: Partial<DBNode>) {
    setNodes((prev) => prev.map((n) => n.id === id ? { ...n, ...patch } : n));
  }

  function addLog(msg: string) {
    setLog((prev) => [msg, ...prev].slice(0, 6));
  }

  function resetAll() {
    if (timerRef.current) clearTimeout(timerRef.current);
    const count = Math.min(Math.max(replicas, 1), 4);
    setNodes(buildNodes(count));
    setCrashed(false);
    setLog([]);
    setAnimating(false);
  }

  async function simulateWrite() {
    if (animating || crashed) return;
    setAnimating(true);

    // Step 1: client writes to primary
    updateNode("primary", { status: "writing" });
    addLog('Client → Primary: INSERT INTO orders ...');

    const delay = (ms: number) => new Promise<void>((res) => {
      timerRef.current = setTimeout(res, ms);
    });

    await delay(600);

    const replicaIds = nodes.filter((n) => n.role === "replica").map((n) => n.id);

    if (mode === "async") {
      // Async: primary acks immediately
      updateNode("primary", { status: "acked", writes: nodes.find((n) => n.id === "primary")!.writes + 1 });
      addLog("Primary → Client: 200 OK (async — immediate ack)");

      await delay(400);

      // Replicas update after lag
      replicaIds.forEach((id) => updateNode(id, { status: "replicating" }));
      addLog(`Replicating to ${replicaIds.length} replica(s) asynchronously...`);

      await delay(Math.min(lagMs, 800) + 400);

      replicaIds.forEach((id) => updateNode(id, {
        status: "synced",
        writes: nodes.find((n) => n.id === id)!.writes + 1,
      }));
      addLog("Replicas: synced (eventual consistency)");

    } else {
      // Sync: wait for all replicas before acking
      updateNode("primary", { status: "writing" });
      replicaIds.forEach((id) => updateNode(id, { status: "replicating" }));
      addLog(`Waiting for all ${replicaIds.length} replica(s) to confirm...`);

      await delay(Math.min(lagMs * replicaIds.length, 1200) + 400);

      replicaIds.forEach((id) => updateNode(id, {
        status: "synced",
        writes: nodes.find((n) => n.id === id)!.writes + 1,
      }));
      addLog("All replicas confirmed ✓");

      await delay(400);

      updateNode("primary", { status: "acked", writes: nodes.find((n) => n.id === "primary")!.writes + 1 });
      addLog("Primary → Client: 200 OK (sync — all confirmed)");
    }

    await delay(1500);

    // Reset to idle (keep write counts)
    setNodes((prev) => prev.map((n) => ({
      ...n,
      status: n.status === "crashed" ? "crashed" : "idle",
    })));
    setAnimating(false);
  }

  function simulateCrash() {
    if (animating) return;
    setCrashed(true);
    updateNode("primary", { status: "crashed" });
    addLog("Primary CRASHED! Electing new leader...");

    timerRef.current = setTimeout(() => {
      const replicaIds = nodes.filter((n) => n.role === "replica").map((n) => n.id);
      if (replicaIds.length > 0) {
        updateNode(replicaIds[0], { status: "promoted", label: "Replica 1 (was)", role: "primary" });
        addLog("Replica 1 promoted to PRIMARY — failover complete");
      }
    }, 1500);
  }

  const primaryNode = nodes.find((n) => n.role === "primary" || n.status === "promoted");
  const replicaNodes = nodes.filter((n) => n.role === "replica" && n.status !== "promoted");

  const writeLatency = mode === "sync"
    ? `~${lagMs * replicas}ms (waiting for ${replicas} replica${replicas > 1 ? "s" : ""})`
    : "<10ms (async)";

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <Database className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">Data Replication</span>
        <span className={cn(
          "text-[10px] font-bold px-2 py-0.5 rounded-full",
          mode === "async"
            ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
            : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
        )}>
          {mode === "async" ? "Async" : "Sync"} mode
        </span>
        <button onClick={resetAll} className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all duration-500">
          <RefreshCw className="size-3.5" />
        </button>
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        Copies database writes from a primary to replica servers — async is fast but may lose data; sync waits for all replicas.
      </p>

      <div className="min-h-[240px] p-4 flex flex-col gap-4">
        {/* Primary */}
        {primaryNode && <NodeBox node={primaryNode} lagMs={lagMs} />}

        {/* Connection lines */}
        {replicaNodes.length > 0 && (
          <div className="flex items-start gap-2 pl-4">
            <div className="flex flex-col justify-around h-full">
              {replicaNodes.map((_, i) => (
                <div key={i} className={cn(
                  "h-6 border-l-2 border-b-2 rounded-bl border-zinc-200 dark:border-zinc-700 w-5 transition-colors duration-500",
                  animating && "border-blue-300 dark:border-blue-700"
                )} />
              ))}
            </div>
            <div className="flex flex-col gap-2 flex-1">
              {replicaNodes.map((node) => (
                <div key={node.id} className="flex items-center gap-2">
                  <NodeBox node={node} lagMs={lagMs} />
                  <div className="text-[10px] text-zinc-400 italic">reads offloaded here</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mode explanation */}
        <div className="grid grid-cols-2 gap-2 mt-auto">
          <div className={cn(
            "rounded-lg p-2 border text-[10px] transition-all duration-500",
            mode === "async"
              ? "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-200"
              : "border-zinc-100 dark:border-zinc-800 text-zinc-400"
          )}>
            <div className="font-bold mb-0.5">Async (fast writes)</div>
            Primary acks immediately. Replicas update later.
            <br /><span className="text-red-600 dark:text-red-400">Risk: data loss if primary crashes before replication.</span>
          </div>
          <div className={cn(
            "rounded-lg p-2 border text-[10px] transition-all duration-500",
            mode === "sync"
              ? "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 text-blue-800 dark:text-blue-200"
              : "border-zinc-100 dark:border-zinc-800 text-zinc-400"
          )}>
            <div className="font-bold mb-0.5">Sync (zero data loss)</div>
            All replicas confirm before ack. Slower.
            <br /><span className="text-zinc-500">Write latency: {writeLatency}</span>
          </div>
        </div>

        {/* Log */}
        {log.length > 0 && (
          <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700 px-3 py-2 space-y-0.5">
            {log.map((entry, i) => (
              <div key={i} className={cn(
                "text-[10px] font-mono transition-opacity",
                i === 0 ? "text-zinc-700 dark:text-zinc-200" : "text-zinc-400"
              )}>
                {entry}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-2 flex-wrap bg-zinc-50 dark:bg-zinc-900/30">
        <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1 min-w-[140px]">
          {animating ? "Replicating write…" : log[0] ?? `Write latency: ${writeLatency}`}
        </span>
        <button
          onClick={() => setMode((m) => m === "async" ? "sync" : "async")}
          disabled={animating}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all duration-500 text-zinc-600 dark:text-zinc-400 disabled:opacity-50"
        >
          <RefreshCw className="size-3.5" />
          {mode === "async" ? "Sync" : "Async"}
        </button>
        {!crashed && (
          <button
            onClick={simulateCrash}
            disabled={animating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-500 disabled:opacity-50"
          >
            <AlertTriangle className="size-3.5" />
            Crash
          </button>
        )}
        <button
          onClick={crashed ? resetAll : simulateWrite}
          disabled={animating && !crashed}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-500",
            animating || (crashed === false && crashed)
              ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 disabled:opacity-50"
              : crashed
                ? "bg-emerald-600 text-white hover:opacity-90"
                : "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 disabled:opacity-50"
          )}
        >
          {crashed ? (
            <><Check className="size-3.5" /> Restore</>
          ) : (
            <><Zap className="size-3.5" /> Write</>
          )}
        </button>
      </div>
    </div>
  );
}
