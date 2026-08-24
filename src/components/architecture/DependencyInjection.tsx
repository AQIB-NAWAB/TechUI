"use client";

import { useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Boxes, CheckCircle2, XCircle, FlaskConical } from "lucide-react";

export const DependencyInjectionSchema = z.object({
  style: z.enum(["without-di", "with-di", "container"]).default("without-di"),
  framework: z.enum(["generic", "nestjs", "spring"]).optional().default("generic"),
});

export type DependencyInjectionProps = z.infer<typeof DependencyInjectionSchema>;

const PROBLEMS = [
  "Can't test (can't mock deps)",
  "Can't swap implementations",
  "Tight coupling",
];
const BENEFITS = [
  "Can test (inject mocks)",
  "Swap implementations freely",
  "Loose coupling",
];

const CONTAINER_BINDINGS = [
  { iface: "IDatabase",     impl: "PostgresDB",    lifetime: "singleton",  color: "blue" },
  { iface: "IEmailService", impl: "SendgridEmail",  lifetime: "transient",  color: "violet" },
  { iface: "ILogger",       impl: "FileLogger",     lifetime: "scoped",     color: "emerald" },
];

const LIFETIME_COLORS: Record<string, string> = {
  singleton: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
  transient:  "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300",
  scoped:    "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300",
};

const WITHOUT_DI_LINES = [
  { text: "class OrderService {", indent: 0 },
  { text: "  private db = new PostgresDB();      // ← hard-coded!", indent: 0, highlight: "red" },
  { text: "  private email = new SendgridEmail(); // ← hard-coded!", indent: 0, highlight: "red" },
  { text: "  private logger = new FileLogger();   // ← hard-coded!", indent: 0, highlight: "red" },
  { text: "}", indent: 0 },
];

const WITH_DI_LINES = [
  { text: "class OrderService {", indent: 0 },
  { text: "  constructor(", indent: 0 },
  { text: "    private db: IDatabase,", indent: 0, highlight: "green" },
  { text: "    private email: IEmailService,", indent: 0, highlight: "green" },
  { text: "    private logger: ILogger,", indent: 0, highlight: "green" },
  { text: "  ) {}", indent: 0 },
  { text: "}", indent: 0 },
  { text: "", indent: 0 },
  { text: "// Usage:", indent: 0 },
  { text: "new OrderService(new PostgresDB(), new SendgridEmail(), new Logger())", indent: 0 },
];

type TabKey = "without-di" | "with-di" | "container";

