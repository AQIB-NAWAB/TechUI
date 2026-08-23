"use client";

import { useState, useMemo } from "react";
import {
  Search, Moon, Sun, Monitor, Tablet, Smartphone,
  Layers, ChevronRight, ChevronDown, RotateCcw,
  Copy, Check, Braces, BookOpen, Settings2, Star,
  Code2, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { registry, CATEGORIES } from "@/registry";
import type { ComponentCategory } from "@/registry/types";
import { LivePreview } from "./LivePreview";
import { PropsPanel } from "./PropsPanel";

type ViewportSize = "desktop" | "tablet" | "mobile";
type ActiveTab = "preview" | "code" | "json" | "schema";

const VIEWPORT_WIDTHS: Record<ViewportSize, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "390px",
};

function toComponentName(id: string): string {
  return id.split("-").map((s) => (s[0]?.toUpperCase() ?? "") + s.slice(1)).join("");
}

const CAT_DIR: Record<ComponentCategory, string> = {
  api: "api", architecture: "architecture", database: "database",
  auth: "auth", networking: "networking", cloud: "cloud",
  containers: "containers", distributed: "distributed",
  code: "code", devtools: "devtools", ui: "ui", ai: "ai",
  edu: "edu",
};

function generateJsx(
  id: string,
  category: ComponentCategory,
  props: Record<string, unknown>
): string {
  const name = toComponentName(id);
  const dir = CAT_DIR[category] ?? category;
  const importPath = `@/components/${dir}/${name}`;

  const propsLines = Object.entries(props)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => {
      if (v === true) return `  ${k}`;
      if (v === false) return `  ${k}={false}`;
      if (typeof v === "string") return `  ${k}="${v}"`;
      if (typeof v === "number") return `  ${k}={${v}}`;
      const json = JSON.stringify(v, null, 2)
        .split("\n")
        .map((line, i) => (i === 0 ? line : "  " + line))
        .join("\n");
      return `  ${k}={${json}}`;
    });

  const selfClose = propsLines.length <= 3;
  const lines = [
    `import { ${name} } from "${importPath}";`,
    "",
    "export default function Example() {",
    "  return (",
    `    <${name}`,
    ...propsLines.map((l) => "  " + l),
    selfClose ? `    />` : `    ></${name}>`,
    "  );",
    "}",
  ];
  return lines.join("\n");
}

