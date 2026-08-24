"use client";

import { useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Braces, ChevronRight, Link2, Circle } from "lucide-react";

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

const KIND_COLORS: Record<string, { node: string; pill: string; line: string }> = {
  type: { node: "border-blue-400 dark:border-blue-600 bg-blue-50 dark:bg-blue-950/40", pill: "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300", line: "stroke-blue-400" },
  input: { node: "border-violet-400 dark:border-violet-600 bg-violet-50 dark:bg-violet-950/40", pill: "bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300", line: "stroke-violet-400" },
  enum: { node: "border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-950/40", pill: "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300", line: "stroke-amber-400" },
  interface: { node: "border-emerald-400 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40", pill: "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300", line: "stroke-emerald-400" },
};

const SCALAR_TYPES = new Set(["ID", "String", "Float", "Int", "Boolean"]);

function baseType(type: string): string {
  return type.replace(/[\[\]!]/g, "");
}

function isScalarType(type: string): boolean {
  return SCALAR_TYPES.has(baseType(type));
}

export function GraphQLSchema({ types = [] }: GraphQLSchemaProps) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [expandedField, setExpandedField] = useState<string | null>(null);

  const safeTypes = types.length > 0 ? types : [];
  const selected = safeTypes[Math.min(selectedIdx, safeTypes.length - 1)];
  const typeNames = new Set(safeTypes.map((t) => t.name));

  function jumpToType(name: string) {
    const idx = safeTypes.findIndex((t) => t.name === name);
    if (idx !== -1) {
      setSelectedIdx(idx);
      setExpandedField(null);
    }
  }

  if (!selected) {
    return (
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 text-center text-sm text-zinc-400 min-h-[280px] flex items-center justify-center">
        No types defined
      </div>
    );
  }

  const kindColor = KIND_COLORS[selected.kind] ?? KIND_COLORS.type;
  const relations = selected.fields.filter((f) => f.isRelation && typeNames.has(baseType(f.type)));

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <Braces className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">GraphQL Schema</span>
        <span className="text-[11px] text-zinc-400">{safeTypes.length} types</span>
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        Types connect like a family tree — click a type, then explore its fields and jump to related types.
      </p>

      <div className="flex min-h-[240px]">
        <div className="w-36 shrink-0 border-r border-zinc-100 dark:border-zinc-800 p-3 space-y-1.5 overflow-y-auto">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-2">Type tree</div>
          {safeTypes.map((t, i) => {
            const kc = KIND_COLORS[t.kind] ?? KIND_COLORS.type;
            const isActive = i === selectedIdx;
            const relCount = t.fields.filter((f) => f.isRelation).length;
            return (
              <button
                key={t.name}
                onClick={() => { setSelectedIdx(i); setExpandedField(null); }}
                className={cn(
                  "w-full text-left rounded-lg border px-2.5 py-2 transition-all duration-500 flex items-center gap-1.5",
                  isActive
                    ? cn(kc.node, "ring-1 ring-zinc-300 dark:ring-zinc-600 shadow-sm")
                    : "border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                )}
              >
                <Circle className={cn("size-2 shrink-0 fill-current", isActive ? "text-zinc-600 dark:text-zinc-300" : "text-zinc-300 dark:text-zinc-600")} />
                <div className="min-w-0 flex-1">
                  <div className={cn("text-xs font-semibold truncate", isActive ? "text-zinc-800 dark:text-zinc-100" : "text-zinc-600 dark:text-zinc-400")}>
                    {t.name}
                  </div>
                  {relCount > 0 && (
                    <div className="text-[9px] text-zinc-400">{relCount} link{relCount !== 1 ? "s" : ""}</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex-1 p-4 flex flex-col gap-3 min-w-0">
          <div className={cn("rounded-lg border-2 p-3 transition-all duration-500", kindColor.node)}>
            <div className="flex items-center gap-2 mb-1">
              <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded uppercase", kindColor.pill)}>
                {selected.kind}
              </span>
              <span className="text-sm font-bold text-zinc-800 dark:text-zinc-100">{selected.name}</span>
            </div>
            {selected.description && (
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{selected.description}</p>
            )}
          </div>

          {selected.kind === "enum" ? (
            <div className="flex flex-wrap gap-1.5">
              {selected.fields.map((f) => (
                <span
                  key={f.name}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 transition-all duration-500"
                >
                  {f.name}
                </span>
              ))}
            </div>
          ) : (
            <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[140px]">
              {selected.fields.map((f) => {
                const base = baseType(f.type);
                const isRel = f.isRelation && typeNames.has(base);
                const isExpanded = expandedField === f.name;
                return (
                  <button
                    key={f.name}
                    type="button"
                    onClick={() => {
                      if (isRel) {
                        jumpToType(base);
                      } else {
                        setExpandedField(isExpanded ? null : f.name);
                      }
                    }}
                    className={cn(
                      "w-full text-left rounded-lg border px-3 py-2 transition-all duration-500 flex items-center gap-2 group",
                      isExpanded || isRel
                        ? "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50"
                        : "border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/30"
                    )}
                  >
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 shrink-0">{f.name}</span>
                    <ChevronRight className="size-3 text-zinc-300 dark:text-zinc-600 shrink-0" />
                    <span className={cn(
                      "text-xs font-mono truncate flex-1",
                      isScalarType(f.type) ? "text-emerald-600 dark:text-emerald-400" : "text-blue-500 dark:text-blue-400"
                    )}>
                      {f.type}
                    </span>
                    {isRel && <Link2 className="size-3.5 text-blue-400 shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-500" />}
                    {f.required && <span className="text-[10px] text-red-500 font-bold shrink-0">req</span>}
                  </button>
                );
              })}
            </div>
          )}

          {relations.length > 0 && (
            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-2">Connections</div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className={cn("rounded-lg border px-2.5 py-1 text-xs font-semibold", kindColor.node)}>
                  {selected.name}
                </div>
                {relations.map((f) => {
                  const target = baseType(f.type);
                  const tk = safeTypes.find((t) => t.name === target);
                  const tkc = KIND_COLORS[tk?.kind ?? "type"] ?? KIND_COLORS.type;
                  return (
                    <div key={f.name} className="flex items-center gap-1">
                      <ChevronRight className={cn("size-4 shrink-0", kindColor.pill.includes("blue") ? "text-blue-400" : "text-zinc-400")} />
                      <button
                        onClick={() => jumpToType(target)}
                        className={cn("rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all duration-500 hover:scale-105", tkc.node)}
                      >
                        {target}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/30 min-h-[52px]">
        <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">
          Exploring <span className="font-semibold text-zinc-700 dark:text-zinc-300">{selected.name}</span>
          {relations.length > 0 ? ` — ${relations.length} connected type${relations.length !== 1 ? "s" : ""}` : ""}
        </span>
        <button
          onClick={() => setSelectedIdx((i) => (i + 1) % safeTypes.length)}
          className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-all duration-500 shrink-0"
        >
          Next Type
        </button>
      </div>
    </div>
  );
}