export function DependencyInjection({
  style: initialStyle = "without-di",
  framework: _framework = "generic",
}: DependencyInjectionProps) {
  const [activeTab, setActiveTab] = useState<TabKey>(initialStyle);
  const [testMode, setTestMode] = useState(false);
  const [testPassing, setTestPassing] = useState(false);

  const handleTest = () => {
    setTestMode(true);
    setTestPassing(false);
    setTimeout(() => setTestPassing(true), 1000);
  };

  const resetTest = () => {
    setTestMode(false);
    setTestPassing(false);
  };

  const TABS: { key: TabKey; label: string }[] = [
    { key: "without-di", label: "Without DI" },
    { key: "with-di",    label: "Constructor DI" },
    { key: "container",  label: "DI Container" },
  ];

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <Boxes className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">Dependency Injection</span>
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        Pass dependencies in from the outside instead of creating them inside — makes code testable and flexible.
      </p>

      <div className="flex border-b border-zinc-100 dark:border-zinc-800 px-4 pt-2 gap-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); resetTest(); }}
            className={cn(
              "px-3 py-1.5 rounded-t-lg text-xs font-semibold transition-all duration-500 cursor-pointer border-b-2 -mb-px",
              activeTab === tab.key
                ? "border-zinc-900 dark:border-white text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800"
                : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content — fixed height */}
      <div className="min-h-[220px] px-4 pt-4 pb-3 flex flex-col gap-3">

        {/* WITHOUT DI */}
        {activeTab === "without-di" && (
          <>
            {/* Code block */}
            <div className="rounded-lg bg-zinc-950 dark:bg-zinc-950 border border-zinc-800 p-3 font-mono text-[11px] leading-5 overflow-x-auto">
              {WITHOUT_DI_LINES.map((line, i) => (
                <div
                  key={i}
                  className={cn(
                    "whitespace-pre",
                    line.highlight === "red"
                      ? "text-red-400"
                      : "text-zinc-300"
                  )}
                >
                  {line.text}
                </div>
              ))}
            </div>

            {/* Problems */}
            <div className="rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 px-3 py-2.5">
              <div className="text-xs font-bold text-red-700 dark:text-red-400 mb-2">Problems:</div>
              <div className="space-y-1">
                {PROBLEMS.map((p) => (
                  <div key={p} className="flex items-center gap-2 text-xs text-red-700 dark:text-red-300">
                    <XCircle className="size-3.5 shrink-0 text-red-500" />
                    {p}
                  </div>
                ))}
              </div>
            </div>

            {/* Visual: tight coupling diagram */}
            <div className="flex items-center gap-2 text-[11px]">
              <div className="rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 px-2 py-1 font-semibold text-zinc-600 dark:text-zinc-300">
                OrderService
              </div>
              <span className="text-zinc-400 text-xs">→ hardcodes →</span>
              <div className="flex flex-col gap-1">
                {["PostgresDB", "SendgridEmail", "FileLogger"].map((dep) => (
                  <div key={dep} className="rounded bg-red-100 dark:bg-red-900/40 border border-red-300 dark:border-red-800 px-2 py-0.5 text-[10px] font-mono text-red-700 dark:text-red-300">
                    {dep}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* WITH DI */}
        {activeTab === "with-di" && (
          <>
            {/* Code block */}
            <div className="rounded-lg bg-zinc-950 border border-zinc-800 p-3 font-mono text-[11px] leading-5 overflow-x-auto">
              {WITH_DI_LINES.map((line, i) => (
                <div
                  key={i}
                  className={cn(
                    "whitespace-pre",
                    line.highlight === "green"
                      ? "text-emerald-400"
                      : "text-zinc-300"
                  )}
                >
                  {line.text || " "}
                </div>
              ))}
            </div>

            {/* Benefits */}
            <div className="rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2.5">
              <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-2">Benefits:</div>
              <div className="space-y-1">
                {BENEFITS.map((b) => (
                  <div key={b} className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" />
                    {b}
                  </div>
                ))}
              </div>
            </div>

            {/* Test demo */}
            <div className="flex items-center gap-3 min-h-[32px]">
              {testMode && (
                <div className="flex items-center gap-2 text-[11px] font-mono transition-all duration-500">
                  <span className={cn(
                    "rounded px-1.5 py-0.5 transition-all duration-500",
                    testPassing
                      ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 animate-pulse"
                  )}>
                    {testPassing ? "MockDB injected ✓" : "PostgresDB → MockDB..."}
                  </span>
                </div>
              )}
            </div>
          </>
        )}

        {/* DI CONTAINER */}
        {activeTab === "container" && (
          <>
            {/* Container bindings */}
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
              <div className="bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 border-b border-zinc-200 dark:border-zinc-700">
                <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-300 font-mono">DI Container</span>
              </div>
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {CONTAINER_BINDINGS.map((binding) => (
                  <div key={binding.iface} className="flex items-center gap-2 px-3 py-2">
                    <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 w-28 shrink-0">{binding.iface}</span>
                    <span className="text-zinc-400 text-xs">→</span>
                    <span className="text-[11px] font-mono font-semibold text-zinc-700 dark:text-zinc-300 flex-1">{binding.impl}</span>
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-semibold", LIFETIME_COLORS[binding.lifetime])}>
                      {binding.lifetime}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Arrow + resolved service */}
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center gap-1 pt-1">
                <div className="w-0.5 h-6 bg-zinc-300 dark:bg-zinc-600" />
                <div className="text-[10px] text-zinc-400 text-center leading-tight">
                  resolve
                  <br />request
                </div>
                <div className="w-0.5 h-6 bg-zinc-300 dark:bg-zinc-600" />
              </div>
              <div className="flex-1 rounded-lg border-2 border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2.5">
                <div className="text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-300 mb-1.5">OrderService</div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 space-y-0.5">
                  {CONTAINER_BINDINGS.map((b) => (
                    <div key={b.iface} className="flex items-center gap-1.5">
                      <CheckCircle2 className="size-3 shrink-0" />
                      <span>{b.iface} injected automatically</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Key insight */}
            <div className="text-[10px] text-zinc-400 dark:text-zinc-500 bg-zinc-50 dark:bg-zinc-800/40 rounded-lg px-3 py-2">
              <strong className="text-zinc-600 dark:text-zinc-300">Lifetime scopes:</strong>{" "}
              <span className="text-blue-500">singleton</span> = one instance ever ·{" "}
              <span className="text-violet-500">transient</span> = new each time ·{" "}
              <span className="text-emerald-500">scoped</span> = one per request
            </div>
          </>
        )}

        {activeTab !== "container" && (
          <div className="text-[10px] text-zinc-400 dark:text-zinc-500 bg-zinc-50 dark:bg-zinc-800/40 rounded-lg border border-zinc-100 dark:border-zinc-800 px-3 py-2 mt-auto">
            DI inverts control — a class declares what it needs, the container provides it
          </div>
        )}
      </div>

      <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/30">
        <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">
          {activeTab === "without-di"
            ? "Hard-coded dependencies — hard to test or swap"
            : activeTab === "with-di"
            ? testPassing ? "Mock injected — tests pass ✓" : "Inject mocks to test without real databases"
            : "Container resolves and injects all dependencies automatically"}
        </span>
        <button
          onClick={() => {
            if (activeTab === "with-di") handleTest();
            else if (activeTab === "without-di") setActiveTab("with-di");
            else setActiveTab("without-di");
          }}
          className="flex items-center gap-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          {activeTab === "with-di" ? (
            <>
              <FlaskConical className="size-3.5" />
              {testPassing ? "Tests Pass" : "Run Tests"}
            </>
          ) : activeTab === "without-di" ? "See With DI" : "Compare Without DI"}
        </button>
      </div>
    </div>
  );
}
