"use client";

import { useState, useEffect, useCallback } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Boxes, Play, RotateCcw } from "lucide-react";

export const DesignPatternsSchema = z.object({
  pattern: z.enum(["singleton", "observer", "factory", "strategy"]).default("singleton"),
});

export type DesignPatternsProps = z.infer<typeof DesignPatternsSchema>;

type PatternKey = "singleton" | "observer" | "factory" | "strategy";

const PATTERN_META: Record<PatternKey, {
  label: string;
  type: "Creational" | "Behavioral";
  typeColor: string;
  useCase: string;
  code: string;
}> = {
  singleton: {
    label: "Singleton",
    type: "Creational",
    typeColor: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
    useCase: "DB connections, config, logger, feature flags",
    code: `class Database {
  private static instance: Database;

  private constructor() {}

  static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance; // always the SAME object
  }
}

const db1 = Database.getInstance();
const db2 = Database.getInstance();
db1 === db2; // true — same instance!`,
  },
  observer: {
    label: "Observer",
    type: "Behavioral",
    typeColor: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
    useCase: "Event systems, React state, Redux, pub/sub",
    code: `class EventEmitter {
  private listeners: Map<string, Function[]> = new Map();

  subscribe(event: string, fn: Function) {
    const list = this.listeners.get(event) ?? [];
    this.listeners.set(event, [...list, fn]);
  }

  notify(event: string, data: unknown) {
    // broadcasts to ALL listeners
    this.listeners.get(event)?.forEach(fn => fn(data));
  }
}

emitter.subscribe("ORDER_PLACED", sendEmail);
emitter.subscribe("ORDER_PLACED", updateInventory);
emitter.subscribe("ORDER_PLACED", logAnalytics);
emitter.notify("ORDER_PLACED", { id: 42 }); // all 3 called!`,
  },
  factory: {
    label: "Factory",
    type: "Creational",
    typeColor: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
    useCase: "Plugin systems, drivers, payment adapters",
    code: `interface PaymentProvider {
  charge(amount: number): Promise<void>;
}

function createPayment(provider: string): PaymentProvider {
  switch (provider) {
    case "stripe":  return new StripePayment();
    case "paypal":  return new PaypalPayment();
    case "crypto":  return new CryptoPayment();
    default: throw new Error(\`Unknown: \${provider}\`);
  }
}

// Caller doesn't need to know implementation details
const payment = createPayment("stripe");
await payment.charge(99.99);`,
  },
  strategy: {
    label: "Strategy",
    type: "Behavioral",
    typeColor: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
    useCase: "Sorting, compression, payment methods, routing",
    code: `type SortFn = (data: number[]) => number[];

class Sorter {
  constructor(private strategy: SortFn) {}

  setStrategy(strategy: SortFn) {
    this.strategy = strategy;  // swap at runtime!
  }

  sort(data: number[]): number[] {
    return this.strategy(data);
  }
}

const sorter = new Sorter(bubbleSort); // O(n²)
sorter.sort(largeDataset);

sorter.setStrategy(mergeSort);         // O(n log n)
sorter.sort(largeDataset);             // same caller, new algorithm`,
  },
};

// Singleton diagram animation steps
function SingletonDiagram({ step }: { step: number }) {
  const requests = [
    { label: "Request A", color: "bg-blue-500" },
    { label: "Request B", color: "bg-violet-500" },
    { label: "Request C", color: "bg-amber-500" },
  ];
  return (
    <div className="flex flex-col gap-3">
      {requests.map((req, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={cn(
            "px-2 py-1 rounded text-white text-[11px] font-semibold w-24 text-center transition-all duration-500",
            req.color,
            step > i ? "opacity-100" : "opacity-30"
          )}>
            {req.label}
          </div>
          <div className={cn(
            "text-zinc-400 text-xs transition-all duration-500",
            step > i ? "opacity-100" : "opacity-20"
          )}>→ getInstance()</div>
          <div className={cn(
            "text-[10px] transition-all duration-500",
            step > i ? "text-zinc-500 dark:text-zinc-400" : "text-transparent"
          )}>
            {i === 0 ? "creates" : "same"}
          </div>
          <div className={cn(
            "px-2 py-1 rounded border-2 text-[11px] font-bold text-center transition-all duration-500",
            step > i
              ? "border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20"
              : "border-zinc-200 dark:border-zinc-700 text-zinc-300 dark:text-zinc-600"
          )}>
            {i === 0 ? "new DB()" : "DB #1"}
          </div>
          {i > 0 && step > i && (
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">← same object!</span>
          )}
        </div>
      ))}
      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 border-t border-zinc-100 dark:border-zinc-800 pt-2">
        Only <strong>one</strong> instance exists in the entire app lifecycle.
      </p>
    </div>
  );
}

