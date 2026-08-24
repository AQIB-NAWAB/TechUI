"use client";

import { useState, useMemo } from "react";
import { z } from "zod";
import { FileText, Check, AlertTriangle, X, Monitor, Server, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const OpenApiSpecSchema = z.object({
  title: z.string().default("FreshMarket API"),
  version: z.string().default("2.0.0"),
  baseUrl: z.string().optional().default("https://api.freshmarket.com"),
  endpoints: z
    .array(
      z.object({
        method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]),
        path: z.string(),
        summary: z.string(),
        tag: z.string().optional(),
        requestBody: z
          .object({
            contentType: z.string(),
            example: z.record(z.string(), z.unknown()),
          })
          .optional(),
        responses: z.array(
          z.object({
            code: z.number(),
            description: z.string(),
          })
        ),
      })
    )
    .default([
      {
        method: "GET",
        path: "/products",
        summary: "List all products",
        tag: "Products",
        responses: [
          { code: 200, description: "Array of products" },
          { code: 401, description: "Not authenticated" },
        ],
      },
      {
        method: "POST",
        path: "/products",
        summary: "Create a product",
        tag: "Products",
        requestBody: {
          contentType: "application/json",
          example: { name: "Apple", price: 1.99, unit: "kg" },
        },
        responses: [
          { code: 201, description: "Product created" },
          { code: 400, description: "Validation error" },
        ],
      },
      {
        method: "GET",
        path: "/orders/:id",
        summary: "Get order by ID",
        tag: "Orders",
        responses: [
          { code: 200, description: "Order object" },
          { code: 404, description: "Order not found" },
        ],
      },
    ]),
});

export type OpenApiSpecProps = z.infer<typeof OpenApiSpecSchema>;

const METHOD_STYLES: Record<string, string> = {
  GET: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  POST: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  PUT: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  DELETE: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  PATCH: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
};

function getResponseColor(code: number) {
  if (code >= 200 && code < 300) return "text-emerald-600 dark:text-emerald-400";
  if (code >= 400 && code < 500) return "text-amber-600 dark:text-amber-400";
  if (code >= 500) return "text-red-600 dark:text-red-400";
  return "text-zinc-500 dark:text-zinc-400";
}

function getResponseIcon(code: number) {
  if (code >= 200 && code < 300) return <Check className="size-3" />;
  if (code >= 400 && code < 500) return <AlertTriangle className="size-3" />;
  if (code >= 500) return <X className="size-3" />;
  return null;
}

type Endpoint = OpenApiSpecProps["endpoints"][number];

