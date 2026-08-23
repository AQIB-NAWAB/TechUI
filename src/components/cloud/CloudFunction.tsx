"use client";

import { useState, useEffect, useRef } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Zap, Globe, CheckCircle, AlertTriangle, Clock, ChevronDown, ChevronRight } from "lucide-react";

const ProviderEnum = z.enum(["aws", "gcp", "azure"]);
const RuntimeEnum = z.enum([
  "nodejs20", "nodejs18", "python312", "python311", "python310",
  "go121", "java21", "java17", "dotnet8", "ruby32",
]);
const InvocationStatusEnum = z.enum(["success", "error", "timeout", "throttled"]);
const TriggerEnum = z.enum(["http", "event", "schedule", "queue", "storage"]);

export const CloudFunctionSchema = z.object({
  name: z.string().optional().default("process-order"),
  provider: ProviderEnum.optional().default("aws"),
  runtime: RuntimeEnum.optional().default("nodejs20"),
  trigger: TriggerEnum.optional().default("http"),
  region: z.string().optional().default("us-east-1"),
  memory: z.number().optional().default(512),
  timeout: z.number().optional().default(30),
  status: InvocationStatusEnum.optional().default("success"),
  duration: z.number().optional().default(142),
  coldStart: z.boolean().optional().default(false),
  coldStartMs: z.number().optional(),
  invocations: z.number().optional(),
  errors: z.number().optional(),
  concurrency: z.number().optional(),
  env: z.array(z.object({ key: z.string(), value: z.string() })).optional(),
  layers: z.array(z.string()).optional(),
});

export type CloudFunctionProps = z.infer<typeof CloudFunctionSchema>;

const PROVIDER_CFG = {
  aws:   { label: "AWS Lambda",     color: "text-amber-600 dark:text-amber-400",  bg: "bg-amber-50 dark:bg-amber-950/20",  badge: "bg-amber-100 dark:bg-amber-900/40" },
  gcp:   { label: "Cloud Function", color: "text-blue-600 dark:text-blue-400",    bg: "bg-blue-50 dark:bg-blue-950/20",    badge: "bg-blue-100 dark:bg-blue-900/40"   },
  azure: { label: "Azure Function", color: "text-cyan-600 dark:text-cyan-400",    bg: "bg-cyan-50 dark:bg-cyan-950/20",    badge: "bg-cyan-100 dark:bg-cyan-900/40"   },
};

const RUNTIME_LABELS: Record<string, string> = {
  nodejs20: "Node.js 20", nodejs18: "Node.js 18",
  python312: "Python 3.12", python311: "Python 3.11", python310: "Python 3.10",
  go121: "Go 1.21", java21: "Java 21", java17: "Java 17",
  dotnet8: ".NET 8", ruby32: "Ruby 3.2",
};

type InvokeState = "idle" | "cold-start" | "executing" | "done-success" | "done-error";