// Observer diagram animation steps
function ObserverDiagram({ step }: { step: number }) {
  const listeners = ["Email Service", "Inventory", "Analytics"];
  return (
    <div className="flex flex-col gap-2">
      <div className={cn(
        "px-3 py-2 rounded-lg border-2 text-[11px] font-bold text-center transition-all duration-500 self-start",
        "border-violet-500 bg-violet-50 dark:bg-violet-950/20 text-violet-700 dark:text-violet-300"
      )}>
        Subject (EventEmitter)
      </div>
      <div className="flex items-start gap-1 pl-4">
        <div className="flex flex-col gap-1 mt-1">
          {listeners.map((_, i) => (
            <div key={i} className={cn(
              "h-4 border-l-2 border-b-2 rounded-bl border-zinc-300 dark:border-zinc-600 w-6 transition-all duration-500",
              step >= 1 ? "opacity-100" : "opacity-20"
            )} />
          ))}
        </div>
        <div className="flex flex-col gap-2">
          {listeners.map((l, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={cn(
                "px-2 py-1 rounded border text-[11px] transition-all duration-500",
                step >= 2
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 scale-105"
                  : step >= 1
                  ? "border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-400"
                  : "border-zinc-200 dark:border-zinc-700 text-zinc-300 dark:text-zinc-600"
              )}>
                {l}
              </div>
              {step >= 2 && (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold animate-pulse">called!</span>
              )}
            </div>
          ))}
        </div>
      </div>
      {step >= 2 && (
        <div className="text-[11px] text-violet-600 dark:text-violet-400 font-semibold mt-1">
          notify(&quot;ORDER_PLACED&quot;) → all {listeners.length} listeners called!
        </div>
      )}
      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-800 pt-2">
        One subject, many observers — <strong>decoupled</strong> communication.
      </p>
    </div>
  );
}

// Factory diagram animation steps
function FactoryDiagram({ step }: { step: number }) {
  const inputs = [
    { label: '"stripe"', output: "StripePayment", color: "bg-blue-500" },
    { label: '"paypal"', output: "PaypalPayment", color: "bg-violet-500" },
    { label: '"crypto"', output: "CryptoPayment", color: "bg-amber-500" },
  ];
  return (
    <div className="flex flex-col gap-2">
      {inputs.map((row, i) => (
        <div key={i} className={cn(
          "flex items-center gap-2 transition-all duration-500",
          step > i ? "opacity-100" : "opacity-30"
        )}>
          <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 w-16 text-right shrink-0">
            {row.label}
          </div>
          <div className="text-zinc-300 dark:text-zinc-600 text-xs">→</div>
          <div className={cn(
            "px-2 py-0.5 rounded text-xs font-semibold text-white",
            step > i ? "opacity-100" : "opacity-40",
            row.color
          )}>
            Factory
          </div>
          <div className="text-zinc-300 dark:text-zinc-600 text-xs">→</div>
          <div className={cn(
            "px-2 py-1 rounded border text-[11px] font-semibold transition-all duration-500",
            step > i
              ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300"
              : "border-zinc-200 dark:border-zinc-700 text-zinc-400"
          )}>
            {row.output}
          </div>
        </div>
      ))}
      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-800 pt-2 mt-1">
        Caller never <code className="text-[10px] bg-zinc-100 dark:bg-zinc-800 px-1 rounded">new</code>s directly — Factory decides the class.
      </p>
    </div>
  );
}

// Strategy diagram animation steps
function StrategyDiagram({ step }: { step: number }) {
  const strategies = [
    { label: "bubbleSort", complexity: "O(n²)", color: "bg-red-100 dark:bg-red-950/30 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300" },
    { label: "mergeSort",  complexity: "O(n log n)", color: "bg-amber-100 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300" },
    { label: "radixSort",  complexity: "O(n)", color: "bg-emerald-100 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300" },
  ];
  return (
    <div className="flex flex-col gap-2">
      <div className="px-3 py-1.5 rounded-lg border-2 border-zinc-400 dark:border-zinc-500 bg-zinc-50 dark:bg-zinc-900 text-[11px] font-bold text-zinc-600 dark:text-zinc-300 self-start">
        Sorter.sort(data, strategy)
      </div>
      <div className="flex flex-col gap-2 pl-4">
        {strategies.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="text-zinc-300 dark:text-zinc-600 text-xs">↳</div>
            <div className={cn(
              "px-2 py-1 rounded border text-[11px] font-semibold transition-all duration-500",
              s.color,
              step === i + 1 ? "scale-105 ring-2 ring-offset-1 ring-zinc-400" : "opacity-60"
            )}>
              {s.label}
            </div>
            <div className={cn(
              "text-[11px] font-mono transition-all duration-500",
              step === i + 1 ? "text-zinc-600 dark:text-zinc-300" : "text-zinc-300 dark:text-zinc-600"
            )}>
              {s.complexity}
            </div>
            {step === i + 1 && (
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">← active</span>
            )}
          </div>
        ))}
      </div>
      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-800 pt-2 mt-1">
        Swap algorithms at runtime — <strong>same caller, different behavior</strong>.
      </p>
    </div>
  );
}

