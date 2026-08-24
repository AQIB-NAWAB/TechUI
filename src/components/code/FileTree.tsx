"use client";

import { useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileText, FolderTree } from "lucide-react";

type FileNode = {
  name: string;
  type: "file" | "dir";
  children?: FileNode[];
  badge?: string;
  highlighted?: boolean;
};

const FileNodeSchema: z.ZodType<FileNode> = z.lazy(() =>
  z.object({
    name: z.string(),
    type: z.enum(["file", "dir"]).default("file"),
    children: z.array(FileNodeSchema).optional(),
    badge: z.string().optional(),
    highlighted: z.boolean().optional(),
  })
);

export const FileTreeSchema = z.object({
  title: z.string().optional().default("Project Structure"),
  nodes: z.array(FileNodeSchema),
  defaultExpanded: z.boolean().optional().default(true),
});

export type FileTreeProps = z.infer<typeof FileTreeSchema>;


function TreeNode({ node, depth, defaultExpanded }: { node: FileNode; depth: number; defaultExpanded: boolean }) {
  const [open, setOpen] = useState(defaultExpanded || depth < 1);
  const isDir = node.type === "dir";

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-1.5 py-[3px] rounded-md text-xs cursor-pointer select-none hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all duration-500",
          node.highlighted && "bg-blue-50 dark:bg-blue-950/20"
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px`, paddingRight: 8 }}
        onClick={() => isDir && setOpen((v) => !v)}
      >
        {isDir ? (
          <>
            {open
              ? <ChevronDown className="size-3 text-zinc-400 shrink-0" />
              : <ChevronRight className="size-3 text-zinc-400 shrink-0" />
            }
            {open
              ? <FolderOpen className="size-3.5 text-zinc-400 shrink-0" />
              : <Folder className="size-3.5 text-zinc-400 shrink-0" />
            }
            <span className="text-zinc-700 dark:text-zinc-300 font-medium">{node.name}</span>
          </>
        ) : (
          <>
            <span className="w-3 shrink-0" />
            <FileText className="size-3.5 shrink-0 text-zinc-400" />
            <span className={cn(
              node.highlighted
                ? "text-blue-700 dark:text-blue-300 font-medium"
                : "text-zinc-600 dark:text-zinc-400"
            )}>
              {node.name}
            </span>
          </>
        )}
        {node.badge && (
          <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-medium">
            {node.badge}
          </span>
        )}
      </div>

      {isDir && open && node.children?.map((child, i) => (
        <TreeNode key={i} node={child} depth={depth + 1} defaultExpanded={defaultExpanded} />
      ))}
    </div>
  );
}

export function FileTree({ title = "Project Structure", nodes, defaultExpanded = true }: FileTreeProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <FolderTree className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">{title}</span>
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        Folders and files in a project — click folders to expand or collapse the tree.
      </p>

      <div className="min-h-[220px] py-2 px-2 font-mono overflow-auto">
        {nodes.map((node, i) => (
          <TreeNode key={`${i}-${expanded}`} node={node} depth={0} defaultExpanded={expanded} />
        ))}
      </div>

      <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/30">
        <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">
          {expanded ? "All folders expanded" : "Folders collapsed — expand to browse files"}
        </span>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          {expanded ? "Collapse All" : "Expand All"}
        </button>
      </div>
    </div>
  );
}
