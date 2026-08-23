"use client";

import { useState, useMemo } from "react";
import { z } from "zod";
import { FileText, ChevronDown, ChevronRight, Check, AlertTriangle, X } from "lucide-react";
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
          { code: 401, description: "Not authenticated" },
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
      {
        method: "POST",
        path: "/orders",
        summary: "Place an order",
        tag: "Orders",
        requestBody: {
          contentType: "application/json",
          example: { cartId: "cart_abc", paymentIntentId: "pi_xyz" },
        },
        responses: [
          { code: 201, description: "Order created" },
          { code: 402, description: "Payment failed" },
        ],
      },
      {
        method: "DELETE",
        path: "/products/:id",
        summary: "Delete a product",
        tag: "Products",
        responses: [
          { code: 204, description: "Deleted" },
          { code: 404, description: "Not found" },
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

function EndpointRow({
  endpoint,
  isExpanded,
  onToggle,
}: {
  endpoint: Endpoint;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const methodStyle = METHOD_STYLES[endpoint.method] ?? METHOD_STYLES.GET;

  return (
    <div>
      {/* Row */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors text-left"
      >
        <span
          className={cn(
            "inline-block text-[10px] font-bold font-mono px-1.5 py-0.5 rounded shrink-0 w-14 text-center",
            methodStyle
          )}
        >
          {endpoint.method}
        </span>
        <span className="font-mono text-xs text-zinc-700 dark:text-zinc-300 flex-1 truncate">
          {endpoint.path}
        </span>
        <span className="text-xs text-zinc-400 dark:text-zinc-500 truncate hidden sm:block max-w-[160px]">
          {endpoint.summary}
        </span>
        <span className="shrink-0 text-zinc-400">
          {isExpanded ? (
            <ChevronDown className="size-3.5" />
          ) : (
            <ChevronRight className="size-3.5" />
          )}
        </span>
      </button>

      {/* Expanded detail */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-500",
          isExpanded ? "max-h-[500px]" : "max-h-0"
        )}
      >
        <div className="mx-3 mb-2 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 text-xs">
          {/* Summary line */}
          <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-medium">
            {endpoint.summary}
          </div>

          {/* Request body */}
          {endpoint.requestBody && (
            <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800">
              <div className="text-zinc-500 dark:text-zinc-400 mb-1.5 font-semibold">
                Request Body{" "}
                <span className="font-normal text-zinc-400 dark:text-zinc-500">
                  ({endpoint.requestBody.contentType})
                </span>
              </div>
              <pre className="font-mono text-[11px] text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap break-all">
                {JSON.stringify(endpoint.requestBody.example, null, 2)}
              </pre>
            </div>
          )}

          {/* Responses */}
          <div className="px-3 py-2">
            <div className="text-zinc-500 dark:text-zinc-400 mb-1.5 font-semibold">Responses</div>
            <div className="space-y-1">
              {endpoint.responses.map((r) => (
                <div key={r.code} className="flex items-center gap-2">
                  <span className={cn("flex items-center gap-1 font-mono font-bold shrink-0", getResponseColor(r.code))}>
                    {getResponseIcon(r.code)}
                    {r.code}
                  </span>
                  <span className="text-zinc-500 dark:text-zinc-400">{r.description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function OpenApiSpec({
  title = "FreshMarket API",
  version = "2.0.0",
  baseUrl = "https://api.freshmarket.com",
  endpoints = [],
}: OpenApiSpecProps) {
  const [expandedEndpoints, setExpandedEndpoints] = useState<Set<string>>(new Set());
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [allExpanded, setAllExpanded] = useState(false);

  // Group endpoints by tag
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

  function toggleEndpoint(ep: Endpoint) {
    const key = endpointKey(ep);
    setExpandedEndpoints((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function toggleGroup(tag: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      next.has(tag) ? next.delete(tag) : next.add(tag);
      return next;
    });
  }

  function handleExpandAll() {
    if (allExpanded) {
      setExpandedEndpoints(new Set());
      setAllExpanded(false);
    } else {
      setExpandedEndpoints(new Set(endpoints.map(endpointKey)));
      setCollapsedGroups(new Set());
      setAllExpanded(true);
    }
  }

  const displayBaseUrl = baseUrl ? baseUrl.replace(/^https?:\/\//, "") : "";

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <FileText className="size-4 text-zinc-500 dark:text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex-1">
          OpenAPI Spec
        </span>
        <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
          {title}{" "}
          <span className="font-mono text-zinc-400 dark:text-zinc-500">v{version}</span>
        </span>
        <button
          onClick={handleExpandAll}
          className="ml-2 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 transition-opacity"
        >
          {allExpanded ? "Collapse" : "Expand"}
        </button>
      </div>

      {/* Base URL */}
      {displayBaseUrl && (
        <div className="px-4 py-1.5 border-b border-zinc-50 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/30">
          <span className="font-mono text-[11px] text-zinc-400 dark:text-zinc-500">{displayBaseUrl}</span>
        </div>
      )}

      {/* Endpoint groups */}
      <div className="max-h-[320px] overflow-y-auto">
        {Array.from(groups.entries()).map(([tag, tagEndpoints]) => {
          const isGroupCollapsed = collapsedGroups.has(tag);
          return (
            <div key={tag} className="border-b border-zinc-50 dark:border-zinc-800/50 last:border-b-0">
              {/* Group header */}
              <button
                onClick={() => toggleGroup(tag)}
                className="w-full flex items-center gap-2 px-4 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors text-left"
              >
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex-1">
                  {tag}
                </span>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 tabular-nums">
                  {tagEndpoints.length} endpoint{tagEndpoints.length !== 1 ? "s" : ""}
                </span>
                {isGroupCollapsed ? (
                  <ChevronRight className="size-3.5 text-zinc-400" />
                ) : (
                  <ChevronDown className="size-3.5 text-zinc-400" />
                )}
              </button>

              {/* Group endpoints */}
              <div
                className={cn(
                  "overflow-hidden transition-all duration-500",
                  isGroupCollapsed ? "max-h-0" : "max-h-[500px]"
                )}
              >
                <div className="mx-3 mb-2 rounded-lg border border-zinc-100 dark:border-zinc-800 overflow-hidden divide-y divide-zinc-50 dark:divide-zinc-800/50">
                  {tagEndpoints.map((ep) => (
                    <EndpointRow
                      key={endpointKey(ep)}
                      endpoint={ep}
                      isExpanded={expandedEndpoints.has(endpointKey(ep))}
                      onToggle={() => toggleEndpoint(ep)}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })}

        {endpoints.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-zinc-400 dark:text-zinc-500">
            No endpoints configured.
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
          Click any endpoint to see request / response schema
        </span>
      </div>
    </div>
  );
}
