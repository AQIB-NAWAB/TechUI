"use client";

import { useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { GitMerge, ChevronDown, ChevronRight, Plus, Minus } from "lucide-react";

const DiffLineTypeEnum = z.enum(["added", "removed", "context", "header"]);

export const GitDiffSchema = z.object({
  files: z.array(
    z.object({
      path: z.string(),
      language: z.string().optional().default("typescript"),
      additions: z.number().optional().default(0),
      deletions: z.number().optional().default(0),
      hunks: z.array(
        z.object({
          header: z.string(),
          lines: z.array(
            z.object({
              type: DiffLineTypeEnum,
              content: z.string(),
              lineNo: z.number().optional(),
            })
          ),
        })
      ),
    })
  ),
  branch: z.string().optional(),
  commit: z.string().optional(),
  message: z.string().optional(),
  collapsed: z.boolean().optional().default(false),
});

export type GitDiffProps = z.infer<typeof GitDiffSchema>;

const LINE_CFG = {
  added:   { bg: "bg-emerald-50 dark:bg-emerald-950/20", text: "text-emerald-800 dark:text-emerald-300", marker: "+", markerColor: "text-emerald-600 dark:text-emerald-500 select-none" },
  removed: { bg: "bg-red-50 dark:bg-red-950/20",         text: "text-red-800 dark:text-red-300",         marker: "-", markerColor: "text-red-600 dark:text-red-500 select-none"         },
  context: { bg: "",                                      text: "text-zinc-600 dark:text-zinc-400",       marker: " ", markerColor: "text-zinc-300 dark:text-zinc-700 select-none"       },
  header:  { bg: "bg-blue-50 dark:bg-blue-950/10",        text: "text-blue-600 dark:text-blue-400",       marker: "@", markerColor: "text-blue-400 dark:text-blue-600 select-none"       },
};

function fileStatusColor(additions: number, deletions: number) {
  if (additions > 0 && deletions === 0) return "text-emerald-500";
  if (deletions > 0 && additions === 0) return "text-red-500";
  return "text-amber-500";
}

function FileIcon({ path }: { path: string }) {
  const ext = path.split(".").pop() ?? "";
  const colors: Record<string, string> = {
    ts: "text-blue-500", tsx: "text-blue-400", js: "text-yellow-500", jsx: "text-yellow-400",
    py: "text-green-500", go: "text-cyan-500", rs: "text-orange-500",
    json: "text-zinc-500", yaml: "text-violet-500", yml: "text-violet-500",
    md: "text-zinc-400", css: "text-pink-500", html: "text-orange-500",
    sh: "text-emerald-600", sql: "text-indigo-500",
  };
  return (
    <span className={cn("text-[10px] font-bold font-mono", colors[ext] ?? "text-zinc-400")}>
      .{ext}
    </span>
  );
}

function FileDiff({ file, initCollapsed }: { file: GitDiffProps["files"][number]; initCollapsed: boolean }) {
  const [collapsed, setCollapsed] = useState(initCollapsed);
  const sc = fileStatusColor(file.additions, file.deletions);

  return (
    <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
      {/* File header */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900/70 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors text-left"
      >
        {collapsed ? <ChevronRight className="size-3.5 text-zinc-400 shrink-0" /> : <ChevronDown className="size-3.5 text-zinc-400 shrink-0" />}
        <FileIcon path={file.path} />
        <span className="text-xs font-mono text-zinc-700 dark:text-zinc-300 flex-1 truncate">{file.path}</span>
        <div className="flex items-center gap-2 shrink-0">
          {file.additions > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              <Plus className="size-2.5" />{file.additions}
            </span>
          )}
          {file.deletions > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] font-semibold text-red-600 dark:text-red-400">
              <Minus className="size-2.5" />{file.deletions}
            </span>
          )}
          <div className="flex gap-0.5 items-center">
            {Array.from({ length: Math.min(5, file.additions + file.deletions) }).map((_, i) => {
              const addFrac = file.additions / Math.max(1, file.additions + file.deletions);
              const isAdd = i < Math.round(addFrac * 5);
              return (
                <span key={i} className={cn("size-2 rounded-sm", isAdd ? "bg-emerald-500" : "bg-red-500")} />
              );
            })}
          </div>
        </div>
      </button>

      {/* Hunks */}
      {!collapsed && (
        <div className="overflow-x-auto">
          {file.hunks.map((hunk, hi) => (
            <div key={hi}>
              {/* Hunk header */}
              <div className="bg-blue-50/50 dark:bg-blue-950/10 px-4 py-1 font-mono text-[11px] text-blue-500 dark:text-blue-500 border-y border-blue-100 dark:border-blue-900/30">
                {hunk.header}
              </div>
              {/* Lines */}
              {hunk.lines.map((line, li) => {
                const cfg = LINE_CFG[line.type];
                return (
                  <div key={li} className={cn("flex items-start font-mono text-xs leading-6", cfg.bg)}>
                    <span className="select-none w-10 text-right text-[10px] text-zinc-300 dark:text-zinc-700 px-2 py-0 shrink-0">
                      {line.lineNo ?? ""}
                    </span>
                    <span className={cn("px-1 shrink-0 font-semibold", cfg.markerColor)}>{cfg.marker}</span>
                    <span className={cn("pr-4 whitespace-pre flex-1", cfg.text)}>{line.content}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function GitDiff({
  files,
  branch,
  commit,
  message,
  collapsed: initCollapsed = false,
}: GitDiffProps) {
  const totalAdditions = files.reduce((s, f) => s + f.additions, 0);
  const totalDeletions = files.reduce((s, f) => s + f.deletions, 0);

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/50">
        <GitMerge className="size-3.5 text-violet-500 shrink-0" />
        <div className="flex-1 min-w-0">
          {message && (
            <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">{message}</div>
          )}
          {(branch || commit) && (
            <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400 mt-0.5">
              {branch && <span className="text-violet-500 dark:text-violet-400">{branch}</span>}
              {commit && <span>{commit.slice(0, 8)}</span>}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0 text-[10px] font-semibold">
          <span className="text-zinc-500">{files.length} file{files.length !== 1 ? "s" : ""}</span>
          <span className="text-emerald-600 dark:text-emerald-400">+{totalAdditions}</span>
          <span className="text-red-600 dark:text-red-400">-{totalDeletions}</span>
        </div>
      </div>

      {/* Files */}
      <div className="p-4 space-y-3">
        {files.map((file, i) => (
          <FileDiff key={i} file={file} initCollapsed={initCollapsed} />
        ))}
      </div>
    </div>
  );
}
