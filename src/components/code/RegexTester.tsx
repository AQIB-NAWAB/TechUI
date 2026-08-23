"use client";

import { useState, useMemo } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { XCircle } from "lucide-react";

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

  const result = useMemo(() => runRegex(pattern, flags, testString), [pattern, flags, testString]);

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-between">
        <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Regex Tester</span>
        <span className="text-[10px] text-zinc-400">
          {result.matches.length} match{result.matches.length !== 1 ? "es" : ""}
        </span>
      </div>

      <div className="p-4 space-y-3">
        {/* Pattern row */}
        <div>
          <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide block mb-1.5">
            Regular Expression
          </label>
          <div className="flex items-center gap-2">
            <div className="flex items-center flex-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 overflow-hidden focus-within:ring-2 focus-within:ring-zinc-300 dark:focus-within:ring-zinc-600">
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
              className="w-12 px-2 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-sm font-mono text-zinc-800 dark:text-zinc-200 outline-none text-center"
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

        {/* Test string */}
        <div>
          <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide block mb-1.5">
            Test String
          </label>
          <textarea
            value={testString}
            onChange={(e) => interactive && setTestString(e.target.value)}
            readOnly={!interactive}
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-sm text-zinc-800 dark:text-zinc-200 outline-none resize-none font-mono leading-relaxed focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-600"
            spellCheck={false}
          />
        </div>

        {/* Highlighted result */}
        <div>
          <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide block mb-1.5">
            Matches highlighted
          </label>
          <div className="px-3 py-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-sm font-mono leading-relaxed break-words min-h-[2.5rem]">
            {result.parts.map((p, i) =>
              p.matched ? (
                <mark key={i} className="bg-yellow-200 dark:bg-yellow-800/60 text-yellow-900 dark:text-yellow-100 rounded px-0.5 not-italic">
                  {p.text}
                </mark>
              ) : (
                <span key={i} className="text-zinc-500 dark:text-zinc-400">{p.text}</span>
              )
            )}
          </div>
        </div>

        {/* Match list */}
        {result.matches.length > 0 && (
          <div>
            <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide block mb-1.5">
              Captured values
            </label>
            <div className="flex flex-wrap gap-1.5">
              {result.matches.map((m, i) => (
                <span key={i} className="px-2 py-0.5 rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 text-xs font-mono">
                  {m}
                </span>
              ))}
            </div>
          </div>
        )}

        {result.matches.length === 0 && !result.error && pattern && (
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 py-1">
            <XCircle className="size-3.5 shrink-0 text-zinc-300" /> No matches — adjust the pattern or test string{interactive ? " above" : ""}
          </div>
        )}
      </div>

      {interactive && (
        <div className="px-4 py-2 border-t border-zinc-50 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/20">
          <p className="text-[10px] text-zinc-400">Edit the pattern or test string above. Highlighted sections are matches.</p>
        </div>
      )}
    </div>
  );
}
