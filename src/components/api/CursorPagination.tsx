"use client";

import { useState, useEffect, useRef } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { ChevronRight, RefreshCw } from "lucide-react";

export const CursorPaginationSchema = z.object({
  method: z.enum(["offset", "cursor"]).default("offset"),
  pageSize: z.number().default(3),
  totalItems: z.number().default(10),
});

export type CursorPaginationProps = z.infer<typeof CursorPaginationSchema>;

const ALL_USERS = [
  { id: 1, name: "Alice",   color: "bg-violet-500" },
  { id: 2, name: "Bob",     color: "bg-blue-500" },
  { id: 3, name: "Charlie", color: "bg-emerald-500" },
  { id: 4, name: "Dana",    color: "bg-amber-500" },
  { id: 5, name: "Eve",     color: "bg-pink-500" },
  { id: 6, name: "Frank",   color: "bg-cyan-500" },
  { id: 7, name: "Grace",   color: "bg-orange-500" },
  { id: 8, name: "Henry",   color: "bg-indigo-500" },
  { id: 9, name: "Iris",    color: "bg-teal-500" },
  { id: 10, name: "Jake",   color: "bg-rose-500" },
];

type User = { id: number; name: string; color: string };

export function CursorPagination({
  method: initialMethod = "offset",
  pageSize = 3,
}: CursorPaginationProps) {
  const [activeTab, setActiveTab] = useState<"offset" | "cursor">(initialMethod);
  const [page, setPage] = useState(0);
  const [insertedItem, setInsertedItem] = useState(false);
  const [showDuplicate, setShowDuplicate] = useState(false);
  const [animating, setAnimating] = useState(false);
  const prevTabRef = useRef(activeTab);

  // Reset when tab changes
  useEffect(() => {
    if (prevTabRef.current !== activeTab) {
      setPage(0);
      setInsertedItem(false);
      setShowDuplicate(false);
      setAnimating(false);
      prevTabRef.current = activeTab;
    }
  }, [activeTab]);

  // Build table with optional injected row (simulates concurrent insert)
  const baseUsers: User[] = [...ALL_USERS];
  // After going to page 2 in offset mode, simulate an item inserted at position 3
  const tableUsers: User[] = insertedItem
    ? [
        ...baseUsers.slice(0, 3),
        { id: 99, name: "New User", color: "bg-lime-500" },
        ...baseUsers.slice(3),
      ]
    : baseUsers;

  // Offset pagination rows
  const offsetRows = tableUsers.slice(page * pageSize, page * pageSize + pageSize);

  // Cursor pagination rows (stable, uses id > cursor)
  const cursors = [0, 3, 6, 9];
  const cursorValue = cursors[page] ?? cursors[cursors.length - 1];
  const cursorRows = baseUsers.filter((u) => u.id > cursorValue).slice(0, pageSize);
  const nextCursor = cursorRows.length > 0 ? cursorRows[cursorRows.length - 1].id : null;

  function handleNext() {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => {
      if (activeTab === "offset" && page === 0) {
        // Simulate insert happening between page 1 and page 2
        setInsertedItem(true);
        setPage(1);
        setShowDuplicate(true);
      } else {
        setPage((p) => p + 1);
      }
      setAnimating(false);
    }, 1200);
  }

  function reset() {
    setPage(0);
    setInsertedItem(false);
    setShowDuplicate(false);
    setAnimating(false);
  }

  const offsetRequest = page === 0
    ? `GET /api/users?limit=${pageSize}&offset=0`
    : `GET /api/users?limit=${pageSize}&offset=${page * pageSize}`;

  const cursorRequest = page === 0
    ? `GET /api/users?limit=${pageSize}&cursor=`
    : `GET /api/users?limit=${pageSize}&cursor=cursor_${cursors[page - 1] ?? 0}`;

  const canGoNext =
    activeTab === "offset"
      ? page < 2
      : cursorRows.length === pageSize && page < 3;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <ChevronRight className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">Cursor Pagination</span>
        <button onClick={reset} className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all duration-500">
          <RefreshCw className="size-3.5" />
        </button>
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        Fetch results in chunks — offset pages can skip or duplicate rows when data changes; cursors stay stable.
      </p>

      {/* Tabs */}
      <div className="flex border-b border-zinc-100 dark:border-zinc-800">
        {(["offset", "cursor"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 py-2 text-xs font-semibold transition-all duration-500",
              activeTab === tab
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border-b-2 border-zinc-900 dark:border-zinc-100"
                : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 bg-zinc-50 dark:bg-zinc-900/50"
            )}
          >
            {tab === "offset" ? "Offset Pagination" : "Cursor Pagination"}
          </button>
        ))}
      </div>

      <div className="p-4 min-h-[220px] flex flex-col gap-3">
        {/* API Request */}
        <div className="bg-zinc-50 dark:bg-zinc-800/60 rounded-lg px-3 py-2 font-mono text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">GET</span>
          <span className="truncate">{activeTab === "offset" ? offsetRequest : cursorRequest}</span>
        </div>

        {/* Insert notice */}
        {activeTab === "offset" && insertedItem && (
          <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-1.5 text-[11px] text-amber-700 dark:text-amber-300">
            <span className="text-amber-500">⚠</span>
            <span>New item inserted between pages during this query!</span>
          </div>
        )}

        {/* Rows */}
        <div className="flex flex-col gap-1.5">
          <div className="text-[10px] text-zinc-400 uppercase tracking-wide font-semibold mb-0.5">
            Page {page + 1} results
          </div>
          {(activeTab === "offset" ? offsetRows : cursorRows).map((user) => {
            const isDuplicate = activeTab === "offset" && showDuplicate && page === 1 && user.id === 3;
            return (
              <div
                key={`${user.id}-${page}`}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 transition-all duration-500 border",
                  isDuplicate
                    ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                    : "bg-zinc-50 dark:bg-zinc-800/40 border-transparent"
                )}
              >
                <div className={cn("size-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0", user.color)}>
                  {user.name[0]}
                </div>
                <span className="text-xs font-mono text-zinc-600 dark:text-zinc-400 w-4">{user.id}</span>
                <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex-1">{user.name}</span>
                {isDuplicate && (
                  <span className="text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/40 px-2 py-0.5 rounded">
                    DUPLICATE!
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Cursor token */}
        {activeTab === "cursor" && nextCursor && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2 text-[11px]">
            <span className="text-blue-500 dark:text-blue-400 font-semibold">cursor →</span>
            <span className="font-mono text-blue-700 dark:text-blue-300 ml-2">&quot;cursor_{nextCursor}&quot;</span>
            <span className="text-blue-500 dark:text-blue-400 ml-2 text-[10px]">(use in next request)</span>
          </div>
        )}

        {/* Problems / Benefits */}
        {activeTab === "offset" ? (
          <div className="grid grid-cols-1 gap-1 mt-auto">
            <div className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wide">Problems with offset</div>
            {[
              { ok: false, text: "Row inserted → item duplicated across pages" },
              { ok: false, text: "Row deleted → item skipped" },
              { ok: false, text: "Not stable for real-time or concurrent writes" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-[11px]">
                <span className={item.ok ? "text-emerald-500" : "text-red-500"}>{item.ok ? "✓" : "✗"}</span>
                <span className="text-zinc-600 dark:text-zinc-400">{item.text}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-1 mt-auto">
            <div className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wide">Benefits of cursor</div>
            {[
              { ok: true, text: "Stable — insertions/deletions don't affect cursor position" },
              { ok: true, text: "Consistent — works with real-time data" },
              { ok: true, text: "Efficient — index seek vs full table scan" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-[11px]">
                <span className={item.ok ? "text-emerald-500" : "text-red-500"}>{item.ok ? "✓" : "✗"}</span>
                <span className="text-zinc-600 dark:text-zinc-400">{item.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/30 min-h-[52px]">
        <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">
          {activeTab === "offset"
            ? page === 0 ? "Click Next Page to see what happens when items are inserted between pages." : showDuplicate ? "Charlie appears twice — offset shifted because of the insert!" : "Keep paginating…"
            : "Cursor stays stable regardless of inserts or deletes."}
        </span>
        <button
          onClick={handleNext}
          disabled={!canGoNext || animating}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-500 shrink-0 hover:opacity-90",
            canGoNext && !animating
              ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
          )}
        >
          Next Page <ChevronRight className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
