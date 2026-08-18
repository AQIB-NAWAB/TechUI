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

const SHELL_PROMPT: Record<string, string> = {
  bash: "$",
  zsh: "%",
  sh: "$",
  fish: "›",
  powershell: "PS>",
  cmd: ">",
};

function TerminalLineView({ line }: { line: TerminalLine }) {
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
        <span className="text-zinc-100">{line.content}</span>
      </div>
    );
  }
  if (line.type === "error") {
    return (
      <div className="text-red-400">{line.content}</div>
    );
  }
  if (line.type === "prompt") {
    return (
      <div className="flex items-center gap-2">
        <ChevronRight className="size-3 text-blue-400 shrink-0" />
        <span className="text-blue-300">{line.content}</span>
      </div>
    );
  }
  // output
  return <div className="text-zinc-400">{line.content}</div>;
}

export function Terminal({ title, shell = "bash", lines, theme = "dark", interactive = false }: TerminalProps) {
  const [copied, setCopied] = useState(false);
  const [input, setInput] = useState("");
  const [extraLines, setExtraLines] = useState<TerminalLine[]>([]);

  const commandLines = lines.filter(l => l.type === "command").map(l => l.content);
  const allText = [...lines, ...extraLines].map(l =>
    l.type === "command" ? `$ ${l.content}` : l.content
  ).join("\n");

  function handleEnter(e: React.KeyboardEvent) {
    if (e.key === "Enter" && input.trim()) {
      setExtraLines(prev => [
        ...prev,
        { type: "command", content: input },
        { type: "output", content: `zsh: command not found: ${input.split(" ")[0]}` },
      ]);
      setInput("");
    }
  }

  const themeClasses = {
    dark: "bg-zinc-950 border-zinc-800",
    light: "bg-white border-zinc-200",
    github: "bg-[#0d1117] border-[#30363d]",
  };

  const textClasses = {
    dark: "text-zinc-100",
    light: "text-zinc-900",
    github: "text-[#c9d1d9]",
  };

  return (
    <div className={cn("rounded-xl border overflow-hidden font-mono text-sm", themeClasses[theme])}>
      {/* Title bar */}
      <div className={cn(
        "flex items-center px-4 py-3 border-b",
        theme === "dark" ? "bg-zinc-900 border-zinc-800" : theme === "github" ? "bg-[#161b22] border-[#30363d]" : "bg-zinc-100 border-zinc-200"
      )}>
        <div className="flex items-center gap-1.5">
          <span className="size-3 rounded-full bg-red-500/70" />
          <span className="size-3 rounded-full bg-amber-500/70" />
          <span className="size-3 rounded-full bg-emerald-500/70" />
        </div>
        <div className="flex-1 flex items-center justify-center gap-2">
          <TerminalIcon className="size-3 text-zinc-500" />
          <span className="text-xs text-zinc-500">{title ?? shell}</span>
        </div>
        <button
          onClick={() => { navigator.clipboard.writeText(commandLines.join("\n")); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
          className="p-1 rounded text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-1 text-[13px] leading-relaxed min-h-[80px]">
        {lines.map((line, i) => (
          <TerminalLineView key={i} line={line} />
        ))}
        {extraLines.map((line, i) => (
          <TerminalLineView key={`extra-${i}`} line={line} />
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
    </div>
  );
}
