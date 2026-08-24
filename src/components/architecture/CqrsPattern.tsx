"use client";

import { useState, useRef } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { ArrowLeftRight } from "lucide-react";

export const CqrsPatternSchema = z.object({
  entityName: z.string().default("Order"),
  commands: z.array(z.object({
    name: z.string(),
    description: z.string(),
    color: z.enum(["blue", "emerald", "amber", "red"]).optional().default("blue"),
  })).default([
    { name: "PlaceOrder",    description: "Create new order",          color: "emerald" },
    { name: "CancelOrder",   description: "Cancel existing order",     color: "red"     },
    { name: "UpdateAddress", description: "Change delivery address",   color: "blue"    },
    { name: "ApplyDiscount", description: "Apply promo code to order", color: "amber"   },
  ]),
  queries: z.array(z.object({
    name: z.string(),
    description: z.string(),
  })).default([
    { name: "GetOrderById",    description: "Fetch single order"          },
    { name: "GetOrdersByUser", description: "All orders for a user"       },
    { name: "GetOrderSummary", description: "Stats: count, total revenue" },
  ]),
});

export type CqrsPatternProps = z.infer<typeof CqrsPatternSchema>;

type AnimPhase = "idle" | "cmd-write" | "event" | "read-update" | "done-cmd" | "query-read" | "done-query";

const COLOR_MAP = {
  blue:    { badge: "bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",    dot: "bg-blue-500"    },
  emerald: { badge: "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800", dot: "bg-emerald-500" },
  amber:   { badge: "bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",   dot: "bg-amber-500"   },
  red:     { badge: "bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",             dot: "bg-red-500"     },
};