const DIAGRAM_STEPS: Record<PatternKey, number> = {
  singleton: 4,
  observer: 3,
  factory: 4,
  strategy: 4,
};

export function DesignPatterns({ pattern: initialPattern = "singleton" }: DesignPatternsProps) {
  const [pattern, setPattern] = useState<PatternKey>(initialPattern);
  const [animStep, setAnimStep] = useState(0);
  const [running, setRunning] = useState(false);
  const [showCode, setShowCode] = useState(false);

  const meta = PATTERN_META[pattern];
  const totalSteps = DIAGRAM_STEPS[pattern];

  const runDemo = useCallback(() => {
    if (running) return;
    setAnimStep(0);
    setRunning(true);
  }, [running]);

  useEffect(() => {
    if (!running) return;
    if (animStep >= totalSteps) {
      setRunning(false);
      return;
    }
    const t = setTimeout(() => setAnimStep((s) => s + 1), 1200);
    return () => clearTimeout(t);
  }, [running, animStep, totalSteps]);

  function handlePatternChange(p: PatternKey) {
    setPattern(p);
    setAnimStep(0);
    setRunning(false);
  }

  const TABS: PatternKey[] = ["singleton", "observer", "factory", "strategy"];

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <Boxes className="size-3.5 text-zinc-400 shrink-0" />
        <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex-1">Design Patterns</span>
        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", meta.typeColor)}>
          {meta.type}
        </span>
      </div>

      {/* Tab row */}
      <div className="flex border-b border-zinc-100 dark:border-zinc-800 overflow-x-auto">
        {TABS.map((p) => (
          <button
            key={p}
            onClick={() => handlePatternChange(p)}
            className={cn(
              "px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all duration-200 border-b-2",
              pattern === p
                ? "border-zinc-900 dark:border-white text-zinc-900 dark:text-white bg-white dark:bg-zinc-900"
                : "border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            )}
          >
            {PATTERN_META[p].label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="min-h-[300px] grid grid-cols-1 md:grid-cols-2">
        {/* Left: diagram */}
        <div className="p-4 border-b md:border-b-0 md:border-r border-zinc-100 dark:border-zinc-800">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400 mb-3">Visual Diagram</div>
          <div className="min-h-[180px]">
            {pattern === "singleton" && <SingletonDiagram step={animStep} />}
            {pattern === "observer" && <ObserverDiagram step={animStep} />}
            {pattern === "factory" && <FactoryDiagram step={animStep} />}
            {pattern === "strategy" && <StrategyDiagram step={animStep} />}
          </div>
        </div>

        {/* Right: code */}
        <div className="p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Code</div>
            <button
              onClick={() => setShowCode((v) => !v)}
              className="text-[10px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 underline"
            >
              {showCode ? "hide" : "show"}
            </button>
          </div>
          {showCode ? (
            <pre className="text-[10px] font-mono text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-3 overflow-x-auto leading-relaxed flex-1">
              <code>{meta.code}</code>
            </pre>
          ) : (
            <pre className="text-[10px] font-mono text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-3 overflow-x-auto leading-relaxed flex-1 max-h-[180px] overflow-y-auto">
              <code>{meta.code}</code>
            </pre>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-2.5 flex items-center gap-3 bg-zinc-50/50 dark:bg-zinc-900/20">
        <button
          onClick={runDemo}
          disabled={running}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300",
            running
              ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
              : "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90"
          )}
        >
          {running ? <RotateCcw className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}
          {running ? "Animating…" : "Demo"}
        </button>
        <p className="text-[10px] text-zinc-400 flex-1">
          <span className="font-semibold text-zinc-500 dark:text-zinc-400">Use case:</span> {meta.useCase}
        </p>
      </div>
    </div>
  );
}
