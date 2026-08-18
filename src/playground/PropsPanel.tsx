"use client";

import { cn } from "@/lib/utils";
import type { ComponentEntry } from "@/registry/types";

type PropsPanelProps = {
  entry: ComponentEntry;
  currentProps: Record<string, unknown>;
  onPropsChange: (props: Record<string, unknown>) => void;
};

function FieldEditor({
  name,
  value,
  onChange,
}: {
  name: string;
  value: unknown;
  onChange: (val: unknown) => void;
}) {
  const baseInput =
    "w-full h-7 px-2 rounded-md bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-800 dark:text-zinc-200 outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition-shadow font-mono";

  if (typeof value === "boolean") {
    return (
      <button
        onClick={() => onChange(!value)}
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border-2 border-transparent transition-colors",
          value
            ? "bg-zinc-900 dark:bg-white"
            : "bg-zinc-200 dark:bg-zinc-700"
        )}
      >
        <span
          className={cn(
            "inline-block size-3.5 rounded-full bg-white dark:bg-zinc-900 shadow-sm transition-transform",
            value ? "translate-x-4" : "translate-x-0"
          )}
        />
      </button>
    );
  }

  if (typeof value === "number") {
    return (
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={baseInput}
      />
    );
  }

  if (typeof value === "string") {
    if (value.includes("\n") || value.length > 60) {
      return (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className={cn(baseInput, "h-auto resize-none py-1.5 leading-relaxed")}
        />
      );
    }
    return (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={baseInput}
      />
    );
  }

  if (Array.isArray(value) || (value !== null && typeof value === "object")) {
    return (
      <textarea
        value={JSON.stringify(value, null, 2)}
        onChange={(e) => {
          try { onChange(JSON.parse(e.target.value)); } catch { /* invalid JSON */ }
        }}
        rows={4}
        className={cn(baseInput, "h-auto resize-none py-1.5 leading-relaxed text-[10px]")}
      />
    );
  }

  return (
    <input
      type="text"
      value={String(value ?? "")}
      onChange={(e) => onChange(e.target.value)}
      className={baseInput}
    />
  );
}

export function PropsPanel({ entry, currentProps, onPropsChange }: PropsPanelProps) {
  function updateField(key: string, value: unknown) {
    onPropsChange({ ...currentProps, [key]: value });
  }

  const fields = Object.entries(currentProps);

  if (fields.length === 0) {
    return (
      <div className="p-4 text-xs text-zinc-400 text-center">No editable props</div>
    );
  }

  return (
    <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
      {fields.map(([key, value]) => (
        <div key={key} className="px-4 py-3">
          <div className="flex items-center gap-2 mb-1.5">
            <label className="text-[11px] font-mono font-medium text-zinc-700 dark:text-zinc-300 flex-1 truncate">
              {key}
            </label>
            <span className="text-[9px] text-zinc-400 font-sans">
              {Array.isArray(value) ? "array" : typeof value}
            </span>
          </div>
          <FieldEditor name={key} value={value} onChange={(v) => updateField(key, v)} />
        </div>
      ))}
    </div>
  );
}
