"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import {
  Settings,
  Shield,
  CheckSquare,
  Code2,
  Database,
  Zap,
  Globe,
  ArrowDown,
  CheckCircle,
  XCircle,
  ArrowUpRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const RequestFlowSchema = z.object({
  title: z.string().optional().default("Request Flow"),
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).default("POST"),
  path: z.string().default("/api/orders"),
  layers: z.array(z.object({
    name: z.string(),
    type: z.enum(["middleware", "auth", "validation", "handler", "database", "cache", "external"]),
    description: z.string(),
    status: z.enum(["pass", "reject", "skip"]).optional().default("pass"),
    latency: z.number().optional(),
  })),
  interactive: z.boolean().optional().default(true),
});

export type RequestFlowProps = z.infer<typeof RequestFlowSchema>;

const TYPE_ICON: Record<string, LucideIcon> = {
  middleware: Settings,
  auth: Shield,
  validation: CheckSquare,
  handler: Code2,
  database: Database,
  cache: Zap,
  external: Globe,
};

const TYPE_COLOR: Record<string, string> = {
  middleware: "border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800",
  auth: "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/40",
  validation: "border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-950/40",
  handler: "border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40",
  database: "border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40",
  cache: "border-cyan-300 dark:border-cyan-700 bg-cyan-50 dark:bg-cyan-950/40",
  external: "border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-950/40",
};

const METHOD_COLOR: Record<string, string> = {
  GET: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400",
  POST: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400",
  PUT: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400",
  PATCH: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400",
  DELETE: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400",
};

export function RequestFlow({
  title = "Request Flow",
  method = "POST",
  path = "/api/orders",
  layers,
  interactive = true,
}: RequestFlowProps) {
  const [activeLayer, setActiveLayer] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  function totalLatency() {
    return layers
      .filter((l) => l.status !== "reject")
      .reduce((sum, l) => sum + (l.latency ?? 0), 0);
  }

  function rejectionIndex() {
    return layers.findIndex((l) => l.status === "reject");
  }

  async function runAnimation() {
    if (isAnimating) return;
    setIsAnimating(true);
    setActiveLayer(null);

    for (let i = 0; i < layers.length; i++) {
      setActiveLayer(i);
      await new Promise((r) => setTimeout(r, 1200));
      if (layers[i].status === "reject") break;
    }

    setIsAnimating(false);
  }

  useEffect(() => {
    return () => setActiveLayer(null);
  }, []);

  const rejectAt = rejectionIndex();
  const total = totalLatency();
  const showRejectBanner = rejectAt !== -1 && activeLayer !== null && activeLayer >= rejectAt;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800">
        <ArrowUpRight className="size-4 text-zinc-400 shrink-0" />
        <span className={`text-xs font-bold px-2 py-0.5 rounded font-mono shrink-0 ${METHOD_COLOR[method] ?? ""}`}>
          {method}
        </span>
        <span className="text-sm font-mono text-zinc-700 dark:text-zinc-300 truncate flex-1">{path}</span>
        {title && <span className="text-[10px] text-zinc-400 shrink-0 hidden sm:inline">{title}</span>}
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        Watch a request travel through each layer — middleware, auth, handler, database — until it succeeds or gets blocked.
      </p>

      <div className="px-4 py-4 min-h-[300px]">
        <div className="flex flex-col items-center gap-0">
          {layers.map((layer, i) => {
            const Icon = TYPE_ICON[layer.type] ?? Settings;
            const isActive = activeLayer === i;
            const isPassed = activeLayer !== null && i < activeLayer;
            const isRejected = layer.status === "reject";
            const isSkipped = layer.status === "skip";
            const isBeyondReject = rejectAt !== -1 && i > rejectAt;

            return (
              <div key={i} className="flex flex-col items-center w-full">
                {i > 0 && (
                  <div className={cn(
                    "w-0.5 h-4 transition-all duration-500",
                    isBeyondReject ? "bg-zinc-200 dark:bg-zinc-700" :
                    isPassed ? "bg-emerald-400" :
                    isActive ? "bg-blue-400" :
                    "bg-zinc-200 dark:bg-zinc-700"
                  )} />
                )}

                <div className={cn(
                  "w-full max-w-sm rounded-lg border p-3 transition-all duration-500",
                  TYPE_COLOR[layer.type] ?? "",
                  isActive && "ring-2 ring-blue-400 dark:ring-blue-500 scale-[1.02]",
                  isBeyondReject && "opacity-30",
                )}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="size-4 text-zinc-500 dark:text-zinc-400 shrink-0" />
                      <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{layer.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {layer.latency !== undefined && (
                        <span className="text-[10px] text-zinc-400 bg-zinc-100 dark:bg-zinc-700 px-1.5 py-0.5 rounded font-mono">
                          ~{layer.latency}ms
                        </span>
                      )}
                      {isSkipped && <span className="text-[10px] text-zinc-400">skip</span>}
                      {isRejected && (
                        <span className="text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 px-1.5 py-0.5 rounded border border-red-200 dark:border-red-800 flex items-center gap-0.5">
                          <XCircle className="size-3" /> reject
                        </span>
                      )}
                      {!isRejected && !isSkipped && (
                        <span className={cn(
                          "text-[10px] font-medium flex items-center gap-0.5 transition-all duration-500",
                          isPassed || activeLayer === null ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400"
                        )}>
                          {(isPassed || activeLayer === null) && <CheckCircle className="size-3" />}
                          {isPassed || activeLayer === null ? "pass" : isActive ? "running…" : "…"}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 ml-6">{layer.description}</p>
                </div>
              </div>
            );
          })}

          <div className="h-10 w-full max-w-sm flex items-center justify-center transition-all duration-500">
            {showRejectBanner && (
              <div className="px-3 py-1.5 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
                <XCircle className="size-3 shrink-0" />
                401 Unauthorized — request stopped
              </div>
            )}
          </div>

          {rejectAt === -1 && (
            <div className="flex flex-col items-center mt-0 w-full">
              <div className={cn(
                "w-0.5 h-4 transition-all duration-500",
                activeLayer !== null && activeLayer >= layers.length - 1 ? "bg-emerald-400" : "bg-zinc-200 dark:bg-zinc-700"
              )} />
              <ArrowDown className={cn(
                "size-4 my-0.5 transition-all duration-500",
                activeLayer !== null && activeLayer >= layers.length - 1 ? "text-emerald-500" : "text-zinc-300 dark:text-zinc-700"
              )} />
              <div className={cn(
                "text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-500 flex items-center gap-1",
                activeLayer !== null && activeLayer >= layers.length - 1
                  ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-zinc-200 dark:border-zinc-700"
              )}>
                <CheckCircle className="size-3.5" />
                200 OK {total > 0 && `· ${total}ms total`}
              </div>
            </div>
          )}
        </div>
      </div>

      {interactive && (
        <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            {activeLayer === null ? "Simulate how the request moves through each layer" : isAnimating ? "Sending request…" : `Complete · ${total}ms`}
          </span>
          <button
            onClick={runAnimation}
            disabled={isAnimating}
            className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0"
          >
            Send Request
          </button>
        </div>
      )}
    </div>
  );
}
