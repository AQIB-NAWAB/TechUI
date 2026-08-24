"use client";

import { useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Copy, Check, ArrowUpRight } from "lucide-react";

export const HttpEndpointSchema = z.object({
  method: z
    .enum(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"])
    .default("GET"),
  path: z.string().default("/users/{id}"),
  description: z.string().optional(),
  deprecated: z.boolean().optional().default(false),
  auth: z
    .enum(["none", "bearer", "apikey", "basic", "oauth2"])
    .optional()
    .default("none"),
  parameters: z
    .array(
      z.object({
        name: z.string(),
        in: z.enum(["path", "query", "header", "cookie"]),
        required: z.boolean().optional().default(false),
        description: z.string().optional(),
        type: z.string().optional().default("string"),
        example: z.string().optional(),
      })
    )
    .optional(),
  responses: z
    .array(
      z.object({
        status: z.number(),
        description: z.string(),
        body: z.string().optional(),
      })
    )
    .optional(),
  tags: z.array(z.string()).optional(),
});

export type HttpEndpointProps = z.infer<typeof HttpEndpointSchema>;

const METHOD_COLOR: Record<string, string> = {
  GET:     "bg-emerald-600",
  POST:    "bg-blue-600",
  PUT:     "bg-orange-500",
  PATCH:   "bg-violet-600",
  DELETE:  "bg-red-600",
  HEAD:    "bg-zinc-500",
  OPTIONS: "bg-zinc-500",
};

const PARAM_TYPE_BORDER: Record<string, string> = {
  path:   "border-l-2 border-l-blue-400",
  query:  "border-l-2 border-l-violet-400",
  header: "border-l-2 border-l-zinc-400",
  cookie: "border-l-2 border-l-zinc-400",
  body:   "border-l-2 border-l-amber-400",
};

function statusGroup(s: number): "2xx" | "4xx" | "5xx" | "other" {
  if (s >= 200 && s < 300) return "2xx";
  if (s >= 400 && s < 500) return "4xx";
  if (s >= 500) return "5xx";
  return "other";
}

function statusTabClass(s: number, selected: boolean): string {
  const group = statusGroup(s);
  if (!selected) {
    return cn(
      "text-[11px] font-mono font-bold px-2 py-0.5 rounded-md transition-all duration-500",
      group === "2xx" ? "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
      : group === "4xx" ? "text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50"
      : "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50"
    );
  }
  return cn(
    "text-[11px] font-mono font-bold px-2 py-0.5 rounded-md transition-all duration-500",
    group === "2xx"
      ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
      : group === "4xx"
      ? "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
      : "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
  );
}

function JsonLine({ text }: { text: string }) {
  const keyMatch = text.match(/^(\s*)("[\w_]+")(\s*:\s*)(.*)$/);
  if (keyMatch) {
    const val = keyMatch[4]!.replace(/,$/, "");
    const comma = keyMatch[4]!.trimEnd().endsWith(",") ? "," : "";
    let valCls = "text-zinc-500 dark:text-zinc-400";
    if (val.startsWith('"')) valCls = "text-emerald-600 dark:text-emerald-400";
    else if (!isNaN(Number(val))) valCls = "text-amber-600 dark:text-amber-400";
    return (
      <div>
        <span>{keyMatch[1]}</span>
        <span className="text-blue-600 dark:text-blue-400 font-semibold">{keyMatch[2]}</span>
        <span className="text-zinc-400">{keyMatch[3]}</span>
        <span className={valCls}>{val}</span>
        {comma && <span className="text-zinc-400">{comma}</span>}
      </div>
    );
  }
  return <div className="text-zinc-500 dark:text-zinc-400">{text}</div>;
}

function SyntaxJson({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="font-mono text-[12px] leading-relaxed">
      {lines.map((line, i) => <JsonLine key={i} text={line} />)}
    </div>
  );
}

function PathDisplay({ path }: { path: string }) {
  return (
    <span className="font-mono text-sm">
      {path.split(/(\{[^}]+\})/).map((part, i) =>
        part.startsWith("{") ? (
          <span key={i} className="text-amber-500">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

type ParamTab = "path" | "query" | "header";

export function HttpEndpoint({
  method = "GET",
  path = "/users/{id}",
  description,
  deprecated = false,
  auth = "none",
  parameters,
  responses,
  tags,
}: HttpEndpointProps) {
  const pathParams   = parameters?.filter((p) => p.in === "path")   ?? [];
  const queryParams  = parameters?.filter((p) => p.in === "query")  ?? [];
  const headerParams = parameters?.filter((p) => p.in === "header" || p.in === "cookie") ?? [];

  const tabs = [
    pathParams.length   > 0 && { id: "path"   as ParamTab, label: "Path",    params: pathParams   },
    queryParams.length  > 0 && { id: "query"  as ParamTab, label: "Query",   params: queryParams  },
    headerParams.length > 0 && { id: "header" as ParamTab, label: "Headers", params: headerParams },
  ].filter(Boolean) as { id: ParamTab; label: string; params: typeof pathParams }[];

  const [paramTab, setParamTab] = useState<ParamTab>(tabs[0]?.id ?? "path");
  const [selectedResponse, setSelectedResponse] = useState(0);

  const currentParams = tabs.find((t) => t.id === paramTab)?.params ?? [];
  const currentResponse = responses?.[selectedResponse];
  const [copied, setCopied] = useState(false);

  const desc =
    description ??
    "One API operation — its URL, parameters, and the responses the server can return.";

  const AUTH_LABEL: Record<string, string> = {
    bearer: "Bearer", apikey: "API Key", basic: "Basic", oauth2: "OAuth 2.0",
  };

  return (
    <div className={cn(
      "rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 overflow-hidden text-sm",
      deprecated && "opacity-60"
    )}>
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-200 dark:border-zinc-800">
        <ArrowUpRight className="size-4 text-blue-500 shrink-0" />
        <span className={cn(
          "text-[11px] font-bold text-white px-2.5 py-1 rounded shrink-0",
          METHOD_COLOR[method] ?? "bg-zinc-600"
        )}>
          {method}
        </span>
        <span className="flex-1 min-w-0 text-zinc-700 dark:text-zinc-300 truncate">
          <PathDisplay path={path} />
        </span>
        {auth !== "none" && (
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400 shrink-0">
            {AUTH_LABEL[auth] ?? auth}
          </span>
        )}
        {deprecated && (
          <span className="text-[11px] font-medium text-zinc-400 line-through shrink-0">deprecated</span>
        )}
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        {desc}
      </p>

      {/* Two-column body */}
      <div className="flex divide-x divide-zinc-100 dark:divide-zinc-800 min-h-[220px]">

        {/* Left — parameters */}
        <div className="w-1/2 flex flex-col p-3 gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">Parameters</span>
            {tabs.length > 0 && (
              <div className="flex gap-0.5 ml-auto">
                {tabs.map(({ id, label, params }) => (
                  <button
                    key={id}
                    onClick={() => setParamTab(id)}
                    className={cn(
                      "px-2 py-0.5 text-[10px] font-semibold rounded transition-all duration-500",
                      paramTab === id
                        ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200"
                        : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                    )}
                  >
                    {label} <span className="opacity-60">{params.length}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {tabs.length > 0 ? (
            <div className="bg-zinc-50 dark:bg-zinc-800/40 rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden flex-1">
              {currentParams.map((p, i) => (
                <div key={i} className={cn(
                  "px-3 py-2.5 flex items-start justify-between gap-3 transition-all duration-500 hover:bg-zinc-100 dark:hover:bg-zinc-700/30 cursor-default",
                  i > 0 && "border-t border-zinc-100 dark:border-zinc-700/50",
                  PARAM_TYPE_BORDER[p.in] ?? ""
                )}>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <code className="text-[12px] font-mono font-semibold text-zinc-800 dark:text-zinc-200">{p.name}</code>
                      <span className="text-[10px] font-mono text-zinc-400">{p.type ?? "string"}</span>
                    </div>
                    {p.description && (
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{p.description}</p>
                    )}
                    {p.example && (
                      <p className="text-[10px] text-zinc-400 mt-0.5">
                        e.g. <code className="font-mono">{p.example}</code>
                      </p>
                    )}
                  </div>
                  {p.required && (
                    <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0 mt-0.5">
                      required
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center flex-1 text-[12px] text-zinc-400">
              No parameters
            </div>
          )}
        </div>

        {/* Right — responses */}
        <div className="w-1/2 flex flex-col p-3 gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">Response</span>
            {responses && responses.length > 0 && (
              <div className="flex gap-1 flex-wrap ml-auto">
                {responses.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedResponse(i)}
                    className={statusTabClass(r.status, i === selectedResponse)}
                  >
                    {r.status}
                  </button>
                ))}
              </div>
            )}
          </div>

          {responses && responses.length > 0 ? (
            currentResponse ? (
              <div className="bg-zinc-50 dark:bg-zinc-800/40 rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden flex-1 flex flex-col">
                <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-700/50">
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
                    {currentResponse.description}
                  </p>
                </div>
                {currentResponse.body ? (
                  <div className="flex-1 px-3 py-2 overflow-auto">
                    <SyntaxJson text={currentResponse.body} />
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <span className="text-[11px] text-zinc-400 italic">
                      {currentResponse.status === 204 ? "204 No Content" : "Empty response"}
                    </span>
                  </div>
                )}
              </div>
            ) : null
          ) : (
            <div className="flex items-center justify-center flex-1 text-[12px] text-zinc-400">
              No responses defined
            </div>
          )}
        </div>
      </div>

      {tags && tags.length > 0 && (
        <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-2 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span key={tag} className="text-[11px] text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/30 min-h-[52px]">
        <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">
          {currentResponse
            ? `${currentResponse.status} — ${currentResponse.description}`
            : "Select a response code to inspect the payload"}
        </span>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(`${method} ${path}`);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="flex items-center gap-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-all duration-500 shrink-0"
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? "Copied" : "Copy Endpoint"}
        </button>
      </div>
    </div>
  );
}
