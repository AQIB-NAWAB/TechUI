"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Copy, Check, Send } from "lucide-react";
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
  GET: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900",
  POST: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-900",
  PUT: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-900",
  PATCH: "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/50 border-violet-200 dark:border-violet-900",
  DELETE: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-900",
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
      className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
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
  const [showHeaders, setShowHeaders] = useState(false);
  const [showBody, setShowBody] = useState(false);
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
    await new Promise((r) => setTimeout(r, 1200));
    setResponse({ status: 200, body: JSON.stringify({ message: "OK", data: [] }, null, 2) });
    setSending(false);
  }

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden font-mono text-sm">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/50">
        <span
          className={cn(
            "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold tracking-wider border",
            methodColor
          )}
        >
          {method}
        </span>
        <div className="flex-1 min-w-0 flex items-center gap-1 text-zinc-800 dark:text-zinc-200 overflow-hidden">
          <span className="text-zinc-400 dark:text-zinc-600 shrink-0">{parsedUrl.base.match(/^https?:\/\//)?.[0] ?? ""}</span>
          <span className="truncate font-semibold">{parsedUrl.base.replace(/^https?:\/\//, "")}</span>
          {parsedUrl.params && (
            <span className="text-zinc-400 dark:text-zinc-500 truncate">?{parsedUrl.params}</span>
          )}
        </div>
        <CopyButton text={curlCommand} />
        {interactive && (
          <button
            onClick={sendRequest}
            disabled={sending}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-medium hover:bg-zinc-700 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50"
          >
            <Send className="size-3" />
            {sending ? "Sending…" : "Send"}
          </button>
        )}
      </div>

      {description && (
        <div className="px-4 py-2 text-xs text-zinc-500 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-900 font-sans">
          {description}
        </div>
      )}

      {/* Headers */}
      {headers && headers.length > 0 && (
        <div className="border-b border-zinc-100 dark:border-zinc-900">
          <button
            className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
            onClick={() => setShowHeaders((v) => !v)}
          >
            {showHeaders ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
            <span className="font-sans font-medium">Headers</span>
            <span className="ml-auto text-zinc-400">{headers.length}</span>
          </button>
          {showHeaders && (
            <div className="px-4 pb-3 space-y-1">
              {headers.map((h, i) => (
                <div key={i} className="flex items-center gap-3 text-xs">
                  <span className="text-blue-600 dark:text-blue-400 min-w-0 w-40 truncate">{h.key}</span>
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
        <div className="border-b border-zinc-100 dark:border-zinc-900">
          <button
            className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
            onClick={() => setShowBody((v) => !v)}
          >
            {showBody ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
            <span className="font-sans font-medium">Body</span>
            <span className="ml-auto text-zinc-400">JSON</span>
          </button>
          {showBody && (
            <div className="relative">
              <pre className="px-4 pb-4 text-xs text-zinc-700 dark:text-zinc-300 overflow-x-auto leading-relaxed">
                {body}
              </pre>
              <div className="absolute top-1 right-3">
                <CopyButton text={body} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Response (interactive mode) */}
      {interactive && response && (
        <div className="border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/30">
          <div className="flex items-center gap-2 px-4 py-2.5 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            <span className="font-sans font-medium">Response</span>
            <span className="ml-auto text-emerald-600 dark:text-emerald-400 font-semibold">{response.status} OK</span>
          </div>
          <pre className="px-4 pb-4 text-xs text-zinc-700 dark:text-zinc-300 overflow-x-auto leading-relaxed">
            {response.body}
          </pre>
        </div>
      )}

      {/* curl footer */}
      <div className="px-4 py-2 bg-zinc-50 dark:bg-zinc-900/40 border-t border-zinc-100 dark:border-zinc-900">
        <div className="flex items-start gap-2">
          <span className="text-[10px] text-zinc-400 mt-0.5 font-sans shrink-0">curl</span>
          <code className="text-[11px] text-zinc-500 dark:text-zinc-500 truncate">{curlCommand.split("\n")[0]}</code>
        </div>
      </div>
    </div>
  );
}
