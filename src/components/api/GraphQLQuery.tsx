"use client";

import { useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Play, Braces } from "lucide-react";

export const GraphQLQuerySchema = z.object({
  operation: z.enum(["query", "mutation", "subscription"]).default("query"),
  name: z.string().optional().default("GetUser"),
  query: z.string().default('query GetUser($id: ID!) {\n  user(id: $id) {\n    id\n    name\n    email\n    posts {\n      id\n      title\n    }\n  }\n}'),
  variables: z.string().optional().default('{\n  "id": "42"\n}'),
  response: z.string().optional().default('{\n  "data": {\n    "user": {\n      "id": "42",\n      "name": "Alice",\n      "email": "alice@example.com",\n      "posts": [\n        { "id": "1", "title": "GraphQL Basics" },\n        { "id": "2", "title": "N+1 Problem" }\n      ]\n    }\n  }\n}'),
  endpoint: z.string().optional().default("/graphql"),
  description: z.string().optional(),
});

export type GraphQLQueryProps = z.infer<typeof GraphQLQuerySchema>;

const OPERATION_BADGE: Record<string, string> = {
  query:        "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800",
  mutation:     "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800",
  subscription: "bg-violet-50 dark:bg-violet-950 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-800",
};

function HighlightedQuery({ query }: { query: string }) {
  const lines = query.split("\n");
  return (
    <div className="font-mono text-[12px] leading-relaxed">
      {lines.map((line, i) => {
        const parts: { text: string; cls: string }[] = [];
        let rest = line;

        const kwMatch = rest.match(/^(\s*)(query|mutation|subscription|fragment|on)\b(.*)$/);
        if (kwMatch) {
          if (kwMatch[1]) parts.push({ text: kwMatch[1]!, cls: "" });
          parts.push({ text: kwMatch[2]!, cls: "text-violet-600 dark:text-violet-400 font-semibold" });
          rest = kwMatch[3]!;
        }

        const argMatch = rest.match(/^(\s*)(\$\w+)(\s*:\s*)(\w+[!]?)(.*)$/);
        if (argMatch && !parts.length) {
          if (argMatch[1]) parts.push({ text: argMatch[1]!, cls: "" });
          parts.push({ text: argMatch[2]!, cls: "text-blue-600 dark:text-blue-400" });
          parts.push({ text: argMatch[3]!, cls: "text-zinc-400" });
          parts.push({ text: argMatch[4]!, cls: "text-emerald-600 dark:text-emerald-400" });
          rest = argMatch[5]!;
        }

        if (rest) parts.push({ text: rest, cls: "text-zinc-700 dark:text-zinc-300" });
        if (!parts.length) parts.push({ text: line, cls: "text-zinc-700 dark:text-zinc-300" });

        return (
          <div key={i} className="flex">
            <span className="select-none text-zinc-300 dark:text-zinc-700 w-6 text-right mr-3 shrink-0">{i + 1}</span>
            <span>{parts.map((p, j) => <span key={j} className={p.cls}>{p.text}</span>)}</span>
          </div>
        );
      })}
    </div>
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
    else if (val === "true" || val === "false") valCls = "text-violet-600 dark:text-violet-400";
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

function VariablesEditor({ variables }: { variables: string }) {
  let entries: [string, unknown][] = [];
  try {
    const parsed = JSON.parse(variables) as Record<string, unknown>;
    entries = Object.entries(parsed);
  } catch {
    return (
      <p className="text-xs text-red-500 dark:text-red-400">Invalid JSON variables</p>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map(([key, val]) => (
        <div
          key={key}
          className="flex items-center gap-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2.5"
        >
          <span className="text-[11px] font-mono font-semibold text-blue-600 dark:text-blue-400 shrink-0">{key}</span>
          <span className="text-zinc-300 dark:text-zinc-600">=</span>
          <input
            readOnly
            value={typeof val === "string" ? val : JSON.stringify(val)}
            className="flex-1 min-w-0 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-md px-2.5 py-1 font-mono text-xs text-emerald-700 dark:text-emerald-400"
          />
        </div>
      ))}
    </div>
  );
}

type Tab = "query" | "variables" | "response";

export function GraphQLQuery({
  operation = "query",
  name = "GetUser",
  query,
  variables,
  response,
  endpoint = "/graphql",
  description,
}: GraphQLQueryProps) {
  const [tab, setTab] = useState<Tab>("query");
  const [ran, setRan] = useState(false);
  const [running, setRunning] = useState(false);

  const desc =
    description ??
    "Ask for exactly the data you need in one request — the server returns a JSON tree matching your query shape.";

  const tabs: { id: Tab; label: string; available: boolean }[] = [
    { id: "query",     label: "Query",     available: !!query     },
    { id: "variables", label: "Variables", available: !!variables },
    { id: "response",  label: "Response",  available: !!response  },
  ].filter((t) => t.available) as { id: Tab; label: string; available: boolean }[];

  function runQuery() {
    if (running) return;
    setRunning(true);
    setTimeout(() => {
      setRunning(false);
      setRan(true);
      setTab("response");
    }, 800);
  }

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800">
        <Braces className="size-4 text-violet-500 shrink-0" />
        <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide", OPERATION_BADGE[operation])}>
          {operation}
        </span>
        <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200 text-sm">{name}</span>
        <code className="text-[11px] text-zinc-400 font-mono ml-auto">{endpoint}</code>
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        {desc}
      </p>

      {/* Tab bar */}
      <div className="flex border-b border-zinc-100 dark:border-zinc-800 mt-1">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "px-4 py-2 text-[12px] font-medium border-b-2 -mb-px transition-all duration-500",
              tab === id
                ? "border-zinc-800 dark:border-zinc-200 text-zinc-800 dark:text-zinc-200"
                : "border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            )}
          >
            {label}
            {id === "response" && ran && (
              <span className="ml-1.5 size-1.5 rounded-full bg-emerald-500 inline-block" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="relative">
        <div className={cn(
          "p-4 bg-zinc-50/50 dark:bg-zinc-900/20 overflow-auto min-h-[220px] transition-opacity duration-500",
          running ? "opacity-50" : "opacity-100"
        )}>
          {tab === "query" && query && (
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4">
              <HighlightedQuery query={query} />
            </div>
          )}
          {tab === "variables" && variables && (
            <VariablesEditor variables={variables} />
          )}
          {tab === "response" && response && (
            <div className={cn(
              "rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 transition-opacity duration-500",
              ran ? "opacity-100" : "opacity-60"
            )}>
              <SyntaxJson text={response} />
            </div>
          )}
        </div>

        {running && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="size-6 rounded-full border-2 border-violet-400 border-t-transparent animate-spin" />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/30 min-h-[52px]">
        <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">
          {running
            ? "Running query…"
            : ran
            ? "Response ready — switch to the Response tab to inspect"
            : "Ready — click Run Query to fetch data"}
        </span>
        <button
          type="button"
          onClick={runQuery}
          disabled={running}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-500 shrink-0 hover:opacity-90",
            running
              ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-400 cursor-not-allowed"
              : "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
          )}
        >
          <Play className="size-3.5" />
          {running ? "Running…" : "Run Query"}
        </button>
      </div>
    </div>
  );
}
