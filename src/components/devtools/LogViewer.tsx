"use client";

import { useState, useRef, useEffect } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Terminal, Filter, X, ChevronDown, ChevronRight } from "lucide-react";

const LogLevelEnum = z.enum(["debug", "info", "warn", "error", "fatal"]);
type LogLevel = z.infer<typeof LogLevelEnum>;

export const LogViewerSchema = z.object({
  title: z.string().optional().default("application.log"),
  logs: z.array(
    z.object({
      ts: z.string().optional(),
      level: LogLevelEnum.optional().default("info"),
      message: z.string(),
      service: z.string().optional(),
      fields: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
      traceId: z.string().optional(),
    })
  ),
  maxHeight: z.number().optional().default(400),
  showFilter: z.boolean().optional().default(true),
  autoScroll: z.boolean().optional().default(false),
  compact: z.boolean().optional().default(false),
});

export type LogViewerProps = z.infer<typeof LogViewerSchema>;

const LEVEL_CFG: Record<LogLevel, { label: string; dot: string; text: string; bg: string; border: string }> = {
  debug: { label: "DBG", dot: "bg-zinc-400", text: "text-zinc-500", bg: "", border: "" },
  info:  { label: "INF", dot: "bg-blue-500", text: "text-blue-600 dark:text-blue-400", bg: "", border: "" },
  warn:  { label: "WRN", dot: "bg-amber-500", text: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950", border: "border-l-2 border-amber-400" },
  error: { label: "ERR", dot: "bg-red-500", text: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950", border: "border-l-2 border-red-500" },
  fatal: { label: "FTL", dot: "bg-red-700", text: "text-red-700 dark:text-red-300 font-bold", bg: "bg-red-50 dark:bg-red-950", border: "border-l-2 border-red-700" },
};

const LEVELS: LogLevel[] = ["debug", "info", "warn", "error", "fatal"];
const LEVEL_ORDER: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3, fatal: 4 };

type LogEntry = LogViewerProps["logs"][number];

function LogRow({ log, compact }: { log: LogEntry; compact: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const level = log.level ?? "info";
  const cfg = LEVEL_CFG[level];
  const hasFields = log.fields && Object.keys(log.fields).length > 0;

  return (
    <div
      className={cn("group transition-all duration-500", cfg.bg, cfg.border, hasFields && "cursor-pointer")}
      onClick={hasFields ? () => setExpanded((v) => !v) : undefined}
    >
      <div className={cn("flex items-start gap-3 font-mono text-xs leading-5", compact ? "px-3 py-1" : "px-4 py-2")}>
        <span className={cn("size-1.5 rounded-full shrink-0 mt-1.5", cfg.dot)} />
        {log.ts && !compact && (
          <span className="text-zinc-400 shrink-0 whitespace-nowrap">{log.ts}</span>
        )}
        <span className={cn("shrink-0 font-semibold text-[10px] mt-0.5", cfg.text)}>{cfg.label}</span>
        {log.service && (
          <span className="text-zinc-400 shrink-0 text-[10px] mt-0.5 truncate max-w-24">{log.service}</span>
        )}
        <span className="text-zinc-800 dark:text-zinc-200 flex-1 break-words min-w-0">{log.message}</span>
        {log.traceId && !compact && (
          <span className="text-zinc-400 text-[10px] shrink-0 truncate max-w-28">{log.traceId}</span>
        )}
        {hasFields && (
          <span className="text-zinc-400 shrink-0 transition-all duration-500">
            {expanded ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
          </span>
        )}
      </div>
      {expanded && hasFields && (
        <div className="px-10 pb-2 flex flex-wrap gap-x-4 gap-y-1">
          {Object.entries(log.fields!).map(([k, v]) => (
            <span key={k} className="text-[11px] font-mono">
              <span className="text-sky-500">{k}</span>
              <span className="text-zinc-400">=</span>
              <span className="text-emerald-600">{typeof v === "string" ? `"${v}"` : String(v)}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function LogViewer({
  title = "application.log",
  logs,
  maxHeight = 400,
  showFilter = true,
  autoScroll = false,
  compact = false,
}: LogViewerProps) {
  const [minLevel, setMinLevel] = useState<LogLevel>("debug");
  const [search, setSearch] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, autoScroll]);

  const filtered = logs.filter((log) => {
    const level = log.level ?? "info";
    if (LEVEL_ORDER[level] < LEVEL_ORDER[minLevel]) return false;
    if (search && !log.message.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts = logs.reduce((acc, log) => {
    const level = log.level ?? "info";
    acc[level] = (acc[level] ?? 0) + 1;
    return acc;
  }, {} as Partial<Record<LogLevel, number>>);

  const errorCount = (counts.error ?? 0) + (counts.fatal ?? 0);

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800">
        <Terminal className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">{title}</span>
        <div className="flex items-center gap-2">
          {(["error", "warn"] as LogLevel[]).map((lv) =>
            counts[lv] ? (
              <span key={lv} className={cn("text-[10px] font-semibold", LEVEL_CFG[lv].text)}>
                {counts[lv]} {LEVEL_CFG[lv].label}
              </span>
            ) : null
          )}
        </div>
        <span className="text-xs text-zinc-400 tabular-nums">{logs.length} lines</span>
      </div>

      <p className="text-sm text-zinc-500 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        Filter and inspect application log output by level and message.
      </p>

      {showFilter && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
          <Filter className="size-3 text-zinc-400 shrink-0" />
          <div className="flex items-center gap-1">
            {LEVELS.map((lv) => (
              <button
                key={lv}
                onClick={() => setMinLevel(lv)}
                className={cn(
                  "text-[10px] font-semibold px-1.5 py-0.5 rounded-md transition-all duration-500",
                  minLevel === lv
                    ? cn(LEVEL_CFG[lv].text, "bg-zinc-100 dark:bg-zinc-800")
                    : "text-zinc-400 hover:text-zinc-600"
                )}
              >
                {LEVEL_CFG[lv].label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 flex-1 max-w-48 ml-auto">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="filter…"
              className="flex-1 bg-transparent text-xs font-mono text-zinc-700 dark:text-zinc-300 outline-none placeholder:text-zinc-400"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-zinc-400 hover:text-zinc-600 transition-all duration-500">
                <X className="size-3" />
              </button>
            )}
          </div>
        </div>
      )}

      <div
        className="min-h-[220px] overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800"
        style={{ maxHeight: Math.min(maxHeight, 320) }}
      >
        {filtered.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-zinc-400">No log lines match</div>
        )}
        {filtered.map((log, i) => (
          <LogRow key={i} log={log} compact={compact} />
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-3">
        <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">
          Showing {filtered.length} of {logs.length} lines
          {errorCount > 0 && <span className="text-red-500 ml-1">· {errorCount} error{errorCount !== 1 ? "s" : ""}</span>}
        </span>
        {search && (
          <button
            onClick={() => setSearch("")}
            className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Clear filter
          </button>
        )}
      </div>
    </div>
  );
}
