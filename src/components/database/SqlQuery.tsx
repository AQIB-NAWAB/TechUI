"use client";

import { useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Play, Clock, AlertCircle, Copy, Check, Database } from "lucide-react";

export const SqlQuerySchema = z.object({
  query: z.string().default(
    "SELECT id, email, name, role\nFROM users\nWHERE role = 'admin'\nORDER BY created_at DESC\nLIMIT 10"
  ),
  database: z.string().optional().default("postgres"),
  result: z
    .object({
      columns: z
        .array(z.object({ name: z.string(), type: z.string().optional() }))
        .optional(),
      rows: z.array(z.record(z.string(), z.unknown())).optional(),
      rowCount: z.number().optional(),
      executionTimeMs: z.number().optional(),
      error: z.string().optional(),
    })
    .optional(),
  interactive: z.boolean().optional().default(false),
});

export type SqlQueryProps = z.infer<typeof SqlQuerySchema>;

const SQL_KW = new Set(
  "SELECT FROM WHERE AND OR NOT IN IS NULL AS JOIN INNER LEFT RIGHT OUTER FULL CROSS ON ORDER BY GROUP HAVING LIMIT OFFSET INSERT INTO VALUES UPDATE SET DELETE CREATE ALTER DROP TABLE INDEX VIEW DISTINCT COUNT SUM MAX MIN AVG RETURNING WITH RECURSIVE UNION ALL EXISTS BETWEEN LIKE ILIKE CASE WHEN THEN ELSE END TRUE FALSE DEFAULT CONSTRAINT PRIMARY KEY FOREIGN REFERENCES UNIQUE CHECK CAST COALESCE NULLIF OVER PARTITION WINDOW LATERAL".split(" ")
);

type TT = "keyword" | "string" | "number" | "comment" | "op" | "plain";

function tokenSql(sql: string): { text: string; type: TT }[] {
  const out: { text: string; type: TT }[] = [];
  let i = 0;
  while (i < sql.length) {
    const ch = sql[i]!;
    // Comment
    if (ch === "-" && sql[i + 1] === "-") {
      let c = "";
      while (i < sql.length && sql[i] !== "\n") c += sql[i++];
      out.push({ text: c, type: "comment" });
      continue;
    }
    // Newline / whitespace
    if (/\s/.test(ch)) {
      let ws = "";
      while (i < sql.length && /\s/.test(sql[i]!)) ws += sql[i++];
      out.push({ text: ws, type: "plain" });
      continue;
    }
    // String
    if (ch === "'" || ch === '"') {
      const q = ch;
      let s = q;
      i++;
      while (i < sql.length && sql[i] !== q) {
        if (sql[i] === "\\" && i + 1 < sql.length) { s += sql[i] + sql[i + 1]; i += 2; }
        else s += sql[i++];
      }
      s += sql[i] ?? q;
      i++;
      out.push({ text: s, type: "string" });
      continue;
    }
    // Number
    if (/[0-9]/.test(ch)) {
      let n = "";
      while (i < sql.length && /[0-9._]/.test(sql[i]!)) n += sql[i++];
      out.push({ text: n, type: "number" });
      continue;
    }
    // Identifier / keyword
    if (/[A-Za-z_]/.test(ch)) {
      let w = "";
      while (i < sql.length && /[A-Za-z0-9_]/.test(sql[i]!)) w += sql[i++];
      out.push({ text: w, type: SQL_KW.has(w.toUpperCase()) ? "keyword" : "plain" });
      continue;
    }
    // Operator / punctuation
    if (/[=<>!*,();:.{}[\]@]/.test(ch)) {
      out.push({ text: ch, type: "op" });
      i++;
      continue;
    }
    out.push({ text: ch, type: "plain" });
    i++;
  }
  return out;
}

const TT_CLASS: Record<TT, string> = {
  keyword: "text-violet-500 dark:text-violet-400 font-semibold",
  string:  "text-emerald-500 dark:text-emerald-400",
  number:  "text-blue-500 dark:text-blue-400",
  comment: "text-zinc-400 dark:text-zinc-600 italic",
  op:      "text-zinc-500 dark:text-zinc-500",
  plain:   "text-zinc-200",
};

type QueryResult = {
  columns: { name: string; type?: string }[];
  rows: Record<string, unknown>[];
  rowCount?: number;
  executionTimeMs?: number;
  error?: string;
};

const DEMO_RESULT: QueryResult = {
  columns: [
    { name: "id", type: "bigint" },
    { name: "email", type: "varchar" },
    { name: "name", type: "varchar" },
    { name: "role", type: "varchar" },
  ],
  rows: [
    { id: 1, email: "alice@example.com", name: "Alice Johnson", role: "admin" },
    { id: 7, email: "bob@example.com",   name: "Bob Smith",     role: "admin" },
    { id: 12, email: "carol@example.com", name: "Carol Davis",  role: "admin" },
  ],
  rowCount: 3,
  executionTimeMs: 2.4,
};

