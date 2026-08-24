"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { z } from "zod";
import { CheckCircle } from "lucide-react";

export const StatusCodeSchema = z.object({
  code: z.number().default(200),
  showText: z.boolean().default(true),
  size: z.enum(["sm", "md", "lg"]).default("md"),
});

export type StatusCodeProps = z.infer<typeof StatusCodeSchema>;

const STATUS_MAP: Record<number, { text: string; range: "2xx" | "3xx" | "4xx" | "5xx" | "1xx"; meaning: string }> = {
  100: { text: "Continue", range: "1xx", meaning: "Server received the request headers — client can continue sending the body." },
  101: { text: "Switching Protocols", range: "1xx", meaning: "Server agrees to switch protocols (e.g. HTTP → WebSocket)." },
  200: { text: "OK", range: "2xx", meaning: "Request succeeded — the response body contains the result." },
  201: { text: "Created", range: "2xx", meaning: "A new resource was created successfully." },
  202: { text: "Accepted", range: "2xx", meaning: "Request accepted for processing, but not yet complete." },
  204: { text: "No Content", range: "2xx", meaning: "Success with no body — common for DELETE requests." },
  206: { text: "Partial Content", range: "2xx", meaning: "Partial content delivered — used for range/resume downloads." },
  301: { text: "Moved Permanently", range: "3xx", meaning: "Resource permanently moved — update bookmarks to the new URL." },
  302: { text: "Found", range: "3xx", meaning: "Temporary redirect — client should follow the Location header." },
  304: { text: "Not Modified", range: "3xx", meaning: "Cached version is still valid — no body sent." },
  307: { text: "Temporary Redirect", range: "3xx", meaning: "Temporary redirect that preserves the HTTP method." },
  308: { text: "Permanent Redirect", range: "3xx", meaning: "Permanent redirect that preserves the HTTP method." },
  400: { text: "Bad Request", range: "4xx", meaning: "Malformed request — check syntax, headers, or body." },
  401: { text: "Unauthorized", range: "4xx", meaning: "Authentication required — missing or invalid credentials." },
  403: { text: "Forbidden", range: "4xx", meaning: "Authenticated but not allowed to access this resource." },
  404: { text: "Not Found", range: "4xx", meaning: "Resource does not exist at this URL." },
  405: { text: "Method Not Allowed", range: "4xx", meaning: "HTTP method not supported for this endpoint." },
  409: { text: "Conflict", range: "4xx", meaning: "Request conflicts with current state (e.g. duplicate email)." },
  410: { text: "Gone", range: "4xx", meaning: "Resource existed but was permanently removed." },
  422: { text: "Unprocessable Entity", range: "4xx", meaning: "Valid JSON but semantic errors in the data." },
  429: { text: "Too Many Requests", range: "4xx", meaning: "Rate limit exceeded — slow down and retry later." },
  500: { text: "Internal Server Error", range: "5xx", meaning: "Unexpected server failure — not the client's fault." },
  501: { text: "Not Implemented", range: "5xx", meaning: "Server does not support this feature yet." },
  502: { text: "Bad Gateway", range: "5xx", meaning: "Upstream server returned an invalid response." },
  503: { text: "Service Unavailable", range: "5xx", meaning: "Server temporarily overloaded or down for maintenance." },
  504: { text: "Gateway Timeout", range: "5xx", meaning: "Upstream server did not respond in time." },
};

const DEMO_CODES = [200, 201, 301, 400, 401, 404, 429, 500, 503];

const RANGE_STYLES = {
  "1xx": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700",
  "2xx": "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  "3xx": "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  "4xx": "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  "5xx": "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
};

const SIZE_STYLES = {
  sm: "px-2 py-0.5 text-[11px] gap-1.5",
  md: "px-2.5 py-1 text-xs gap-2",
  lg: "px-3 py-1.5 text-sm gap-2.5",
};

export function StatusCode({ code = 200, showText = true, size = "md" }: StatusCodeProps) {
  const [activeCode, setActiveCode] = useState(code);

  const digit = String(activeCode)[0] ?? "2";
  const range = (`${digit}xx` as keyof typeof RANGE_STYLES) in RANGE_STYLES
    ? (`${digit}xx` as keyof typeof RANGE_STYLES)
    : "2xx";
  const info = STATUS_MAP[activeCode];
  const text = info?.text ?? "Unknown";

  function nextCode() {
    const idx = DEMO_CODES.indexOf(activeCode);
    const next = DEMO_CODES[(idx + 1) % DEMO_CODES.length] ?? 200;
    setActiveCode(next);
  }

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <CheckCircle className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">HTTP Status Code</span>
        <span
          className={cn(
            "inline-flex items-center rounded-md border font-mono font-semibold transition-all duration-500",
            RANGE_STYLES[range],
            SIZE_STYLES[size]
          )}
        >
          <span>{activeCode}</span>
          {showText && info && (
            <span className="font-normal opacity-75 font-sans">{text}</span>
          )}
        </span>
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        Three-digit codes that tell the client whether a request succeeded, failed, or needs a redirect.
      </p>

      <div className="min-h-[220px] px-4 py-6 flex flex-col items-center justify-center gap-4 transition-all duration-500">
        <div
          className={cn(
            "flex flex-col items-center justify-center rounded-2xl border-2 px-8 py-6 transition-all duration-700",
            RANGE_STYLES[range]
          )}
        >
          <span className="text-5xl font-bold font-mono tabular-nums">{activeCode}</span>
          <span className="text-lg font-semibold mt-1 font-sans">{text}</span>
          <span className="text-xs font-mono uppercase tracking-widest mt-2 opacity-60">{range}</span>
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 text-center max-w-sm min-h-[40px] transition-opacity duration-500">
          {info?.meaning ?? "Unknown status code."}
        </p>
        <div className="flex flex-wrap justify-center gap-2 pt-1">
          {(["2xx", "3xx", "4xx", "5xx"] as const).map((r) => (
            <span
              key={r}
              className={cn(
                "text-[10px] font-mono px-2 py-0.5 rounded-md border transition-all duration-500",
                range === r ? RANGE_STYLES[r] : "border-zinc-200 dark:border-zinc-700 text-zinc-400 opacity-50"
              )}
            >
              {r === "2xx" ? "2xx Success" : r === "3xx" ? "3xx Redirect" : r === "4xx" ? "4xx Client error" : "5xx Server error"}
            </span>
          ))}
        </div>
      </div>

      <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/30">
        <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">
          {activeCode} {text} — {digit === "2" ? "success" : digit === "3" ? "redirect" : digit === "4" ? "client error" : digit === "5" ? "server error" : "informational"}
        </span>
        <button
          onClick={nextCode}
          className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-all duration-500"
        >
          Next Code
        </button>
      </div>
    </div>
  );
}
