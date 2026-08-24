"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Database, Server, Clock, Monitor, ArrowRight } from "lucide-react";

export const ConnectionPoolSchema = z.object({
  poolSize: z.number().int().min(1).max(10).optional().default(5),
  appInstances: z.number().int().min(1).max(8).optional().default(4),
  dbLabel: z.string().optional().default("PostgreSQL"),
  timeoutMs: z.number().optional().default(30000),
  interactive: z.boolean().optional().default(true),
});

export type ConnectionPoolProps = z.infer<typeof ConnectionPoolSchema>;

type ConnState = "free" | "busy";
type QueueItem = { id: number; since: number };

let _reqId = 100;

function useStableCallback<T extends (...args: never[]) => unknown>(fn: T): T {
  const ref = useRef(fn);
  ref.current = fn;
  return useCallback((...args: Parameters<T>) => ref.current(...args), []) as T;
}

export function ConnectionPool({
  poolSize = 5,
  appInstances = 4,
  dbLabel = "PostgreSQL",
  interactive = true,
}: ConnectionPoolProps) {
  const [conns, setConns] = useState<ConnState[]>(() => Array(poolSize).fill("free"));
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [totalHandled, setTotalHandled] = useState(0);
  const [totalWaitMs, setTotalWaitMs] = useState(0);
  const [flash, setFlash] = useState<"ok" | "queued" | null>(null);
  const [packetAnim, setPacketAnim] = useState(false);

  const releaseConn = useStableCallback((slot: number, waitMs: number) => {
    setTimeout(() => {
      setConns((prev) => {
        const next = [...prev];
        next[slot] = "free";
        return next;
      });
      setTotalHandled((t) => t + 1);
      setTotalWaitMs((t) => t + waitMs);
    }, 1200);
  });

  const acquireSlot = useCallback((connsSnapshot: ConnState[]): number => {
    return connsSnapshot.findIndex((c) => c === "free");
  }, []);

  const sendRequest = useStableCallback(() => {
    setPacketAnim(true);
    setTimeout(() => setPacketAnim(false), 1000);
    setConns((prev) => {
      const freeSlot = acquireSlot(prev);
      if (freeSlot !== -1) {
        const next = [...prev];
        next[freeSlot] = "busy";
        setFlash("ok");
        setTimeout(() => setFlash(null), 1000);
        releaseConn(freeSlot, 0);
        return next;
      } else {
        const item: QueueItem = { id: ++_reqId, since: Date.now() };
        setQueue((q) => [...q, item].slice(0, 4));
        setFlash("queued");
        setTimeout(() => setFlash(null), 1000);
        return prev;
      }
    });
  });

  useEffect(() => {
    if (queue.length === 0) return;
    const freeSlot = acquireSlot(conns);
    if (freeSlot === -1) return;

    const [next, ...rest] = queue;
    const waitMs = Date.now() - next.since;
    setQueue(rest);
    setConns((prev) => {
      const updated = [...prev];
      updated[freeSlot] = "busy";
      return updated;
    });
    releaseConn(freeSlot, waitMs);
  }, [conns, queue, acquireSlot, releaseConn]);

  const busyCount = conns.filter((c) => c === "busy").length;
  const avgWait = totalHandled > 0 ? Math.round(totalWaitMs / totalHandled) : 0;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <Database className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">Connection Pool</span>
        <span className="text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-2 py-0.5 rounded">
          {poolSize} connections
        </span>
      </div>

      <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          App instances share a limited pool of database connections. Requests queue when all slots are busy.
        </p>
      </div>

      <div className="min-h-[260px] px-4 py-4">
        {/* Animated flow: App → Pool → DB */}
        <div className="flex items-center justify-center gap-2 mb-4 py-2 border border-zinc-100 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-800/40">
          <Monitor className={cn("size-4 transition-all duration-500", packetAnim ? "text-blue-500" : "text-zinc-400")} />
          <div className="relative flex-1 h-1 max-w-[60px] bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
            {packetAnim && <div className="absolute inset-y-0 w-2 bg-blue-500 rounded-full animate-[travel_1s_ease-in-out_forwards]" />}
          </div>
          <span className="text-[9px] font-semibold text-zinc-500">Pool</span>
          <ArrowRight className={cn("size-3 transition-all duration-500", packetAnim ? "text-emerald-500" : "text-zinc-300")} />
          <div className="relative flex-1 h-1 max-w-[60px] bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
            {packetAnim && <div className="absolute inset-y-0 w-2 bg-emerald-500 rounded-full animate-[travel_1s_ease-in-out_0.3s_forwards]" style={{ animationDelay: "0.3s" }} />}
          </div>
          <Database className={cn("size-4 transition-all duration-500", packetAnim ? "text-emerald-500" : "text-zinc-400")} />
        </div>

        <div className="grid grid-cols-3 gap-3 h-full">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wide text-zinc-400 mb-2">App Instances</div>
            <div className="space-y-1.5">
              {Array.from({ length: appInstances }).map((_, i) => (
                <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                  <Server className="size-3 text-zinc-400" />
                  <span className="text-[10px] font-mono text-zinc-600 dark:text-zinc-400">App {i + 1}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[10px] font-bold uppercase tracking-wide text-zinc-400 mb-2">Pool</div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {conns.map((state, i) => (
                <div
                  key={i}
                  className={cn(
                    "size-7 rounded-full border-2 flex items-center justify-center transition-all duration-500",
                    state === "busy"
                      ? "border-emerald-400 bg-emerald-100 dark:bg-emerald-900/40"
                      : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                  )}
                  title={state === "busy" ? "In use" : "Available"}
                >
                  <div className={cn(
                    "size-2.5 rounded-full transition-all duration-500",
                    state === "busy" ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-600"
                  )} />
                </div>
              ))}
            </div>

            <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mb-1 font-mono">
              {busyCount}/{poolSize} in use
            </div>

            <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden mb-3">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  busyCount === poolSize ? "bg-red-500" : busyCount > poolSize * 0.6 ? "bg-amber-500" : "bg-emerald-500"
                )}
                style={{ width: `${(busyCount / poolSize) * 100}%` }}
              />
            </div>

            {queue.length > 0 && (
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-amber-500 mb-1">
                  Queue ({queue.length})
                </div>
                <div className="space-y-1">
                  {queue.map((item) => (
                    <div key={item.id} className="flex items-center gap-1.5 text-[10px] text-zinc-500 dark:text-zinc-400">
                      <Clock className="size-3 text-amber-400 animate-spin" style={{ animationDuration: "2s" }} />
                      <span className="font-mono">Req #{item.id}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="text-[10px] font-bold uppercase tracking-wide text-zinc-400 mb-2">Database</div>
            <div className="flex flex-col items-center gap-2">
              <div className={cn(
                "p-3 rounded-xl border-2 transition-all duration-500",
                busyCount > 0
                  ? "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20"
                  : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50"
              )}>
                <Database className={cn(
                  "size-6 transition-all duration-500",
                  busyCount > 0 ? "text-blue-500" : "text-zinc-400"
                )} />
              </div>
              <span className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-400">{dbLabel}</span>
              <div className="text-[10px] text-zinc-400 text-center">
                <div className="font-mono">{totalHandled} served</div>
                {avgWait > 0 && <div className="font-mono">avg wait {avgWait}ms</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes travel {
          from { left: 0; opacity: 1; }
          to { left: calc(100% - 8px); opacity: 0.3; }
        }
      `}</style>

      {interactive && (
        <div className={cn(
          "px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-3 transition-all duration-500",
          flash === "queued" ? "bg-amber-50 dark:bg-amber-900/10" : "bg-zinc-50 dark:bg-zinc-900/30"
        )}>
          <span className="text-xs text-zinc-500 flex-1">
            {flash === "queued"
              ? "All connections busy — request queued!"
              : flash === "ok"
              ? "Connection acquired — request in flight"
              : queue.length > 0
              ? `${queue.length} request${queue.length > 1 ? "s" : ""} waiting for a free connection`
              : "Click to send a request through the pool"}
          </span>
          <button
            onClick={sendRequest}
            className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity shrink-0"
          >
            Send Request
          </button>
        </div>
      )}
    </div>
  );
}
