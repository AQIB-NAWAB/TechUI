"use client";

import { useState } from "react";
import { Copy, Check, Send, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import { z } from "zod";

export const ApiRequestSchema = z.object({
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]).default("GET"),
  url: z.string().default("https://api.example.com/users"),
  headers: z.array(z.object({ key: z.string(), value: z.string() })).optional(),
  body: z.string().optional(),
  description: z.string().optional(),
  interactive: z.boolean().default(false),
});

export type ApiRequestProps = z.infer<typeof ApiRequestSchema>;

const METHOD_COLORS: Record<string, string> = {
  GET: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800",
  POST: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800",
  PUT: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800",
  PATCH: "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950 border-violet-200 dark:border-violet-800",
  DELETE: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800",
  HEAD: "text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800",
  OPTIONS: "text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800",
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-all duration-500"
    >
      {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
    </button>
  );
}

export function ApiRequest({
  method = "GET",
  url = "https://api.example.com/users",
  headers,
  body,
  description,
  interactive = false,
}: ApiRequestProps) {
  const [response, setResponse] = useState<null | { status: number; body: string }>(null);
  const [sending, setSending] = useState(false);

  const methodColor = METHOD_COLORS[method] ?? METHOD_COLORS.GET;

  const parsedUrl = (() => {
    try {
      const u = new URL(url);
      return { base: u.origin + u.pathname, params: u.searchParams.toString() };
    } catch {
      return { base: url, params: "" };
    }
  })();

  const curlCommand = [
    `curl -X ${method}`,
    ...(headers?.map((h) => `-H "${h.key}: ${h.value}"`) ?? []),
    body ? `-d '${body}'` : "",
    `"${url}"`,
  ]
    .filter(Boolean)
    .join(" \\\n  ");

  async function sendRequest() {
    setSending(true);
    setResponse(null);
    await new Promise((r) => setTimeout(r, 1200));
    setResponse({ status: 200, body: JSON.stringify({ message: "OK", data: [] }, null, 2) });
    setSending(false);
  }

  const desc =
    description ??
    "An outgoing HTTP request — method, URL, headers, and optional body sent from a client to an API.";

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden font-mono text-sm">
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <Monitor className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1 font-sans">API Request</span>
        <span
          className={cn(
            "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold tracking-wider border",
            methodColor
          )}
        >
          {method}
        </span>
        <CopyButton text={curlCommand} />
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800 font-sans">
        {desc}
      </p>

      <div className="min-h-[220px] px-4 py-3 flex flex-col gap-3 font-sans">
        <div className="border border-zinc-100 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 px-3 py-2.5">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1.5">
            URL
          </div>
          <div className="flex items-center gap-1 text-zinc-800 dark:text-zinc-200 overflow-hidden text-xs font-mono">
            <span className="text-zinc-400 dark:text-zinc-600 shrink-0">
              {parsedUrl.base.match(/^https?:\/\//)?.[0] ?? ""}
            </span>
            <span className="truncate font-semibold">{parsedUrl.base.replace(/^https?:\/\//, "")}</span>
            {parsedUrl.params && (
              <span className="text-zinc-400 dark:text-zinc-500 truncate">?{parsedUrl.params}</span>
            )}
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 gap-3 min-h-0">
          {headers && headers.length > 0 && (
            <div className="border border-zinc-100 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 overflow-hidden">
              <div className="px-3 py-1.5 border-b border-zinc-100 dark:border-zinc-800 text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                Headers ({headers.length})
              </div>
              <div className="max-h-[72px] overflow-y-auto px-3 py-2 space-y-1">
                {headers.map((h, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs">
                    <span className="text-blue-600 dark:text-blue-400 min-w-0 w-36 truncate">{h.key}</span>
                    <span className="text-zinc-400">:</span>
                    <span className="text-zinc-700 dark:text-zinc-300 truncate">{h.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {body && (
            <div className="border border-zinc-100 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 overflow-hidden">
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                  Body
                </span>
                <CopyButton text={body} />
              </div>
              <pre className="max-h-[80px] overflow-y-auto px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed m-0">
                {body}
              </pre>
            </div>
          )}

          {interactive && (
            <div
              className={cn(
                "border rounded-lg overflow-hidden transition-all duration-500 min-h-[72px]",
                response
                  ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30"
                  : "border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30"
              )}
            >
              <div className="px-3 py-1.5 border-b border-zinc-100 dark:border-zinc-800 text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                Response
              </div>
              <div className="px-3 py-2 min-h-[48px]">
                {sending && (
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 font-sans animate-pulse">Sending request…</span>
                )}
                {!sending && !response && (
                  <span className="text-xs text-zinc-400 font-sans">Click Send to simulate a response</span>
                )}
                {response && (
                  <pre className="text-xs text-zinc-700 dark:text-zinc-300 overflow-x-auto leading-relaxed m-0 transition-opacity duration-500">
                    {response.body}
                  </pre>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="bg-zinc-100 dark:bg-zinc-800 rounded-md px-2.5 py-1 font-mono text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
          {curlCommand.split("\n")[0]}
        </div>
      </div>

      <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/30">
        <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1 font-sans">
          {interactive
            ? sending
              ? "Sending request…"
              : response
                ? `${response.status} OK — request completed`
                : "Ready to send — click Send to simulate"
            : "Outgoing call from client to API — method, URL, headers, body"}
        </span>
        {interactive ? (
          <button
            onClick={sendRequest}
            disabled={sending}
            className="flex items-center gap-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-all duration-500 disabled:opacity-50"
          >
            <Send className="size-3.5" />
            {sending ? "Sending…" : "Send"}
          </button>
        ) : (
          <button
            onClick={() => navigator.clipboard.writeText(curlCommand)}
            className="flex items-center gap-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-all duration-500"
          >
            <Copy className="size-3.5" />
            Copy cURL
          </button>
        )}
      </div>
    </div>
  );
}
