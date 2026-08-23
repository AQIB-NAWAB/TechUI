"use client";

import { useState, useCallback } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

export const AbTestSchema = z.object({
  name: z.string().optional().default("Checkout button color"),
  variantA: z
    .object({
      label: z.string(),
      description: z.string(),
      color: z.string(),
    })
    .optional()
    .default({ label: "Variant A", description: "Blue CTA button", color: "blue" }),
  variantB: z
    .object({
      label: z.string(),
      description: z.string(),
      color: z.string(),
    })
    .optional()
    .default({ label: "Variant B", description: "Green CTA button", color: "green" }),
  splitPercent: z.number().min(0).max(100).optional().default(50),
  interactive: z.boolean().optional().default(true),
});

export type AbTestProps = z.infer<typeof AbTestSchema>;

type Variant = { users: number; conversions: number };

const INITIAL_A: Variant = { users: 312, conversions: 10 };
const INITIAL_B: Variant = { users: 298, conversions: 15 };

function convRate(v: Variant) {
  if (v.users === 0) return 0;
  return (v.conversions / v.users) * 100;
}

function significance(totalUsers: number): number {
  return Math.min(99, Math.round(40 + (totalUsers / 15)));
}

const COLOR_MAP: Record<string, { border: string; text: string; bg: string }> = {
  blue: {
    border: "border-t-blue-500",
    text: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500",
  },
  green: {
    border: "border-t-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500",
  },
  red: {
    border: "border-t-red-500",
    text: "text-red-600 dark:text-red-400",
    bg: "bg-red-500",
  },
  purple: {
    border: "border-t-violet-500",
    text: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-500",
  },
  orange: {
    border: "border-t-orange-500",
    text: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-500",
  },
};

function getColors(color: string) {
  return COLOR_MAP[color] ?? COLOR_MAP.blue!;
}

export function AbTest({
  name = "Checkout button color",
  variantA = { label: "Variant A", description: "Blue CTA button", color: "blue" },
  variantB = { label: "Variant B", description: "Green CTA button", color: "green" },
  splitPercent = 50,
  interactive = true,
}: AbTestProps) {
  const [a, setA] = useState<Variant>(INITIAL_A);
  const [b, setB] = useState<Variant>(INITIAL_B);
  const [animating, setAnimating] = useState<"a" | "b" | null>(null);

  const totalUsers = a.users + b.users;
  const rateA = convRate(a);
  const rateB = convRate(b);
  const sig = significance(totalUsers);
  const winnerIsA = rateA > rateB;
  const winnerIsB = rateB > rateA;

  const addUser = useCallback(() => {
    if (animating) return;
    const goesA = Math.random() * 100 < splitPercent;
    setAnimating(goesA ? "a" : "b");

    setTimeout(() => {
      if (goesA) {
        setA((prev) => {
          const newUsers = prev.users + 1;
          const jitter = Math.random() < 0.3 ? 1 : 0;
          return { users: newUsers, conversions: prev.conversions + jitter };
        });
      } else {
        setB((prev) => {
          const newUsers = prev.users + 1;
          const jitter = Math.random() < 0.5 ? 1 : 0;
          return { users: newUsers, conversions: prev.conversions + jitter };
        });
      }
      setAnimating(null);
    }, 700);
  }, [animating, splitPercent]);

  const colorsA = getColors(variantA.color);
  const colorsB = getColors(variantB.color);

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="h-12 px-4 flex items-center gap-3 border-b border-zinc-200 dark:border-zinc-800">
        <span className="text-lg">🧪</span>
        <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex-1">{name}</span>
        <span className="text-[10px] text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full font-medium">
          Running · {totalUsers.toLocaleString()} users
        </span>
      </div>

      <div className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        Traffic is split between two variants — whichever converts more users wins. Live conversion rates update as users are added.
      </div>

      <div className="min-h-[260px] px-4 py-4 flex flex-col gap-3">
        <div className="flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-1 text-[11px] text-zinc-500">
            {[...Array(5)].map((_, i) => (
              <span key={i} className={cn("transition-all duration-300", animating ? "scale-110 opacity-100" : "opacity-70")}>👤</span>
            ))}
            <span className="ml-1 font-semibold text-zinc-600 dark:text-zinc-400">Users</span>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-zinc-400">
            <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-600" />
          </div>

          <div className="flex items-center gap-2 text-[11px] font-semibold">
            <div
              className={cn(
                "px-3 py-1 rounded-full border-2 border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-all duration-500",
                animating === "a" ? "border-blue-400 bg-blue-50 dark:bg-blue-950/30 scale-105" : "",
                animating === "b" ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 scale-105" : ""
              )}
            >
              {splitPercent}% / {100 - splitPercent}%
            </div>
          </div>

          <div className="flex items-center gap-1 text-[10px] text-zinc-400">
            <div className="w-px h-3 bg-zinc-300 dark:bg-zinc-600 -ml-8" />
            <div className="w-px h-3 bg-zinc-300 dark:bg-zinc-600 ml-8" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div
            className={cn(
              "rounded-lg border-t-2 border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/40 px-3 py-3 transition-all duration-500",
              colorsA.border,
              animating === "a" ? "scale-[1.02] shadow-sm" : ""
            )}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">{variantA.label}</span>
              {winnerIsA && sig >= 80 && (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="size-3" /> Winner
                </span>
              )}
            </div>
            <div className="text-[10px] text-zinc-500 mb-2">{variantA.description}</div>
            <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300 transition-all duration-500">
              {a.users.toLocaleString()} users
            </div>
            <div className={cn("text-base font-bold transition-all duration-500", colorsA.text)}>
              {rateA.toFixed(1)}%
            </div>
            <div className="text-[10px] text-zinc-400">conversion rate</div>
          </div>

          <div
            className={cn(
              "rounded-lg border-t-2 border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/40 px-3 py-3 transition-all duration-500",
              colorsB.border,
              animating === "b" ? "scale-[1.02] shadow-sm" : ""
            )}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">{variantB.label}</span>
              {winnerIsB && sig >= 80 && (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="size-3" /> Winner
                </span>
              )}
            </div>
            <div className="text-[10px] text-zinc-500 mb-2">{variantB.description}</div>
            <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300 transition-all duration-500">
              {b.users.toLocaleString()} users
            </div>
            <div className={cn("text-base font-bold transition-all duration-500", colorsB.text)}>
              {rateB.toFixed(1)}%
            </div>
            <div className="text-[10px] text-zinc-400">conversion rate</div>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-[10px] mb-1">
            <span className="text-zinc-500">Statistical significance</span>
            <span
              className={cn(
                "font-semibold transition-all duration-500",
                sig >= 95
                  ? "text-emerald-600 dark:text-emerald-400"
                  : sig >= 80
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-zinc-400"
              )}
            >
              {sig}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                sig >= 95
                  ? "bg-emerald-500"
                  : sig >= 80
                  ? "bg-amber-500"
                  : "bg-zinc-400"
              )}
              style={{ width: `${sig}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-zinc-400 mt-0.5">
            <span>0%</span>
            <span className="text-zinc-300 dark:text-zinc-600">95% threshold</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
        <span className="text-[11px] text-zinc-500 flex-1">
          {sig >= 95
            ? `Statistically significant — ${winnerIsA ? variantA.label : variantB.label} wins!`
            : `Add more users to reach 95% confidence (${sig}% now)`}
        </span>
        {interactive && (
          <button
            onClick={addUser}
            disabled={!!animating}
            className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            Add User
          </button>
        )}
      </div>
    </div>
  );
}