export function CqrsPattern({
  entityName = "Order",
  commands = [
    { name: "PlaceOrder",    description: "Create new order",          color: "emerald" as const },
    { name: "CancelOrder",   description: "Cancel existing order",     color: "red"     as const },
    { name: "UpdateAddress", description: "Change delivery address",   color: "blue"    as const },
    { name: "ApplyDiscount", description: "Apply promo code to order", color: "amber"   as const },
  ],
  queries = [
    { name: "GetOrderById",    description: "Fetch single order"          },
    { name: "GetOrdersByUser", description: "All orders for a user"       },
    { name: "GetOrderSummary", description: "Stats: count, total revenue" },
  ],
}: CqrsPatternProps) {
  const [phase, setPhase] = useState<AnimPhase>("idle");
  const [activeCmd, setActiveCmd] = useState<number>(0);
  const [activeQuery, setActiveQuery] = useState<number>(0);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [queryOpen, setQueryOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => { if (timerRef.current) clearTimeout(timerRef.current); };

  const sendCommand = (idx: number) => {
    clearTimer();
    setActiveCmd(idx);
    setCmdOpen(false);
    setPhase("cmd-write");
    timerRef.current = setTimeout(() => {
      setPhase("event");
      timerRef.current = setTimeout(() => {
        setPhase("read-update");
        timerRef.current = setTimeout(() => setPhase("done-cmd"), 1000);
      }, 1200);
    }, 1000);
  };

  const runQuery = (idx: number) => {
    clearTimer();
    setActiveQuery(idx);
    setQueryOpen(false);
    setPhase("query-read");
    timerRef.current = setTimeout(() => setPhase("done-query"), 1200);
  };

  const cmdColor = (c?: string) => COLOR_MAP[(c as keyof typeof COLOR_MAP) ?? "blue"] ?? COLOR_MAP.blue;

  const writeHighlight = phase === "cmd-write" || phase === "event" || phase === "read-update" || phase === "done-cmd";
  const eventHighlight = phase === "event" || phase === "read-update" || phase === "done-cmd";
  const readHighlight  = phase === "read-update" || phase === "done-cmd" || phase === "query-read" || phase === "done-query";

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <ArrowLeftRight className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">CQRS Pattern</span>
        <span className="text-[10px] font-mono text-zinc-400 border border-zinc-200 dark:border-zinc-700 px-2 py-0.5 rounded">
          {entityName}
        </span>
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        Separate write and read paths — commands change data, queries read from an optimized copy.
      </p>

      <div className="min-h-[220px] p-4">
        {/* Two columns: Commands / Queries */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Commands */}
          <div className="border border-zinc-100 dark:border-zinc-800 rounded-lg p-3 bg-zinc-50 dark:bg-zinc-800/50">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-2">Commands (Write)</div>
            <div className="space-y-1.5">
              {commands.map((cmd, i) => {
                const cc = cmdColor(cmd.color);
                const isActive = phase !== "idle" && phase !== "query-read" && phase !== "done-query" && i === activeCmd;
                return (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-[11px] transition-all duration-500",
                      cc.badge,
                      isActive && "ring-2 ring-offset-1 ring-blue-400 dark:ring-blue-600"
                    )}
                  >
                    <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", cc.dot)} />
                    <div>
                      <div className="font-semibold font-mono">{cmd.name}</div>
                      <div className="text-[9px] opacity-70">{cmd.description}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Queries */}
          <div className="border border-zinc-100 dark:border-zinc-800 rounded-lg p-3 bg-zinc-50 dark:bg-zinc-800/50">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-2">Queries (Read)</div>
            <div className="space-y-1.5">
              {queries.map((q, i) => {
                const isActive = (phase === "query-read" || phase === "done-query") && i === activeQuery;
                return (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20 text-[11px] transition-all duration-500",
                      isActive && "ring-2 ring-offset-1 ring-emerald-400 dark:ring-emerald-600"
                    )}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <div>
                      <div className="font-semibold font-mono text-emerald-800 dark:text-emerald-200">{q.name}</div>
                      <div className="text-[9px] text-emerald-700/70 dark:text-emerald-300/70">{q.description}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Stores + event stream */}
        <div className="flex items-center gap-3 mt-3">
          {/* Write store */}
          <div className={cn(
            "flex-1 rounded-lg border px-3 py-2.5 text-center transition-all duration-500",
            writeHighlight
              ? "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/20"
              : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/40"
          )}>
            <div className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Write Store</div>
            <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mt-0.5">PostgreSQL</div>
            <div className="text-[9px] text-zinc-400">normalized</div>
          </div>

          {/* Event arrow */}
          <div className="flex flex-col items-center gap-0.5 shrink-0">
            <div className={cn(
              "text-[8px] font-semibold uppercase tracking-wide transition-all duration-500",
              eventHighlight ? "text-amber-600 dark:text-amber-400" : "text-zinc-300 dark:text-zinc-600"
            )}>
              event
            </div>
            <div className={cn(
              "text-base transition-all duration-500",
              eventHighlight ? "text-amber-500" : "text-zinc-300 dark:text-zinc-600"
            )}>→</div>
            <div className={cn(
              "text-[8px] font-semibold uppercase tracking-wide transition-all duration-500",
              eventHighlight ? "text-amber-600 dark:text-amber-400" : "text-zinc-300 dark:text-zinc-600"
            )}>
              stream
            </div>
          </div>

          {/* Read store */}
          <div className={cn(
            "flex-1 rounded-lg border px-3 py-2.5 text-center transition-all duration-500",
            readHighlight
              ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/20"
              : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/40"
          )}>
            <div className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Read Store</div>
            <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mt-0.5">Elasticsearch</div>
            <div className="text-[9px] text-zinc-400">denormalized</div>
          </div>
        </div>

        {/* Status message */}
        <div className={cn(
          "mt-3 px-3 py-2 rounded-lg text-[11px] text-center font-medium transition-all duration-500 border",
          phase === "idle"         && "bg-zinc-50 dark:bg-zinc-800/40 text-zinc-400 border-zinc-100 dark:border-zinc-800",
          phase === "cmd-write"    && "bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
          phase === "event"        && "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
          (phase === "read-update" || phase === "done-cmd" || phase === "query-read" || phase === "done-query") &&
            "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
        )}>
          {phase === "idle"        && "Send a command or run a query to see the CQRS flow"}
          {phase === "cmd-write"   && `→ ${commands[activeCmd]?.name ?? ""} sent to Write Store…`}
          {phase === "event"       && "→ Event published — read store syncing…"}
          {phase === "read-update" && "→ Read Store updated from event"}
          {phase === "done-cmd"    && `✓ ${commands[activeCmd]?.name ?? ""} complete`}
          {phase === "query-read"  && `→ ${queries[activeQuery]?.name ?? ""} hitting Read Store…`}
          {phase === "done-query"  && `✓ ${queries[activeQuery]?.name ?? ""} returned fast`}
        </div>
      </div>

      <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/30">
        <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">
          {phase === "idle"
            ? "Commands write · queries read from a separate optimized store"
            : "Reads are never blocked by writes"}
        </span>
        <div className="relative">
          <button
            onClick={() => { setCmdOpen((v) => !v); setQueryOpen(false); }}
            className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Send Command
          </button>
          {cmdOpen && (
            <div className="absolute bottom-full mb-1 right-0 z-10 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg overflow-hidden min-w-[180px]">
              {commands.map((cmd, i) => (
                <button
                  key={i}
                  onClick={() => sendCommand(i)}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all duration-500"
                >
                  <span className="font-semibold font-mono">{cmd.name}</span>
                </button>
              ))}
              <div className="border-t border-zinc-100 dark:border-zinc-800">
                {queries.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => runQuery(i)}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all duration-500 text-emerald-700 dark:text-emerald-300"
                  >
                    Query: {q.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
