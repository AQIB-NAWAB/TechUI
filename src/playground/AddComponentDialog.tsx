"use client";

import { useEffect } from "react";
import { X, Copy, Check, Terminal, FolderTree, Package, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ComponentCategory } from "@/registry/types";
import {
  NPM_PACKAGE,
  getAddCommand,
  getAddUtilsCommand,
  getInitCommand,
  getImportPath,
  getInstallPath,
  toComponentName,
} from "@/lib/techui-cli";

type AddComponentDialogProps = {
  open: boolean;
  onClose: () => void;
  id: string;
  name: string;
  category: ComponentCategory;
  copied: string | null;
  onCopy: (text: string, key: string) => void;
};

function Step({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-zinc-900 dark:bg-white text-[11px] font-bold text-white dark:text-zinc-900">
        {number}
      </span>
      <div className="min-w-0 flex-1 space-y-2">
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</p>
        {children}
      </div>
    </div>
  );
}

function CommandBlock({
  command,
  copyKey,
  copied,
  onCopy,
}: {
  command: string;
  copyKey: string;
  copied: string | null;
  onCopy: (text: string, key: string) => void;
}) {
  return (
    <div className="relative group">
      <pre className="overflow-x-auto rounded-lg bg-zinc-950 px-3 py-2.5 text-[11px] font-mono text-zinc-300 leading-relaxed">
        {command}
      </pre>
      <button
        onClick={() => onCopy(command, copyKey)}
        className={cn(
          "absolute right-2 top-2 flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-colors",
          "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 opacity-0 group-hover:opacity-100 focus:opacity-100"
        )}
      >
        {copied === copyKey ? (
          <>
            <Check className="size-3 text-emerald-400" /> Copied
          </>
        ) : (
          <>
            <Copy className="size-3" /> Copy
          </>
        )}
      </button>
    </div>
  );
}

export function AddComponentDialog({
  open,
  onClose,
  id,
  name,
  category,
  copied,
  onCopy,
}: AddComponentDialogProps) {
  const componentName = toComponentName(id);
  const installPath = getInstallPath(category, id);
  const importPath = getImportPath(category, id);
  const usageSnippet = `import { ${componentName} } from "${importPath}";

export default function Example() {
  return <${componentName} />;
}`;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close dialog"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-component-title"
        className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-zinc-100 dark:border-zinc-900 bg-white/95 dark:bg-zinc-950/95 backdrop-blur px-5 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Package className="size-4 text-zinc-500 shrink-0" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                Add to your project
              </span>
            </div>
            <h2 id="add-component-title" className="text-lg font-bold text-zinc-900 dark:text-zinc-100 truncate">
              {name}
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5 font-mono">{id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors shrink-0"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="px-5 py-5 space-y-6">
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            TechUI installs like{" "}
            <a
              href="https://ui.shadcn.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-zinc-900 dark:hover:text-zinc-200"
            >
              shadcn/ui
            </a>
            . You copy the source into your repo — fully editable, no black-box package.
          </p>

          <div className="space-y-5">
            <Step number={1} title="Initialize TechUI (first time only)">
              <CommandBlock
                command={getInitCommand()}
                copyKey="init"
                copied={copied}
                onCopy={onCopy}
              />
              <p className="text-xs text-zinc-500">Creates <code className="text-[10px] bg-zinc-100 dark:bg-zinc-900 px-1 py-0.5 rounded">techui.json</code> in your project root.</p>
            </Step>

            <Step number={2} title="Add the cn() utility (if you don't have it)">
              <CommandBlock
                command={getAddUtilsCommand()}
                copyKey="utils"
                copied={copied}
                onCopy={onCopy}
              />
            </Step>

            <Step number={3} title={`Add ${name}`}>
              <CommandBlock
                command={getAddCommand(id)}
                copyKey="add"
                copied={copied}
                onCopy={onCopy}
              />
            </Step>
          </div>

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              <FolderTree className="size-3.5" />
              Installed to
            </div>
            <code className="block text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-white dark:bg-zinc-950 rounded-lg px-3 py-2 border border-zinc-200 dark:border-zinc-800">
              {installPath}
            </code>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              All TechUI components live under <code className="bg-zinc-200/60 dark:bg-zinc-800 px-1 rounded">src/components/techui/</code> so they stay separate from your app components.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              <Terminal className="size-3.5" />
              Then import in your page
            </div>
            <div className="relative group">
              <pre className="overflow-x-auto rounded-lg bg-zinc-950 px-3 py-3 text-[11px] font-mono text-zinc-300 leading-relaxed">
                {usageSnippet}
              </pre>
              <button
                onClick={() => onCopy(usageSnippet, "usage")}
                className={cn(
                  "absolute right-2 top-2 flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-colors",
                  "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 opacity-0 group-hover:opacity-100 focus:opacity-100"
                )}
              >
                {copied === "usage" ? (
                  <>
                    <Check className="size-3 text-emerald-400" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="size-3" /> Copy
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-900">
            <p className="text-[11px] text-zinc-400">
              npm: <span className="font-mono text-zinc-600 dark:text-zinc-300">{NPM_PACKAGE}</span>
            </p>
            <a
              href={`https://www.npmjs.com/package/${NPM_PACKAGE}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              View on npm <ChevronRight className="size-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
