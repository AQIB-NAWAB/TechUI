"use client";

import { useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Copy, Check } from "lucide-react";

export const CodeBlockSchema = z.object({
  code: z.string().default('const greet = (name: string): string => {\n  return `Hello, ${name}!`;\n};\n\nconsole.log(greet("World"));'),
  language: z
    .enum([
      "typescript", "javascript", "python", "go", "rust", "java",
      "bash", "sql", "json", "yaml", "html", "css", "graphql", "dockerfile",
    ])
    .default("typescript"),
  title: z.string().optional(),
  showLineNumbers: z.boolean().optional().default(true),
  highlightLines: z.array(z.number()).optional(),
  copyable: z.boolean().optional().default(true),
  maxHeight: z.number().optional(),
});

export type CodeBlockProps = z.infer<typeof CodeBlockSchema>;

const KEYWORDS: Record<string, string[]> = {
  typescript: ["const","let","var","function","class","interface","type","return","if","else","for","while","do","switch","case","break","continue","throw","try","catch","finally","async","await","import","export","from","default","new","this","super","extends","implements","void","null","undefined","true","false","typeof","instanceof","in","of","static","readonly","public","private","protected","abstract","enum","as","any","never","unknown","keyof","infer","satisfies","declare"],
  javascript: ["const","let","var","function","class","return","if","else","for","while","do","switch","case","break","continue","throw","try","catch","finally","async","await","import","export","from","default","new","this","super","extends","void","null","undefined","true","false","typeof","instanceof","in","of","static"],
  python: ["def","class","return","if","elif","else","for","while","try","except","finally","with","as","import","from","pass","break","continue","raise","lambda","yield","async","await","True","False","None","and","or","not","in","is","global","nonlocal","del","assert","property"],
  go: ["func","var","const","type","struct","interface","return","if","else","for","range","switch","case","break","continue","defer","go","chan","map","package","import","true","false","nil","make","new","append","len","cap","delete","close","panic","recover","select","default","fallthrough"],
  rust: ["fn","let","mut","const","static","struct","enum","trait","impl","return","if","else","for","while","loop","match","use","pub","mod","self","super","crate","true","false","None","Some","Ok","Err","where","type","unsafe","extern","ref","in","as","box","move","dyn","async","await","try"],
  java: ["class","interface","extends","implements","public","private","protected","static","final","return","if","else","for","while","do","switch","case","break","continue","throw","try","catch","finally","new","this","super","void","null","true","false","int","long","boolean","double","float","String","import","package","abstract","enum","instanceof","synchronized","volatile","transient","native","strictfp","throws"],
  bash: ["if","then","else","elif","fi","for","while","do","done","function","return","export","local","echo","source","exit","set","unset","read","case","esac","in","select","until","break","continue","shift","eval","exec","trap","wait","jobs","kill","printf","true","false"],
  graphql: ["type","interface","union","enum","input","schema","query","mutation","subscription","fragment","on","directive","extend","scalar","implements","true","false","null"],
  dockerfile: ["FROM","RUN","CMD","LABEL","EXPOSE","ENV","ADD","COPY","ENTRYPOINT","VOLUME","USER","WORKDIR","ARG","ONBUILD","STOPSIGNAL","HEALTHCHECK","SHELL","AS"],
};

type TT = "keyword" | "string" | "number" | "comment" | "type" | "op" | "plain" | "key";

const TT_CLASS: Record<TT, string> = {
  keyword: "text-violet-400 font-medium",
  string:  "text-emerald-400",
  number:  "text-blue-400",
  comment: "text-zinc-500 italic",
  type:    "text-amber-400",
  op:      "text-zinc-500",
  key:     "text-sky-400",    // JSON/YAML keys
  plain:   "text-zinc-200",
};

function tokenizeLine(line: string, lang: string, kwSet: Set<string>): { text: string; type: TT }[] {
  const out: { text: string; type: TT }[] = [];
  const patterns: [RegExp, (m: string, rest: string) => TT][] = [
    // Comments
    [/^\/\/.*|^#.*|^--.*|^\/\*[\s\S]*?\*\//, () => "comment"],
    // Strings (multi-style)
    [/^"""[\s\S]*?"""|^'''[\s\S]*?'''/, () => "string"],
    [/^"(?:[^"\\]|\\.)*"|^'(?:[^'\\]|\\.)*'|^`(?:[^`\\]|\\.)*`/, () => "string"],
    // Numbers (including hex, binary, floats)
    [/^-?(?:0[xXbBoO][0-9A-Fa-f_]+|[0-9][0-9_]*(?:\.[0-9_]*)?(?:[eE][+-]?[0-9]+)?[nN]?)\b/, () => "number"],
    // Identifiers
    [/^[A-Za-z_$][A-Za-z0-9_$]*/, (m, rest) => {
      if (kwSet.has(m)) return "keyword";
      if (/^[A-Z][A-Za-z0-9]*$/.test(m)) return "type";
      // JSON/YAML key: identifier followed by : (with optional space)
      if (/^\s*[=:]/.test(rest) && (lang === "json" || lang === "yaml")) return "key";
      return "plain";
    }],
    // Whitespace
    [/^\s+/, () => "plain"],
    // Everything else
    [/^./, () => "op"],
  ];

  let rem = line;
  while (rem.length > 0) {
    let matched = false;
    for (const [pat, classify] of patterns) {
      const m = rem.match(pat);
      if (m) {
        const text = m[0];
        const rest = rem.slice(text.length);
        out.push({ text, type: classify(text, rest) });
        rem = rest;
        matched = true;
        break;
      }
    }
    if (!matched) {
      out.push({ text: rem[0]!, type: "plain" });
      rem = rem.slice(1);
    }
  }
  return out;
}

