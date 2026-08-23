"use client";

import { useState, useRef, useEffect } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { ListOrdered, Plus, RefreshCw, ShoppingCart, ChevronRight } from "lucide-react";

export const EventSourcingSchema = z.object({
  entityType: z.string().default("ShoppingCart"),
  events: z
    .array(
      z.object({
        type: z.string(),
        data: z.record(z.string(), z.unknown()),
        timestamp: z.string(),
      })
    )
    .default([
      { type: "CartCreated", data: { cartId: "cart_001", userId: "user_123" }, timestamp: "10:00:01" },
      { type: "ItemAdded", data: { productId: "apple", qty: 2, price: 1.99 }, timestamp: "10:00:15" },
      { type: "ItemAdded", data: { productId: "banana", qty: 1, price: 0.99 }, timestamp: "10:00:22" },
      { type: "ItemRemoved", data: { productId: "apple", qty: 1 }, timestamp: "10:01:05" },
      { type: "CouponApplied", data: { code: "SAVE10", discount: 0.10 }, timestamp: "10:01:30" },
    ]),
});

export type EventSourcingProps = z.infer<typeof EventSourcingSchema>;

const EVENT_COLORS: Record<string, string> = {
  CartCreated: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300",
  AccountOpened: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300",
  ItemAdded: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
  MoneyDeposited: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
  ItemRemoved: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300",
  MoneyWithdrawn: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300",
  CouponApplied: "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300",
  OrderPlaced: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
};

const DEFAULT_COLOR = "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400";

const ADD_EVENT_CYCLE = [
  { type: "ItemAdded", data: { productId: "mango", qty: 1, price: 2.49 }, timestamp: "" },
  { type: "ItemRemoved", data: { productId: "banana", qty: 1 }, timestamp: "" },
  { type: "CouponApplied", data: { code: "FRESH5", discount: 0.05 }, timestamp: "" },
  { type: "OrderPlaced", data: { orderId: "ord_002", total: "auto" }, timestamp: "" },
];

function formatEventSummary(event: { type: string; data: Record<string, unknown> }): string {
  const d = event.data;
  if (event.type === "CartCreated" || event.type === "AccountOpened") {
    return Object.values(d)[0] as string ?? "";
  }
  if (event.type === "ItemAdded") {
    return `${d.productId ?? d.product ?? ""} ×${d.qty ?? 1}`;
  }
  if (event.type === "ItemRemoved") {
    return `${d.productId ?? d.product ?? ""} ×${d.qty ?? 1}`;
  }
  if (event.type === "CouponApplied") {
    return `${d.code ?? ""}`;
  }
  if (event.type === "MoneyDeposited" || event.type === "MoneyWithdrawn") {
    return `$${d.amount ?? ""}`;
  }
  if (event.type === "OrderPlaced") {
    return `${d.orderId ?? ""}`;
  }
  return Object.values(d).slice(0, 1).join(", ");
}

type CartState = {
  id: string;
  items: Record<string, { qty: number; price: number }>;
  coupon: string | null;
  discount: number;
  placed: boolean;
};

function replayEvents(entityType: string, events: EventSourcingProps["events"]): CartState {
  const state: CartState = { id: "", items: {}, coupon: null, discount: 0, placed: false };
  for (const ev of events) {
    const d = ev.data;
    if (ev.type === "CartCreated" || ev.type === "AccountOpened") {
      state.id = (d.cartId ?? d.accountId ?? "") as string;
    } else if (ev.type === "ItemAdded") {
      const key = (d.productId ?? d.product ?? "item") as string;
      const existing = state.items[key];
      if (existing) {
        state.items[key] = { qty: existing.qty + ((d.qty as number) ?? 1), price: (d.price as number) ?? existing.price };
      } else {
        state.items[key] = { qty: (d.qty as number) ?? 1, price: (d.price as number) ?? 0 };
      }
    } else if (ev.type === "ItemRemoved") {
      const key = (d.productId ?? d.product ?? "item") as string;
      if (state.items[key]) {
        const newQty = state.items[key].qty - ((d.qty as number) ?? 1);
        if (newQty <= 0) delete state.items[key];
        else state.items[key].qty = newQty;
      }
    } else if (ev.type === "CouponApplied") {
      state.coupon = (d.code as string) ?? null;
      state.discount = (d.discount as number) ?? 0;
    } else if (ev.type === "OrderPlaced") {
      state.placed = true;
    } else if (ev.type === "MoneyDeposited") {
      // treat like an item for display
      const key = "__balance__";
      if (!state.items[key]) state.items[key] = { qty: 0, price: 1 };
      state.items[key].qty += (d.amount as number) ?? 0;
    } else if (ev.type === "MoneyWithdrawn") {
      const key = "__balance__";
      if (!state.items[key]) state.items[key] = { qty: 0, price: 1 };
      state.items[key].qty -= (d.amount as number) ?? 0;
    }
  }
  return state;
}

