"use client";

import { useState, useMemo } from "react";
import {
  Search, Moon, Sun, Monitor, Tablet, Smartphone,
  Code2, Layers, ChevronRight, ChevronDown, RotateCcw,
  Copy, Check, Braces, BookOpen, Settings2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { registry, CATEGORIES } from "@/registry";
import type { ComponentCategory } from "@/registry/types";
import { LivePreview } from "./LivePreview";
import { PropsPanel } from "./PropsPanel";

type ViewportSize = "desktop" | "tablet" | "mobile";
type ActiveTab = "preview" | "json" | "schema";

const VIEWPORT_WIDTHS: Record<ViewportSize, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "390px",
};

export function PlaygroundShell() {
  const [selectedId, setSelectedId] = useState<string>("api-request");
  const [darkMode, setDarkMode] = useState(false);
  const [viewport, setViewport] = useState<ViewportSize>("desktop");
  const [activeTab, setActiveTab] = useState<ActiveTab>("preview");
  const [search, setSearch] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["api", "architecture", "database"])
  );
  const [props, setProps] = useState<Record<string, Record<string, unknown>>>({});
  const [copied, setCopied] = useState(false);

  const selectedEntry = registry[selectedId];

  const currentProps = useMemo(() => {
    if (!selectedEntry) return {};
    return props[selectedId] ?? selectedEntry.defaultProps;
  }, [selectedId, selectedEntry, props]);

  function handlePropsChange(newProps: Record<string, unknown>) {
    setProps((prev) => ({ ...prev, [selectedId]: newProps }));
  }

  function resetProps() {
    setProps((prev) => {
      const next = { ...prev };
      delete next[selectedId];
      return next;
    });
  }

  function copyJson() {
    navigator.clipboard.writeText(JSON.stringify(currentProps, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  // Group by category with search
  const grouped = useMemo(() => {
    const q = search.toLowerCase();
    const result: Partial<Record<ComponentCategory, typeof registry[string][]>> = {};
    for (const entry of Object.values(registry)) {
      if (
        q &&
        !entry.name.toLowerCase().includes(q) &&
        !entry.description.toLowerCase().includes(q) &&
        !entry.tags?.some((t) => t.includes(q))
      ) {
        continue;
      }
      if (!result[entry.category]) result[entry.category] = [];
      result[entry.category]!.push(entry);
    }
    return result;
  }, [search]);

  function toggleCategory(cat: string) {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  }

  const jsonString = JSON.stringify(
    { type: selectedEntry?.id, ...currentProps },
    null,
    2
  );

  return (
    <div className={cn("flex h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100", darkMode ? "dark" : "")}>
      {/* Left Sidebar */}
      <aside className="w-64 shrink-0 flex flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        {/* Branding */}
        <div className="px-4 py-4 border-b border-zinc-100 dark:border-zinc-900">
          <div className="flex items-center gap-2.5">
            <div className="size-7 rounded-lg bg-zinc-950 dark:bg-white flex items-center justify-center">
              <Layers className="size-4 text-white dark:text-zinc-950" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-none">TechUI</h1>
              <p className="text-[10px] text-zinc-400 mt-0.5">Component Playground</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="px-3 py-3 border-b border-zinc-100 dark:border-zinc-900">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-zinc-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search components…"
              className="w-full h-8 pl-8 pr-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition-shadow"
            />
          </div>
        </div>

        {/* Categories */}
        <nav className="flex-1 overflow-y-auto py-2">
          {(Object.keys(CATEGORIES) as ComponentCategory[]).map((cat) => {
            const items = grouped[cat];
            if (!items || items.length === 0) return null;
            const isExpanded = expandedCategories.has(cat);
            const cfg = CATEGORIES[cat];
            return (
              <div key={cat}>
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
                  onClick={() => toggleCategory(cat)}
                >
                  {isExpanded
                    ? <ChevronDown className="size-3 text-zinc-400 shrink-0" />
                    : <ChevronRight className="size-3 text-zinc-400 shrink-0" />
                  }
                  <span className={cn("text-[11px] font-semibold uppercase tracking-wider", cfg.color)}>
                    {cfg.label}
                  </span>
                  <span className="ml-auto text-[10px] text-zinc-400">{items.length}</span>
                </button>
                {isExpanded && (
                  <div className="pb-1">
                    {items.map((entry) => (
                      <button
                        key={entry.id}
                        onClick={() => setSelectedId(entry.id)}
                        className={cn(
                          "w-full text-left px-4 py-2 ml-3 rounded-l-none text-xs transition-colors flex items-center gap-2",
                          selectedId === entry.id
                            ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-medium"
                            : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                        )}
                      >
                        <span className="flex-1 truncate">{entry.name}</span>
                        {entry.interactive && (
                          <span className="text-[8px] px-1 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
                            Live
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-900 text-[10px] text-zinc-400">
          {Object.keys(registry).length} components
        </div>
      </aside>

      {/* Main area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Toolbar */}
        <header className="flex items-center gap-4 px-6 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {selectedEntry?.name ?? "Select a component"}
            </h2>
            {selectedEntry && (
              <p className="text-[11px] text-zinc-400 leading-tight truncate max-w-sm">
                {selectedEntry.description}
              </p>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Viewport */}
            <div className="flex items-center gap-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800 p-0.5">
              {([
                ["desktop", Monitor],
                ["tablet", Tablet],
                ["mobile", Smartphone],
              ] as const).map(([v, Icon]) => (
                <button
                  key={v}
                  onClick={() => setViewport(v)}
                  className={cn(
                    "p-1.5 rounded-md transition-colors",
                    viewport === v
                      ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                      : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
                  )}
                >
                  <Icon className="size-3.5" />
                </button>
              ))}
            </div>

            {/* Dark mode */}
            <button
              onClick={() => setDarkMode((v) => !v)}
              className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
            >
              {darkMode ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
            </button>

            {/* Reset */}
            <button
              onClick={resetProps}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              <RotateCcw className="size-3" /> Reset
            </button>
          </div>
        </header>

        {/* Content row */}
        <div className="flex-1 flex overflow-hidden">
          {/* Preview + code area */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Tabs */}
            <div className="flex items-center gap-0 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-6 shrink-0">
              {([
                ["preview", Monitor, "Preview"],
                ["json", Braces, "JSON"],
                ["schema", BookOpen, "Schema"],
              ] as const).map(([tab, Icon, label]) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors -mb-px",
                    activeTab === tab
                      ? "border-zinc-900 dark:border-white text-zinc-900 dark:text-white"
                      : "border-transparent text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
                  )}
                >
                  <Icon className="size-3.5" /> {label}
                </button>
              ))}
            </div>

            {/* Preview area */}
            {activeTab === "preview" && (
              <div className="flex-1 overflow-auto bg-zinc-100 dark:bg-zinc-900 p-6 flex justify-center">
                <div
                  style={{ width: VIEWPORT_WIDTHS[viewport], maxWidth: "100%" }}
                  className={cn(
                    "transition-all duration-300",
                    darkMode ? "dark" : ""
                  )}
                >
                  {selectedEntry ? (
                    <LivePreview
                      entryId={selectedId}
                      props={currentProps}
                      darkMode={darkMode}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-64 text-sm text-zinc-400">
                      Select a component from the sidebar
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* JSON view */}
            {activeTab === "json" && (
              <div className="flex-1 overflow-auto bg-zinc-950 p-6 relative">
                <button
                  onClick={copyJson}
                  className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 transition-colors"
                >
                  {copied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                  {copied ? "Copied" : "Copy"}
                </button>
                <pre className="text-sm text-zinc-300 font-mono leading-relaxed">
                  {jsonString}
                </pre>
              </div>
            )}

            {/* Schema view */}
            {activeTab === "schema" && selectedEntry && (
              <div className="flex-1 overflow-auto bg-zinc-950 p-6">
                <pre className="text-sm text-zinc-300 font-mono leading-relaxed">
                  {JSON.stringify(selectedEntry.schema._def, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Right panel */}
          <aside className="w-72 shrink-0 border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-900 flex items-center gap-2">
              <Settings2 className="size-3.5 text-zinc-400" />
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Props</span>
              {selectedEntry && (
                <div className="ml-auto flex gap-1.5 flex-wrap justify-end">
                  {selectedEntry.tags?.slice(0, 3).map((tag) => (
                    <span key={tag} className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-500">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              {selectedEntry ? (
                <PropsPanel
                  entry={selectedEntry}
                  currentProps={currentProps}
                  onPropsChange={handlePropsChange}
                />
              ) : (
                <div className="flex items-center justify-center h-32 text-xs text-zinc-400">
                  No component selected
                </div>
              )}
            </div>

            {/* Examples */}
            {selectedEntry && selectedEntry.examples.length > 0 && (
              <div className="border-t border-zinc-100 dark:border-zinc-900 p-4">
                <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">Examples</p>
                <div className="space-y-1">
                  {selectedEntry.examples.map((ex, i) => (
                    <button
                      key={i}
                      onClick={() => handlePropsChange(ex.props)}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors flex items-center gap-2"
                    >
                      <Code2 className="size-3 shrink-0 text-zinc-400" />
                      {ex.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
