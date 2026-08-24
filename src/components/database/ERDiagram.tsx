"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Key } from "lucide-react";

const ERColumnSchema = z.object({
  name: z.string(),
  type: z.string(),
  primaryKey: z.boolean().optional().default(false),
  foreignKey: z.string().optional(),
  nullable: z.boolean().optional().default(true),
  unique: z.boolean().optional().default(false),
});

const ERTableSchema = z.object({
  name: z.string(),
  columns: z.array(ERColumnSchema),
  note: z.string().optional(),
});

export const ERDiagramSchema = z.object({
  title: z.string().optional(),
  tables: z.array(ERTableSchema),
  layout: z.enum(["horizontal", "grid"]).optional().default("horizontal"),
});

export type ERDiagramProps = z.infer<typeof ERDiagramSchema>;

type Table = z.infer<typeof ERTableSchema>;

type Relationship = {
  from: string;
  to: string;
  fromTable: string;
  toTable: string;
  fromCol: string;
  toCol: string;
};

type PathInfo = {
  rel: Relationship;
  d: string;
  colorIdx: number;
};

const REL_COLORS = [
  { stroke: "#60a5fa", dim: "rgba(96,165,250,0.15)" },   // blue-400
  { stroke: "#a78bfa", dim: "rgba(167,139,250,0.15)" },  // violet-400
  { stroke: "#34d399", dim: "rgba(52,211,153,0.15)" },   // emerald-400
  { stroke: "#fbbf24", dim: "rgba(251,191,36,0.15)" },   // amber-400
];

function extractRelationships(tables: Table[]): Relationship[] {
  const rels: Relationship[] = [];
  for (const table of tables) {
    for (const col of table.columns) {
      if (col.foreignKey) {
        const [toTable, toCol] = col.foreignKey.split(".");
        rels.push({
          from: `${table.name}.${col.name}`,
          to: col.foreignKey,
          fromTable: table.name,
          toTable: toTable!,
          fromCol: col.name,
          toCol: toCol ?? "id",
        });
      }
    }
  }
  return rels;
}

function computeBezierPath(fromRect: DOMRect, toRect: DOMRect, containerRect: DOMRect): string {
  const x1 = fromRect.right - containerRect.left;
  const y1 = fromRect.top + fromRect.height / 2 - containerRect.top;
  const x2 = toRect.left - containerRect.left;
  const y2 = toRect.top + toRect.height / 2 - containerRect.top;
  const cx1 = x1 + (x2 - x1) * 0.4;
  const cx2 = x1 + (x2 - x1) * 0.6;
  return `M ${x1} ${y1} C ${cx1} ${y1} ${cx2} ${y2} ${x2} ${y2}`;
}