function tokenizeJson(line: string): { text: string; type: TT }[] {
  const out: { text: string; type: TT }[] = [];
  let rem = line;
  while (rem.length > 0) {
    // String: check if it's a key
    const strMatch = rem.match(/^"(?:[^"\\]|\\.)*"/);
    if (strMatch) {
      const text = strMatch[0];
      const rest = rem.slice(text.length);
      const isKey = /^\s*:/.test(rest);
      out.push({ text, type: isKey ? "key" : "string" });
      rem = rest;
      continue;
    }
    // true/false/null
    const kwMatch = rem.match(/^(true|false|null)\b/);
    if (kwMatch) {
      out.push({ text: kwMatch[0], type: "keyword" });
      rem = rem.slice(kwMatch[0].length);
      continue;
    }
    // Numbers
    const numMatch = rem.match(/^-?[0-9]+(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/);
    if (numMatch) {
      out.push({ text: numMatch[0], type: "number" });
      rem = rem.slice(numMatch[0].length);
      continue;
    }
    // Whitespace/operators
    out.push({ text: rem[0]!, type: /\s/.test(rem[0]!) ? "plain" : "op" });
    rem = rem.slice(1);
  }
  return out;
}

function tokenizeYaml(line: string): { text: string; type: TT }[] {
  // YAML: "key: value" pattern
  const keyVal = line.match(/^(\s*)([\w.-]+)(\s*:\s*)(.*)/);
  if (keyVal) {
    const [, indent, key, sep, val] = keyVal;
    const out: { text: string; type: TT }[] = [
      { text: indent!, type: "plain" },
      { text: key!, type: "key" },
      { text: sep!, type: "op" },
    ];
    if (val!.startsWith("#")) {
      out.push({ text: val!, type: "comment" });
    } else if (/^['"]/.test(val!)) {
      out.push({ text: val!, type: "string" });
    } else if (/^[0-9]/.test(val!) || val === "true" || val === "false" || val === "null") {
      out.push({ text: val!, type: val === "true" || val === "false" || val === "null" ? "keyword" : "number" });
    } else {
      out.push({ text: val!, type: "plain" });
    }
    return out;
  }
  // Comment lines
  if (line.trimStart().startsWith("#")) {
    return [{ text: line, type: "comment" }];
  }
  // Array items / plain
  return [{ text: line, type: "plain" }];
}

const LANG_LABELS: Record<string, string> = {
  typescript: "TypeScript", javascript: "JavaScript", python: "Python",
  go: "Go", rust: "Rust", java: "Java", bash: "Bash",
  sql: "SQL", json: "JSON", yaml: "YAML", html: "HTML",
  css: "CSS", graphql: "GraphQL", dockerfile: "Dockerfile",
};

export function CodeBlock({
  code,
  language = "typescript",
  title,
  showLineNumbers = true,
  highlightLines,
  copyable = true,
  maxHeight,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const kwSet = new Set(KEYWORDS[language] ?? KEYWORDS.typescript!);
  const highlightSet = new Set(highlightLines ?? []);

  const lines = code.split("\n");

  function getLineTokens(line: string): { text: string; type: TT }[] {
    if (language === "json") return tokenizeJson(line);
    if (language === "yaml") return tokenizeYaml(line);
    return tokenizeLine(line, language, kwSet);
  }

  function copy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-950 overflow-hidden font-mono">
      {/* Header bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-zinc-800 bg-zinc-900/80">
        <div className="flex gap-1.5 shrink-0">
          <span className="size-2.5 rounded-full bg-zinc-700" />
          <span className="size-2.5 rounded-full bg-zinc-700" />
          <span className="size-2.5 rounded-full bg-zinc-700" />
        </div>
        {title && (
          <span className="text-xs text-zinc-400 truncate ml-2 flex-1">{title}</span>
        )}
        <span className="text-[10px] text-zinc-500 ml-auto shrink-0">
          {LANG_LABELS[language] ?? language}
        </span>
        {copyable && (
          <button
            onClick={copy}
            className="p-1 rounded text-zinc-500 hover:text-zinc-300 transition-colors shrink-0"
          >
            {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
          </button>
        )}
      </div>

      {/* Code */}
      <div
        className="overflow-auto text-xs leading-6"
        style={maxHeight ? { maxHeight } : undefined}
      >
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, li) => {
              const lineNum = li + 1;
              const isHighlighted = highlightSet.has(lineNum);
              const tokens = getLineTokens(line);
              return (
                <tr
                  key={li}
                  className={cn(
                    isHighlighted
                      ? "bg-amber-400/10 border-l-2 border-amber-400/60"
                      : "border-l-2 border-transparent"
                  )}
                >
                  {showLineNumbers && (
                    <td
                      className={cn(
                        "select-none text-right pr-4 pl-3 w-10 text-zinc-600 align-top whitespace-nowrap",
                        isHighlighted && "text-amber-500/60"
                      )}
                    >
                      {lineNum}
                    </td>
                  )}
                  <td className="pl-4 pr-6 whitespace-pre align-top">
                    {tokens.length > 0
                      ? tokens.map((t, ti) => (
                          <span key={ti} className={TT_CLASS[t.type]}>{t.text}</span>
                        ))
                      : <span>&nbsp;</span>
                    }
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
