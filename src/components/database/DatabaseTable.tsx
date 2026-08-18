"use client";

import { useState } from "react";
import { Key, Hash, Search, ChevronUp, ChevronDown } from "lucide-react";
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

const TYPE_COLORS: Record<string, string> = {
  int: "text-blue-600 dark:text-blue-400",
  integer: "text-blue-600 dark:text-blue-400",
  bigint: "text-blue-600 dark:text-blue-400",
  serial: "text-blue-600 dark:text-blue-400",
  bigserial: "text-blue-600 dark:text-blue-400",
  varchar: "text-emerald-600 dark:text-emerald-400",
  text: "text-emerald-600 dark:text-emerald-400",
  char: "text-emerald-600 dark:text-emerald-400",
  boolean: "text-amber-600 dark:text-amber-400",
  bool: "text-amber-600 dark:text-amber-400",
  timestamp: "text-violet-600 dark:text-violet-400",
  timestamptz: "text-violet-600 dark:text-violet-400",
  date: "text-violet-600 dark:text-violet-400",
  uuid: "text-orange-600 dark:text-orange-400",
  json: "text-rose-600 dark:text-rose-400",
  jsonb: "text-rose-600 dark:text-rose-400",
  float: "text-cyan-600 dark:text-cyan-400",
  decimal: "text-cyan-600 dark:text-cyan-400",
  numeric: "text-cyan-600 dark:text-cyan-400",
};

function CellValue({ value }: { value: unknown }) {
  if (value === null || value === undefined) {
    return <span className="text-zinc-300 dark:text-zinc-600 italic text-xs">null</span>;
  }
  if (typeof value === "boolean") {
    return (
      <span className={cn("text-xs font-medium", value ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400")}>
        {String(value)}
      </span>
    );
  }
  if (typeof value === "number") {
    return <span className="text-blue-600 dark:text-blue-400 text-xs">{value}</span>;
  }
  return <span className="text-zinc-700 dark:text-zinc-300 text-xs truncate max-w-[160px]">{String(value)}</span>;
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

  const displayRows = (() => {
    let r = rows ?? [];
    if (search) {
      r = r.filter((row) =>
        Object.values(row).some((v) => String(v).toLowerCase().includes(search.toLowerCase()))
      );
    }
    if (sortCol) {
      r = [...r].sort((a, b) => {
        const av = String(a[sortCol] ?? "");
        const bv = String(b[sortCol] ?? "");
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      });
    }
    return r;
  })();

  function toggleSort(col: string) {
    if (sortCol === col) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
  }

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden font-mono text-sm">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/50">
        <div className="size-7 flex items-center justify-center rounded-md bg-violet-100 dark:bg-violet-950/50">
          <Hash className="size-3.5 text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
            {schema ? `${schema}.` : ""}<span className="text-violet-700 dark:text-violet-400">{name}</span>
          </span>
          <span className="ml-2 text-[10px] text-zinc-400">{columns.length} columns</span>
        </div>
        {rows && rows.length > 0 && (
          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-zinc-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter rows…"
                className="h-6 pl-6 pr-3 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 font-sans w-32"
              />
            </div>
          </div>
        )}
      </div>

      {/* Schema */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-900/30">
              <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-900 w-5">
                #
              </th>
              <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-900">
                Column
              </th>
              <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-900">
                Type
              </th>
              <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-900">
                Constraints
              </th>
              <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-900">
                Default
              </th>
            </tr>
          </thead>
          <tbody>
            {columns.map((col, i) => {
              const typeColor = TYPE_COLORS[col.type.toLowerCase().split("(")[0]!] ?? "text-zinc-600 dark:text-zinc-400";
              const isHighlighted = highlightColumn === col.name;
              return (
                <tr
                  key={col.name}
                  className={cn(
                    "border-b border-zinc-50 dark:border-zinc-900/50 transition-colors",
                    isHighlighted ? "bg-yellow-50 dark:bg-yellow-950/20" : "hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20"
                  )}
                >
                  <td className="px-4 py-2.5 text-[10px] text-zinc-300 dark:text-zinc-700">{i + 1}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      {col.primaryKey && <Key className="size-3 text-amber-500 shrink-0" />}
                      {col.foreignKey && !col.primaryKey && <Key className="size-3 text-blue-400 shrink-0" />}
                      {col.index && !col.primaryKey && !col.foreignKey && (
                        <Hash className="size-3 text-zinc-400 shrink-0" />
                      )}
                      <span className={cn("text-xs font-medium", col.primaryKey ? "text-amber-700 dark:text-amber-400" : "text-zinc-800 dark:text-zinc-200")}>
                        {col.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={cn("text-xs", typeColor)}>{col.type}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {col.primaryKey && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                          PK
                        </span>
                      )}
                      {col.foreignKey && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 uppercase tracking-wider" title={`→ ${col.foreignKey}`}>
                          FK
                        </span>
                      )}
                      {col.unique && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-400 uppercase tracking-wider">
                          UQ
                        </span>
                      )}
                      {!col.nullable && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                          NOT NULL
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-[11px] text-zinc-400 dark:text-zinc-600">
                    {col.default ?? "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Rows */}
      {showRows && rows && rows.length > 0 && (
        <div className="border-t border-zinc-200 dark:border-zinc-800">
          <div className="px-4 py-2 text-[10px] text-zinc-400 dark:text-zinc-600 font-sans uppercase tracking-widest">
            {displayRows.length} row{displayRows.length !== 1 ? "s" : ""}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-900/30">
                  {columns.map((col) => (
                    <th
                      key={col.name}
                      className="text-left px-4 py-2 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-900 cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                      onClick={() => toggleSort(col.name)}
                    >
                      <div className="flex items-center gap-1">
                        {col.name}
                        {sortCol === col.name && (
                          sortDir === "asc" ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayRows.map((row, i) => (
                  <tr key={i} className="border-b border-zinc-50 dark:border-zinc-900/50 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20 transition-colors">
                    {columns.map((col) => (
                      <td key={col.name} className="px-4 py-2">
                        <CellValue value={row[col.name]} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
