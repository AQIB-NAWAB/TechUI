"use client";

import { useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Copy, Check } from "lucide-react";

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

function Swatch({ swatch }: { swatch: z.infer<typeof SwatchSchema> }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(swatch.value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div onClick={copy} className="cursor-pointer group flex flex-col gap-1" title={`Click to copy ${swatch.value}`}>
      <div
        className="w-full h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105"
        style={{ backgroundColor: swatch.value }}
      >
        <span className="opacity-0 group-hover:opacity-100 transition-opacity drop-shadow">
          {copied
            ? <Check className="size-3 text-white" />
            : <Copy className="size-3 text-white" />
          }
        </span>
      </div>
      <div className="text-center">
        <div className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-400 leading-tight">{swatch.name}</div>
        <div className="text-[9px] font-mono text-zinc-400 leading-tight">{swatch.label ?? swatch.value}</div>
      </div>
    </div>
  );
}

export function ColorPalette({ title = "Color Palette", scales, swatches }: ColorPaletteProps) {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-between">
        <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{title}</span>
        <span className="text-[10px] text-zinc-400">Click any color to copy its value</span>
      </div>

      <div className="p-4 space-y-5">
        {scales?.map((scale, i) => (
          <div key={i}>
            <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide mb-2">{scale.name}</div>
            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(scale.swatches.length, 10)}, minmax(0, 1fr))` }}>
              {scale.swatches.map((s, j) => (
                <Swatch key={j} swatch={s} />
              ))}
            </div>
          </div>
        ))}

        {swatches && (
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
            {swatches.map((s, i) => (
              <Swatch key={i} swatch={s} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
