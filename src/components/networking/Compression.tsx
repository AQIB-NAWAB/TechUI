"use client";

import { useState, useEffect, useRef } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Minimize2 } from "lucide-react";

export const CompressionSchema = z.object({
  algorithm: z.enum(["gzip", "brotli", "none"]).default("brotli"),
  content: z.enum(["html", "json", "image", "binary"]).default("json"),
  originalSize: z.number().default(24000),
});

export type CompressionProps = z.infer<typeof CompressionSchema>;

// Typical compression ratios (percentage reduction)
const RATIOS: Record<string, Record<string, number>> = {
  gzip:   { html: 78, json: 85, image: 3,  binary: 1 },
  brotli: { html: 82, json: 88, image: 4,  binary: 1 },
  none:   { html: 0,  json: 0,  image: 0,  binary: 0 },
};

const CONTENT_LABELS: Record<string, string> = {
  html:   "HTML",
  json:   "JSON",
  image:  "Image (JPEG)",
  binary: "Binary",
};

const CONTENT_TYPES: Record<string, string> = {
  html:   "text/html; charset=utf-8",
  json:   "application/json",
  image:  "image/jpeg",
  binary: "application/octet-stream",
};

const ALGO_ENCODING: Record<string, string> = {
  gzip:   "gzip",
  brotli: "br",
  none:   "identity",
};

