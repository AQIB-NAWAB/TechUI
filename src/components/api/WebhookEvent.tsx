"use client";

import { useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Webhook, Server, CheckCircle2, XCircle, RefreshCw, Clock } from "lucide-react";

const DeliveryStatusEnum = z.enum(["delivered", "failed", "pending", "retrying"]);

export const WebhookEventSchema = z.object({
  event: z.string().optional().default("user.created"),
  endpoint: z.string().optional().default("https://api.example.com/webhooks/stripe"),
  method: z.enum(["POST", "PUT"]).optional().default("POST"),
  status: DeliveryStatusEnum.optional().default("delivered"),
  responseCode: z.number().optional().default(200),
  attempt: z.number().optional().default(1),
  maxAttempts: z.number().optional().default(3),
  timestamp: z.string().optional(),
  latency: z.number().optional().default(124),
  signatureHeader: z.string().optional().default("Stripe-Signature"),
  signatureValue: z.string().optional().default("t=1716239022,v1=a1b2c3d4e5f6..."),
  payload: z.record(z.string(), z.unknown()).optional(),
  headers: z.array(z.object({ key: z.string(), value: z.string() })).optional(),
  senderLabel: z.string().optional().default("Sender"),
  verified: z.boolean().optional().default(true),
});

export type WebhookEventProps = z.infer<typeof WebhookEventSchema>;

const STATUS_CFG = {
  delivered: { label: "DELIVERED", dot: "bg-emerald-500", badge: "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800" },
  failed:    { label: "FAILED",    dot: "bg-red-500",     badge: "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800" },
  pending:   { label: "PENDING",   dot: "bg-zinc-400",    badge: "bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700" },
  retrying:  { label: "RETRYING",  dot: "bg-amber-500",   badge: "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800" },
};

const DEFAULT_PAYLOAD = {
  id: "evt_1Qx8dR2eZvKYlo2C6L9mKP3j",
  type: "payment.succeeded",
  created: 1716239022,
  data: {
    object: {
      id: "pi_3Qx8dR",
      amount: 4999,
      currency: "usd",
      status: "succeeded",
    },
  },
};

function JsonLine({ text }: { text: string }) {
  const parts: { text: string; cls: string }[] = [];
  const keyMatch = text.match(/^(\s*)("[\w_]+")(\s*:\s*)(.*)$/);
  if (keyMatch) {
    if (keyMatch[1]) parts.push({ text: keyMatch[1]!, cls: "" });
    parts.push({ text: keyMatch[2]!, cls: "text-blue-500 dark:text-blue-400" });
    parts.push({ text: keyMatch[3]!, cls: "text-zinc-400" });
    const val = keyMatch[4]!.trimEnd().replace(/,$/, "");
    const comma = keyMatch[4]!.trimEnd().endsWith(",") ? "," : "";
    if (val.startsWith('"')) {
      parts.push({ text: val, cls: "text-emerald-600 dark:text-emerald-400" });
    } else if (!isNaN(Number(val))) {
      parts.push({ text: val, cls: "text-amber-600 dark:text-amber-400" });
    } else {
      parts.push({ text: val, cls: "text-zinc-500 dark:text-zinc-400" });
    }
    if (comma) parts.push({ text: comma, cls: "text-zinc-400" });
  } else {
    parts.push({ text, cls: "text-zinc-500 dark:text-zinc-400" });
  }
  return (
    <div>
      {parts.map((p, i) => <span key={i} className={p.cls}>{p.text}</span>)}
    </div>
  );
}

function SyntaxJson({ obj }: { obj: unknown }) {
  const lines = JSON.stringify(obj, null, 2).split("\n");
  return (
    <div className="font-mono text-xs leading-5">
      {lines.map((line, i) => <JsonLine key={i} text={line} />)}
    </div>
  );
}

function extractEndpointPath(endpoint: string) {
  try {
    const url = new URL(endpoint);
    return url.pathname;
  } catch {
    return endpoint;
  }
}

