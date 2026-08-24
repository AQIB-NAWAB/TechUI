"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { GitBranch, RotateCcw } from "lucide-react";

export const TriePrefixTreeSchema = z.object({
  title: z.string().optional().default("Trie (Prefix Tree)"),
  words: z.array(z.string()).optional().default(["cat", "car", "card", "dog", "dot", "dodge"]),
  searchPrefix: z.string().optional().default("ca"),
  interactive: z.boolean().optional().default(true),
});

export type TriePrefixTreeProps = z.infer<typeof TriePrefixTreeSchema>;

type TrieNode = {
  char: string;
  children: Map<string, TrieNode>;
  isWord: boolean;
};

function buildTrie(words: string[]): TrieNode {
  const root: TrieNode = { char: "", children: new Map(), isWord: false };
  for (const word of words) {
    let node = root;
    for (const ch of word) {
      if (!node.children.has(ch)) {
        node.children.set(ch, { char: ch, children: new Map(), isWord: false });
      }
      node = node.children.get(ch)!;
    }
    node.isWord = true;
  }
  return root;
}

function prefixMatches(word: string, prefix: string): boolean {
  return word.startsWith(prefix);
}

const WORD_PRESETS = ["apple", "app", "apt", "banana", "band", "bat"];

export function TriePrefixTree({
  title = "Trie (Prefix Tree)",
  words = ["cat", "car", "card", "dog", "dot", "dodge"],
  searchPrefix: initialPrefix = "ca",
  interactive = true,
}: TriePrefixTreeProps) {
  const [insertedWords, setInsertedWords] = useState<string[]>(words);
  const [prefix, setPrefix] = useState(initialPrefix);
  const [insertIdx, setInsertIdx] = useState(0);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [highlightPath, setHighlightPath] = useState<string[]>([]);

  const trie = buildTrie(insertedWords);
  const matches = insertedWords.filter((w) => prefixMatches(w, prefix));

  useEffect(() => {
    const path: string[] = [];
    const currentTrie = buildTrie(words);
    let node = currentTrie;
    for (const ch of initialPrefix) {
      const next = node.children.get(ch);
      if (!next) break;
      path.push(ch);
      node = next;
    }
    setHighlightPath(path);
  }, [words, initialPrefix]);

  function runPrefixSearch(p: string, wordList = insertedWords) {
    const currentTrie = buildTrie(wordList);
    const path: string[] = [];
    let node = currentTrie;
    for (const ch of p) {
      const next = node.children.get(ch);
      if (!next) break;
      path.push(ch);
      node = next;
    }
    const matchCount = wordList.filter((w) => w.startsWith(p)).length;
    setHighlightPath(path);
    setPrefix(p);
    setLastAction(
      path.length === p.length && p.length > 0
        ? `Prefix "${p}" found — ${matchCount} word${matchCount !== 1 ? "s" : ""} match`
        : p.length > 0
        ? `Prefix "${p}" not in trie`
        : null
    );
  }

  function insertNext() {
    const word = WORD_PRESETS[insertIdx % WORD_PRESETS.length];
    setInsertIdx((i) => i + 1);
    if (insertedWords.includes(word)) {
      setLastAction(`"${word}" already in trie — skipped`);
      return;
    }
    const nextWords = [...insertedWords, word];
    setInsertedWords(nextWords);
    setLastAction(`Inserted "${word}" — shared prefixes reuse existing nodes`);
    runPrefixSearch(word.slice(0, 2), nextWords);
  }

  function reset() {
    setInsertedWords(words);
    setPrefix(initialPrefix);
    setInsertIdx(0);
    setLastAction(null);
    setHighlightPath([]);
    runPrefixSearch(initialPrefix, words);
  }

  function renderNode(node: TrieNode, depth: number, path: string[]): React.ReactNode {
    const entries = Array.from(node.children.entries()).sort(([a], [b]) => a.localeCompare(b));
    if (entries.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-1.5" style={{ paddingLeft: depth * 14 }}>
        {entries.map(([ch, child]) => {
          const childPath = [...path, ch];
          const onPath = highlightPath.length >= childPath.length && childPath.every((c, i) => highlightPath[i] === c);
          const isEnd = child.isWord;

          return (
            <div key={childPath.join("-")} className="flex flex-col items-start gap-1">
              <div
                className={cn(
                  "rounded-lg border px-2 py-1 font-mono text-xs font-bold transition-all duration-500",
                  onPath
                    ? "bg-blue-100 dark:bg-blue-950/40 border-blue-400 dark:border-blue-600 text-blue-700 dark:text-blue-300 scale-105"
                    : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300"
                )}
              >
                {ch}
                {isEnd && <span className="ml-0.5 text-emerald-500">●</span>}
              </div>
              {renderNode(child, depth + 1, childPath)}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800">
        <GitBranch className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">{title}</span>
        <span className="text-[10px] font-mono text-zinc-400 border border-zinc-200 dark:border-zinc-700 px-2 py-0.5 rounded">
          {insertedWords.length} words
        </span>
        {interactive && (
          <button
            type="button"
            onClick={reset}
            className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all duration-500"
            title="Reset"
          >
            <RotateCcw className="size-3.5" />
          </button>
        )}
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        Words share letter-by-letter paths — type a prefix to find all matches instantly.
      </p>

      <div className="min-h-[220px] px-4 pt-3 pb-2 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 shrink-0">Prefix</span>
          <input
            type="text"
            value={prefix}
            onChange={(e) => runPrefixSearch(e.target.value.toLowerCase().replace(/[^a-z]/g, ""))}
            className="flex-1 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-500"
            placeholder="ca"
          />
        </div>

        <div className="border border-zinc-100 dark:border-zinc-800 rounded-lg p-3 bg-zinc-50 dark:bg-zinc-800/50 min-h-[100px] overflow-auto">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Root</span>
            <span className="size-5 rounded-full border-2 border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 flex items-center justify-center text-[9px] font-bold text-zinc-400">
              ∅
            </span>
          </div>
          {renderNode(trie, 0, [])}
        </div>

        <div className="min-h-[52px] border border-zinc-100 dark:border-zinc-800 rounded-lg p-2 bg-zinc-50 dark:bg-zinc-800/50">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-1.5">Matches</div>
          <div className="flex flex-wrap gap-1.5 min-h-[24px]">
            {matches.length === 0 ? (
              <span className="text-xs text-zinc-400 italic">No matches for &quot;{prefix}&quot;</span>
            ) : (
              matches.map((w) => (
                <span
                  key={w}
                  className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs font-mono text-emerald-700 dark:text-emerald-400 transition-all duration-500"
                >
                  {w}
                </span>
              ))
            )}
          </div>
        </div>

        <div
          className={cn(
            "rounded-lg px-3 py-2 text-xs font-semibold min-h-[32px] flex items-center border transition-all duration-500",
            lastAction
              ? "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
              : "bg-zinc-50 dark:bg-zinc-800/60 text-zinc-400 border-zinc-200 dark:border-zinc-700"
          )}
        >
          {lastAction ?? `Type a prefix — O(m) lookup where m = prefix length`}
        </div>
      </div>

      {interactive && (
        <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/30">
          <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">
            {matches.length > 0
              ? `${matches.length} word${matches.length !== 1 ? "s" : ""} share prefix "${prefix}"`
              : "Insert words and search by prefix — used in autocomplete"}
          </span>
          <button
            type="button"
            onClick={insertNext}
            className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-all duration-500 shrink-0"
          >
            Insert Word
          </button>
        </div>
      )}
    </div>
  );
}
