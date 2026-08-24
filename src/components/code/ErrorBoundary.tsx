"use client";

import { useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { ShieldAlert, AlertTriangle, RefreshCw } from "lucide-react";

export const ErrorBoundarySchema = z.object({
  componentName: z.string().default("ProductCard"),
  errorMessage: z.string().default("Cannot read properties of null (reading 'price')"),
  fallbackMessage: z.string().default("Something went wrong loading this product."),
  stack: z.string().optional(),
  errorType: z.enum(["runtime", "network", "assertion"]).default("runtime"),
});

export type ErrorBoundaryProps = z.infer<typeof ErrorBoundarySchema>;

const ERROR_TYPE_LABELS: Record<string, string> = {
  runtime: "TypeError",
  network: "NetworkError",
  assertion: "AssertionError",
};

export function ErrorBoundary({
  componentName = "ProductCard",
  errorMessage = "Cannot read properties of null (reading 'price')",
  fallbackMessage = "Something went wrong loading this product.",
  errorType = "runtime",
}: ErrorBoundaryProps) {
  const [appState, setAppState] = useState<"normal" | "throwing" | "error">("normal");

  function handleThrowError() {
    if (appState !== "normal") return;
    setAppState("throwing");
    setTimeout(() => setAppState("error"), 700);
  }

  function handleReset() {
    setAppState("normal");
  }

  const errorLabel = ERROR_TYPE_LABELS[errorType] ?? "Error";
  const isError = appState === "error";
  const isThrowing = appState === "throwing";

  return (
    <>
      <style>{`
        @keyframes eb-shake {
          0%,100% { transform: translateX(0) rotate(0deg); }
          15% { transform: translateX(-5px) rotate(-1deg); }
          30% { transform: translateX(5px) rotate(1deg); }
          45% { transform: translateX(-5px) rotate(-1deg); }
          60% { transform: translateX(5px) rotate(1deg); }
          75% { transform: translateX(-3px); }
        }
      `}</style>
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
        <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800">
          <ShieldAlert className="size-4 text-zinc-400 shrink-0" />
          <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">Error Boundary</span>
          <span className={cn(
            "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide transition-all duration-500",
            isError
              ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"
              : "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
          )}>
            {isError ? "Error" : "Normal"}
          </span>
        </div>

        <p className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
          Catches crashes in one component so the rest of your app keeps working.
        </p>

        <div className="min-h-[220px] p-4 space-y-3">
          {/* Visual nesting: App > Error Boundary > Component */}
          <div className="border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-3 relative">
            {/* App label */}
            <div className="absolute -top-2.5 left-3 bg-white dark:bg-zinc-900 px-1.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-wide">
              App
            </div>

            {/* "App keeps working" hint */}
            <div className="flex items-center gap-2 mb-2 text-[10px] text-zinc-400">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              The rest of the app keeps working
            </div>

            {/* Error Boundary box */}
            <div className={cn(
              "border border-dashed rounded-xl p-3 relative transition-all duration-500",
              isError
                ? "border-amber-400 dark:border-amber-600 bg-amber-50/40 dark:bg-amber-900/10"
                : "border-zinc-300 dark:border-zinc-700"
            )}>
              {/* EB label */}
              <div className={cn(
                "absolute -top-2.5 left-3 bg-white dark:bg-zinc-900 px-1.5 text-[10px] font-semibold uppercase tracking-wide transition-all duration-500",
                isError ? "text-amber-500" : "text-zinc-400"
              )}>
                Error Boundary
              </div>

              {/* Component area */}
              <div
                className={cn(
                  "rounded-lg border transition-all duration-700",
                  isThrowing ? "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20" :
                  isError     ? "border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/20" :
                                "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60"
                )}
                style={isThrowing ? { animation: "eb-shake 0.7s ease-in-out" } : undefined}
              >
                {/* Normal state: fake ProductCard */}
                {!isError && (
                  <div className="p-3 transition-all duration-500">
                    <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide mb-2">{componentName}</div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-bold text-zinc-800 dark:text-zinc-100">Wireless Headphones</div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">In stock · Free shipping</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-zinc-900 dark:text-zinc-50">$24.99</div>
                        <button className="mt-1 text-[10px] bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded px-2 py-1 font-semibold hover:opacity-80 transition-opacity">
                          Add to cart
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Error state: fallback UI */}
                {isError && (
                  <div className="p-3 transition-all duration-700">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="size-4 text-amber-500 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">{fallbackMessage}</div>
                        <div className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">Only this component shows the fallback</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Error detail — fixed height slot */}
          <div className="min-h-[80px]">
            {isError && (
              <div className="rounded-lg bg-zinc-950 border border-zinc-800 overflow-hidden transition-all duration-500">
                <div className="px-3 py-1.5 text-[10px] font-semibold text-red-400 uppercase tracking-wide border-b border-zinc-800 bg-zinc-900/80">
                  Error caught by boundary
                </div>
                <div className="px-3 py-2 font-mono text-[11px] leading-relaxed">
                  <div className="text-red-400">{errorLabel}: {errorMessage}</div>
                  <div className="text-zinc-500 mt-1">
                    <div>  at {componentName} ({componentName}.tsx:42)</div>
                    <div>  at ErrorBoundary (react-dom.js:1234)</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-3">
          <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">
            {isError
              ? "Error isolated — boundary caught the crash. App is still usable."
              : "Component renders normally. Click to simulate a crash."}
          </span>
          {!isError ? (
            <button
              onClick={handleThrowError}
              disabled={isThrowing}
              className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              Throw Error
            </button>
          ) : (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <RefreshCw className="size-3.5" />
              Reset
            </button>
          )}
        </div>
      </div>
    </>
  );
}
