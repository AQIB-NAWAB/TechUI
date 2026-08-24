"use client";

import { useState, useMemo } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, CheckCircle2, Circle, Lock } from "lucide-react";

export const PasswordStrengthSchema = z.object({
  initialValue: z.string().optional().default(""),
  placeholder: z.string().optional().default("Type a password to test…"),
  showRules: z.boolean().optional().default(true),
  interactive: z.boolean().optional().default(true),
});

export type PasswordStrengthProps = z.infer<typeof PasswordStrengthSchema>;

const RULES = [
  { id: "length",  label: "At least 8 characters",    test: (p: string) => p.length >= 8 },
  { id: "upper",   label: "Uppercase letter (A–Z)",    test: (p: string) => /[A-Z]/.test(p) },
  { id: "lower",   label: "Lowercase letter (a–z)",    test: (p: string) => /[a-z]/.test(p) },
  { id: "number",  label: "Number (0–9)",              test: (p: string) => /\d/.test(p) },
  { id: "special", label: "Special character (!@#$…)", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

const STRENGTHS = [
  { label: "Very Weak", color: "bg-red-500",     text: "text-red-600 dark:text-red-400",       bars: 1 },
  { label: "Weak",      color: "bg-orange-500",  text: "text-orange-600 dark:text-orange-400", bars: 2 },
  { label: "Fair",      color: "bg-amber-500",   text: "text-amber-600 dark:text-amber-400",   bars: 3 },
  { label: "Strong",    color: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400", bars: 4 },
  { label: "Very Strong",color:"bg-emerald-600", text: "text-emerald-600 dark:text-emerald-400", bars: 5 },
];

export function PasswordStrength({
  initialValue = "",
  placeholder = "Type a password to test…",
  showRules = true,
  interactive = true,
}: PasswordStrengthProps) {
  const [password, setPassword] = useState(initialValue);
  const [show, setShow] = useState(false);

  const passed = useMemo(() => RULES.filter((r) => r.test(password)).length, [password]);
  const strength = password.length === 0 ? null : STRENGTHS[Math.max(0, Math.min(4, passed - 1))]!;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="h-12 px-4 flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <Lock className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Password Strength Checker</span>
      </div>

      <div className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        Type a password to see how strength is measured in real time.
      </div>

      <div className="min-h-[220px] p-4 space-y-4">
        {/* Password input */}
        <div className="relative">
          <input
            type={show ? "text" : "password"}
            value={password}
            onChange={(e) => interactive && setPassword(e.target.value)}
            readOnly={!interactive}
            placeholder={placeholder}
            className="w-full px-3 py-2.5 pr-10 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-sm text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-600 font-mono transition"
          />
          <button
            onClick={() => setShow((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            type="button"
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>

        {/* Strength bars */}
        <div className="space-y-2">
          <div className="flex gap-1">
            {Array.from({ length: 5 }, (_, i) => (
              <div
                key={i}
                className={cn(
                  "flex-1 h-1.5 rounded-full transition-all duration-500",
                  strength && i < strength.bars ? strength.color : "bg-zinc-100 dark:bg-zinc-800"
                )}
              />
            ))}
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className={cn("font-semibold transition-colors", strength ? strength.text : "text-zinc-400")}>
              {strength ? strength.label : "Enter a password above"}
            </span>
            {password.length > 0 && (
              <span className="text-zinc-400">{passed}/{RULES.length} criteria met</span>
            )}
          </div>
        </div>

        {/* Checklist */}
        {showRules && (
          <div className="space-y-2 pt-1 border-t border-zinc-50 dark:border-zinc-900">
            {RULES.map((rule) => {
              const met = rule.test(password);
              return (
                <div key={rule.id} className="flex items-center gap-2">
                  {met
                    ? <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                    : <Circle className="size-3.5 text-zinc-300 dark:text-zinc-700 shrink-0" />
                  }
                  <span className={cn("text-xs transition-colors", met ? "text-zinc-700 dark:text-zinc-200" : "text-zinc-400")}>
                    {rule.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {interactive && (
        <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
          <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">
            {strength ? `${strength.label} — ${passed}/${RULES.length} rules met` : "Start typing to check strength"}
          </span>
        </div>
      )}
    </div>
  );
}
