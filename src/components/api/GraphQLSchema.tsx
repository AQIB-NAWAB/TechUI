"use client";

import { useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Braces, Link } from "lucide-react";

const FieldSchema = z.object({
  name: z.string(),
  type: z.string(),
  required: z.boolean().optional().default(false),
  description: z.string().optional(),
  isRelation: z.boolean().optional().default(false),
});

const TypeSchema = z.object({
  name: z.string(),
  kind: z.enum(["type", "input", "enum", "interface"]).default("type"),
  description: z.string().optional(),
  fields: z.array(FieldSchema),
});

export const GraphQLSchemaSchema = z.object({
  types: z.array(TypeSchema).optional(),
});

export type GraphQLSchemaProps = z.infer<typeof GraphQLSchemaSchema>;

const KIND_STYLES: Record<string, { pill: string; keyword: string; label: string }> = {
  type:      { pill: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800",      keyword: "text-blue-500 dark:text-blue-400",   label: "type" },
  input:     { pill: "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800", keyword: "text-violet-500 dark:text-violet-400", label: "input" },
  enum:      { pill: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800",   keyword: "text-amber-500 dark:text-amber-400",  label: "enum" },
  interface: { pill: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800", keyword: "text-emerald-500 dark:text-emerald-400", label: "interface" },
};

const SCALAR_TYPES = new Set(["ID", "String", "Float", "Int", "Boolean"]);

function isScalarType(type: string): boolean {
  // Strip wrapping characters like [ ] !
  const base = type.replace(/[\[\]!]/g, "");
  return SCALAR_TYPES.has(base);
}

function TypeBadge({ kind }: { kind: string }) {
  const style = KIND_STYLES[kind] ?? KIND_STYLES.type;
  return (
    <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide", style.pill)}>
      {style.label}
    </span>
  );
}

function FieldTypeDisplay({
  type,
  isRelation,
  typeNames,
  onJump,
}: {
  type: string;
  isRelation?: boolean;
  typeNames: Set<string>;
  onJump: (name: string) => void;
}) {
  // Strip wrappers to find base type name
  const base = type.replace(/[\[\]!]/g, "");
  const prefix = type.startsWith("[") ? "[" : "";
  const suffix = type.endsWith("!") ? (type.startsWith("[") ? "]!" : "!") : type.startsWith("[") ? "]" : "";
  const innerBang = type.startsWith("[") && type.includes("!]") ? "!" : "";

  const isKnownType = typeNames.has(base);

  if (isRelation && isKnownType) {
    return (
      <span className="flex items-center gap-1">
        {prefix && <span className="text-zinc-400 dark:text-zinc-500">{prefix}</span>}
        <button
          onClick={() => onJump(base)}
          className="text-blue-500 dark:text-blue-400 hover:underline font-mono font-semibold text-[12px] transition-colors"
          title={`Jump to ${base}`}
        >
          {base}
        </button>
        {innerBang && <span className="text-red-500 dark:text-red-400 font-mono">{innerBang}</span>}
        {suffix && <span className="text-zinc-400 dark:text-zinc-500">{suffix.replace("!", "")}</span>}
        {type.endsWith("!") && <span className="text-red-500 dark:text-red-400 font-mono">!</span>}
        <Link className="size-3 text-zinc-400 dark:text-zinc-500 shrink-0" />
      </span>
    );
  }

  // Scalar or unknown relation
  const color = isScalarType(type)
    ? "text-emerald-600 dark:text-emerald-400"
    : "text-blue-500 dark:text-blue-400";

  return (
    <span className="flex items-center gap-0.5 font-mono text-[12px]">
      <span className={color}>{type.replace("!", "")}</span>
      {type.endsWith("!") && <span className="text-red-500 dark:text-red-400">!</span>}
      {isRelation && <Link className="size-3 text-zinc-400 dark:text-zinc-500 ml-1 shrink-0" />}
    </span>
  );
}

export function GraphQLSchema({ types = [] }: GraphQLSchemaProps) {
  const [selectedIdx, setSelectedIdx] = useState(0);

  const safeTypes = types.length > 0 ? types : [];
  const selected = safeTypes[Math.min(selectedIdx, safeTypes.length - 1)];
  const typeNames = new Set(safeTypes.map((t) => t.name));

  function jumpToType(name: string) {
    const idx = safeTypes.findIndex((t) => t.name === name);
    if (idx !== -1) setSelectedIdx(idx);
  }

  if (!selected) {
    return (
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 text-center text-sm text-zinc-400 min-h-[280px] flex items-center justify-center">
        No types defined
      </div>
    );
  }

  const kindStyle = KIND_STYLES[selected.kind] ?? KIND_STYLES.type;
  const isEnum = selected.kind === "enum";

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
        <Braces className="size-3.5 text-zinc-400 shrink-0" />
        <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex-1">GraphQL Schema</span>
        <span className="text-[11px] text-zinc-400">{safeTypes.length} type{safeTypes.length !== 1 ? "s" : ""}</span>
        <TypeBadge kind={selected.kind} />
      </div>

      {/* Type pills */}
      <div className="flex flex-wrap gap-1.5 px-4 pt-3 pb-2">
        {safeTypes.map((t, i) => {
          const ks = KIND_STYLES[t.kind] ?? KIND_STYLES.type;
          const isActive = i === selectedIdx;
          return (
            <button
              key={t.name}
              onClick={() => setSelectedIdx(i)}
              className={cn(
                "text-xs font-semibold px-3 py-1 rounded-full border transition-all duration-500",
                isActive
                  ? cn(ks.pill, "shadow-sm scale-105")
                  : "border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-300",
              )}
            >
              {t.name}
            </button>
          );
        })}
      </div>

      {/* Schema view */}
      <div className="px-4 pb-4 min-h-[280px] transition-all duration-500">
        <div className="rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 overflow-hidden">
          {/* Type header */}
          <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-start gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className={cn("text-sm font-mono font-semibold", kindStyle.keyword)}>
                {selected.kind}
              </span>
              <span className="text-sm font-mono font-bold text-zinc-800 dark:text-zinc-100">
                {selected.name}
              </span>
              <span className="text-sm font-mono text-zinc-400 dark:text-zinc-600">{"{"}</span>
            </div>
            {selected.description && (
              <p className="text-[11px] italic text-zinc-400 dark:text-zinc-500 w-full mt-0.5">
                {/* "{selected.description}" */}
                &quot;{selected.description}&quot;
              </p>
            )}
          </div>

          {/* Fields */}
          <div className="px-4 py-2">
            {isEnum ? (
              // Enum values as badges
              <div className="flex flex-wrap gap-1.5 py-1">
                {selected.fields.map((f) => (
                  <span
                    key={f.name}
                    className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                  >
                    {f.name}
                  </span>
                ))}
              </div>
            ) : (
              // Regular fields
              <table className="w-full text-[12px] font-mono">
                <tbody>
                  {selected.fields.map((f) => (
                    <tr
                      key={f.name}
                      className="group border-b border-zinc-50 dark:border-zinc-800/50 last:border-b-0"
                    >
                      <td className="py-1.5 pr-4 w-8">
                        <span className="text-zinc-200 dark:text-zinc-700 group-hover:text-zinc-300 dark:group-hover:text-zinc-600 transition-colors">
                          {f.isRelation ? (
                            <Link className="size-3 text-zinc-300 dark:text-zinc-600" />
                          ) : null}
                        </span>
                      </td>
                      <td className="py-1.5 pr-4 align-top">
                        <span className="text-blue-600 dark:text-blue-400 font-semibold">{f.name}</span>
                        <span className="text-zinc-400 dark:text-zinc-600">:</span>
                      </td>
                      <td className="py-1.5 align-top">
                        <FieldTypeDisplay
                          type={f.type}
                          isRelation={f.isRelation}
                          typeNames={typeNames}
                          onJump={jumpToType}
                        />
                      </td>
                      {f.description && (
                        <td className="py-1.5 pl-4 align-top">
                          <span className="text-zinc-400 dark:text-zinc-500 text-[10px] not-italic">
                            # {f.description}
                          </span>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Closing brace */}
          <div className="px-4 py-2 border-t border-zinc-50 dark:border-zinc-800/50">
            <span className="text-sm font-mono text-zinc-400 dark:text-zinc-600">{"}"}</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 mt-3 px-1">
          <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wide">Legend:</span>
          <span className="flex items-center gap-1 text-[10px] text-zinc-500 dark:text-zinc-400">
            <span className="text-red-500 font-mono font-bold">!</span> required
          </span>
          <span className="flex items-center gap-1 text-[10px] text-zinc-500 dark:text-zinc-400">
            <span className="text-emerald-600 dark:text-emerald-400 font-mono font-semibold">String</span> scalar
          </span>
          <span className="flex items-center gap-1 text-[10px] text-zinc-500 dark:text-zinc-400">
            <Link className="size-3" /> relation (click to jump)
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-2 bg-zinc-50/50 dark:bg-zinc-900/30">
        <p className="text-[10px] text-zinc-400">
          Click a type pill to explore it · Click relation types (blue) to jump to that type
        </p>
      </div>
    </div>
  );
}
