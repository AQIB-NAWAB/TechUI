"use client";

import { cn } from "@/lib/utils";
import type { ComponentEntry } from "@/registry/types";
import type { z } from "zod";
import { ChevronDown } from "lucide-react";

type FieldKind =
  | { kind: "boolean" }
  | { kind: "string" }
  | { kind: "number" }
  | { kind: "enum"; values: string[] }
  | { kind: "array" }
  | { kind: "object" }
  | { kind: "unknown" };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function unwrapZodDef(def: any): any {
  while (
    def.typeName === "ZodOptional" ||
    def.typeName === "ZodDefault" ||
    def.typeName === "ZodNullable"
  ) {
    def = (def.innerType ?? def.type)?._def ?? def;
    if (!def) break;
  }
  return def;
}

function getFieldKind(schema: z.ZodTypeAny, key: string): FieldKind {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const topDef = (schema as any)._def;
    if (topDef.typeName !== "ZodObject") return { kind: "unknown" };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fieldSchema = topDef.shape()[key] as any;
    if (!fieldSchema) return { kind: "unknown" };

    const fd = unwrapZodDef(fieldSchema._def);
    switch (fd?.typeName) {
      case "ZodEnum":    return { kind: "enum", values: fd.values as string[] };
      case "ZodBoolean": return { kind: "boolean" };
      case "ZodString":  return { kind: "string" };
      case "ZodNumber":  return { kind: "number" };
      case "ZodArray":   return { kind: "array" };
      case "ZodObject":  return { kind: "object" };
      default:           return { kind: "unknown" };
    }
  } catch {
    return { kind: "unknown" };
  }
}

const baseInput =
  "w-full h-7 px-2 rounded-md bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-800 dark:text-zinc-200 outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 font-mono transition-shadow";

function BooleanToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border-2 border-transparent transition-colors",
        value ? "bg-zinc-900 dark:bg-white" : "bg-zinc-200 dark:bg-zinc-700"
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

function EnumSelect({ value, values, onChange }: { value: string; values: string[]; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          baseInput,
          "appearance-none pr-7 cursor-pointer"
        )}
      >
        {values.map((v) => (
          <option key={v} value={v}>{v}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-3 text-zinc-400 pointer-events-none" />
    </div>
  );
}

function FieldEditor({
  name,
  value,
  fieldKind,
  onChange,
}: {
  name: string;
  value: unknown;
  fieldKind: FieldKind;
  onChange: (val: unknown) => void;
}) {
  // Boolean
  if (fieldKind.kind === "boolean" || typeof value === "boolean") {
    return <BooleanToggle value={Boolean(value)} onChange={onChange} />;
  }

  // Enum select
  if (fieldKind.kind === "enum" && typeof value === "string") {
    return (
      <EnumSelect
        value={value}
        values={fieldKind.values}
        onChange={onChange}
      />
    );
  }

  // Number
  if (fieldKind.kind === "number" || typeof value === "number") {
    return (
      <input
        type="number"
        value={typeof value === "number" ? value : ""}
        onChange={(e) => onChange(Number(e.target.value))}
        className={baseInput}
      />
    );
  }

  // String (detect long/multiline)
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

  // Array or Object — JSON editor
  if (Array.isArray(value) || (value !== null && typeof value === "object")) {
    return (
      <textarea
        value={JSON.stringify(value, null, 2)}
        onChange={(e) => {
          try {
            onChange(JSON.parse(e.target.value));
          } catch {
            // keep current on invalid JSON
          }
        }}
        rows={Math.min(8, JSON.stringify(value, null, 2).split("\n").length + 1)}
        className={cn(
          baseInput,
          "h-auto resize-none py-1.5 leading-relaxed text-[10px]"
        )}
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

type PropsPanelProps = {
  entry: ComponentEntry;
  currentProps: Record<string, unknown>;
  onPropsChange: (props: Record<string, unknown>) => void;
};

const KIND_LABEL: Record<FieldKind["kind"], string> = {
  boolean: "bool",
  string: "string",
  number: "number",
  enum: "enum",
  array: "array",
  object: "object",
  unknown: "",
};

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
      {fields.map(([key, value]) => {
        const fieldKind = getFieldKind(entry.schema, key);
        const kindLabel = fieldKind.kind === "enum"
          ? fieldKind.values.slice(0, 3).join(" | ") + (fieldKind.values.length > 3 ? "…" : "")
          : KIND_LABEL[fieldKind.kind] || (Array.isArray(value) ? "array" : typeof value);

        const isBool = fieldKind.kind === "boolean" || typeof value === "boolean";

        return (
          <div key={key} className="px-4 py-3">
            <div className={cn("flex items-center gap-2 mb-1.5", isBool && "mb-0")}>
              <label className="text-[11px] font-mono font-medium text-zinc-700 dark:text-zinc-300 flex-1 truncate">
                {key}
              </label>
              {isBool ? (
                <FieldEditor
                  name={key}
                  value={value}
                  fieldKind={fieldKind}
                  onChange={(v) => updateField(key, v)}
                />
              ) : (
                <span className="text-[9px] text-zinc-400 font-sans shrink-0 max-w-[80px] truncate text-right">
                  {kindLabel}
                </span>
              )}
            </div>
            {!isBool && (
              <FieldEditor
                name={key}
                value={value}
                fieldKind={fieldKind}
                onChange={(v) => updateField(key, v)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