// Very lightweight JSX syntax highlighter
function HighlightedCode({ code }: { code: string }) {
  const lines = code.split("\n");
  return (
    <pre className="text-xs font-mono leading-relaxed whitespace-pre">
      {lines.map((line, li) => {
        // Colorize tokens
        const parts: React.ReactNode[] = [];
        let remaining = line;
        let key = 0;

        function push(text: string, cls?: string) {
          if (!text) return;
          parts.push(cls
            ? <span key={key++} className={cls}>{text}</span>
            : <span key={key++} className="text-zinc-300">{text}</span>
          );
        }

        // Simple line-level categorization
        if (remaining.trimStart().startsWith("import ") || remaining.trimStart().startsWith("export ")) {
          // tokenize: import/export/from/default as keyword, strings as string
          const segments = remaining.split(/(".*?"|'.*?'|\bimport\b|\bexport\b|\bdefault\b|\bfrom\b|\bfunction\b|\breturn\b)/g);
          for (const seg of segments) {
            if (!seg) continue;
            if (/^(import|export|default|from|function|return)$/.test(seg)) push(seg, "text-violet-400");
            else if (/^["'].*["']$/.test(seg)) push(seg, "text-emerald-400");
            else push(seg);
          }
        } else if (/^\s*<[A-Z]/.test(remaining) || /^\s*\/>/.test(remaining) || /^\s*>/.test(remaining)) {
          // JSX tag line
          const m = remaining.match(/^(\s*)(<\/?)(([A-Z]\w*)?)(.*)$/);
          if (m) {
            push(m[1]!);
            push(m[2]! + (m[3] ?? ""), "text-blue-400");
            // parse rest for prop=value
            let rest = m[5] ?? "";
            const propParts = rest.split(/(\s+\w+={|\/?>|"[^"]*"|\{[^}]*\})/g);
            for (const p of propParts) {
              if (/^\s+\w+=\{?/.test(p)) push(p, "text-zinc-400");
              else if (/^"[^"]*"$/.test(p)) push(p, "text-emerald-400");
              else if (/^\{[^}]*\}$/.test(p)) push(p, "text-amber-400");
              else if (p === "/>" || p === ">") push(p, "text-blue-400");
              else push(p);
            }
          } else push(remaining);
        } else if (/^\s+\w+(\?)?=/.test(remaining)) {
          // prop assignment line
          const m = remaining.match(/^(\s+)(\w+)(=)(.*)/);
          if (m) {
            push(m[1]!);
            push(m[2]!, "text-zinc-300");
            push(m[3]!);
            const val = m[4] ?? "";
            if (val.startsWith('"')) push(val, "text-emerald-400");
            else if (val.startsWith("{")) push(val, "text-amber-400");
            else push(val);
          } else push(remaining);
        } else if (/^\s+\w+$/.test(remaining)) {
          // boolean shorthand prop
          push(remaining.match(/^(\s+)/)?.[1] ?? "");
          push(remaining.trim(), "text-zinc-300");
        } else {
          push(remaining);
        }

        return (
          <div key={li} className="leading-6">
            {parts}
          </div>
        );
      })}
    </pre>
  );
}

export function PlaygroundShell() {
  const [selectedId, setSelectedId] = useState<string>("api-request");
  const [darkMode, setDarkMode] = useState(false);
  const [viewport, setViewport] = useState<ViewportSize>("desktop");
  const [activeTab, setActiveTab] = useState<ActiveTab>("preview");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["api", "architecture", "database"])
  );
  const [props, setProps] = useState<Record<string, Record<string, unknown>>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      return new Set<string>(JSON.parse(localStorage.getItem("techui-favorites") ?? "[]") as string[]);
    } catch {
      return new Set<string>();
    }
  });

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

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  }

  function toggleFavorite(id: string) {
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      try {
        localStorage.setItem("techui-favorites", JSON.stringify([...next]));
      } catch { /* ignore */ }
      return next;
    });
  }

  // Group by category with search
  const grouped = useMemo(() => {
    const q = searchQuery.toLowerCase();
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
  }, [searchQuery]);

  function toggleCategory(cat: string) {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  }

  const favoriteEntries = [...favorites]
    .map((id) => registry[id])
    .filter(Boolean) as typeof registry[string][];

  const jsonString = JSON.stringify({ type: selectedEntry?.id, ...currentProps }, null, 2);
  const codeString = selectedEntry
    ? generateJsx(selectedEntry.id, selectedEntry.category, currentProps)
    : "";

  const TABS = [
    { id: "preview" as const, icon: Monitor, label: "Preview" },
    { id: "code" as const, icon: Code2, label: "Code" },
    { id: "json" as const, icon: Braces, label: "JSON" },
    { id: "schema" as const, icon: BookOpen, label: "Schema" },
  ];

  return (
    <div className={cn("flex h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100", darkMode ? "dark" : "")}>
      {/* Left Sidebar */}
      <aside className="w-60 shrink-0 flex flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        {/* Branding */}
        <div className="px-4 py-4 border-b border-zinc-100 dark:border-zinc-900">
          <div className="flex items-center gap-2.5">
            <div className="size-7 rounded-lg bg-zinc-950 dark:bg-white flex items-center justify-center shrink-0">
              <Layers className="size-4 text-white dark:text-zinc-950" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-none">TechUI</h1>
              <p className="text-[10px] text-zinc-400 mt-0.5">Component Playground</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="px-3 py-2.5 border-b border-zinc-100 dark:border-zinc-900">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-zinc-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search…"
              className="w-full h-7 pl-8 pr-3 rounded-md bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition-shadow"
            />
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-1.5">
          {/* Favorites */}
          {favoriteEntries.length > 0 && !searchQuery && (
            <div className="mb-1">
              <div className="flex items-center gap-2 px-3 py-1.5">
                <Star className="size-3 text-zinc-400 fill-zinc-400 shrink-0" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Favorites
                </span>
              </div>
              {favoriteEntries.map((entry) => (
                <ComponentItem
                  key={entry.id}
                  entry={entry}
                  selected={selectedId === entry.id}
                  favorited={favorites.has(entry.id)}
                  onSelect={setSelectedId}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          )}

          {/* Categories */}
          {(Object.keys(CATEGORIES) as ComponentCategory[]).map((cat) => {
            const items = grouped[cat];
            if (!items || items.length === 0) return null;
            const isExpanded = expandedCategories.has(cat) || !!searchQuery;
            const cfg = CATEGORIES[cat];
            return (
              <div key={cat}>
                <button
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
                  onClick={() => toggleCategory(cat)}
                >
                  {isExpanded
                    ? <ChevronDown className="size-3 text-zinc-400 shrink-0" />
                    : <ChevronRight className="size-3 text-zinc-400 shrink-0" />
                  }
                  <span className={cn("text-[10px] font-semibold uppercase tracking-wider", cfg.color)}>
                    {cfg.label}
                  </span>
                  <span className="ml-auto text-[10px] text-zinc-400">{items.length}</span>
                </button>
                {isExpanded && (
                  <div className="pb-0.5">
                    {items.map((entry) => (
                      <ComponentItem
                        key={entry.id}
                        entry={entry}
                        selected={selectedId === entry.id}
                        favorited={favorites.has(entry.id)}
                        onSelect={setSelectedId}
                        onToggleFavorite={toggleFavorite}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-zinc-100 dark:border-zinc-900 flex items-center gap-2">
          <span className="text-[10px] text-zinc-400 flex-1">
            {Object.keys(registry).length} components
          </span>
        </div>
      </aside>

      {/* Main area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Toolbar */}
        <header className="flex items-center gap-3 px-5 py-2.5 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shrink-0">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                {selectedEntry?.name ?? "Select a component"}
              </h2>
              {selectedEntry?.interactive && (
                <span className="shrink-0 flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 font-bold uppercase tracking-wider">
                  <Zap className="size-2.5" />
                  Live
                </span>
              )}
            </div>
            {selectedEntry && (
              <p className="text-[11px] text-zinc-400 leading-tight truncate max-w-md mt-0.5">
                {selectedEntry.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Viewport */}
            <div className="flex items-center gap-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800 p-0.5">
              {([ ["desktop", Monitor], ["tablet", Tablet], ["mobile", Smartphone] ] as const).map(([v, Icon]) => (
                <button
                  key={v}
                  onClick={() => setViewport(v)}
                  title={v}
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
              title={darkMode ? "Light mode" : "Dark mode"}
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
          {/* Center + tabs */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Tabs */}
            <div className="flex items-center border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-5 shrink-0">
              {TABS.map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors -mb-px",
                    activeTab === id
                      ? "border-zinc-900 dark:border-white text-zinc-900 dark:text-white"
                      : "border-transparent text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
                  )}
                >
                  <Icon className="size-3.5" /> {label}
                </button>
              ))}
            </div>

            {/* Preview */}
            {activeTab === "preview" && (
              <div className="flex-1 overflow-auto bg-[#f4f4f5] dark:bg-zinc-900 p-6 flex justify-center">
                <div
                  style={{ width: VIEWPORT_WIDTHS[viewport], maxWidth: "100%" }}
                  className="transition-all duration-300"
                >
                  {selectedEntry ? (
                    <LivePreview entryId={selectedId} props={currentProps} darkMode={darkMode} />
                  ) : (
                    <div className="flex items-center justify-center h-64 text-sm text-zinc-400">
                      Select a component from the sidebar
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Code tab */}
            {activeTab === "code" && (
              <div className="flex-1 overflow-auto bg-zinc-950 p-6 relative">
                <button
                  onClick={() => copyText(codeString, "code")}
                  className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 transition-colors z-10"
                >
                  {copied === "code" ? <Check className="size-3 text-zinc-500" /> : <Copy className="size-3" />}
                  {copied === "code" ? "Copied" : "Copy"}
                </button>
                <HighlightedCode code={codeString} />
              </div>
            )}

            {/* JSON tab */}
            {activeTab === "json" && (
              <div className="flex-1 overflow-auto bg-zinc-950 p-6 relative">
                <button
                  onClick={() => copyText(jsonString, "json")}
                  className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 transition-colors z-10"
                >
                  {copied === "json" ? <Check className="size-3 text-zinc-500" /> : <Copy className="size-3" />}
                  {copied === "json" ? "Copied" : "Copy"}
                </button>
                <pre className="text-xs text-zinc-300 font-mono leading-relaxed">{jsonString}</pre>
              </div>
            )}

            {/* Schema tab */}
            {activeTab === "schema" && selectedEntry && (
              <div className="flex-1 overflow-auto bg-zinc-950 p-6">
                <pre className="text-xs text-zinc-300 font-mono leading-relaxed">
                  {JSON.stringify(selectedEntry.schema._def, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Right panel */}
          <aside className="w-68 shrink-0 border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col overflow-hidden" style={{ width: 272 }}>
            {/* Props header */}
            <div className="px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-900 flex items-center gap-2 shrink-0">
              <Settings2 className="size-3.5 text-zinc-400" />
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Props</span>
              {selectedEntry && (
                <div className="ml-auto flex gap-1 flex-wrap justify-end">
                  {selectedEntry.tags?.slice(0, 2).map((tag) => (
                    <span key={tag} className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Props editor */}
            <div className="flex-1 overflow-y-auto min-h-0">
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
              <div className="border-t border-zinc-100 dark:border-zinc-900 p-3 shrink-0">
                <p className="text-[9px] font-semibold text-zinc-400 uppercase tracking-wider mb-2 px-1">
                  Examples
                </p>
                <div className="space-y-0.5">
                  {selectedEntry.examples.map((ex, i) => (
                    <button
                      key={i}
                      onClick={() => handlePropsChange(ex.props)}
                      className="w-full text-left px-2.5 py-1.5 rounded-md text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors flex items-center gap-2"
                    >
                      <span className="size-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600 shrink-0" />
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

function ComponentItem({
  entry,
  selected,
  favorited,
  onSelect,
  onToggleFavorite,
}: {
  entry: typeof registry[string];
  selected: boolean;
  favorited: boolean;
  onSelect: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center group mx-2 rounded-md",
        selected
          ? "bg-zinc-950 dark:bg-white"
          : "hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
      )}
    >
      <button
        onClick={() => onSelect(entry.id)}
        className={cn(
          "flex-1 text-left px-2 py-1.5 text-xs transition-colors flex items-center gap-1.5 min-w-0",
          selected
            ? "text-white dark:text-zinc-950 font-medium"
            : "text-zinc-600 dark:text-zinc-400"
        )}
      >
        <span className="flex-1 truncate">{entry.name}</span>
        {entry.interactive && (
          <span className={cn(
            "text-[8px] px-1 py-0.5 rounded font-bold uppercase tracking-wider shrink-0",
            selected
              ? "bg-white/20 text-white dark:bg-zinc-900/20 dark:text-zinc-900"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
          )}>
            Live
          </span>
        )}
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onToggleFavorite(entry.id); }}
        className={cn(
          "p-1.5 mr-1 rounded opacity-0 group-hover:opacity-100 transition-opacity",
          favorited && "opacity-100"
        )}
      >
        <Star
          className={cn(
            "size-3",
            favorited
              ? "text-zinc-500 fill-zinc-500 dark:text-zinc-300 dark:fill-zinc-300"
              : selected
              ? "text-white/50 dark:text-zinc-900/50"
              : "text-zinc-300 dark:text-zinc-600"
          )}
        />
      </button>
    </div>
  );
}
