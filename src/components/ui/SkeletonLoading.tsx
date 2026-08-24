"use client";

import { useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export const SkeletonLoadingSchema = z.object({
  pattern: z.enum(["card", "list", "profile", "table"]).default("card"),
  loaded: z.boolean().default(false),
});

export type SkeletonLoadingProps = z.infer<typeof SkeletonLoadingSchema>;

const PATTERNS = ["card", "list", "profile", "table"] as const;
const PATTERN_LABELS: Record<string, string> = { card: "Card", list: "List", profile: "Profile", table: "Table" };

// Skeleton base class — shimmer via opacity, not animate-pulse (header icon handles loading motion)
const SK = "bg-zinc-200 dark:bg-zinc-700 rounded";

/* ── Card pattern ── */
function CardSkeleton() {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden w-48">
      <div className={cn(SK, "h-28 rounded-none")} />
      <div className="p-3 space-y-2">
        <div className={cn(SK, "h-3 w-3/4")} />
        <div className={cn(SK, "h-2.5 w-full")} />
        <div className={cn(SK, "h-2.5 w-5/6")} />
        <div className={cn(SK, "h-4 w-1/3 mt-1")} />
      </div>
    </div>
  );
}

function CardLoaded() {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden w-48">
      <div className="h-28 bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
        <span className="text-3xl">🍎</span>
      </div>
      <div className="p-3 space-y-1.5">
        <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Organic Apple</div>
        <div className="text-xs text-zinc-500 dark:text-zinc-400">Fresh from the farm. Rich in fiber.</div>
        <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1">$1.99 / lb</div>
      </div>
    </div>
  );
}

/* ── List pattern ── */
function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-3 px-3 py-2">
      <div className={cn(SK, "size-9 rounded-full shrink-0")} />
      <div className="flex-1 space-y-1.5">
        <div className={cn(SK, "h-3 w-1/2")} />
        <div className={cn(SK, "h-2.5 w-3/4")} />
      </div>
    </div>
  );
}

function ListItemLoaded({ name, role, avatar }: { name: string; role: string; avatar: string }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2">
      <div className="size-9 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
        {avatar}
      </div>
      <div className="flex-1">
        <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{name}</div>
        <div className="text-xs text-zinc-500 dark:text-zinc-400">{role}</div>
      </div>
    </div>
  );
}

const LIST_DATA = [
  { name: "Alice Johnson", role: "Engineering Lead", avatar: "AJ" },
  { name: "Bob Smith",     role: "Product Manager",  avatar: "BS" },
  { name: "Carol White",   role: "UX Designer",      avatar: "CW" },
  { name: "Dave Kim",      role: "Backend Engineer",  avatar: "DK" },
];

/* ── Profile pattern ── */
function ProfileSkeleton() {
  return (
    <div className="space-y-3 p-2">
      <div className="flex items-center gap-4">
        <div className={cn(SK, "size-16 rounded-full shrink-0")} />
        <div className="flex-1 space-y-2">
          <div className={cn(SK, "h-4 w-2/3")} />
          <div className={cn(SK, "h-3 w-1/2")} />
          <div className={cn(SK, "h-2.5 w-3/4")} />
        </div>
      </div>
      <div className="space-y-1.5">
        <div className={cn(SK, "h-2.5 w-full")} />
        <div className={cn(SK, "h-2.5 w-5/6")} />
        <div className={cn(SK, "h-2.5 w-4/6")} />
      </div>
      <div className="flex gap-3">
        <div className={cn(SK, "h-10 flex-1 rounded-lg")} />
        <div className={cn(SK, "h-10 flex-1 rounded-lg")} />
        <div className={cn(SK, "h-10 flex-1 rounded-lg")} />
      </div>
    </div>
  );
}

