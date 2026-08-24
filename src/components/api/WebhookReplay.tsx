"use client";

import { useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Webhook, Server, RefreshCw, CheckCircle2, XCircle, Clock } from "lucide-react";

const EventSchema = z.object({
  id: z.string(),
  event: z.string(),
  status: z.enum(["failed", "retrying", "delivered", "pending"]),
  attempts: z.number(),
  lastCode: z.number().optional(),
});

export const WebhookReplaySchema = z.object({
  name: z.string().optional().default("Webhook Replay Queue"),
  endpoint: z.string().optional().default("/webhooks/stripe"),
  maxAttempts: z.number().optional().default(5),
  events: z.array(EventSchema).optional().default([
    { id: "evt_01", event: "payment.failed", status: "failed", attempts: 3, lastCode: 503 },
    { id: "evt_02", event: "invoice.paid", status: "failed", attempts: 2, lastCode: 500 },
    { id: "evt_03", event: "customer.created", status: "delivered", attempts: 1, lastCode: 200 },
    { id: "evt_04", event: "subscription.updated", status: "failed", attempts: 4, lastCode: 502 },
  ]),
  interactive: z.boolean().optional().default(true),
});

export type WebhookReplayProps = z.infer<typeof WebhookReplaySchema>;

type EventStatus = z.infer<typeof EventSchema>["status"];

type QueueEvent = {
  id: string;
  event: string;
  status: EventStatus;
  attempts: number;
  lastCode?: number;
};

const STATUS_CFG: Record<EventStatus, { label: string; dot: string; badge: string; icon: React.ReactNode }> = {
  failed: {
    label: "FAILED",
    dot: "bg-red-500",
    badge: "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800",
    icon: <XCircle className="size-3.5" />,
  },
  retrying: {
    label: "RETRYING",
    dot: "bg-amber-500 animate-pulse",
    badge: "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800",
    icon: <Clock className="size-3.5" />,
  },
  delivered: {
    label: "DELIVERED",
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800",
    icon: <CheckCircle2 className="size-3.5" />,
  },
  pending: {
    label: "PENDING",
    dot: "bg-zinc-400",
    badge: "bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700",
    icon: <Clock className="size-3.5" />,
  },
};

export function WebhookReplay({
  name = "Webhook Replay Queue",
  endpoint = "/webhooks/stripe",
  maxAttempts = 5,
  events: initialEvents = [],
  interactive = true,
}: WebhookReplayProps) {
  const [events, setEvents] = useState<QueueEvent[]>(initialEvents);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialEvents.find((e) => e.status === "failed")?.id ?? null
  );
  const [packetAnim, setPacketAnim] = useState(false);
  const [footerMsg, setFooterMsg] = useState("Select a failed event, then click Replay Event to resend the stored payload.");

  const failedCount = events.filter((e) => e.status === "failed").length;
  const selected = events.find((e) => e.id === selectedId);

  function reset() {
    setEvents(initialEvents);
    setSelectedId(initialEvents.find((e) => e.status === "failed")?.id ?? null);
    setPacketAnim(false);
    setFooterMsg("Select a failed event, then click Replay Event to resend the stored payload.");
  }

  function replaySelected() {
    if (!selected || selected.status !== "failed") return;

    setFooterMsg(`Replaying ${selected.event}…`);
    setEvents((prev) =>
      prev.map((e) => (e.id === selected.id ? { ...e, status: "retrying" as const } : e))
    );
    setPacketAnim(true);

    setTimeout(() => {
      setEvents((prev) =>
        prev.map((e) =>
          e.id === selected.id
            ? { ...e, status: "delivered" as const, attempts: e.attempts + 1, lastCode: 200 }
            : e
        )
      );
      setPacketAnim(false);
      setFooterMsg(`${selected.event} delivered on replay — HTTP 200 OK.`);
    }, 1200);
  }

  return (
    <>
      <style>{`
        @keyframes travel {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(calc(100% - 24px)); opacity: 0.3; }
        }
      `}</style>
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
        <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/50">
          <Webhook className="size-4 text-zinc-400 shrink-0" />
          <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">{name}</span>
          <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
            {failedCount} failed
          </span>
          {interactive && (
            <button onClick={reset} className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all duration-500">
              <RefreshCw className="size-3.5" />
            </button>
          )}
        </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-900">
        Webhooks push event data to your server. When delivery fails (5xx errors), events wait in a replay queue until you resend them.
      </p>

      <div className="p-4 min-h-[280px] flex flex-col gap-3">
          {/* Delivery wire */}
          <div className="relative flex items-center gap-2 px-2 py-3 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
            <div className="flex flex-col items-center gap-1 shrink-0 w-16">
              <div className="w-10 h-10 rounded-lg border-2 border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-950/40 flex items-center justify-center">
                <Webhook className="size-4 text-violet-500" />
              </div>
              <span className="text-[9px] text-zinc-400 font-semibold">Queue</span>
            </div>

            <div className="flex-1 relative h-1 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-visible">
              {packetAnim && (
                <div
                  className="absolute top-1/2 -translate-y-1/2 size-3 rounded-full bg-violet-500 shadow-sm"
                  style={{ animation: "travel 1.2s ease-in-out forwards", left: 0 }}
                />
              )}
            </div>

            <div className="flex flex-col items-center gap-1 shrink-0 w-16">
              <div className={cn(
                "w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-all duration-700",
                selected?.status === "delivered"
                  ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40"
                  : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
              )}>
                <Server className={cn("size-4 transition-colors duration-700", selected?.status === "delivered" ? "text-emerald-500" : "text-zinc-400")} />
              </div>
              <span className="text-[9px] text-zinc-400 font-mono truncate max-w-[64px]">{endpoint}</span>
            </div>
          </div>

          {/* Event list — fixed height scroll */}
          <div className="flex-1 min-h-[120px] max-h-[120px] overflow-y-auto space-y-1.5 pr-1">
            {events.map((evt) => {
              const sc = STATUS_CFG[evt.status];
              const isSelected = evt.id === selectedId;
              return (
                <button
                  key={evt.id}
                  type="button"
                  disabled={!interactive}
                  onClick={() => setSelectedId(evt.id)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-all duration-500",
                    isSelected
                      ? "border-zinc-300 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-800/60"
                      : "border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-200 dark:hover:border-zinc-700"
                  )}
                >
                  <span className={cn("size-2 rounded-full shrink-0", sc.dot)} />
                  <code className="text-xs font-mono text-zinc-600 dark:text-zinc-300 flex-1 truncate">{evt.event}</code>
                  <span className="text-[10px] text-zinc-400 font-mono shrink-0">{evt.attempts}/{maxAttempts}</span>
                  {evt.lastCode !== undefined && (
                    <span className={cn(
                      "text-[10px] font-mono font-bold shrink-0",
                      evt.lastCode < 300 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                    )}>
                      {evt.lastCode}
                    </span>
                  )}
                  <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-1 shrink-0", sc.badge)}>
                    {sc.icon}
                    {sc.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {interactive && (
          <div className="border-t border-zinc-100 dark:border-zinc-900 px-4 py-3 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/30 min-h-[52px]">
            <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">{footerMsg}</span>
            <button
              type="button"
              onClick={replaySelected}
              disabled={!selected || selected.status !== "failed" || packetAnim}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 transition-all duration-500 shrink-0 disabled:opacity-50"
            >
              {packetAnim ? "Delivering…" : "Replay Event"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
