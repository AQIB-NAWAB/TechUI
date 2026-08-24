"use client";

import { useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { CheckSquare, ArrowRightLeft } from "lucide-react";

export const SolidPrinciplesSchema = z.object({
  principle: z.enum(["S", "O", "L", "I", "D"]).default("S"),
});

export type SolidPrinciplesProps = z.infer<typeof SolidPrinciplesSchema>;

type PrincipleKey = "S" | "O" | "L" | "I" | "D";

interface PrincipleData {
  letter: PrincipleKey;
  name: string;
  summary: string;
  bad: {
    title: string;
    lines: { text: string; highlight?: boolean }[];
  };
  good: {
    title: string;
    lines: { text: string; highlight?: boolean }[];
  };
}

const PRINCIPLES: PrincipleData[] = [
  {
    letter: "S",
    name: "Single Responsibility",
    summary: "A class should have only one reason to change.",
    bad: {
      title: "UserService does EVERYTHING",
      lines: [
        { text: "class UserService {" },
        { text: "  getUser()      // data access", highlight: true },
        { text: "  hashPassword() // business logic", highlight: true },
        { text: "  sendEmail()    // notification", highlight: true },
        { text: "  formatDate()   // utility", highlight: true },
        { text: "}" },
      ],
    },
    good: {
      title: "Each class has ONE reason to change",
      lines: [
        { text: "class UserRepository  { getUser() }", highlight: true },
        { text: "class PasswordService { hashPassword() }", highlight: true },
        { text: "class EmailService    { sendEmail() }", highlight: true },
        { text: "" },
        { text: "// One concern per class" },
      ],
    },
  },
  {
    letter: "O",
    name: "Open / Closed",
    summary: "Open for extension, closed for modification.",
    bad: {
      title: "Add new shape? Edit existing code ✗",
      lines: [
        { text: "function area(shape) {" },
        { text: "  if shape == 'circle': ...", highlight: true },
        { text: "  if shape == 'square': ...", highlight: true },
        { text: "  // must edit here for triangle!", highlight: true },
        { text: "}" },
      ],
    },
    good: {
      title: "Just add a new class, don't edit old code",
      lines: [
        { text: "interface Shape { area(): number }" },
        { text: "class Circle  extends Shape { area() }", highlight: true },
        { text: "class Square  extends Shape { area() }", highlight: true },
        { text: "class Triangle extends Shape { area() }", highlight: true },
        { text: "// Adding Triangle = zero edits to existing!" },
      ],
    },
  },
  {
    letter: "L",
    name: "Liskov Substitution",
    summary: "Subtypes must be substitutable for their base types.",
    bad: {
      title: "Square extends Rectangle breaks contracts",
      lines: [
        { text: "rect.setWidth(5)" },
        { text: "rect.setHeight(10)" },
        { text: "assert rect.area() == 50  // OK for Rectangle" },
        { text: "// FAILS for Square!", highlight: true },
        { text: "// Square.setWidth overrides height too", highlight: true },
      ],
    },
    good: {
      title: "Use separate interfaces for each contract",
      lines: [
        { text: "interface Shape { area(): number }", highlight: true },
        { text: "class Rectangle implements Shape {" },
        { text: "  width: number; height: number" },
        { text: "}" },
        { text: "class Square implements Shape { side: number }", highlight: true },
      ],
    },
  },
  {
    letter: "I",
    name: "Interface Segregation",
    summary: "No code should be forced to depend on methods it doesn't use.",
    bad: {
      title: "Fat interface — forces stub implementations",
      lines: [
        { text: "interface Animal {" },
        { text: "  walk(); swim(); fly() // not all do all!", highlight: true },
        { text: "}" },
        { text: "class Dog {" },
        { text: "  walk() ✓  swim() ✓  fly() { throw! } ✗", highlight: true },
        { text: "}" },
      ],
    },
    good: {
      title: "Small focused interfaces — implement only what fits",
      lines: [
        { text: "interface Walker  { walk() }", highlight: true },
        { text: "interface Swimmer { swim() }", highlight: true },
        { text: "interface Flyer   { fly()  }" },
        { text: "" },
        { text: "class Dog implements Walker, Swimmer { }", highlight: true },
      ],
    },
  },
  {
    letter: "D",
    name: "Dependency Inversion",
    summary: "Depend on abstractions, not concretions.",
    bad: {
      title: "High-level module depends on low-level detail",
      lines: [
        { text: "class OrderService {" },
        { text: "  db = new PostgresDB()  // tight coupling!", highlight: true },
        { text: "  // Can't swap DB without editing this class", highlight: true },
        { text: "}" },
        { text: "" },
      ],
    },
    good: {
      title: "Both depend on an abstraction (interface)",
      lines: [
        { text: "interface IDatabase { query(): any }", highlight: true },
        { text: "class OrderService {" },
        { text: "  constructor(db: IDatabase) {}", highlight: true },
        { text: "}" },
        { text: "// Inject PostgresDB or MockDB at runtime!", highlight: true },
      ],
    },
  },
];

export function SolidPrinciples({ principle: initialPrinciple = "S" }: SolidPrinciplesProps) {
  const [active, setActive] = useState<PrincipleKey>(initialPrinciple);
  const [showGood, setShowGood] = useState(false);

  const data = PRINCIPLES.find((p) => p.letter === active) ?? PRINCIPLES[0];

  function handleTab(letter: PrincipleKey) {
    setActive(letter);
    setShowGood(false);
  }

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800">
        <CheckSquare className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">SOLID Principles</span>
        <span className="text-[10px] font-mono text-zinc-400 border border-zinc-200 dark:border-zinc-700 px-2 py-0.5 rounded">
          {data.letter} — {data.name}
        </span>
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        Five rules for writing code that is easy to change, test, and extend.
      </p>

      <div className="min-h-[220px] px-4 pt-3 pb-2 flex flex-col gap-3">
        <div className="flex gap-2">
          {(["S", "O", "L", "I", "D"] as PrincipleKey[]).map((letter) => (
            <button
              key={letter}
              onClick={() => handleTab(letter)}
              className={cn(
                "w-9 h-9 rounded-lg border text-sm font-bold transition-all duration-500 cursor-pointer",
                active === letter
                  ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white"
                  : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
              )}
            >
              {letter}
            </button>
          ))}
        </div>

        <p className="text-xs text-zinc-500 dark:text-zinc-400 italic">{data.summary}</p>

        <div className="grid grid-cols-2 gap-3 flex-1">
          <div
            className={cn(
              "rounded-lg border p-3 transition-all duration-500 bg-zinc-50 dark:bg-zinc-800/50",
              showGood
                ? "border-zinc-200 dark:border-zinc-700 opacity-50"
                : "border-red-300 dark:border-red-700"
            )}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-red-500 dark:text-red-400">Bad</span>
              <span className="text-[10px] text-zinc-400 truncate">{data.bad.title}</span>
            </div>
            <div className="font-mono text-[10px] leading-relaxed space-y-0.5">
              {data.bad.lines.map((line, i) => (
                <div
                  key={i}
                  className={cn(
                    "px-1 rounded transition-all duration-500",
                    line.highlight
                      ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40"
                      : "text-zinc-600 dark:text-zinc-400"
                  )}
                >
                  {line.text || "\u00a0"}
                </div>
              ))}
            </div>
          </div>

          <div
            className={cn(
              "rounded-lg border p-3 transition-all duration-500 bg-zinc-50 dark:bg-zinc-800/50",
              showGood
                ? "border-emerald-300 dark:border-emerald-700"
                : "border-zinc-200 dark:border-zinc-700 opacity-50"
            )}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-500 dark:text-emerald-400">Good</span>
              <span className="text-[10px] text-zinc-400 truncate">{data.good.title}</span>
            </div>
            <div className="font-mono text-[10px] leading-relaxed space-y-0.5">
              {data.good.lines.map((line, i) => (
                <div
                  key={i}
                  className={cn(
                    "px-1 rounded transition-all duration-500",
                    line.highlight
                      ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40"
                      : "text-zinc-600 dark:text-zinc-400"
                  )}
                >
                  {line.text || "\u00a0"}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
        <ArrowRightLeft className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">
          {showGood ? "Green = the fix applied" : "Red = the violation highlighted"}
        </span>
        <button
          onClick={() => setShowGood((v) => !v)}
          className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity shrink-0"
        >
          {showGood ? "Show Bad" : "Show Good"}
        </button>
      </div>
    </div>
  );
}
