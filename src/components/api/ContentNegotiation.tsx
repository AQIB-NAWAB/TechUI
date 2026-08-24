"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Monitor, Server, ArrowRight, RefreshCw } from "lucide-react";

export const ContentNegotiationSchema = z.object({
  endpoint: z.string().optional().default("/api/users/42"),
  defaultAcceptOrder: z.array(z.enum(["json", "xml", "html"])).optional().default(["json", "xml", "html"]),
  interactive: z.boolean().optional().default(true),
});

export type ContentNegotiationProps = z.infer<typeof ContentNegotiationSchema>;

type Format = "json" | "xml" | "html";

const ACCEPT_HEADERS: Record<Format, string> = {
  json: "application/json",
  xml: "application/xml",
  html: "text/html",
};

const RESPONSES: Record<Format, string> = {
  json: '{ "id": 42, "name": "Alice" }',
  xml: "<user><id>42</id><name>Alice</name></user>",
  html: "<h1>Alice</h1><p>User #42</p>",
};

const SERVER_SUPPORTS: Format[] = ["json", "xml", "html"];

function pickFormat(accept: Format[]): Format {
  for (const fmt of accept) {
    if (SERVER_SUPPORTS.includes(fmt)) return fmt;
  }
  return "json";
}

export function ContentNegotiation({
  endpoint = "/api/users/42",
  defaultAcceptOrder = ["json", "xml", "html"],
  interactive = true,
}: ContentNegotiationProps) {
  const [acceptOrder, setAcceptOrder] = useState<Format[]>(defaultAcceptOrder);
  const [sent, setSent] = useState(false);
  const [selected, setSelected] = useState<Format | null>(null);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    setAcceptOrder(defaultAcceptOrder);
    setSent(false);
    setSelected(null);
    setAnimating(false);
  }, [defaultAcceptOrder, endpoint]);

  const negotiated = pickFormat(acceptOrder);

  function moveFormat(fmt: Format, dir: -1 | 1) {
    setAcceptOrder((order) => {
      const idx = order.indexOf(fmt);
      const next = idx + dir;
      if (next < 0 || next >= order.length) return order;
      const copy = [...order];
      [copy[idx], copy[next]] = [copy[next], copy[idx]];
      return copy;
    });
    setSent(false);
    setSelected(null);
  }

  function sendRequest() {
    if (animating) return;
    setAnimating(true);
    setSent(false);
    setSelected(null);
    setTimeout(() => {
      setSent(true);
      setSelected(negotiated);
      setAnimating(false);
    }, 1000);
  }

  function reset() {
    setAcceptOrder(defaultAcceptOrder);
    setSent(false);
    setSelected(null);
    setAnimating(false);
  }

  const acceptHeader = acceptOrder.map((f) => ACCEPT_HEADERS[f]).join(", ");

  const statusText = animating
    ? "Server reading Accept header and picking best match…"
    : sent && selected
    ? `Server chose ${ACCEPT_HEADERS[selected]} — highest preferred format it supports.`
    : "Reorder Accept preferences, then send — server returns the best matching format.";

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <style>{`
        @keyframes travel {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `}</style>
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <Server className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">Content Negotiation</span>
        <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded truncate max-w-[140px]">
          GET {endpoint}
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
          The client lists preferred formats in Accept — the server picks the best match it can return.
        </div>

        <div className="min-h-[220px] p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 shrink-0">
              <Monitor className="size-4 text-zinc-400" />
              <span className="text-[10px] font-semibold text-zinc-500">Client</span>
            </div>
            <div className="flex-1 relative h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              {animating && (
                <span
                  className="absolute top-1/2 -translate-y-1/2 size-2 rounded-full bg-blue-500"
                  style={{ animation: "travel 1s ease-in-out forwards" }}
                />
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Server className="size-4 text-zinc-400" />
              <span className="text-[10px] font-semibold text-zinc-500">Server</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30 p-3">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2">
                Accept (priority order)
              </div>
              <div className="space-y-1.5">
                {acceptOrder.map((fmt, i) => (
                  <div
                    key={fmt}
                    className={cn(
                      "flex items-center gap-2 rounded-md border px-2 py-1.5 text-xs transition-all duration-500",
                      i === 0
                        ? "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20"
                        : "border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                    )}
                  >
                    <span className="font-mono font-bold text-zinc-500 w-4">{i + 1}</span>
                    <span className="font-mono text-zinc-700 dark:text-zinc-300 flex-1 truncate">{ACCEPT_HEADERS[fmt]}</span>
                    {interactive && (
                      <div className="flex gap-0.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => moveFormat(fmt, -1)}
                          disabled={i === 0}
                          className="text-[10px] px-1 rounded text-zinc-400 hover:text-zinc-600 disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveFormat(fmt, 1)}
                          disabled={i === acceptOrder.length - 1}
                          className="text-[10px] px-1 rounded text-zinc-400 hover:text-zinc-600 disabled:opacity-30"
                        >
                          ↓
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30 p-3 flex flex-col">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2">
                Response
              </div>
              <div className="flex-1 min-h-[100px] flex flex-col justify-center">
                {!sent ? (
                  <div className="text-xs text-zinc-400 text-center">Waiting for request…</div>
                ) : (
                  <div className="space-y-2 transition-all duration-500">
                    <div
                      className={cn(
                        "text-[10px] font-semibold px-2 py-0.5 rounded w-fit transition-all duration-500",
                        "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                      )}
                    >
                      Content-Type: {selected ? ACCEPT_HEADERS[selected] : ""}
                    </div>
                    <pre className="text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800 rounded-md px-2.5 py-2 overflow-x-auto text-zinc-700 dark:text-zinc-300">
                      {selected ? RESPONSES[selected] : ""}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-zinc-100 dark:bg-zinc-800 rounded-md px-2.5 py-1.5 font-mono text-[10px] text-zinc-600 dark:text-zinc-400 truncate">
            Accept: {acceptHeader}
          </div>
        </div>

        {interactive && (
          <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/30 min-h-[52px]">
            <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">{statusText}</span>
            <button
              type="button"
              onClick={sendRequest}
              disabled={animating}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-500 hover:opacity-90",
                animating
                  ? "bg-blue-500 text-white opacity-80"
                  : "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
              )}
            >
              {animating ? "Negotiating…" : "Send Request"}
              {!animating && <ArrowRight className="size-3.5" />}
            </button>
          </div>
        )}
    </div>
  );
}
