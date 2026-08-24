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
  added:   { bg: "bg-emerald-50 dark:bg-emerald-950", text: "text-emerald-800 dark:text-emerald-300", marker: "+", markerColor: "text-emerald-600 dark:text-emerald-500 select-none" },
  removed: { bg: "bg-red-50 dark:bg-red-950",         text: "text-red-800 dark:text-red-300",         marker: "-", markerColor: "text-red-600 dark:text-red-500 select-none" },
  context: { bg: "",                                   text: "text-zinc-600 dark:text-zinc-400",       marker: " ", markerColor: "text-zinc-300 dark:text-zinc-700 select-none" },
  header:  { bg: "bg-blue-50 dark:bg-blue-950",        text: "text-blue-600 dark:text-blue-400",       marker: "@", markerColor: "text-blue-400 dark:text-blue-600 select-none" },
};

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

  return (
    <div className="border border-zinc-100 dark:border-zinc-800 rounded-lg overflow-hidden">
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-500 text-left border-b border-zinc-100 dark:border-zinc-800"
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
        </div>
      </button>

      {!collapsed && (
        <div className="overflow-x-auto">
          {file.hunks.map((hunk, hi) => (
            <div key={hi}>
              <div className="bg-blue-50 dark:bg-blue-950 px-4 py-1 font-mono text-[11px] text-blue-600 dark:text-blue-400 border-y border-blue-100 dark:border-blue-800">
                {hunk.header}
              </div>
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
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800">
        <GitMerge className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1 truncate">
          {message ?? "Git Diff"}
        </span>
        {(branch || commit) && (
          <span className="text-[10px] font-mono text-zinc-400">
            {branch && <span className="text-violet-500">{branch}</span>}
            {commit && <span className="ml-1">{commit.slice(0, 8)}</span>}
          </span>
        )}
        <span className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold">+{totalAdditions}</span>
        <span className="text-red-600 dark:text-red-400 text-xs font-semibold">-{totalDeletions}</span>
      </div>

      <p className="text-sm text-zinc-500 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        {files.length} file{files.length !== 1 ? "s" : ""} changed — green additions, red deletions.
      </p>

      <div className="min-h-[240px] max-h-[360px] overflow-y-auto p-4 space-y-3">
        {files.map((file, i) => (
          <FileDiff key={i} file={file} initCollapsed={initCollapsed} />
        ))}
      </div>

      <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-3">
        <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">
          {files.length} file{files.length !== 1 ? "s" : ""} · +{totalAdditions} / -{totalDeletions} lines
        </span>
      </div>
    </div>
  );
}
