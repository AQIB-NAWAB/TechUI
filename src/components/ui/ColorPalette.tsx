"use client";

import { useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Copy, Check, Palette } from "lucide-react";

const SwatchSchema = z.object({
  name: z.string(),
  value: z.string(),
  label: z.string().optional(),
});

const ScaleSchema = z.object({
  name: z.string(),
  swatches: z.array(SwatchSchema),
});

export const ColorPaletteSchema = z.object({
  title: z.string().optional().default("Color Palette"),
  scales: z.array(ScaleSchema).optional(),
  swatches: z.array(SwatchSchema).optional(),
});

export type ColorPaletteProps = z.infer<typeof ColorPaletteSchema>;

function Swatch({ swatch, onCopy }: { swatch: z.infer<typeof SwatchSchema>; onCopy: (v: string) => void }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(swatch.value);
    onCopy(swatch.value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="cursor-pointer group flex flex-col gap-1 text-left transition-all duration-500 hover:scale-[1.03]"
      title={`Click to copy ${swatch.value}`}
    >
      <div
        className="w-full h-10 rounded-lg flex items-center justify-center border border-zinc-200/50 dark:border-zinc-700/50"
        style={{ backgroundColor: swatch.value }}
      >
        <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-500 drop-shadow">
          {copied ? <Check className="size-3 text-white" /> : <Copy className="size-3 text-white" />}
        </span>
      </div>
      <div className="text-center">
        <div className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-400 leading-tight">{swatch.name}</div>
        <div className="text-[9px] font-mono text-zinc-400 leading-tight">{swatch.label ?? swatch.value}</div>
      </div>
    </button>
  );
}

export function ColorPalette({ title = "Color Palette", scales, swatches }: ColorPaletteProps) {
  const [lastCopied, setLastCopied] = useState<string | null>(null);
  const totalSwatches = (scales?.reduce((n, s) => n + s.swatches.length, 0) ?? 0) + (swatches?.length ?? 0);

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="h-12 px-4 flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <Palette className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">{title}</span>
        <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
          {totalSwatches} colors
        </span>
      </div>

      <div className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        Design tokens for your UI — click any swatch to copy its hex value to the clipboard.
      </div>

      <div className="min-h-[220px] p-4 flex flex-col justify-center space-y-4">
        {scales?.map((scale, i) => (
          <div key={i} className="rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30 p-3">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2">
              {scale.name}
            </div>
            <div
              className="grid gap-2"
              style={{ gridTemplateColumns: `repeat(${Math.min(scale.swatches.length, 10)}, minmax(0, 1fr))` }}
            >
              {scale.swatches.map((s, j) => (
                <Swatch key={j} swatch={s} onCopy={setLastCopied} />
              ))}
            </div>
          </div>
        ))}

        {swatches && (
          <div className="rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30 p-3">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2">
              Swatches
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
              {swatches.map((s, i) => (
                <Swatch key={i} swatch={s} onCopy={setLastCopied} />
              ))}
            </div>
          </div>
        )}

        <div className="min-h-[52px] rounded-lg border border-zinc-100 dark:border-zinc-800 p-3 flex items-center gap-3 transition-all duration-500">
          {lastCopied ? (
            <>
              <div
                className="size-10 rounded-lg border border-zinc-200/50 dark:border-zinc-700/50 shrink-0"
                style={{ backgroundColor: lastCopied }}
              />
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                Preview —{" "}
                <code className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">{lastCopied}</code>
              </div>
            </>
          ) : (
            <span className="text-xs text-zinc-400">Click a swatch to preview the copied color here</span>
          )}
        </div>
      </div>

      <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/30">
        <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">
          {lastCopied ? (
            <>Copied <code className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">{lastCopied}</code></>
          ) : (
            "Click a color swatch to copy its value"
          )}
        </span>
        {lastCopied && (
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(lastCopied)}
            className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Copy Again
          </button>
        )}
      </div>
    </div>
  );
}
