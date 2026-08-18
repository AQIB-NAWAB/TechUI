"use client";

import { useState } from "react";
import { Copy, Check, ChevronDown, ChevronRight } from "lucide-react";
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
  "2": "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-900",
  "3": "text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-900",
  "4": "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-900",
  "5": "text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-900",
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
      className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
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
  const [showHeaders, setShowHeaders] = useState(false);
  const digit = String(status)[0] ?? "2";
  const statusStyle = STATUS_STYLES[digit] ?? STATUS_STYLES["2"];
  const dot = STATUS_DOT[digit] ?? STATUS_DOT["2"];
  const resolvedText = statusText ?? DEFAULT_STATUS_TEXT[status] ?? "";

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden font-mono text-sm">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/50">
        <span className={cn("size-2 rounded-full shrink-0", dot)} />
        <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold border", statusStyle)}>
          {status} <span className="font-normal opacity-80">{resolvedText}</span>
        </span>
        <span className="flex-1 text-xs font-sans text-zinc-400">HTTP Response</span>
        {latency !== undefined && (
          <span className="text-xs font-sans text-zinc-400">{latency}ms</span>
        )}
        {body && <CopyButton text={body} />}
      </div>

      {/* Headers */}
      {headers && headers.length > 0 && (
        <div className="border-b border-zinc-100 dark:border-zinc-900">
          <button
            className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
            onClick={() => setShowHeaders((v) => !v)}
          >
            {showHeaders ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
            <span className="font-sans font-medium">Response Headers</span>
            <span className="ml-auto text-zinc-400">{headers.length}</span>
          </button>
          {showHeaders && (
            <div className="px-4 pb-3 space-y-1">
              {headers.map((h, i) => (
                <div key={i} className="flex items-center gap-3 text-xs">
                  <span className="text-violet-600 dark:text-violet-400 min-w-0 w-44 truncate">{h.key}</span>
                  <span className="text-zinc-400">:</span>
                  <span className="text-zinc-700 dark:text-zinc-300 truncate">{h.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Body */}
      {body && (
        <div className="relative">
          <pre className="px-4 py-4 text-xs text-zinc-700 dark:text-zinc-300 overflow-x-auto leading-relaxed max-h-72">
            {body}
          </pre>
        </div>
      )}
    </div>
  );
}
