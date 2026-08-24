"use client";

import { useState } from "react";
import { Copy, Check, Server } from "lucide-react";
import { cn } from "@/lib/utils";
import { z } from "zod";

export const ApiResponseSchema = z.object({
  status: z.number().default(200),
  statusText: z.string().optional(),
  headers: z.array(z.object({ key: z.string(), value: z.string() })).optional(),
  body: z.string().optional(),
  latency: z.number().optional(),
});

export type ApiResponseProps = z.infer<typeof ApiResponseSchema>;

const STATUS_STYLES: Record<string, string> = {
  "2": "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  "3": "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800",
  "4": "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  "5": "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
};

const STATUS_DOT: Record<string, string> = {
  "2": "bg-emerald-500",
  "3": "bg-blue-500",
  "4": "bg-amber-500",
  "5": "bg-red-500",
};

const DEFAULT_STATUS_TEXT: Record<number, string> = {
  200: "OK", 201: "Created", 204: "No Content",
  301: "Moved Permanently", 302: "Found", 304: "Not Modified",
  400: "Bad Request", 401: "Unauthorized", 403: "Forbidden",
  404: "Not Found", 409: "Conflict", 422: "Unprocessable Entity", 429: "Too Many Requests",
  500: "Internal Server Error", 502: "Bad Gateway", 503: "Service Unavailable",
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-all duration-500"
    >
      {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
    </button>
  );
}

export function ApiResponse({
  status = 200,
  statusText,
  headers,
  body,
  latency,
}: ApiResponseProps) {
  const [showBody, setShowBody] = useState(true);
  const digit = String(status)[0] ?? "2";
  const statusStyle = STATUS_STYLES[digit] ?? STATUS_STYLES["2"];
  const dot = STATUS_DOT[digit] ?? STATUS_DOT["2"];
  const resolvedText = statusText ?? DEFAULT_STATUS_TEXT[status] ?? "";

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden font-mono text-sm">
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <Server className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1 font-sans">HTTP Response</span>
        <span className={cn("size-2 rounded-full shrink-0", dot)} />
        <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold border", statusStyle)}>
          {status} <span className="font-normal opacity-80">{resolvedText}</span>
        </span>
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800 font-sans">
        The server&apos;s reply — status code, headers, and body returned after a request completes.
      </p>

      <div className="min-h-[220px] px-4 py-3 flex flex-col gap-3">
        {headers && headers.length > 0 && (
          <div className="border border-zinc-100 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 overflow-hidden">
            <div className="px-3 py-1.5 border-b border-zinc-100 dark:border-zinc-800 text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-sans">
              Response Headers ({headers.length})
            </div>
            <div className="max-h-[80px] overflow-y-auto px-3 py-2 space-y-1">
              {headers.map((h, i) => (
                <div key={i} className="flex items-center gap-3 text-xs">
                  <span className="text-violet-600 dark:text-violet-400 min-w-0 w-40 truncate">{h.key}</span>
                  <span className="text-zinc-400">:</span>
                  <span className="text-zinc-700 dark:text-zinc-300 truncate">{h.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 border border-zinc-100 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 overflow-hidden min-h-[120px]">
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-100 dark:border-zinc-800">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-sans">
              Body
            </span>
            {body && <CopyButton text={body} />}
          </div>
          <div className="min-h-[96px] max-h-[140px] overflow-y-auto">
            {body && showBody ? (
              <pre className="px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed m-0 transition-opacity duration-500">
                {body}
              </pre>
            ) : (
              <div className="px-3 py-2 text-xs text-zinc-400 font-sans">No response body</div>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/30">
        <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1 font-sans">
          {digit === "2" ? "Success" : digit === "3" ? "Redirect" : digit === "4" ? "Client error" : "Server error"}
          {latency !== undefined && ` · ${latency}ms`}
        </span>
        {body && (
          <button
            onClick={() => setShowBody((v) => !v)}
            className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-all duration-500 shrink-0"
          >
            {showBody ? "Hide Body" : "Show Body"}
          </button>
        )}
      </div>
    </div>
  );
}
