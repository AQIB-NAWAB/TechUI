"use client";

import { useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Scissors, RefreshCw, FileText } from "lucide-react";

export const RagChunkingSchema = z.object({
  title: z.string().optional().default("RAG Document Chunking"),
  document: z.string().optional().default(
    "TechUI helps beginners understand software concepts visually. RAG systems split long documents into smaller chunks before embedding them. Smaller chunks improve precision but may lose context. Overlapping chunks preserve continuity across boundaries."
  ),
  chunkSize: z.number().int().min(40).max(200).optional().default(80),
  overlap: z.number().int().min(0).max(40).optional().default(20),
  strategy: z.enum(["fixed", "sentence", "paragraph"]).optional().default("fixed"),
  interactive: z.boolean().optional().default(true),
});

export type RagChunkingProps = z.infer<typeof RagChunkingSchema>;

type Chunk = { id: number; text: string; start: number; end: number };

const CHUNK_COLORS = [
  "bg-blue-100 dark:bg-blue-950 border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-300",
  "bg-violet-100 dark:bg-violet-950 border-violet-300 dark:border-violet-800 text-violet-800 dark:text-violet-300",
  "bg-emerald-100 dark:bg-emerald-950 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300",
  "bg-amber-100 dark:bg-amber-950 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300",
  "bg-rose-100 dark:bg-rose-950 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300",
];

function buildChunks(document: string, chunkSize: number, overlap: number, strategy: RagChunkingProps["strategy"]): Chunk[] {
  if (strategy === "paragraph") {
    const parts = document.split(/\n\n+/).filter(Boolean);
    return parts.map((text, i) => ({
      id: i + 1,
      text: text.trim(),
      start: document.indexOf(text),
      end: document.indexOf(text) + text.length,
    }));
  }

  if (strategy === "sentence") {
    const sentences = document.match(/[^.!?]+[.!?]+/g) ?? [document];
    return sentences.map((text, i) => ({
      id: i + 1,
      text: text.trim(),
      start: document.indexOf(text),
      end: document.indexOf(text) + text.length,
    }));
  }

  const chunks: Chunk[] = [];
  let start = 0;
  let id = 1;
  const step = Math.max(1, chunkSize - overlap);

  while (start < document.length) {
    const end = Math.min(document.length, start + chunkSize);
    const text = document.slice(start, end).trim();
    if (text) chunks.push({ id, text, start, end });
    id++;
    if (end >= document.length) break;
    start += step;
  }

  return chunks;
}

export function RagChunking({
  title = "RAG Document Chunking",
  document = "TechUI helps beginners understand software concepts visually. RAG systems split long documents into smaller chunks before embedding them. Smaller chunks improve precision but may lose context. Overlapping chunks preserve continuity across boundaries.",
  chunkSize = 80,
  overlap = 20,
  strategy = "fixed",
  interactive = true,
}: RagChunkingProps) {
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [revealed, setRevealed] = useState(0);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState("Click Chunk Document to split the text into embeddable pieces.");

  const previewChunks = buildChunks(document, chunkSize, overlap, strategy);

  function reset() {
    setChunks([]);
    setRevealed(0);
    setRunning(false);
    setStatus("Click Chunk Document to split the text into embeddable pieces.");
  }

  function chunkDocument() {
    if (running) return;
    const next = previewChunks;
    setChunks(next);
    setRevealed(0);
    setRunning(true);
    setStatus(`Splitting into ${next.length} chunks with ${overlap}-character overlap…`);

    let i = 0;
    const reveal = () => {
      i++;
      setRevealed(i);
      if (i >= next.length) {
        setRunning(false);
        setStatus(`Done — ${next.length} chunks ready for embedding. Overlap keeps context at boundaries.`);
        return;
      }
      setTimeout(reveal, 1000);
    };
    setTimeout(reveal, 1000);
  }

  const visibleCount = revealed;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/50">
        <Scissors className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">{title}</span>
        <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">{strategy}</span>
        {interactive && (
          <button onClick={reset} className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all duration-500">
            <RefreshCw className="size-3.5" />
          </button>
        )}
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-900">
        RAG splits long text into smaller chunks before embedding. Smaller chunks find exact matches; overlap keeps sentences from getting cut in half.
      </p>

      <div className="p-4 min-h-[280px] flex flex-col gap-4">
        <div className="border border-zinc-100 dark:border-zinc-800 rounded-lg p-3 bg-zinc-50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="size-3.5 text-zinc-400" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Source document</span>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-mono">{document}</p>
        </div>

        <div className="grid grid-cols-3 gap-2 text-[10px]">
          <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg px-3 py-2 border border-zinc-100 dark:border-zinc-800">
            <div className="text-zinc-400">Chunk size</div>
            <div className="font-mono font-bold text-zinc-700 dark:text-zinc-300 mt-0.5">{chunkSize} chars</div>
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg px-3 py-2 border border-zinc-100 dark:border-zinc-800">
            <div className="text-zinc-400">Overlap</div>
            <div className="font-mono font-bold text-zinc-700 dark:text-zinc-300 mt-0.5">{overlap} chars</div>
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg px-3 py-2 border border-zinc-100 dark:border-zinc-800">
            <div className="text-zinc-400">Chunks</div>
            <div className="font-mono font-bold text-zinc-700 dark:text-zinc-300 mt-0.5">
              {chunks.length > 0 ? chunks.length : previewChunks.length}
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-[88px]">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2">Chunks</div>
          {chunks.length === 0 ? (
            <p className="text-xs text-zinc-400 italic py-2 min-h-[64px] flex items-center">
              Click Chunk Document below to see how the text is split
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {chunks.map((chunk, idx) => {
                const visible = idx < visibleCount;
                return (
                  <div
                    key={chunk.id}
                    className={cn(
                      "rounded-lg border px-2.5 py-1.5 text-[10px] font-mono max-w-full transition-all duration-500",
                      CHUNK_COLORS[idx % CHUNK_COLORS.length],
                      visible ? "opacity-100 scale-100" : "opacity-0 scale-95"
                    )}
                    title={chunk.text}
                  >
                    <span className="font-bold mr-1">#{chunk.id}</span>
                    {chunk.text.length > 48 ? `${chunk.text.slice(0, 48)}…` : chunk.text}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {interactive && (
        <div className="border-t border-zinc-100 dark:border-zinc-900 px-4 py-3 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/30 min-h-[52px]">
          <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">{status}</span>
          <button
            type="button"
            onClick={chunkDocument}
            disabled={running}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 transition-all duration-500 shrink-0 hover:opacity-90 disabled:opacity-50"
          >
            {running ? "Chunking…" : chunks.length > 0 && !running ? "Chunk Again" : "Chunk Document"}
          </button>
        </div>
      )}
    </div>
  );
}
