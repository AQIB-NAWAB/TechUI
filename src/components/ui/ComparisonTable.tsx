"use client";

import { z } from "zod";
import { cn } from "@/lib/utils";
import { CheckCircle, XCircle, Minus, Star, Table2 } from "lucide-react";

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

function isPartialValue(value: z.infer<typeof CellValueEnum>): boolean {
  if (typeof value === "string") {
    const lower = value.toLowerCase();
    return lower.includes("partial") || lower.includes("limited") || lower.includes("sometimes");
  }
  return false;
}

function CellValue({ value }: { value: z.infer<typeof CellValueEnum> }) {
  if (value === true) {
    return (
      <span className="inline-flex items-center justify-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
        <CheckCircle className="size-4 shrink-0" />
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="inline-flex items-center justify-center">
        <XCircle className="size-4 text-zinc-300 dark:text-zinc-600" />
      </span>
    );
  }
  if (value === null) {
    return <Minus className="size-4 text-zinc-300 dark:text-zinc-600 mx-auto" />;
  }
  if (typeof value === "number") {
    return <span className="text-xs font-mono font-semibold text-zinc-600 dark:text-zinc-400">{value}</span>;
  }
  if (isPartialValue(value)) {
    return <span className="text-xs text-amber-500 font-medium text-center leading-tight">{value}</span>;
  }
  return <span className="text-xs text-zinc-600 dark:text-zinc-400 text-center leading-tight">{value}</span>;
}

export function ComparisonTable({ title, options, criteria }: ComparisonTableProps) {
  const groups = [...new Set(criteria.map((c) => c.group ?? ""))];

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {title && (
        <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800">
          <Table2 className="size-4 text-zinc-400 shrink-0" />
          <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{title}</span>
        </div>
      )}

      <div className="overflow-x-auto min-h-[200px]">
        <table className="w-full">
          <thead>
            <tr className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900">
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest w-36 bg-zinc-900 dark:bg-zinc-100">
                Feature
              </th>
              {options.map((opt) => (
                <th
                  key={opt.id}
                  className={cn(
                    "px-4 py-3 text-center font-bold",
                    opt.recommended && "ring-2 ring-inset ring-blue-200 dark:ring-blue-800"
                  )}
                >
                  <div className="flex flex-col items-center gap-1">
                    {opt.recommended && (
                      <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-blue-300 dark:text-blue-700">
                        <Star className="size-2.5 fill-current" />
                        Best pick
                      </div>
                    )}
                    <span className="text-xs">{opt.label}</span>
                    {opt.sublabel && (
                      <span className="text-[10px] font-normal opacity-70">{opt.sublabel}</span>
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
                      <td
                        colSpan={options.length + 1}
                        className="px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800 border-t border-zinc-200 dark:border-zinc-700"
                      >
                        {group}
                      </td>
                    </tr>
                  )}
                  {groupCriteria.map((c, ci) => (
                    <tr
                      key={c.label}
                      className={cn(
                        "border-t border-zinc-100 dark:border-zinc-800 transition-all duration-500",
                        ci % 2 === 0 ? "bg-white dark:bg-zinc-900" : "bg-zinc-50 dark:bg-zinc-800/40"
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
                              opt.recommended && "ring-2 ring-inset ring-blue-200 dark:ring-blue-800"
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