export function OpenApiSpec({
  title = "FreshMarket API",
  version = "2.0.0",
  baseUrl = "https://api.freshmarket.com",
  endpoints = [],
}: OpenApiSpecProps) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [phase, setPhase] = useState<"idle" | "sending" | "done">("idle");
  const [responseCode, setResponseCode] = useState<number | null>(null);

  const selected = endpoints[selectedIdx] ?? endpoints[0];
  const displayBaseUrl = baseUrl ? baseUrl.replace(/^https?:\/\//, "") : "";

  const groups = useMemo(() => {
    const map = new Map<string, Endpoint[]>();
    endpoints.forEach((ep) => {
      const tag = ep.tag ?? "Other";
      if (!map.has(tag)) map.set(tag, []);
      map.get(tag)!.push(ep);
    });
    return map;
  }, [endpoints]);

  function endpointKey(ep: Endpoint) {
    return `${ep.method}:${ep.path}`;
  }

  function tryEndpoint() {
    if (phase === "sending" || !selected) return;
    setPhase("sending");
    setResponseCode(null);
    setTimeout(() => {
      const success = selected.responses.find((r) => r.code >= 200 && r.code < 300);
      setResponseCode(success?.code ?? selected.responses[0]?.code ?? 200);
      setPhase("done");
    }, 1200);
  }

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-2 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800">
        <FileText className="size-4 text-zinc-500 dark:text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex-1">OpenAPI Spec</span>
        <span className="text-xs text-zinc-500 font-medium">
          {title} <span className="font-mono text-zinc-400">v{version}</span>
        </span>
      </div>

      <div className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        A machine-readable contract describing every endpoint, request, and response.
      </div>

      <div className="min-h-[220px] flex flex-col">
        <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800 flex flex-wrap gap-1 max-h-[100px] overflow-y-auto">
          {Array.from(groups.entries()).flatMap(([, tagEndpoints]) =>
            tagEndpoints.map((ep) => {
              const idx = endpoints.indexOf(ep);
              const isSelected = idx === selectedIdx;
              return (
                <button
                  key={endpointKey(ep)}
                  onClick={() => { setSelectedIdx(idx); setPhase("idle"); setResponseCode(null); }}
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-mono transition-all duration-500",
                    isSelected
                      ? "border-zinc-900 dark:border-white bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                      : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400"
                  )}
                >
                  <span className={cn("px-1 rounded font-bold", isSelected ? "bg-white/20 dark:bg-zinc-900/20" : METHOD_STYLES[ep.method])}>
                    {ep.method}
                  </span>
                  {ep.path}
                </button>
              );
            })
          )}
        </div>

        {selected && (
          <div className="flex-1 px-4 py-4 flex flex-col justify-center gap-3">
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center gap-1">
                <Monitor className="size-5 text-blue-500" />
                <span className="text-[9px] text-zinc-400">Client</span>
              </div>
              <div className="flex-1 relative h-6 flex items-center">
                <div className={cn(
                  "absolute inset-y-1/2 h-0.5 transition-all duration-700 origin-left",
                  phase !== "idle" ? "w-full bg-blue-400" : "w-0 bg-zinc-200"
                )} />
                {phase === "sending" && (
                  <div className="absolute top-1/2 -translate-y-1/2 size-2 rounded-full bg-blue-500 animate-pulse" style={{ left: "50%" }} />
                )}
                <ArrowRight className={cn("absolute right-0 size-3.5 transition-all duration-500", phase === "done" ? "text-emerald-500" : "text-zinc-300")} />
              </div>
              <div className="flex flex-col items-center gap-1">
                <Server className={cn("size-5 transition-colors duration-500", phase === "done" ? "text-emerald-500" : "text-zinc-400")} />
                <span className="text-[9px] text-zinc-400">Server</span>
              </div>
            </div>

            <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/40 p-3 space-y-2">
              <div className="font-mono text-xs">
                <span className={cn("px-1.5 py-0.5 rounded font-bold mr-2", METHOD_STYLES[selected.method])}>{selected.method}</span>
                <span className="text-zinc-600 dark:text-zinc-300">{displayBaseUrl}{selected.path}</span>
              </div>
              <p className="text-xs text-zinc-500">{selected.summary}</p>
              {selected.requestBody && (
                <pre className="font-mono text-[10px] text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900 rounded px-2 py-1.5 overflow-x-auto">
                  {JSON.stringify(selected.requestBody.example, null, 2)}
                </pre>
              )}
            </div>

            <div className="min-h-[72px] rounded-lg border border-zinc-200 dark:border-zinc-700 p-3 transition-all duration-500">
              {phase === "idle" && (
                <p className="text-xs text-zinc-400 text-center py-2">Click Try Endpoint to simulate the request</p>
              )}
              {phase === "sending" && (
                <p className="text-xs text-blue-600 dark:text-blue-400 text-center py-2 animate-pulse">Sending request…</p>
              )}
              {phase === "done" && responseCode !== null && (
                <div className="space-y-1 transition-all duration-500">
                  {selected.responses.map((r) => (
                    <div
                      key={r.code}
                      className={cn(
                        "flex items-center gap-2 text-xs transition-all duration-500",
                        r.code === responseCode ? "opacity-100" : "opacity-40"
                      )}
                    >
                      <span className={cn("flex items-center gap-1 font-mono font-bold", getResponseColor(r.code))}>
                        {getResponseIcon(r.code)}
                        {r.code}
                      </span>
                      <span className="text-zinc-500">{r.description}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/30 min-h-[52px]">
        <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">
          {phase === "done" && responseCode
            ? `Response: ${responseCode} — ${selected?.responses.find((r) => r.code === responseCode)?.description ?? "OK"}`
            : selected
            ? `${selected.method} ${selected.path}`
            : "Select an endpoint"}
        </span>
        <button
          onClick={tryEndpoint}
          disabled={phase === "sending" || !selected}
          className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-all duration-500 disabled:opacity-50"
        >
          Try Endpoint
        </button>
      </div>
    </div>
  );
}
