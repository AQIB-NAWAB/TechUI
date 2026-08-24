"use client";

import { useState } from "react";
import { Copy, Check, Terminal as TerminalIcon, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { z } from "zod";

export const TerminalLineSchema = z.object({
  type: z.enum(["command", "output", "error", "comment", "prompt"]).default("command"),
  content: z.string(),
});

export const TerminalSchema = z.object({
  title: z.string().optional(),
  shell: z.enum(["bash", "zsh", "sh", "powershell", "cmd", "fish"]).default("bash"),
  lines: z.array(TerminalLineSchema),
  theme: z.enum(["dark", "light", "github"]).default("dark"),
  interactive: z.boolean().default(false),
});

export type TerminalProps = z.infer<typeof TerminalSchema>;
type TerminalLine = z.infer<typeof TerminalLineSchema>;

function TerminalLineView({ line, theme }: { line: TerminalLine; theme: TerminalProps["theme"] }) {
  const isLight = theme === "light";
  if (line.type === "comment") {
    return (
      <div className="flex items-start gap-2 opacity-40">
        <span className="text-zinc-400">#</span>
        <span className="text-zinc-400">{line.content}</span>
      </div>
    );
  }
  if (line.type === "command") {
    return (
      <div className="flex items-start gap-2">
        <span className="text-emerald-400 select-none shrink-0">$</span>
        <span className={isLight ? "text-zinc-900" : "text-zinc-100"}>{line.content}</span>
      </div>
    );
  }
  if (line.type === "error") {
    return <div className="text-red-400">{line.content}</div>;
  }
  if (line.type === "prompt") {
    return (
      <div className="flex items-center gap-2">
        <ChevronRight className="size-3 text-blue-400 shrink-0" />
        <span className="text-blue-300">{line.content}</span>
      </div>
    );
  }
  return <div className="text-zinc-400">{line.content}</div>;
}

export function Terminal({ title, shell = "bash", lines, theme = "dark", interactive = false }: TerminalProps) {
  const [copied, setCopied] = useState(false);
  const [input, setInput] = useState("");
  const [extraLines, setExtraLines] = useState<TerminalLine[]>([]);

  const commandLines = lines.filter((l) => l.type === "command").map((l) => l.content);

  function handleEnter(e: React.KeyboardEvent) {
    if (e.key === "Enter" && input.trim()) {
      setExtraLines((prev) => [
        ...prev,
        { type: "command", content: input },
        { type: "output", content: `zsh: command not found: ${input.split(" ")[0]}` },
      ]);
      setInput("");
    }
  }

  const themeClasses = {
    dark: "bg-zinc-950",
    light: "bg-white",
    github: "bg-[#0d1117]",
  };

  const headerBg = {
    dark: "bg-zinc-900 border-zinc-800",
    light: "bg-zinc-100 border-zinc-200",
    github: "bg-[#161b22] border-[#30363d]",
  };

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className={cn("flex items-center gap-3 px-4 h-12 border-b", headerBg[theme])}>
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-red-500/70" />
          <span className="size-2.5 rounded-full bg-amber-500/70" />
          <span className="size-2.5 rounded-full bg-emerald-500/70" />
        </div>
        <TerminalIcon className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">{title ?? shell}</span>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">{shell}</span>
      </div>

      <div className={cn("min-h-[220px] p-4 space-y-1 font-mono text-[13px] leading-relaxed", themeClasses[theme])}>
        {lines.map((line, i) => (
          <TerminalLineView key={i} line={line} theme={theme} />
        ))}
        {extraLines.map((line, i) => (
          <TerminalLineView key={`extra-${i}`} line={line} theme={theme} />
        ))}
        {interactive && (
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 select-none">$</span>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleEnter}
              placeholder="Type a command…"
              className="flex-1 bg-transparent text-zinc-100 placeholder:text-zinc-600 outline-none caret-emerald-400"
              autoFocus
            />
          </div>
        )}
      </div>

      <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-3">
        <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">
          {commandLines.length} command{commandLines.length !== 1 ? "s" : ""} · {lines.length + extraLines.length} lines
        </span>
        <button
          onClick={() => {
            navigator.clipboard.writeText(commandLines.join("\n"));
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5"
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          Copy commands
        </button>
      </div>
    </div>
  );
}
