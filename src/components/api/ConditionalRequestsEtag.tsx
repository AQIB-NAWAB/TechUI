"use client";

import { useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { FileJson, RefreshCw, Monitor, Server } from "lucide-react";

export const ConditionalRequestsEtagSchema = z.object({
  name: z.string().optional().default("Conditional Requests (ETag)"),
  resourcePath: z.string().optional().default("/api/users/42"),
  interactive: z.boolean().optional().default(true),
});

export type ConditionalRequestsEtagProps = z.infer<typeof ConditionalRequestsEtagSchema>;

type FetchResult = "idle" | "200" | "304";

const RESOURCES = [
  { etag: '"abc123"', body: '{ "id": 42, "name": "Alice", "role": "admin" }' },
  { etag: '"def456"', body: '{ "id": 42, "name": "Alice", "role": "editor" }' },
  { etag: '"ghi789"', body: '{ "id": 42, "name": "Alice Chen", "role": "editor" }' },
];

export function ConditionalRequestsEtag({
  name = "Conditional Requests (ETag)",
  resourcePath = "/api/users/42",
  interactive = true,
}: ConditionalRequestsEtagProps) {
  const [serverVersion, setServerVersion] = useState(0);
  const [cachedEtag, setCachedEtag] = useState<string | null>(null);
  const [cachedBody, setCachedBody] = useState<string | null>(null);
  const [result, setResult] = useState<FetchResult>("idle");
  const [flash, setFlash] = useState<"hit" | "miss" | null>(null);

  const server = RESOURCES[serverVersion % RESOURCES.length];

  function reset() {
    setCachedEtag(null);
    setCachedBody(null);
    setResult("idle");
    setFlash(null);
    setServerVersion(0);
  }

  function fetchResource() {
    const matched = cachedEtag !== null && cachedEtag === server.etag;

    if (matched) {
      setResult("304");
      setFlash("hit");
    } else {
      setResult("200");
      setCachedEtag(server.etag);
      setCachedBody(server.body);
      setFlash("miss");
    }
    setTimeout(() => setFlash(null), 1000);
  }

  function updateResource() {
    setServerVersion((v) => v + 1);
    setResult("idle");
  }

  const statusText =
    result === "304"
      ? "304 Not Modified — server skipped the body. Your cache is still valid."
      : result === "200"
      ? "200 OK — resource changed or first fetch. Body downloaded and cached."
      : cachedEtag
      ? `Client cache holds ETag ${cachedEtag}. Send a conditional GET to avoid re-downloading.`
      : "No cache yet. First GET downloads the full resource and stores its ETag.";

  const requestHeaders =
    cachedEtag !== null
      ? [{ key: "If-None-Match", value: cachedEtag, highlight: true }]
      : [{ key: "(none)", value: "First request — no conditional header", highlight: false }];

  const responseHeaders =
    result === "304"
      ? [
          { key: "ETag", value: server.etag },
          { key: "Cache-Control", value: "private, max-age=0" },
        ]
      : result === "200"
      ? [
          { key: "ETag", value: server.etag, highlight: true },
          { key: "Content-Type", value: "application/json" },
        ]
      : [];

  return (
    <div
      className={cn(
        "rounded-xl border bg-white dark:bg-zinc-900 overflow-hidden transition-all duration-500",
        flash === "hit" ? "border-emerald-300 dark:border-emerald-800" : flash === "miss" ? "border-blue-300 dark:border-blue-800" : "border-zinc-200 dark:border-zinc-800"
      )}
    >
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <FileJson className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">{name}</span>
        <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded truncate max-w-[140px]">
          {resourcePath}
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
        Send If-None-Match with your cached ETag — get 304 when nothing changed, skip the download.
      </div>

      <div className="p-4 min-h-[220px] grid grid-cols-2 gap-3">
        {/* Client panel */}
        <div className="rounded-lg border border-zinc-100 dark:border-zinc-800 overflow-hidden flex flex-col">
          <div className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/30 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-1.5">
            <Monitor className="size-3 text-blue-500" />
            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide">Client Cache</span>
          </div>
          <div className="p-3 flex-1 space-y-2">
            <div className="text-[10px] text-zinc-400">Cached ETag</div>
            <div className="bg-zinc-100 dark:bg-zinc-800 rounded-md px-2.5 py-1 font-mono text-xs text-zinc-700 dark:text-zinc-300 min-h-[28px] flex items-center">
              {cachedEtag ?? "—"}
            </div>
            <div className="text-[10px] text-zinc-400 mt-2">Cached body</div>
            <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-100 dark:border-zinc-800 p-2 font-mono text-[10px] text-zinc-600 dark:text-zinc-400 min-h-[56px] overflow-hidden">
              {cachedBody ?? "Empty — fetch to populate"}
            </div>
          </div>
        </div>

        {/* Server panel */}
        <div className="rounded-lg border border-zinc-100 dark:border-zinc-800 overflow-hidden flex flex-col">
          <div className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-1.5">
            <Server className="size-3 text-emerald-500" />
            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide">Server</span>
          </div>
          <div className="p-3 flex-1 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="text-[10px] text-zinc-400">Current ETag</div>
              {interactive && (
                <button
                  type="button"
                  onClick={updateResource}
                  className="text-[10px] px-2 py-0.5 rounded-md font-semibold border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-500"
                >
                  Change data
                </button>
              )}
            </div>
            <div className="bg-zinc-100 dark:bg-zinc-800 rounded-md px-2.5 py-1 font-mono text-xs text-emerald-700 dark:text-emerald-400">
              {server.etag}
            </div>
            <div className="text-[10px] text-zinc-400 mt-2">Live body</div>
            <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-100 dark:border-zinc-800 p-2 font-mono text-[10px] text-zinc-600 dark:text-zinc-400 min-h-[56px] overflow-hidden">
              {server.body}
            </div>
          </div>
        </div>

        {/* Request / response strip — fixed height slot */}
        <div className="col-span-2 min-h-[100px]">
          {(result !== "idle" || cachedEtag) ? (
          <div className="rounded-lg border border-zinc-100 dark:border-zinc-800 overflow-hidden">
            <div className="px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
              <span
                className={cn(
                  "text-xs font-bold font-mono px-2 py-0.5 rounded transition-all duration-500",
                  result === "304"
                    ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
                    : result === "200"
                    ? "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                )}
              >
                {result === "304" ? "304 Not Modified" : result === "200" ? "200 OK" : "GET " + resourcePath}
              </span>
              {result === "304" && (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">0 bytes transferred</span>
              )}
            </div>
            <div className="grid grid-cols-2 divide-x divide-zinc-100 dark:divide-zinc-800">
              <div className="p-2 space-y-1">
                <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide px-1">Request</div>
                {requestHeaders.map((h) => (
                  <div
                    key={h.key}
                    className={cn(
                      "flex gap-1.5 px-2 py-1 text-[10px] font-mono rounded transition-all duration-500",
                      h.highlight && "bg-violet-50 dark:bg-violet-950/30"
                    )}
                  >
                    <span className="text-violet-600 dark:text-violet-400 shrink-0">{h.key}:</span>
                    <span className="text-zinc-600 dark:text-zinc-400 truncate">{h.value}</span>
                  </div>
                ))}
              </div>
              <div className="p-2 space-y-1">
                <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide px-1">Response</div>
                {responseHeaders.length === 0 ? (
                  <div className="px-2 py-1 text-[10px] text-zinc-400">—</div>
                ) : (
                  responseHeaders.map((h) => (
                    <div
                      key={h.key}
                      className={cn(
                        "flex gap-1.5 px-2 py-1 text-[10px] font-mono rounded transition-all duration-500",
                        h.highlight && "bg-emerald-50 dark:bg-emerald-950/30"
                      )}
                    >
                      <span className="text-emerald-600 dark:text-emerald-400 shrink-0">{h.key}:</span>
                      <span className="text-zinc-600 dark:text-zinc-400 truncate">{h.value}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          ) : (
            <div className="rounded-lg border border-dashed border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 p-3 flex items-center justify-center min-h-[100px]">
              <span className="text-[10px] text-zinc-400">Fetch to see request/response headers</span>
            </div>
          )}
        </div>
      </div>

      {interactive && (
        <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/30 min-h-[52px]">
          <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">{statusText}</span>
          <button
            type="button"
            onClick={fetchResource}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 transition-all duration-500 shrink-0"
          >
            Fetch Resource
          </button>
        </div>
      )}
    </div>
  );
}