export function WebhookEvent({
  event = "user.created",
  endpoint = "https://api.example.com/webhooks/stripe",
  method = "POST",
  status = "delivered",
  responseCode = 200,
  attempt = 1,
  maxAttempts = 3,
  latency = 124,
  signatureHeader = "Stripe-Signature",
  senderLabel = "Sender",
  verified = true,
  payload,
}: WebhookEventProps) {
  const [animated, setAnimated] = useState(false);
  const displayPayload = payload ?? DEFAULT_PAYLOAD;
  const sc = STATUS_CFG[status];
  const endpointPath = extractEndpointPath(endpoint);

  function replay() {
    setAnimated(false);
    setTimeout(() => setAnimated(true), 50);
    setTimeout(() => setAnimated(false), 1200);
  }

  const responseColor =
    responseCode < 300 ? "text-emerald-600 dark:text-emerald-400"
    : responseCode < 500 ? "text-amber-600 dark:text-amber-400"
    : "text-red-600 dark:text-red-400";

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800">
        <Webhook className="size-4 text-violet-500 shrink-0" />
        <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 shrink-0">Webhook Event</span>
        <div className="flex-1 min-w-0">
          <code className="text-sm font-mono font-semibold text-zinc-800 dark:text-zinc-100 truncate block">{event}</code>
        </div>
        <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold tracking-wide flex items-center gap-1.5", sc.badge)}>
          <span className={cn("size-1.5 rounded-full", sc.dot)} />
          {sc.label}
        </span>
        <span className="text-[10px] font-bold font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 px-1.5 py-0.5 rounded">
          {method}
        </span>
      </div>

      <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          An external service sends an HTTP POST to your endpoint when something happens.
        </p>
      </div>

      {/* Delivery flow */}
      <div className="px-4 py-4 min-h-[220px] flex flex-col justify-center gap-3">
        <div className="flex items-center gap-2">
          {/* Sender */}
          <div className="flex flex-col items-center gap-1.5 shrink-0">
            <div className="w-16 h-12 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 flex flex-col items-center justify-center gap-0.5">
              <Server className="size-4 text-zinc-500" />
              <span className="text-[9px] font-semibold text-zinc-500 truncate max-w-[60px] text-center">{senderLabel}</span>
            </div>
          </div>

          {/* Animated line */}
          <div className="flex-1 relative flex items-center">
            <div className="w-full h-px bg-zinc-200 dark:bg-zinc-700 border-t border-dashed border-zinc-300 dark:border-zinc-600" />
            <div
              className={cn(
                "absolute left-0 h-1.5 w-1.5 rounded-full bg-violet-500 transition-transform",
                animated ? "translate-x-full opacity-0 duration-[1100ms]" : "translate-x-0 opacity-100 duration-0"
              )}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-white dark:bg-zinc-900 px-2 text-[9px] font-mono text-zinc-400 border border-zinc-200 dark:border-zinc-700 rounded">
                {method} {endpointPath}
              </span>
            </div>
          </div>

          {/* Receiver */}
          <div className="flex flex-col items-center gap-1.5 shrink-0">
            <div className="w-16 h-12 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 flex flex-col items-center justify-center gap-0.5">
              <Server className="size-4 text-emerald-500" />
              <span className="text-[9px] font-semibold text-zinc-500 text-center">Your API</span>
            </div>
          </div>
        </div>

        {/* Signature row */}
        <div className="flex items-center gap-2 px-0.5">
          <div className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold",
            verified
              ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
              : "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
          )}>
            {verified
              ? <><CheckCircle2 className="size-3" /> Signature verified</>
              : <><XCircle className="size-3" /> Invalid signature</>
            }
          </div>
          {verified && (
            <span className="text-[10px] font-mono text-zinc-400">t=1716239022</span>
          )}
        </div>
      </div>

      {/* Payload section */}
      <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2">Payload</div>
        <div className="bg-zinc-950 dark:bg-zinc-950 rounded-lg border border-zinc-800 p-3 h-36 overflow-y-auto">
          <SyntaxJson obj={displayPayload} />
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-3 bg-zinc-50/50 dark:bg-zinc-900/30">
        <div className="flex items-center gap-3 text-xs text-zinc-500 flex-1">
          <span>Response:</span>
          <span className={cn("font-mono font-bold", responseColor)}>{responseCode}</span>
          {responseCode < 300 && <span className="text-zinc-400">OK</span>}
          <span className="text-zinc-300 dark:text-zinc-700">·</span>
          <span className="flex items-center gap-1 text-zinc-400">
            <Clock className="size-3" />{latency}ms
          </span>
          <span className="text-zinc-300 dark:text-zinc-700">·</span>
          <span className="font-mono">{attempt}/{maxAttempts}</span>
        </div>
        <button
          onClick={replay}
          className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5"
        >
          <RefreshCw className="size-3.5" />
          Replay Delivery
        </button>
      </div>
    </div>
  );
}
