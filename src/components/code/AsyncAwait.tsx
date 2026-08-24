"use client";

import { z } from "zod";
import { useState, useEffect, useRef } from "react";
import { Code2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const AsyncAwaitSchema = z.object({
  style: z.enum(["callbacks", "promises", "async-await"]).default("callbacks"),
  operation: z.string().default("fetch user profile"),
});

export type AsyncAwaitProps = z.infer<typeof AsyncAwaitSchema>;

type Style = "callbacks" | "promises" | "async-await";

type CodeLine = {
  text: string;
  indent: number;
  isStep?: boolean; // marks lines that represent async steps
};

const TABS: { id: Style; label: string }[] = [
  { id: "callbacks", label: "Callbacks" },
  { id: "promises", label: "Promises" },
  { id: "async-await", label: "async/await" },
];

const CODE: Record<Style, CodeLine[]> = {
  callbacks: [
    { text: "getUser(userId, (err, user) => {", indent: 0, isStep: true },
    { text: "  if (err) return handleError(err);", indent: 1 },
    { text: "  getProfile(user.id, (err, profile) => {", indent: 1, isStep: true },
    { text: "    if (err) return handleError(err);", indent: 2 },
    { text: "    getPosts(profile.id, (err, posts) => {", indent: 2, isStep: true },
    { text: "      // 3 levels deep — 'callback hell'", indent: 3 },
    { text: "      render(user, profile, posts);", indent: 3 },
    { text: "    });", indent: 2 },
    { text: "  });", indent: 1 },
    { text: "});", indent: 0 },
  ],
  promises: [
    { text: "getUser(userId)", indent: 0, isStep: true },
    { text: "  .then(user => getProfile(user.id))", indent: 1, isStep: true },
    { text: "  .then(profile => getPosts(profile.id))", indent: 1, isStep: true },
    { text: "  .then(posts => render(...))", indent: 1 },
    { text: "  .catch(err => handleError(err));", indent: 1 },
  ],
  "async-await": [
    { text: "async function loadPage() {", indent: 0 },
    { text: "  try {", indent: 1 },
    { text: "    const user    = await getUser(userId);", indent: 2, isStep: true },
    { text: "    const profile = await getProfile(user.id);", indent: 2, isStep: true },
    { text: "    const posts   = await getPosts(profile.id);", indent: 2, isStep: true },
    { text: "    render(user, profile, posts);", indent: 2 },
    { text: "  } catch (err) {", indent: 1 },
    { text: "    handleError(err);", indent: 2 },
    { text: "  }", indent: 1 },
    { text: "}", indent: 0 },
  ],
};

const STEP_LABELS: Record<Style, string[]> = {
  callbacks: [
    "Step 1: getUser...",
    "Step 2: getProfile...",
    "Step 3: getPosts...",
  ],
  promises: [
    "Step 1: getUser...",
    "Step 2: getProfile...",
    "Step 3: getPosts...",
  ],
  "async-await": [
    "Step 1: getUser...",
    "Step 2: getProfile...",
    "Step 3: getPosts...",
  ],
};

const STYLE_LABEL: Record<Style, { text: string; color: string }> = {
  callbacks: {
    text: "Callback Hell — hard to read, hard to error handle",
    color: "text-red-600 dark:text-red-400",
  },
  promises: {
    text: "Flat chain — one .catch() handles all errors",
    color: "text-emerald-600 dark:text-emerald-400",
  },
  "async-await": {
    text: "Reads like sync code — same flat error handling as promises",
    color: "text-emerald-600 dark:text-emerald-400",
  },
};

function tokenize(line: string): { text: string; cls: string }[] {
  const keywords = /\b(async|await|function|const|let|var|return|if|try|catch|throw)\b/g;
  const result: { text: string; cls: string }[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  keywords.lastIndex = 0;
  while ((match = keywords.exec(line)) !== null) {
    if (match.index > last) result.push({ text: line.slice(last, match.index), cls: "" });
    result.push({ text: match[0], cls: "text-violet-600 dark:text-violet-400 font-semibold" });
    last = match.index + match[0].length;
  }
  if (last < line.length) result.push({ text: line.slice(last), cls: "" });
  // color strings in comments
  return result.map(t => {
    if (t.text.includes("//")) return { text: t.text, cls: "text-zinc-400 dark:text-zinc-500 italic" };
    if (t.text.includes(".then") || t.text.includes(".catch")) return { text: t.text, cls: "text-blue-600 dark:text-blue-400" };
    return t;
  });
}

export function AsyncAwait({
  style: styleProp = "callbacks",
}: AsyncAwaitProps) {
  const [activeTab, setActiveTab] = useState<Style>(styleProp);
  const [running, setRunning] = useState(false);
  const [activeLine, setActiveLine] = useState<number | null>(null);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const animRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setActiveTab(styleProp);
  }, [styleProp]);

  useEffect(() => {
    setActiveLine(null);
    setCompletedSteps([]);
    setRunning(false);
    if (animRef.current) clearTimeout(animRef.current);
  }, [activeTab]);

  const lines = CODE[activeTab];
  const stepLines = lines
    .map((l, i) => (l.isStep ? i : -1))
    .filter(i => i !== -1);

  function handleRun() {
    if (running) return;
    setRunning(true);
    setActiveLine(null);
    setCompletedSteps([]);

    let stepIdx = 0;
    let lineIdx = 0;

    function nextLine() {
      if (lineIdx >= lines.length) {
        setActiveLine(null);
        setRunning(false);
        return;
      }
      setActiveLine(lineIdx);
      const isStep = lines[lineIdx]?.isStep;
      const delay = isStep ? 1000 : 500;
      if (isStep) {
        const si = stepIdx;
        animRef.current = setTimeout(() => {
          setCompletedSteps(prev => [...prev, si]);
          stepIdx++;
          lineIdx++;
          nextLine();
        }, delay);
      } else {
        animRef.current = setTimeout(() => {
          lineIdx++;
          nextLine();
        }, delay);
      }
    }

    nextLine();
  }

  const stepLabels = STEP_LABELS[activeTab];
  const styleLabel = STYLE_LABEL[activeTab];

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800">
        <Code2 className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">Async/Await Patterns</span>
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        Three ways to handle async code — from nested callbacks to clean async/await syntax.
      </p>

      <div className="flex border-b border-zinc-100 dark:border-zinc-800 px-4 pt-2 gap-1">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-3 py-1.5 text-xs font-semibold rounded-t-lg transition-all duration-500 border-b-2",
              activeTab === tab.id
                ? "border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30"
                : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-[220px] px-4 py-4 flex flex-col gap-3">
        <div className="rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-950 p-3 font-mono text-xs overflow-x-auto flex-1">
          {lines.map((line, i) => {
            const isActive = activeLine === i;
            const tokens = tokenize(line.text);
            return (
              <div
                key={i}
                className={cn(
                  "px-1 py-0.5 rounded transition-all duration-500 whitespace-pre leading-relaxed",
                  isActive ? "bg-blue-900/60 text-white" : "text-zinc-300"
                )}
              >
                {tokens.map((t, j) => (
                  <span key={j} className={t.cls || "text-zinc-300"}>
                    {t.text}
                  </span>
                ))}
              </div>
            );
          })}
        </div>

        <p className={cn("text-xs font-medium", styleLabel.color)}>{styleLabel.text}</p>

        <div className="flex gap-3 flex-wrap">
          {stepLabels.map((label, i) => {
            const done = completedSteps.includes(i);
            const active = stepLines[i] === activeLine;
            return (
              <span
                key={i}
                className={cn(
                  "text-xs transition-all duration-500 font-mono",
                  done ? "text-emerald-600 dark:text-emerald-400" :
                  active ? "text-blue-600 dark:text-blue-400 animate-pulse" :
                  "text-zinc-400 dark:text-zinc-500"
                )}
              >
                {label} {done ? "✓" : active ? "..." : ""}
              </span>
            );
          })}
        </div>
      </div>

      <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-3">
        <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">
          {running ? "Stepping through async calls…" : "Run to watch each async step execute in order"}
        </span>
        <button
          onClick={handleRun}
          disabled={running}
          className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 shrink-0"
        >
          {running ? "Running..." : "Run"}
        </button>
      </div>
    </div>
  );
}
