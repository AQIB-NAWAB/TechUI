"use client";

import { useState, useMemo } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { XCircle, Regex } from "lucide-react";

export const RegexTesterSchema = z.object({
  pattern: z.string().optional().default("[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}"),
  flags: z.string().optional().default("gi"),
  testString: z.string().optional().default("Contact us at support@example.com or sales@acme.org — invalid: not-an-email, @missinguser"),
  interactive: z.boolean().optional().default(true),
});

export type RegexTesterProps = z.infer<typeof RegexTesterSchema>;

type Part = { text: string; matched: boolean };

function runRegex(pattern: string, flags: string, input: string): { error: string | null; matches: string[]; parts: Part[] } {
  if (!pattern) return { error: null, matches: [], parts: [{ text: input, matched: false }] };
  try {
    const safeFlags = flags.replace(/[^gimsuy]/g, "").replace(/(.)\1+/g, "$1");
    const gFlags = safeFlags.includes("g") ? safeFlags : safeFlags + "g";
    const re = new RegExp(pattern, gFlags);
    const matches: string[] = [];
    const parts: Part[] = [];
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(input)) !== null) {
      if (m.index > last) parts.push({ text: input.slice(last, m.index), matched: false });
      parts.push({ text: m[0]!, matched: true });
      matches.push(m[0]!);
      last = m.index + m[0]!.length;
      if (m[0]!.length === 0) re.lastIndex++;
    }
    if (last < input.length) parts.push({ text: input.slice(last), matched: false });
    return { error: null, matches, parts };
  } catch (e) {
    return { error: (e as Error).message, matches: [], parts: [{ text: input, matched: false }] };
  }
}

export function RegexTester({
  pattern: initPattern = "[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}",
  flags: initFlags = "gi",
  testString: initTest = "Contact us at support@example.com or sales@acme.org — invalid: not-an-email, @missinguser",
  interactive = true,
}: RegexTesterProps) {
  const [pattern, setPattern] = useState(initPattern);
  const [flags, setFlags] = useState(initFlags);
  const [testString, setTestString] = useState(initTest);
  const [flash, setFlash] = useState(false);

  const result = useMemo(() => runRegex(pattern, flags, testString), [pattern, flags, testString]);

  function runTest() {
    setFlash(true);
    setTimeout(() => setFlash(false), 1000);
  }

  function loadExample() {
    setPattern("\\d{3}-\\d{2}-\\d{4}");
    setFlags("g");
    setTestString("SSN: 123-45-6789 and invalid 12-345-6789");
  }

  const statusText = result.error
    ? "Invalid pattern — fix the syntax above"
    : result.matches.length > 0
    ? `${result.matches.length} match${result.matches.length !== 1 ? "es" : ""} found — highlighted in yellow`
    : "No matches — try adjusting the pattern or test string";

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800">
        <Regex className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">Regex Tester</span>
        <span className={cn(
          "text-[10px] font-bold px-2 py-0.5 rounded-full transition-all duration-500",
          result.error
            ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"
            : result.matches.length > 0
            ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
        )}>
          {result.error ? "Error" : `${result.matches.length} matches`}
        </span>
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        A regex is a search pattern — type one and see which parts of your text match instantly.
      </p>

      <div className="min-h-[220px] p-4 space-y-3">
        <div className="border border-zinc-100 dark:border-zinc-800 rounded-lg p-3 bg-zinc-50 dark:bg-zinc-800/50">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1.5">
            Pattern
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center flex-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 overflow-hidden">
              <span className="px-2.5 text-zinc-400 font-mono text-sm select-none">/</span>
              <input
                value={pattern}
                onChange={(e) => interactive && setPattern(e.target.value)}
                readOnly={!interactive}
                className="flex-1 py-2 bg-transparent text-sm font-mono text-zinc-800 dark:text-zinc-200 outline-none"
                placeholder="pattern"
                spellCheck={false}
              />
              <span className="px-2.5 text-zinc-400 font-mono text-sm select-none">/</span>
            </div>
            <input
              value={flags}
              onChange={(e) => interactive && setFlags(e.target.value.toLowerCase().replace(/[^gimsuy]/g, ""))}
              readOnly={!interactive}
              className="w-12 px-2 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-mono text-zinc-800 dark:text-zinc-200 outline-none text-center"
              placeholder="gi"
              maxLength={6}
            />
          </div>
          {result.error && (
            <p className="text-[11px] text-red-500 dark:text-red-400 mt-1.5 flex items-center gap-1">
              <XCircle className="size-3 shrink-0" /> {result.error}
            </p>
          )}
        </div>

        <div className="border border-zinc-100 dark:border-zinc-800 rounded-lg p-3 bg-zinc-50 dark:bg-zinc-800/50">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1.5">
            Test string
          </div>
          <textarea
            value={testString}
            onChange={(e) => interactive && setTestString(e.target.value)}
            readOnly={!interactive}
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-800 dark:text-zinc-200 outline-none resize-none font-mono leading-relaxed"
            spellCheck={false}
          />
        </div>

        <div className="border border-zinc-100 dark:border-zinc-800 rounded-lg p-3 bg-zinc-50 dark:bg-zinc-800/50 min-h-[3rem]">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1.5">
            Result
          </div>
          <div className={cn(
            "text-sm font-mono leading-relaxed break-words transition-all duration-500",
            flash && "ring-2 ring-emerald-400 rounded-md"
          )}>
            {result.parts.map((p, i) =>
              p.matched ? (
                <mark key={i} className="bg-yellow-200 dark:bg-yellow-800/60 text-yellow-900 dark:text-yellow-100 rounded px-0.5">
                  {p.text}
                </mark>
              ) : (
                <span key={i} className="text-zinc-500 dark:text-zinc-400">{p.text}</span>
              )
            )}
          </div>
          {result.matches.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {result.matches.map((m, i) => (
                <span key={i} className="px-2 py-0.5 rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 text-xs font-mono">
                  {m}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {interactive && (
        <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-3">
          <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">{statusText}</span>
          <button
            onClick={() => { runTest(); loadExample(); }}
            className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Try Example
          </button>
        </div>
      )}
    </div>
  );
}