export function SqlQuery({
  query = "SELECT id, email, name, role\nFROM users\nWHERE role = 'admin'\nORDER BY created_at DESC\nLIMIT 10",
  database = "postgres",
  result: resultProp,
  interactive = false,
}: SqlQueryProps) {
  const [result, setResult] = useState<QueryResult | null>(
    resultProp
      ? {
          columns: (resultProp.columns ?? DEMO_RESULT.columns) as QueryResult["columns"],
          rows: (resultProp.rows ?? DEMO_RESULT.rows) as QueryResult["rows"],
          rowCount: resultProp.rowCount,
          executionTimeMs: resultProp.executionTimeMs,
          error: resultProp.error,
        }
      : null
  );
  const [running, setRunning] = useState(false);
  const [copied, setCopied] = useState(false);

  function run() {
    if (running) return;
    setRunning(true);
    setResult(null);
    setTimeout(() => {
      setResult({ ...DEMO_RESULT, executionTimeMs: +(Math.random() * 8 + 0.8).toFixed(1) });
      setRunning(false);
    }, 1000);
  }

  function copy() {
    navigator.clipboard.writeText(query);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const tokens = tokenSql(query);
  const cols = result?.columns ?? [];
  const rows = result?.rows ?? [];

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <Database className="size-4 text-violet-500 dark:text-violet-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1 font-sans">SQL Query</span>
        <span className="text-xs font-mono text-zinc-400">{database}</span>
        <button
          onClick={copy}
          className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-all duration-500"
        >
          {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
        </button>
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800 font-sans">
        Run a SQL statement against a database and inspect the rows returned.
      </p>

      <div className="min-h-[220px] flex flex-col">
        <div className="px-4 py-3 bg-zinc-950 overflow-x-auto border-b border-zinc-100 dark:border-zinc-800">
          <pre className="m-0 text-xs font-mono leading-6 min-h-[72px]">
            {tokens.map((t, i) => (
              <span key={i} className={TT_CLASS[t.type]}>{t.text}</span>
            ))}
          </pre>
        </div>

        <div className="flex-1 min-h-[120px] overflow-hidden">
          {running && (
            <div className="px-4 py-6 text-sm text-zinc-500 dark:text-zinc-400 font-sans animate-pulse">
              Executing query…
            </div>
          )}

          {!running && !result && (
            <div className="px-4 py-6 text-sm text-zinc-400 font-sans">
              Click Run Query to see results
            </div>
          )}

          {result && !result.error && (
            <div className="transition-opacity duration-500">
              <div className="flex items-center gap-3 px-4 py-2 bg-zinc-50 dark:bg-zinc-900/40 border-b border-zinc-100 dark:border-zinc-800">
                <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">
                  {result.rowCount ?? rows.length} row{(result.rowCount ?? rows.length) !== 1 ? "s" : ""}
                </span>
                {result.executionTimeMs !== undefined && (
                  <span className="flex items-center gap-1 text-[10px] text-zinc-400">
                    <Clock className="size-3" />
                    {result.executionTimeMs.toFixed(1)}ms
                  </span>
                )}
              </div>
              {cols.length > 0 && (
                <div className="overflow-x-auto max-h-[140px]">
                  <table className="w-full text-xs font-mono">
                    <thead>
                      <tr className="border-b border-zinc-100 dark:border-zinc-800">
                        {cols.map((c) => (
                          <th key={c.name} className="px-4 py-2 text-left font-semibold text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                            {c.name}
                            {c.type && (
                              <span className="ml-1.5 text-zinc-400 dark:text-zinc-600 font-normal text-[10px]">{c.type}</span>
                            )}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, ri) => (
                        <tr key={ri} className="border-b border-zinc-50 dark:border-zinc-800/60 hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-all duration-500">
                          {cols.map((c) => (
                            <td key={c.name} className="px-4 py-2 text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                              {row[c.name] === null || row[c.name] === undefined ? (
                                <span className="text-zinc-400 dark:text-zinc-600 italic">null</span>
                              ) : typeof row[c.name] === "boolean" ? (
                                <span className={row[c.name] ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400"}>
                                  {String(row[c.name])}
                                </span>
                              ) : (
                                String(row[c.name])
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {result?.error && (
            <div className="px-4 py-3 bg-red-50 dark:bg-red-950 border-t border-red-200 dark:border-red-800 flex items-start gap-2">
              <AlertCircle className="size-3.5 text-red-500 shrink-0 mt-0.5" />
              <code className="text-xs font-mono text-red-700 dark:text-red-400">{result.error}</code>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/30">
        <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1 font-sans">
          {running
            ? "Running query…"
            : result
              ? `${result.rowCount ?? rows.length} rows in ${result.executionTimeMs?.toFixed(1) ?? "—"}ms`
              : "Ready to execute — results appear below the query"}
        </span>
        <button
          onClick={run}
          disabled={running || !interactive}
          className="flex items-center gap-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-all duration-500 disabled:opacity-50"
        >
          <Play className={cn("size-3.5", running && "animate-pulse")} fill="currentColor" />
          {running ? "Running…" : "Run Query"}
        </button>
      </div>
    </div>
  );
}
