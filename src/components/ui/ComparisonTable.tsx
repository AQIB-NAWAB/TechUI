"use client";

import { z } from "zod";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, Minus, Star } from "lucide-react";

const CellValueEnum = z.union([
  z.boolean(),
  z.string(),
  z.number(),
  z.null(),
]);

export const ComparisonTableSchema = z.object({
  title: z.string().optional(),
  options: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      sublabel: z.string().optional(),
      recommended: z.boolean().optional().default(false),
      color: z.enum(["blue", "violet", "emerald", "amber", "cyan", "rose", "zinc"]).optional().default("zinc"),
    })
  ),
  criteria: z.array(
    z.object({
      label: z.string(),
      description: z.string().optional(),
      group: z.string().optional(),
      values: z.record(z.string(), CellValueEnum),
    })
  ),
});

export type ComparisonTableProps = z.infer<typeof ComparisonTableSchema>;


function CellValue({ value }: { value: z.infer<typeof CellValueEnum> }) {
  if (value === true) return <CheckCircle2 className="size-4 text-emerald-500 mx-auto" />;
  if (value === false) return <XCircle className="size-4 text-red-400 dark:text-red-500 mx-auto" />;
  if (value === null) return <Minus className="size-4 text-zinc-300 dark:text-zinc-700 mx-auto" />;
  if (typeof value === "number") {
    return <span className="text-xs font-mono text-zinc-600 dark:text-zinc-400">{value}</span>;
  }
  return <span className="text-xs text-zinc-600 dark:text-zinc-400 text-center leading-tight">{value}</span>;
}

export function ComparisonTable({ title, options, criteria }: ComparisonTableProps) {
  const groups = [...new Set(criteria.map((c) => c.group ?? ""))];

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
      {title && (
        <div className="px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/50">
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{title}</span>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Option headers */}
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-zinc-400 uppercase tracking-wide w-36" />
              {options.map((opt) => (
                <th
                  key={opt.id}
                  className={cn(
                    "px-4 py-3 text-center border-t-2",
                    opt.recommended
                      ? "border-blue-500 text-zinc-800 dark:text-zinc-200 bg-blue-50/40 dark:bg-blue-950/10"
                      : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"
                  )}
                >
                  <div className="flex flex-col items-center gap-1">
                    {opt.recommended && (
                      <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                        <Star className="size-2.5 fill-current" />
                        Recommended
                      </div>
                    )}
                    <span className="text-xs font-bold">{opt.label}</span>
                    {opt.sublabel && (
                      <span className="text-[10px] font-normal text-zinc-400">{opt.sublabel}</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {groups.map((group) => {
              const groupCriteria = criteria.filter((c) => (c.group ?? "") === group);
              return (
                <>
                  {group && (
                    <tr key={`group-${group}`}>
                      <td colSpan={options.length + 1} className="px-4 py-2 text-[10px] font-semibold text-zinc-400 uppercase tracking-wide bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-900">
                        {group}
                      </td>
                    </tr>
                  )}
                  {groupCriteria.map((c, ci) => (
                    <tr
                      key={c.label}
                      className={cn(
                        "border-t border-zinc-50 dark:border-zinc-900",
                        ci % 2 === 0 ? "" : "bg-zinc-50/30 dark:bg-zinc-900/20"
                      )}
                    >
                      <td className="px-4 py-2.5">
                        <div className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{c.label}</div>
                        {c.description && (
                          <div className="text-[10px] text-zinc-400 mt-0.5">{c.description}</div>
                        )}
                      </td>
                      {options.map((opt) => {
                        const value = c.values[opt.id] ?? null;
                        return (
                          <td
                            key={opt.id}
                            className={cn(
                              "px-4 py-2.5 text-center",
                              opt.recommended && "bg-blue-50/30 dark:bg-blue-950/10"
                            )}
                          >
                            <CellValue value={value} />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
