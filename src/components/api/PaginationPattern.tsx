"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { ChevronRight, ChevronLeft, User, FileText, CheckCircle2, XCircle } from "lucide-react";

export const PaginationPatternSchema = z.object({
  pattern: z.enum(["offset", "cursor", "keyset"]).default("cursor"),
  resource: z.string().optional().default("users"),
  pageSize: z.number().int().min(1).max(10).optional().default(5),
  totalItems: z.number().int().optional().default(25),
  interactive: z.boolean().optional().default(true),
});

export type PaginationPatternProps = z.infer<typeof PaginationPatternSchema>;

type Pattern = "offset" | "cursor" | "keyset";

const NAMES = ["Alice", "Bob", "Carol", "Dave", "Eve", "Frank", "Grace", "Hank", "Iris", "Jack",
  "Kate", "Leo", "Mia", "Noah", "Olivia", "Pete", "Quinn", "Rose", "Sam", "Tina",
  "Uma", "Vick", "Wendy", "Xena", "Yara"];

const COMPARISON: Record<Pattern, { jumpToPage: boolean; stable: boolean; fastLarge: boolean }> = {
  offset: { jumpToPage: true,  stable: false, fastLarge: false },
  cursor: { jumpToPage: false, stable: true,  fastLarge: true  },
  keyset: { jumpToPage: false, stable: true,  fastLarge: true  },
};

function getCursor(id: number, resource: string) {
  return btoa(`${resource}:${id}`).replace(/=/g, "").slice(0, 16);
}

function buildApiCall(pattern: Pattern, page: number, pageSize: number, resource: string, names: string[]) {
  const offset = page * pageSize;
  if (pattern === "offset") {
    return `GET /${resource}?limit=${pageSize}&offset=${offset}`;
  }
  if (pattern === "cursor") {
    if (page === 0) return `GET /${resource}?limit=${pageSize}`;
    const prevLastId = (page - 1) * pageSize + pageSize;
    return `GET /${resource}?after=${getCursor(prevLastId, resource)}&limit=${pageSize}`;
  }
  // keyset
  if (page === 0) return `GET /${resource}?limit=${pageSize}&order=id_asc`;
  const prevLastId = (page - 1) * pageSize + pageSize;
  return `GET /${resource}?after_id=${prevLastId}&limit=${pageSize}`;
}

export function PaginationPattern({
  pattern = "cursor",
  resource = "users",
  pageSize = 5,
  totalItems = 25,
  interactive = true,
}: PaginationPatternProps) {
  const [active, setActive] = useState<Pattern>(pattern);
  const [page, setPage] = useState(0);
  const [animDir, setAnimDir] = useState<"left" | "right" | null>(null);
  const [visible, setVisible] = useState(true);

  const totalPages = Math.ceil(totalItems / pageSize);

  useEffect(() => {
    setPage(0);
  }, [active]);

  function goTo(newPage: number) {
    if (!interactive) return;
    const dir = newPage > page ? "right" : "left";
    setAnimDir(dir);
    setVisible(false);
    setTimeout(() => {
      setPage(newPage);
      setVisible(true);
      setAnimDir(null);
    }, 500);
  }

  const offset = page * pageSize;
  const pageNames = NAMES.slice(offset, offset + pageSize);
  const apiCall = buildApiCall(active, page, pageSize, resource, NAMES);
  const cmp = COMPARISON[active];
  const lastItemId = offset + pageSize;
  const cursorValue = active === "cursor" ? getCursor(lastItemId, resource) : active === "keyset" ? String(lastItemId) : null;

  const slideOut = animDir === "right" ? "-translate-x-8 opacity-0" : "translate-x-8 opacity-0";
  const slideIn = animDir === "right" ? "translate-x-8 opacity-0" : "-translate-x-8 opacity-0";

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Header with tabs */}
      <div className="flex items-center gap-0 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800">
        <FileText className="size-4 text-zinc-500 shrink-0 mr-2" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mr-4">Pagination</span>
        <div className="flex gap-1 ml-auto">
          {(["offset", "cursor", "keyset"] as Pattern[]).map((p) => (
            <button
              key={p}
              onClick={() => setActive(p)}
              className={cn(
                "px-3 py-1 rounded-md text-[11px] font-semibold transition-all duration-500",
                active === p
                  ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                  : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              )}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Fetch results in chunks, not all at once
        </p>
      </div>

      {/* Main visual area — fixed height */}
      <div className="min-h-[220px] px-4 py-4 flex flex-col gap-4">
        {/* Item cards */}
        <div
          className={cn(
            "flex gap-2 transition-all duration-500",
            visible ? "translate-x-0 opacity-100" : slideOut
          )}
        >
          {pageNames.map((name, i) => (
            <div
              key={`${page}-${i}`}
              className="flex-1 min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-2 py-3 flex flex-col items-center gap-1.5"
            >
              <div className="size-7 rounded-full bg-zinc-200 dark:bg-zinc-600 flex items-center justify-center">
                <User className="size-3.5 text-zinc-500 dark:text-zinc-400" />
              </div>
              <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 truncate w-full text-center">{name}</span>
              <span className="text-[9px] font-mono text-zinc-400">#{offset + i + 1}</span>
            </div>
          ))}
          {pageNames.length < pageSize && Array.from({ length: pageSize - pageNames.length }).map((_, i) => (
            <div key={`empty-${i}`} className="flex-1 min-w-0 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-700 bg-zinc-50/30 dark:bg-zinc-800/30" />
          ))}
        </div>

        {/* Page controls */}
        <div className="flex flex-col items-center gap-2">
          {cursorValue && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-violet-500 dark:text-violet-400">
                {active === "cursor" ? "Cursor" : "After ID"}
              </span>
              <code className="text-[11px] font-mono text-violet-700 dark:text-violet-300">{cursorValue}</code>
            </div>
          )}
          <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => goTo(page - 1)}
            disabled={page === 0 || !interactive}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-500"
          >
            <ChevronLeft className="size-4" />
            Prev
          </button>
          <span className="text-sm text-zinc-600 dark:text-zinc-400 font-medium min-w-[90px] text-center">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => goTo(page + 1)}
            disabled={page >= totalPages - 1 || !interactive}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-500"
          >
            Next
            <ChevronRight className="size-4" />
          </button>
          </div>
        </div>
      </div>

      {/* API call display */}
      <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 bg-zinc-50/50 dark:bg-zinc-800/30">
        <code className="text-[11px] font-mono text-zinc-600 dark:text-zinc-300 block truncate">
          {apiCall}
        </code>
      </div>

      {/* Comparison footer */}
      <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-2.5 flex items-center gap-3 flex-wrap">
        {[
          { label: "Jump to any page", supported: cmp.jumpToPage },
          { label: "Stable on inserts", supported: cmp.stable },
          { label: "Fast on large data", supported: cmp.fastLarge },
        ].map(({ label, supported }) => (
          <span key={label} className={cn(
            "flex items-center gap-1 text-[11px] font-medium",
            supported ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400 dark:text-zinc-600"
          )}>
            {supported
              ? <CheckCircle2 className="size-3 shrink-0" />
              : <XCircle className="size-3 shrink-0" />}
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