export function CloudFunction({
  name = "process-order",
  provider = "aws",
  runtime = "nodejs20",
  trigger = "http",
  region = "us-east-1",
  memory = 512,
  timeout = 30,
  status = "success",
  duration = 142,
  coldStart = false,
  coldStartMs = 748,
  invocations,
  errors,
  env,
}: CloudFunctionProps) {
  const pc = PROVIDER_CFG[provider];

  const [invokeState, setInvokeState] = useState<InvokeState>("idle");
  const [invocationCount, setInvocationCount] = useState(invocations ?? 0);
  const [coldBarWidth, setColdBarWidth] = useState(0);
  const [execBarWidth, setExecBarWidth] = useState(0);
  const [dotPos, setDotPos] = useState(0);
  const [isFirstInvoke, setIsFirstInvoke] = useState(coldStart);
  const [envOpen, setEnvOpen] = useState(false);
  const [counterScale, setCounterScale] = useState(false);
  const animRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const errorRate = invocationCount > 0 && errors ? ((errors / invocationCount) * 100).toFixed(1) : "0.0";

  function clearAnim() {
    if (animRef.current) clearTimeout(animRef.current);
  }

  async function invoke() {
    if (invokeState !== "idle") return;
    clearAnim();

    const willCold = isFirstInvoke;
    setColdBarWidth(0);
    setExecBarWidth(0);
    setDotPos(0);

    if (willCold) {
      setInvokeState("cold-start");
      await delay(80);
      setColdBarWidth(100);   // fills over 1.2s via CSS transition-all duration-[1200ms]
      await delay(1300);
    }

    setInvokeState("executing");
    setDotPos(50);
    await delay(80);
    setExecBarWidth(100);    // fills over 0.5s via CSS transition-all duration-500
    setDotPos(100);
    await delay(600);

    const success = status !== "error" && status !== "timeout";
    setInvokeState(success ? "done-success" : "done-error");
    setInvocationCount((c) => c + 1);
    setCounterScale(true);
    animRef.current = setTimeout(() => setCounterScale(false), 600);

    if (willCold) setIsFirstInvoke(false);

    animRef.current = setTimeout(() => {
      setInvokeState("idle");
      setColdBarWidth(0);
      setExecBarWidth(0);
      setDotPos(0);
    }, 3000);
  }

  useEffect(() => () => clearAnim(), []);

  const arrowBarColor =
    invokeState === "cold-start" ? "bg-blue-300 dark:bg-blue-700" :
    invokeState === "executing" || invokeState === "done-success" ? "bg-emerald-500" :
    invokeState === "done-error" ? "bg-red-500" : "bg-zinc-300 dark:bg-zinc-700";

  const statusLabel =
    invokeState === "cold-start" ? "❄️ Cold start..." :
    invokeState === "executing" ? "⚡ Executing..." :
    invokeState === "done-success" ? "✓ Success" :
    invokeState === "done-error" ? "✗ Error" : "";

  const showColdBar = isFirstInvoke || invokeState === "cold-start" || (coldBarWidth > 0 && invokeState !== "idle");

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
      {/* Header */}
      <div className={cn("flex items-center gap-3 px-4 py-3 border-b border-zinc-100 dark:border-zinc-900", pc.bg)}>
        <Zap className={cn("size-4 shrink-0", pc.color)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-zinc-800 dark:text-zinc-100">{name}</span>
            <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded", pc.badge, pc.color)}>
              {pc.label}
            </span>
            <span className="text-[10px] text-zinc-400">{RUNTIME_LABELS[runtime] ?? runtime} · {region}</span>
          </div>
        </div>
        <button
          onClick={invoke}
          disabled={invokeState !== "idle"}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-500",
            invokeState === "idle"
              ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90"
              : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
          )}
        >
          <span>▶</span> Invoke
        </button>
      </div>

      {/* Trigger flow */}
      <div className="px-4 py-4 border-b border-zinc-100 dark:border-zinc-900">
        <div className="flex items-center gap-2 relative">
          {/* HTTP Client */}
          <div className={cn(
            "flex flex-col items-center gap-1 transition-all duration-500",
            invokeState !== "idle" ? "text-blue-600 dark:text-blue-400" : "text-zinc-400"
          )}>
            <Globe className="size-5" />
            <span className="text-[9px] font-semibold">HTTP</span>
          </div>

          {/* Arrow 1 */}
          <div className="flex-1 relative h-2 flex items-center">
            <div className="w-full h-0.5 bg-zinc-200 dark:bg-zinc-700 rounded-full" />
            <div
              className={cn("absolute h-0.5 rounded-full transition-all duration-700", arrowBarColor)}
              style={{ width: dotPos >= 50 ? "100%" : `${dotPos * 2}%`, left: 0 }}
            />
          </div>

          {/* Lambda */}
          <div className={cn(
            "flex flex-col items-center gap-1 transition-all duration-500",
            invokeState === "executing" || invokeState === "done-success" || invokeState === "done-error"
              ? "text-amber-500"
              : invokeState === "cold-start" ? "text-blue-500 animate-pulse"
              : "text-zinc-400"
          )}>
            <Zap className="size-5" />
            <span className="text-[9px] font-semibold">Lambda</span>
          </div>

          {/* Arrow 2 */}
          <div className="flex-1 relative h-2 flex items-center">
            <div className="w-full h-0.5 bg-zinc-200 dark:bg-zinc-700 rounded-full" />
            <div
              className={cn("absolute h-0.5 rounded-full transition-all duration-700", arrowBarColor)}
              style={{ width: dotPos === 100 ? "100%" : "0%", left: 0 }}
            />
          </div>

          {/* Response */}
          <div className={cn(
            "flex flex-col items-center gap-1 transition-all duration-500",
            invokeState === "done-success" ? "text-emerald-500" :
            invokeState === "done-error" ? "text-red-500" : "text-zinc-400"
          )}>
            <CheckCircle className="size-5" />
            <span className="text-[9px] font-semibold">Response</span>
          </div>
        </div>

        {/* Execution timeline — two bars */}
        <div className="mt-4 space-y-2.5">
          <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1">
            <span className={cn(
              "text-[10px] font-semibold uppercase tracking-widest transition-all duration-300",
              invokeState === "cold-start" ? "text-blue-500" :
              invokeState === "executing" ? "text-amber-500 dark:text-amber-400" :
              invokeState === "done-success" ? "text-emerald-600 dark:text-emerald-400" :
              invokeState === "done-error" ? "text-red-600 dark:text-red-400" :
              "text-zinc-400"
            )}>
              {statusLabel || "Execution timeline"}
            </span>
          </div>

          {/* Cold Start bar — only shown for first invocation */}
          <div className={cn(
            "transition-all duration-500",
            showColdBar ? "opacity-100" : "opacity-0 pointer-events-none"
          )}>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 w-20 shrink-0">Cold Start</span>
              <div className="flex-1 h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-300 dark:bg-blue-600 transition-all duration-[1200ms]"
                  style={{ width: `${coldBarWidth}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-blue-500 dark:text-blue-400 w-12 text-right shrink-0">
                {coldStartMs}ms
              </span>
            </div>
          </div>

          {/* Execution bar */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 w-20 shrink-0">Execution</span>
            <div className="flex-1 h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  invokeState === "done-error" ? "bg-red-500" : "bg-emerald-500"
                )}
                style={{ width: `${execBarWidth}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 w-12 text-right shrink-0">
              {duration}ms / {timeout}s
            </span>
          </div>

          {isFirstInvoke && invokeState === "idle" && (
            <div className="text-[10px] text-blue-500 dark:text-blue-400">
              ❄️ First invocation will trigger a cold start (~{coldStartMs}ms)
            </div>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 divide-x divide-zinc-100 dark:divide-zinc-900 border-b border-zinc-100 dark:border-zinc-900">
        {[
          { label: "Duration", value: `${duration}ms` },
          { label: "Memory", value: `${memory} MB` },
          {
            label: "Invocations",
            value: invocationCount.toLocaleString(),
            accent: true,
          },
          { label: "Error Rate", value: `${errorRate}%` },
        ].map((s) => (
          <div key={s.label} className="flex flex-col gap-0.5 px-3 py-2.5">
            <span className="text-[10px] text-zinc-400">{s.label}</span>
            <span className={cn(
              "text-xs font-semibold font-mono text-zinc-700 dark:text-zinc-300 transition-transform duration-300",
              s.accent && counterScale ? "scale-110 text-emerald-600 dark:text-emerald-400" : ""
            )}>
              {s.value}
            </span>
          </div>
        ))}
      </div>

      {/* Env vars (collapsible) */}
      {env && env.length > 0 && (
        <div className="border-b border-zinc-100 dark:border-zinc-900">
          <button
            onClick={() => setEnvOpen((v) => !v)}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
          >
            {envOpen ? <ChevronDown className="size-3 shrink-0" /> : <ChevronRight className="size-3 shrink-0" />}
            <span className="text-[10px] font-semibold uppercase tracking-widest">Environment</span>
          </button>
          {envOpen && (
            <div className="px-4 pb-3 space-y-1">
              {env.map((e, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px] font-mono">
                  <span className="text-sky-600 dark:text-sky-400 shrink-0">{e.key}</span>
                  <span className="text-zinc-400">=</span>
                  <span className="text-emerald-600 dark:text-emerald-400 truncate">{e.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-2 flex items-center gap-2 text-[10px] text-zinc-400">
        {invokeState === "done-success" && (
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">✓ Invocation complete</span>
        )}
        {invokeState === "done-error" && (
          <span className="text-red-600 dark:text-red-400 font-semibold flex items-center gap-1">
            <AlertTriangle className="size-3" /> Invocation failed
          </span>
        )}
        {invokeState === "idle" && (
          <>
            <Clock className="size-3" />
            <span>{timeout}s timeout · {memory} MB allocated</span>
          </>
        )}
      </div>
    </div>
  );
}

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}