function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000)     return `${(bytes / 1_000).toFixed(1)} KB`;
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
  const animFrameRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);
  const startRef = useRef<number>(0);

  const ratio = RATIOS[algo][content] ?? 0;
  const compressedSize = Math.round(originalSize * (1 - ratio / 100));

  // Animate bar on mount and when algo/content changes
  useEffect(() => {
    if (algo === "none") {
      setAnimatedRatio(0);
      return;
    }
    setAnimating(true);
    setAnimatedRatio(0);
    const duration = 800;
    startRef.current = performance.now();

    const step = (now: number) => {
      const elapsed = now - startRef.current;
      const t = Math.min(elapsed / duration, 1);
      // ease out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setAnimatedRatio(ratio * eased);
      if (t < 1) {
        animFrameRef.current = requestAnimationFrame(step);
      } else {
        setAnimatedRatio(ratio);
        setAnimating(false);
      }
    };

    animFrameRef.current = requestAnimationFrame(step);
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [algo, content, originalSize]);

  const displayRatio = animating ? animatedRatio : ratio;
  const displayCompressed = Math.round(originalSize * (1 - displayRatio / 100));
  const compressedBarWidth = algo === "none" ? 100 : Math.max(100 - displayRatio, 2);
  const factor = ratio > 0 ? (originalSize / compressedSize).toFixed(1) : "1.0";

  const ALGOS: AlgoKey[] = ["gzip", "brotli", "none"];
  const CONTENTS: ContentKey[] = ["html", "json", "image", "binary"];

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <Minimize2 className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">HTTP Compression</span>
        <div className="flex gap-1">
          {ALGOS.map((a) => (
            <button
              key={a}
              onClick={() => setAlgo(a)}
              className={cn(
                "px-2.5 py-1 rounded-lg border text-[11px] font-mono font-semibold transition-all duration-300 cursor-pointer",
                algo === a
                  ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white"
                  : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400"
              )}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Content — fixed height */}
      <div className="min-h-[300px] px-4 pt-3 pb-3 flex flex-col gap-3">

        {/* Content type selector */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400 shrink-0">Content type:</span>
          <div className="flex gap-1 flex-wrap">
            {CONTENTS.map((c) => (
              <button
                key={c}
                onClick={() => setContent(c)}
                className={cn(
                  "px-2 py-0.5 rounded border text-[10px] font-semibold transition-all duration-300 cursor-pointer",
                  content === c
                    ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white"
                    : "border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-zinc-400"
                )}
              >
                {CONTENT_LABELS[c]}
              </button>
            ))}
          </div>
        </div>

        {/* Header exchange */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 p-2">
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide mb-1.5">Request headers</div>
            <div className="font-mono text-[10px] space-y-0.5">
              <div>
                <span className="text-zinc-400">Accept-Encoding: </span>
                <span className="text-blue-600 dark:text-blue-400">br, gzip, deflate</span>
              </div>
              <div>
                <span className="text-zinc-400">Accept: </span>
                <span className="text-zinc-600 dark:text-zinc-300">{CONTENT_TYPES[content]}</span>
              </div>
            </div>
          </div>
          <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 p-2">
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide mb-1.5">Response headers</div>
            <div className="font-mono text-[10px] space-y-0.5">
              <div>
                <span className="text-zinc-400">Content-Encoding: </span>
                <span className={cn(
                  "font-semibold",
                  algo === "none" ? "text-zinc-400" : "text-emerald-600 dark:text-emerald-400"
                )}>
                  {ALGO_ENCODING[algo]}
                </span>
              </div>
              <div>
                <span className="text-zinc-400">Content-Type: </span>
                <span className="text-zinc-600 dark:text-zinc-300">{CONTENT_TYPES[content]}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Size bars */}
        <div className="space-y-2">
          {/* Original */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-20 shrink-0 text-right">Original</span>
            <div className="flex-1 h-5 bg-zinc-100 dark:bg-zinc-800 rounded overflow-hidden">
              <div className="h-full bg-zinc-400 dark:bg-zinc-500 rounded transition-all duration-500 w-full" />
            </div>
            <span className="text-[11px] font-mono font-bold text-zinc-600 dark:text-zinc-300 w-16 shrink-0">
              {formatBytes(originalSize)}
            </span>
          </div>

          {/* Compressed */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-20 shrink-0 text-right">Compressed</span>
            <div className="flex-1 h-5 bg-zinc-100 dark:bg-zinc-800 rounded overflow-hidden">
              <div
                className={cn(
                  "h-full rounded transition-all duration-500",
                  algo === "none"
                    ? "bg-zinc-400 dark:bg-zinc-500"
                    : ratio < 20
                    ? "bg-amber-500"
                    : "bg-emerald-500"
                )}
                style={{ width: `${compressedBarWidth}%` }}
              />
            </div>
            <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 w-16 shrink-0">
              {formatBytes(displayCompressed)}
            </span>
          </div>
        </div>

        {/* Ratio summary */}
        <div className={cn(
          "rounded-lg px-3 py-2 text-center transition-all duration-500",
          algo === "none"
            ? "bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700"
            : ratio < 20
            ? "bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900"
            : "bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900"
        )}>
          {algo === "none" ? (
            <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">No compression — full size transmitted</span>
          ) : (
            <div className="flex items-center justify-center gap-3 text-sm">
              <span className="font-bold text-emerald-700 dark:text-emerald-300 text-base">
                {Math.round(displayRatio)}% reduction
              </span>
              <span className="text-zinc-400">·</span>
              <span className="font-semibold text-zinc-600 dark:text-zinc-300">{factor}× smaller</span>
            </div>
          )}
        </div>

        {/* Comparison table: all content types */}
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
          <div className="bg-zinc-50 dark:bg-zinc-800/60 px-3 py-1.5 border-b border-zinc-200 dark:border-zinc-700">
            <span className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">
              {algo.toUpperCase()} compression by content type
            </span>
          </div>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {CONTENTS.map((c) => {
              const r = RATIOS[algo][c];
              return (
                <div
                  key={c}
                  onClick={() => setContent(c)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-all duration-200",
                    content === c ? "bg-zinc-50 dark:bg-zinc-800/60" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/30"
                  )}
                >
                  <span className={cn(
                    "text-[11px] font-semibold w-16 shrink-0",
                    content === c ? "text-zinc-900 dark:text-white" : "text-zinc-500 dark:text-zinc-400"
                  )}>
                    {CONTENT_LABELS[c]}
                  </span>
                  <div className="flex-1 h-3 bg-zinc-100 dark:bg-zinc-800 rounded overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded transition-all duration-500",
                        r > 50 ? "bg-emerald-500" : r > 10 ? "bg-amber-500" : "bg-zinc-400"
                      )}
                      style={{ width: `${Math.max(r, 2)}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono w-8 text-right text-zinc-500 dark:text-zinc-400 shrink-0">
                    {r}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Key insight */}
        <div className="text-[10px] text-zinc-400 dark:text-zinc-500 bg-zinc-50 dark:bg-zinc-800/40 rounded-lg px-3 py-2">
          Brotli is newer and compresses ~<strong className="text-zinc-600 dark:text-zinc-300">20% better than gzip</strong> for text content · Images are already compressed — adding gzip barely helps
        </div>
      </div>
    </div>
  );
}