function ProfileLoaded() {
  return (
    <div className="space-y-3 p-2">
      <div className="flex items-center gap-4">
        <div className="size-16 rounded-full bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center text-white text-xl font-bold shrink-0">
          AJ
        </div>
        <div className="flex-1">
          <div className="text-base font-bold text-zinc-900 dark:text-zinc-100">Alice Johnson</div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">@alice · Engineering Lead</div>
          <div className="text-xs text-blue-500 dark:text-blue-400 mt-0.5">alice@example.com</div>
        </div>
      </div>
      <p className="text-xs text-zinc-600 dark:text-zinc-400">
        Building distributed systems at scale. Open-source contributor. Loves Go, Rust, and strong coffee.
      </p>
      <div className="flex gap-3">
        {[["142", "Repos"], ["8.4K", "Followers"], ["312", "Following"]].map(([val, label]) => (
          <div key={label} className="flex-1 bg-zinc-50 dark:bg-zinc-800 rounded-lg p-2 text-center">
            <div className="text-sm font-bold text-zinc-800 dark:text-zinc-100">{val}</div>
            <div className="text-[10px] text-zinc-400">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Table pattern ── */
const TABLE_HEADERS = ["Name", "Status", "Value", "Updated"];
const TABLE_DATA = [
  ["api-service",  "healthy",  "99.9%",  "2s ago"],
  ["auth-server",  "healthy",  "99.7%",  "5s ago"],
  ["db-primary",   "degraded", "98.1%",  "12s ago"],
  ["cache-redis",  "healthy",  "100%",   "1s ago"],
];

function TableSkeleton() {
  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-zinc-100 dark:border-zinc-800">
          {TABLE_HEADERS.map((h) => (
            <th key={h} className="px-3 py-2 text-left">
              <div className={cn(SK, "h-2.5 w-12")} />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {[0, 1, 2, 3].map((i) => (
          <tr key={i} className="border-b border-zinc-50 dark:border-zinc-800/50">
            {TABLE_HEADERS.map((_, ci) => (
              <td key={ci} className="px-3 py-2.5">
                <div className={cn(SK, "h-2.5", ci === 0 ? "w-24" : ci === 1 ? "w-14" : ci === 2 ? "w-10" : "w-12")} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TableLoaded() {
  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-zinc-100 dark:border-zinc-800">
          {TABLE_HEADERS.map((h) => (
            <th key={h} className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-zinc-400">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {TABLE_DATA.map(([name, status, value, updated]) => (
          <tr key={name} className="border-b border-zinc-50 dark:border-zinc-800/50">
            <td className="px-3 py-2.5 text-xs font-mono font-medium text-zinc-700 dark:text-zinc-300">{name}</td>
            <td className="px-3 py-2.5">
              <span className={cn(
                "text-[10px] font-semibold px-1.5 py-0.5 rounded",
                status === "healthy"
                  ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                  : "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"
              )}>
                {status}
              </span>
            </td>
            <td className="px-3 py-2.5 text-xs font-mono text-zinc-600 dark:text-zinc-400">{value}</td>
            <td className="px-3 py-2.5 text-[10px] text-zinc-400">{updated}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function SkeletonLoading({
  pattern: initialPattern = "card",
  loaded: initialLoaded = false,
}: SkeletonLoadingProps) {
  const [pattern, setPattern] = useState(initialPattern);
  const [loaded, setLoaded] = useState(initialLoaded);

  const isLoading = !loaded;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <Loader2 className={cn("size-4 text-zinc-400 shrink-0", isLoading && "animate-spin")} />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">Skeleton Loading</span>
        <span className={cn(
          "text-[10px] font-semibold px-2 py-0.5 rounded",
          isLoading
            ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
            : "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
        )}>
          {isLoading ? "Loading…" : "Loaded"}
        </span>
      </div>

      <div className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        Placeholder shapes show page structure while data loads — users perceive faster apps.
      </div>

      {/* Pattern tabs */}
      <div className="px-4 pt-3 pb-2 flex gap-1.5 border-b border-zinc-100 dark:border-zinc-800">
        {PATTERNS.map((p) => (
          <button
            key={p}
            onClick={() => { setPattern(p); setLoaded(false); }}
            className={cn(
              "px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all duration-500 cursor-pointer",
              pattern === p
                ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white"
                : "border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-zinc-400"
            )}
          >
            {PATTERN_LABELS[p]}
          </button>
        ))}
      </div>

      {/* Content area — fixed height, no layout shift */}
      <div className="min-h-[220px] px-4 py-4 flex flex-col justify-center">
        <div className="transition-opacity duration-500">
          {/* Card */}
          {pattern === "card" && (
            <div className="flex justify-center py-2">
              {isLoading ? <CardSkeleton /> : <CardLoaded />}
            </div>
          )}

          {/* List */}
          {pattern === "list" && (
            <div className="rounded-xl border border-zinc-100 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800 overflow-hidden">
              {isLoading
                ? [0, 1, 2, 3].map((i) => <ListItemSkeleton key={i} />)
                : LIST_DATA.map((item) => (
                    <ListItemLoaded key={item.name} {...item} />
                  ))
              }
            </div>
          )}

          {/* Profile */}
          {pattern === "profile" && (
            <div className="rounded-xl border border-zinc-100 dark:border-zinc-800 overflow-hidden p-1">
              {isLoading ? <ProfileSkeleton /> : <ProfileLoaded />}
            </div>
          )}

          {/* Table */}
          {pattern === "table" && (
            <div className="rounded-xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
              {isLoading ? <TableSkeleton /> : <TableLoaded />}
            </div>
          )}
        </div>
      </div>

      <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/30">
        <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">
          {isLoading
            ? "Showing skeleton placeholder — users see structure before data arrives."
            : "Content loaded successfully — skeleton replaced with real data."}
        </span>
        <button
          onClick={() => {
            if (loaded) {
              setLoaded(false);
            } else {
              setTimeout(() => setLoaded(true), 1000);
            }
          }}
          className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          {loaded ? "Reload" : "Load Content"}
        </button>
      </div>
    </div>
  );
}
