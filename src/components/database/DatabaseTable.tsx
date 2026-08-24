"use client";

import { useState } from "react";
import { Key, Search, ChevronUp, ChevronDown, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { z } from "zod";

export const ColumnSchema = z.object({
  name: z.string(),
  type: z.string(),
  nullable: z.boolean().default(false),
  primaryKey: z.boolean().default(false),
  foreignKey: z.string().optional(),
  unique: z.boolean().default(false),
  index: z.boolean().default(false),
  default: z.string().optional(),
});

export const DatabaseTableSchema = z.object({
  name: z.string().default("users"),
  schema: z.string().optional(),
  columns: z.array(ColumnSchema),
  rows: z.array(z.record(z.string(), z.unknown())).optional(),
  showRows: z.boolean().default(true),
  highlightColumn: z.string().optional(),
});

export type DatabaseTableProps = z.infer<typeof DatabaseTableSchema>;

function CellValue({ value }: { value: unknown }) {
  if (value === null || value === undefined)
    return <span className="text-zinc-400 dark:text-zinc-600 italic text-xs">null</span>;
  if (typeof value === "boolean") {
    if (value) {
      return (
        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium text-xs">
          <CheckCircle className="size-3" /> true
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-red-500 dark:text-red-400 font-medium text-xs">
        <XCircle className="size-3" /> false
      </span>
    );
  }
  return <span className="text-zinc-700 dark:text-zinc-300 truncate max-w-[160px]">{String(value)}</span>;
}

export function DatabaseTable({
  name = "users",
  schema,
  columns,
  rows,
  showRows = true,
  highlightColumn,
}: DatabaseTableProps) {
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [search, setSearch] = useState("");
  const [showData, setShowData] = useState(true);
  const [hoveredColumn, setHoveredColumn] = useState<string | null>(null);

  const displayRows = (() => {
    let r = rows ?? [];
    if (search)
      r = r.filter((row) =>
        Object.values(row).some((v) => String(v).toLowerCase().includes(search.toLowerCase()))
      );
    if (sortCol)
      r = [...r].sort((a, b) => {
        const av = String(a[sortCol] ?? "");
        const bv = String(b[sortCol] ?? "");
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      });
    return r;
  })();

  function toggleSort(col: string) {
    if (sortCol === col) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  }

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden font-mono text-[13px]">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-100 dark:border-zinc-900">
        <span className="text-zinc-800 dark:text-zinc-200 font-semibold">
          {schema ? <span className="text-zinc-400 dark:text-zinc-500">{schema}.</span> : null}{name}
        </span>
        <span className="text-[11px] text-zinc-400 font-sans">{columns.length} cols</span>
        {rows && rows.length > 0 && (
          <span className="text-[11px] text-zinc-400 font-sans">{rows.length} rows</span>
        )}
        {rows && rows.length > 0 && (
          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-zinc-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter…"
                className="h-6 pl-6 pr-2 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 outline-none font-sans w-24"
              />
            </div>
          </div>
        )}
      </div>

      {/* Schema — always visible */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left px-4 py-2 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-900 font-sans">Column</th>
              <th className="text-left px-4 py-2 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-900 font-sans">Type</th>
              <th className="text-left px-4 py-2 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-900 font-sans">Constraints</th>
              <th className="text-left px-4 py-2 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-900 font-sans">Default</th>
            </tr>
          </thead>
          <tbody>
            {columns.map((col) => {
              const isPK = col.primaryKey;
              const isHighlighted = highlightColumn === col.name;
              const constraints: string[] = [];
              if (col.primaryKey) constraints.push("pk");
              if (col.foreignKey) constraints.push(`fk → ${col.foreignKey}`);
              if (col.unique && !col.primaryKey) constraints.push("unique");
              if (!col.nullable && !col.primaryKey) constraints.push("not null");
              if (col.index && !col.primaryKey) constraints.push("index");

              return (
                <tr
                  key={col.name}
                  className={cn(
                    "border-b border-zinc-50 dark:border-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-default",
                    isHighlighted ? "bg-blue-50/60 dark:bg-blue-950/10" : "",
                    isPK ? "border-l-2 border-l-amber-400" : ""
                  )}
                >
                  {/* Column name */}
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isPK && <Key className="size-3 text-amber-500 shrink-0" />}
                      <span className={cn(
                        "font-medium",
                        isPK ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-700 dark:text-zinc-300"
                      )}>
                        {col.name}
                      </span>
                      {col.foreignKey && (
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-sans font-normal">
                          → {col.foreignKey}
                        </span>
                      )}
                    </div>
                  </td>
                  {/* Type — neutral, no rainbow */}
                  <td className="px-4 py-2.5 text-zinc-500 dark:text-zinc-400">{col.type}</td>
                  {/* Constraints — plain text, no colored badges */}
                  <td className="px-4 py-2.5">
                    {constraints.length > 0 ? (
                      <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-sans">
                        {constraints.join(" · ")}
                      </span>
                    ) : (
                      <span className="text-zinc-200 dark:text-zinc-800">—</span>
                    )}
                  </td>
                  {/* Default */}
                  <td className="px-4 py-2.5 text-zinc-400 dark:text-zinc-600 text-[11px]">
                    {col.default ?? "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Rows — progressive disclosure toggle */}
      {showRows && rows && rows.length > 0 && (
        <div className="border-t border-zinc-100 dark:border-zinc-900">
          <button
            onClick={() => setShowData(!showData)}
            className="w-full flex items-center gap-2 px-4 py-2 text-[11px] font-sans text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors text-left"
          >
            {showData ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
            {displayRows.length} row{displayRows.length !== 1 ? "s" : ""}
            {search && ` (filtered from ${rows.length})`}
          </button>

          {showData && (
            <div className="overflow-x-auto border-t border-zinc-50 dark:border-zinc-900/50">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {columns.map((col) => (
                      <th
                        key={col.name}
                        onClick={() => toggleSort(col.name)}
                        onMouseEnter={() => setHoveredColumn(col.name)}
                        onMouseLeave={() => setHoveredColumn(null)}
                        className={cn(
                          "text-left px-4 py-2 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-900 cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors font-sans select-none",
                          hoveredColumn === col.name && "bg-zinc-50 dark:bg-zinc-800/50"
                        )}
                      >
                        <span className="flex items-center gap-1">
                          {col.name}
                          {sortCol === col.name && (
                            sortDir === "asc" ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />
                          )}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayRows.map((row, i) => (
                    <tr key={i} className="border-b border-zinc-50 dark:border-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-default">
                      {columns.map((col) => (
                        <td
                          key={col.name}
                          className={cn(
                            "px-4 py-2 transition-colors duration-500",
                            hoveredColumn === col.name && "bg-zinc-50 dark:bg-zinc-800/50"
                          )}
                        >
                          <CellValue value={row[col.name]} />
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
    </div>
  );
}