function TableCard({
  table,
  selected,
  highlighted,
  dimmed,
  onTableClick,
  onFkClick,
  selectedRel,
  relationships,
  cellRefs,
}: {
  table: Table;
  selected: boolean;
  highlighted: boolean;
  dimmed: boolean;
  onTableClick: () => void;
  onFkClick: (refKey: string) => void;
  selectedRel: string | null;
  relationships: Relationship[];
  cellRefs: React.MutableRefObject<Map<string, HTMLElement>>;
}) {
  const referencedCols = new Set(
    relationships
      .filter((r) => r.toTable === table.name)
      .map((r) => r.toCol)
  );

  return (
    <div
      className={cn(
        "text-left rounded-lg border overflow-hidden transition-all duration-500 font-mono text-[12px]",
        selected
          ? "border-blue-500 ring-2 ring-blue-400/40 shadow-md"
          : highlighted
          ? "border-zinc-400 dark:border-zinc-500"
          : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700",
        dimmed && "opacity-30"
      )}
    >
      <button
        type="button"
        onClick={onTableClick}
        className={cn(
          "w-full px-3 py-2 border-b font-semibold text-[13px] text-left transition-colors duration-500",
          selected
            ? "bg-blue-600 text-white border-blue-500"
            : "bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border-zinc-100 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        )}
      >
        {table.name}
      </button>

      <div className="bg-white dark:bg-zinc-950 divide-y divide-zinc-50 dark:divide-zinc-900/50">
        {table.columns.map((col) => {
          const isPK = col.primaryKey;
          const isFK = !!col.foreignKey;
          const isReferenced = referencedCols.has(col.name);
          const refKey = `${table.name}.${col.name}`;
          const isRelSelected = selectedRel === refKey;
          return (
            <div
              key={col.name}
              ref={(el) => {
                if (el) cellRefs.current.set(refKey, el);
                else cellRefs.current.delete(refKey);
              }}
              role={isFK ? "button" : undefined}
              tabIndex={isFK ? 0 : undefined}
              onClick={isFK ? (e) => { e.stopPropagation(); onFkClick(refKey); } : undefined}
              onKeyDown={isFK ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onFkClick(refKey); } } : undefined}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 transition-all duration-500",
                isPK && "bg-amber-50/50 dark:bg-amber-950/10 border-l-2 border-l-amber-400",
                isFK && !isPK && "bg-blue-50/30 dark:bg-blue-950/10 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/20",
                isRelSelected && "ring-1 ring-inset ring-blue-400 bg-blue-50 dark:bg-blue-950/30"
              )}
            >
              <span className="shrink-0 w-3">
                {isPK && <Key className="size-3 text-amber-500" />}
                {isFK && !isPK && <span className="text-[9px] text-blue-400 font-bold">FK</span>}
              </span>

              <span className={cn(
                "flex-1 text-left",
                isPK ? "font-semibold text-zinc-800 dark:text-zinc-200" : "text-zinc-600 dark:text-zinc-400",
                isReferenced && !isPK && "text-zinc-800 dark:text-zinc-300"
              )}>
                {col.name}
                {isFK && (
                  <span className="ml-1.5 text-[9px] text-zinc-400 dark:text-zinc-600 font-sans font-normal">
                    → {col.foreignKey}
                  </span>
                )}
              </span>

              <span className="text-[10px] text-zinc-400 dark:text-zinc-600 shrink-0">{col.type}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ERDiagram({
  title,
  tables,
  layout = "horizontal",
}: ERDiagramProps) {
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [selectedRel, setSelectedRel] = useState<string | null>(null);
  const [paths, setPaths] = useState<PathInfo[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const tablesAreaRef = useRef<HTMLDivElement>(null);
  const cellRefs = useRef<Map<string, HTMLElement>>(new Map());

  const relationships = extractRelationships(tables);

  const measurePaths = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();

    const newPaths: PathInfo[] = [];
    relationships.forEach((rel, idx) => {
      const fromEl = cellRefs.current.get(rel.from);
      const toEl = cellRefs.current.get(rel.to);
      if (!fromEl || !toEl) return;
      const fromRect = fromEl.getBoundingClientRect();
      const toRect = toEl.getBoundingClientRect();
      newPaths.push({
        rel,
        d: computeBezierPath(fromRect, toRect, containerRect),
        colorIdx: idx % REL_COLORS.length,
      });
    });
    setPaths(newPaths);
  }, [relationships]);

  useEffect(() => {
    const timer = setTimeout(measurePaths, 50);
    return () => clearTimeout(timer);
  }, [measurePaths, tables, layout]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const obs = new ResizeObserver(() => measurePaths());
    obs.observe(container);
    return () => obs.disconnect();
  }, [measurePaths]);

  const relatedTables = selectedTable
    ? new Set(
        relationships
          .filter((r) => r.fromTable === selectedTable || r.toTable === selectedTable)
          .flatMap((r) => [r.fromTable, r.toTable])
      )
    : new Set<string>();

  function isRelActive(p: PathInfo): boolean {
    if (selectedRel) return p.rel.from === selectedRel;
    if (selectedTable) return p.rel.fromTable === selectedTable || p.rel.toTable === selectedTable;
    return true;
  }

  function isTableDimmed(name: string): boolean {
    if (!selectedTable) return false;
    return !relatedTables.has(name);
  }

  function handleContainerClick(e: React.MouseEvent) {
    if (e.target === containerRef.current || e.target === tablesAreaRef.current) {
      setSelectedTable(null);
      setSelectedRel(null);
    }
  }

  return (
    <div
      ref={containerRef}
      className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden text-sm relative"
      onClick={handleContainerClick}
    >
      <style>{`
        @keyframes drawPath {
          from { stroke-dashoffset: 1000; }
          to   { stroke-dashoffset: 0; }
        }
        .er-path {
          animation: drawPath 800ms ease-out forwards;
          stroke-dasharray: 1000;
        }
      `}</style>

      {title && (
        <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-900">
          <span className="text-[12px] font-medium text-zinc-500 dark:text-zinc-400">{title}</span>
        </div>
      )}

      <div className="relative min-h-[260px]">
        {/* SVG overlay for relationship lines */}
        <svg
          style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "visible", zIndex: 10 }}
          width="100%"
          height="100%"
        >
          <defs>
            {REL_COLORS.map((c, i) => (
              <marker
                key={i}
                id={`circle-${i}`}
                markerWidth="6"
                markerHeight="6"
                refX="3"
                refY="3"
              >
                <circle cx="3" cy="3" r="2.5" fill={c.stroke} />
              </marker>
            ))}
            {REL_COLORS.map((c, i) => (
              <marker
                key={`arrow-${i}`}
                id={`arrow-${i}`}
                markerWidth="8"
                markerHeight="8"
                refX="0"
                refY="4"
                orient="auto"
              >
                <path d="M 8 4 L 0 1 L 0 7 Z" fill={c.stroke} />
              </marker>
            ))}
          </defs>

          {paths.map((p, idx) => {
            const active = isRelActive(p);
            const color = REL_COLORS[p.colorIdx]!;
            const isHighlighted = selectedRel === p.rel.from;
            return (
              <path
                key={idx}
                d={p.d}
                fill="none"
                stroke={isHighlighted ? "#3b82f6" : color.stroke}
                strokeWidth={isHighlighted ? 2.5 : 2}
                strokeOpacity={active ? 1 : 0.15}
                className="er-path"
                markerStart={`url(#arrow-${p.colorIdx})`}
                markerEnd={`url(#circle-${p.colorIdx})`}
                style={{ transition: "stroke-opacity 0.5s, stroke-width 0.3s" }}
              />
            );
          })}
        </svg>

        {/* Tables */}
        <div
          ref={tablesAreaRef}
          className={cn(
            "p-4 relative",
            layout === "grid"
              ? "grid grid-cols-2 gap-6 sm:grid-cols-3"
              : "flex flex-wrap gap-6 items-start"
          )}
        >
          {tables.map((table) => (
            <TableCard
              key={table.name}
              table={table}
              selected={selectedTable === table.name}
              highlighted={relatedTables.has(table.name) && selectedTable !== table.name}
              dimmed={isTableDimmed(table.name)}
              selectedRel={selectedRel}
              onTableClick={() => {
                setSelectedRel(null);
                setSelectedTable(selectedTable === table.name ? null : table.name);
              }}
              onFkClick={(refKey) => {
                setSelectedTable(null);
                setSelectedRel(selectedRel === refKey ? null : refKey);
              }}
              relationships={relationships}
              cellRefs={cellRefs}
            />
          ))}
        </div>
      </div>

      {/* Relationship legend */}
      {relationships.length > 0 && (
        <div className="border-t border-zinc-100 dark:border-zinc-900 px-4 py-2.5 flex flex-wrap gap-3">
          <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider self-center">
            Relationships
          </span>
          {relationships.map((r, i) => {
            const color = REL_COLORS[i % REL_COLORS.length]!;
            const isActive = selectedRel === r.from;
            return (
              <button
                key={r.from}
                onClick={() => setSelectedRel(isActive ? null : r.from)}
                className={cn(
                  "flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono transition-all duration-500",
                  isActive
                    ? "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 ring-1 ring-blue-300"
                    : "hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-500 dark:text-zinc-400"
                )}
              >
                <span
                  className="w-2.5 h-0.5 rounded-full shrink-0 inline-block"
                  style={{ backgroundColor: color.stroke }}
                />
                {r.from} → {r.to}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
