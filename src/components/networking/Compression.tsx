"use client";

import { useState, useRef } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Minimize2, Monitor, Server, ArrowRight } from "lucide-react";

export const CompressionSchema = z.object({
  algorithm: z.enum(["gzip", "brotli", "none"]).default("brotli"),
  content: z.enum(["html", "json", "image", "binary"]).default("json"),
  originalSize: z.number().default(24000),
});

export type CompressionProps = z.infer<typeof CompressionSchema>;

const RATIOS: Record<string, Record<string, number>> = {
  gzip:   { html: 78, json: 85, image: 3,  binary: 1 },
  brotli: { html: 82, json: 88, image: 4,  binary: 1 },
  none:   { html: 0,  json: 0,  image: 0,  binary: 0 },
};

const CONTENT_LABELS: Record<string, string> = {
  html: "HTML", json: "JSON", image: "Image", binary: "Binary",
};

const CONTENT_TYPES: Record<string, string> = {
  html: "text/html", json: "application/json", image: "image/jpeg", binary: "application/octet-stream",
};

const ALGO_ENCODING: Record<string, string> = {
  gzip: "gzip", brotli: "br", none: "identity",
};

function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(1)} KB`;
  return `${bytes} B`;
}

type AlgoKey = "gzip" | "brotli" | "none";
type ContentKey = "html" | "json" | "image" | "binary";

export function Compression({
  algorithm: initialAlgo = "brotli",
  content: initialContent = "json",
  originalSize = 24000,
}: CompressionProps) {
  const [algo, setAlgo] = useState<AlgoKey>(initialAlgo);
  const [content, setContent] = useState<ContentKey>(initialContent);
  const [animating, setAnimating] = useState(false);
  const [animatedRatio, setAnimatedRatio] = useState(0);
  const [phase, setPhase] = useState<"idle" | "compressing" | "done">("idle");
  const animFrameRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);
  const startRef = useRef<number>(0);

  const ratio = RATIOS[algo][content] ?? 0;
  const compressedSize = Math.round(originalSize * (1 - ratio / 100));

  function runCompress() {
    if (animating) return;
    setPhase("compressing");
    setAnimating(true);
    setAnimatedRatio(0);
    startRef.current = performance.now();
    const duration = 1200;

    const step = (now: number) => {
      const elapsed = now - startRef.current;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setAnimatedRatio(ratio * eased);
      if (t < 1) {
        animFrameRef.current = requestAnimationFrame(step);
      } else {
        setAnimatedRatio(ratio);
        setAnimating(false);
        setPhase("done");
      }
    };
    animFrameRef.current = requestAnimationFrame(step);
  }

  const displayRatio = phase === "idle" ? 0 : animatedRatio || ratio;
  const displayCompressed = Math.round(originalSize * (1 - displayRatio / 100));
  const compressedBarWidth = algo === "none" ? 100 : Math.max(100 - displayRatio, 2);
  const factor = ratio > 0 ? (originalSize / compressedSize).toFixed(1) : "1.0";

  const ALGOS: AlgoKey[] = ["gzip", "brotli", "none"];
  const CONTENTS: ContentKey[] = ["html", "json", "image", "binary"];

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800">
        <Minimize2 className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">HTTP Compression</span>
        <div className="flex gap-1">
          {ALGOS.map((a) => (
            <button
              key={a}
              onClick={() => { setAlgo(a); setPhase("idle"); setAnimatedRatio(0); }}
              className={cn(
                "px-2 py-1 rounded-lg border text-[10px] font-mono font-semibold transition-all duration-500",
                algo === a ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white" : "border-zinc-200 dark:border-zinc-700 text-zinc-500"
              )}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <div className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        Servers shrink response bodies before sending — less bandwidth, faster loads.
      </div>

      <div className="min-h-[280px] px-4 py-4 flex flex-col justify-center gap-3">
        <div className="flex gap-1 flex-wrap">
          {CONTENTS.map((c) => (
            <button
              key={c}
              onClick={() => { setContent(c); setPhase("idle"); setAnimatedRatio(0); }}
              className={cn(
                "px-2 py-0.5 rounded border text-[10px] font-semibold transition-all duration-500",
                content === c ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900" : "border-zinc-200 dark:border-zinc-700 text-zinc-500"
              )}
            >
              {CONTENT_LABELS[c]}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 justify-center py-2">
          <Monitor className="size-5 text-blue-500" />
          <div className="flex-1 relative h-6 max-w-[200px]">
            <div className={cn("absolute inset-y-1/2 h-0.5 transition-all duration-700", phase !== "idle" ? "w-full bg-emerald-400" : "w-0 bg-zinc-200")} />
            {phase === "compressing" && (
              <div className="absolute top-1/2 -translate-y-1/2 size-2 rounded-full bg-emerald-500 animate-pulse" style={{ left: "50%" }} />
            )}
            <ArrowRight className={cn("absolute right-0 top-1/2 -translate-y-1/2 size-3.5 transition-all duration-500", phase === "done" ? "text-emerald-500" : "text-zinc-300")} />
          </div>
          <Server className={cn("size-5 transition-colors duration-500", phase === "done" ? "text-emerald-500" : "text-zinc-400")} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 p-2">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-1">Request</div>
            <div className="font-mono text-[10px]">
              <span className="text-zinc-400">Accept-Encoding: </span>
              <span className="text-blue-600">br, gzip</span>
            </div>
          </div>
          <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 p-2">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-1">Response</div>
            <div className="font-mono text-[10px]">
              <span className="text-zinc-400">Content-Encoding: </span>
              <span className={algo === "none" ? "text-zinc-400" : "text-emerald-600"}>{ALGO_ENCODING[algo]}</span>
              <br />
              <span className="text-zinc-400">Type: </span>
              <span className="text-zinc-600">{CONTENT_TYPES[content]}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-20 text-right">Original</span>
            <div className="flex-1 h-5 bg-zinc-100 dark:bg-zinc-800 rounded overflow-hidden">
              <div className="h-full bg-zinc-400 rounded w-full transition-all duration-500" />
            </div>
            <span className="text-[11px] font-mono font-bold text-zinc-600 w-16">{formatBytes(originalSize)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-20 text-right">Compressed</span>
            <div className="flex-1 h-5 bg-zinc-100 dark:bg-zinc-800 rounded overflow-hidden">
              <div
                className={cn("h-full rounded transition-all duration-500", algo === "none" ? "bg-zinc-400" : ratio < 20 ? "bg-amber-500" : "bg-emerald-500")}
                style={{ width: `${compressedBarWidth}%` }}
              />
            </div>
            <span className="text-[11px] font-mono font-bold text-emerald-600 w-16">{formatBytes(displayCompressed)}</span>
          </div>
        </div>

        <div className={cn(
          "rounded-lg px-3 py-2 text-center min-h-[44px] flex items-center justify-center transition-all duration-500 border",
          phase === "done" && ratio >= 20 ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900" :
          phase === "done" ? "bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-700" :
          "bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-700"
        )}>
          {phase === "idle" ? (
            <span className="text-sm text-zinc-500">Click Compress to see size reduction</span>
          ) : algo === "none" ? (
            <span className="text-sm font-semibold text-zinc-500">No compression — full size transmitted</span>
          ) : (
            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
              {Math.round(displayRatio)}% reduction · {factor}× smaller
            </span>
          )}
        </div>
      </div>

      <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
        <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">
          {phase === "done" ? `${formatBytes(originalSize)} → ${formatBytes(compressedSize)} with ${algo}` : `${CONTENT_LABELS[content]} via ${algo}`}
        </span>
        <button
          onClick={runCompress}
          disabled={animating}
          className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          Compress
        </button>
      </div>
    </div>
  );
}