export function EventSourcing({ entityType = "ShoppingCart", events = [] }: EventSourcingProps) {
  const [log, setLog] = useState(events);
  const [visibleCount, setVisibleCount] = useState(events.length);
  const [replaying, setReplaying] = useState(false);
  const [cycleIdx, setCycleIdx] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const visibleLog = log.slice(0, visibleCount);
  const currentState = replayEvents(entityType, visibleLog);

  function addEvent() {
    if (replaying) return;
    const now = new Date();
    const ts = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
    const newEv = { ...ADD_EVENT_CYCLE[cycleIdx % ADD_EVENT_CYCLE.length], timestamp: ts };
    setLog((prev) => [...prev, newEv]);
    setVisibleCount((c) => c + 1);
    setCycleIdx((i) => i + 1);
  }

  function replay() {
    if (replaying) return;
    setReplaying(true);
    setVisibleCount(0);
    let i = 0;
    function step() {
      i++;
      setVisibleCount(i);
      if (i < log.length) {
        timerRef.current = setTimeout(step, 600);
      } else {
        timerRef.current = setTimeout(() => setReplaying(false), 400);
      }
    }
    timerRef.current = setTimeout(step, 400);
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const subtotal = Object.entries(currentState.items).reduce(
    (acc, [, v]) => acc + v.qty * v.price,
    0
  );
  const total = subtotal * (1 - currentState.discount);

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
        <ListOrdered className="size-3.5 text-zinc-400 shrink-0" />
        <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex-1">
          Event Sourcing — {entityType}
        </span>
      </div>

      {/* Two panels */}
      <div className="flex min-h-[280px] divide-x divide-zinc-100 dark:divide-zinc-800">
        {/* Left: Event Log */}
        <div className="flex-1 flex flex-col">
          <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800">
            <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
              Event Log
            </span>
          </div>
          <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
            {log.map((ev, i) => {
              const visible = i < visibleCount;
              return (
                <div
                  key={i}
                  className={cn(
                    "flex items-center gap-2 px-2 py-1.5 rounded-md transition-all duration-500",
                    visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none",
                    replaying && i === visibleCount - 1
                      ? "bg-blue-50 dark:bg-blue-950/30"
                      : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  )}
                >
                  <ChevronRight className="size-3 text-zinc-300 dark:text-zinc-600 shrink-0" />
                  <span
                    className={cn(
                      "text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0",
                      EVENT_COLORS[ev.type] ?? DEFAULT_COLOR
                    )}
                  >
                    {ev.type}
                  </span>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate flex-1">
                    {formatEventSummary(ev)}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 shrink-0">
                    {ev.timestamp}
                  </span>
                </div>
              );
            })}
          </div>
          {/* Actions */}
          <div className="px-3 py-2.5 border-t border-zinc-100 dark:border-zinc-800 flex gap-2">
            <button
              onClick={addEvent}
              disabled={replaying}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-500",
                "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 disabled:opacity-50"
              )}
            >
              <Plus className="size-3" />
              Add Event
            </button>
          </div>
        </div>

        {/* Right: Current State */}
        <div className="flex-1 flex flex-col">
          <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800">
            <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
              Current State
            </span>
          </div>
          <div className="flex-1 px-3 py-3 space-y-2">
            <div className="flex items-center gap-2">
              <ShoppingCart className="size-3.5 text-zinc-400" />
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                {entityType}
                {currentState.id ? ` #${currentState.id}` : ""}
              </span>
              {currentState.placed && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-semibold">
                  PLACED
                </span>
              )}
            </div>
            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-2 space-y-1.5">
              {Object.entries(currentState.items).length === 0 ? (
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 italic">Empty</p>
              ) : (
                Object.entries(currentState.items).map(([key, val]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between text-xs transition-all duration-500"
                  >
                    <span className="text-zinc-700 dark:text-zinc-300 capitalize">{key}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-500 dark:text-zinc-400">×{val.qty}</span>
                      {val.price > 0 && (
                        <span className="font-mono text-zinc-600 dark:text-zinc-400">
                          ${(val.qty * val.price).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            {currentState.coupon && (
              <div className="flex items-center justify-between text-xs border-t border-zinc-100 dark:border-zinc-800 pt-1.5">
                <span className="text-violet-600 dark:text-violet-400 font-medium">
                  Coupon: {currentState.coupon}
                </span>
                <span className="text-violet-600 dark:text-violet-400">
                  -{Math.round(currentState.discount * 100)}%
                </span>
              </div>
            )}
            {Object.keys(currentState.items).length > 0 && (
              <div className="flex items-center justify-between text-xs font-bold border-t border-zinc-200 dark:border-zinc-700 pt-1.5">
                <span className="text-zinc-700 dark:text-zinc-300">Total</span>
                <span className="font-mono text-zinc-800 dark:text-zinc-200">${total.toFixed(2)}</span>
              </div>
            )}
          </div>
          {/* Replay button */}
          <div className="px-3 py-2.5 border-t border-zinc-100 dark:border-zinc-800">
            <button
              onClick={replay}
              disabled={replaying}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold w-full justify-center transition-all duration-500",
                "border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50"
              )}
            >
              {replaying ? <RefreshCw className="size-3 animate-spin" /> : <RefreshCw className="size-3" />}
              {replaying ? "Replaying…" : "Replay from scratch →"}
            </button>
          </div>
        </div>
      </div>

      {/* Footer insight */}
      <div className="border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 px-4 py-2">
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
          The event log is the source of truth — state is always derived from events
        </p>
      </div>
    </div>
  );
}
