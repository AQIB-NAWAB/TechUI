"use client";

import { useState, useCallback } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Zap, Play, CheckCircle, XCircle } from "lucide-react";

export const GrpcVsRestSchema = z.object({
  operation: z.string().default("Get user by ID"),
  restEndpoint: z.string().default("GET /api/v2/users/1234"),
  grpcMethod: z.string().default("UserService.GetUser"),
  restPayloadBytes: z.number().default(284),
  grpcPayloadBytes: z.number().default(18),
  restLatencyMs: z.number().default(45),
  grpcLatencyMs: z.number().default(12),
});

export type GrpcVsRestProps = z.infer<typeof GrpcVsRestSchema>;

type AnimState = "idle" | "running" | "done";

const COMPARISON_ROWS: {
  label: string;
  restOk: boolean;
  grpcOk: boolean;
  restLabel: string;
  grpcLabel: string;
}[] = [
  { label: "Human readable", restOk: true,  grpcOk: false, restLabel: "JSON text",      grpcLabel: "Binary" },
  { label: "Schema required", restOk: false, grpcOk: true,  restLabel: "Optional",        grpcLabel: ".proto file" },
  { label: "Browser support", restOk: true,  grpcOk: false, restLabel: "Native",          grpcLabel: "Limited" },
  { label: "Streaming",       restOk: false, grpcOk: true,  restLabel: "Limited",         grpcLabel: "Full" },
  { label: "Speed",           restOk: false, grpcOk: true,  restLabel: "Slower",          grpcLabel: "Faster" },
];

function JsonLine({ children, indent = 0 }: { children: React.ReactNode; indent?: number }) {
  return (
    <div style={{ paddingLeft: indent * 16 }} className="leading-5">
      {children}
    </div>
  );
}

function JKey({ k }: { k: string }) {
  return <span className="text-blue-400">&quot;{k}&quot;</span>;
}
function JStr({ v }: { v: string }) {
  return <span className="text-emerald-400">&quot;{v}&quot;</span>;
}
function JNum({ v }: { v: string }) {
  return <span className="text-amber-400">{v}</span>;
}

export function GrpcVsRest({
  operation = "Get user by ID",
  restEndpoint = "GET /api/v2/users/1234",
  grpcMethod = "UserService.GetUser",
  restPayloadBytes = 284,
  grpcPayloadBytes = 18,
  restLatencyMs = 45,
  grpcLatencyMs = 12,
}: GrpcVsRestProps) {
  const [animState, setAnimState] = useState<AnimState>("idle");
  const [restProgress, setRestProgress] = useState(0);
  const [grpcProgress, setGrpcProgress] = useState(0);

  const maxBytes = Math.max(restPayloadBytes, grpcPayloadBytes);
  const maxLatency = Math.max(restLatencyMs, grpcLatencyMs);
  const ratio = restPayloadBytes / grpcPayloadBytes;

  const sendRequest = useCallback(() => {
    if (animState === "running") return;
    setAnimState("running");
    setRestProgress(0);
    setGrpcProgress(0);

    // Animate grpc faster
    const grpcDuration = 600;
    const restDuration = Math.round(grpcDuration * (restLatencyMs / grpcLatencyMs));

    const grpcStep = 100 / (grpcDuration / 16);
    const restStep = 100 / (restDuration / 16);

    let grpcVal = 0;
    let restVal = 0;
    let grpcDone = false;
    let restDone = false;

    const tick = setInterval(() => {
      grpcVal = Math.min(100, grpcVal + grpcStep);
      restVal = Math.min(100, restVal + restStep);

      setGrpcProgress(grpcVal);
      setRestProgress(restVal);

      if (grpcVal >= 100) grpcDone = true;
      if (restVal >= 100) restDone = true;

      if (grpcDone && restDone) {
        clearInterval(tick);
        setAnimState("done");
      }
    }, 16);
  }, [animState, restLatencyMs, grpcLatencyMs]);

  const reset = () => {
    setAnimState("idle");
    setRestProgress(0);
    setGrpcProgress(0);
  };

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
          <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
            gRPC vs REST
          </span>
        </div>
        <span className="text-xs text-zinc-400 dark:text-zinc-500 font-mono">{operation}</span>
      </div>

      {/* Main content */}
      <div className="min-h-[280px]">
        {/* Two-column comparison */}
        <div className="grid grid-cols-2 divide-x divide-zinc-200 dark:divide-zinc-700">
          {/* REST column */}
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                REST
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-mono">
                JSON
              </span>
            </div>

            {/* Endpoint */}
            <div className="font-mono text-[11px] text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 rounded-md px-2 py-1.5 truncate">
              {restEndpoint}
            </div>

            {/* JSON response */}
            <div className="bg-zinc-900 dark:bg-zinc-950 rounded-md px-3 py-2 font-mono text-[11px] leading-5">
              <JsonLine><span className="text-zinc-400">{"{"}</span></JsonLine>
              <JsonLine indent={1}><JKey k="id" /><span className="text-zinc-400">: </span><JStr v="1234" /><span className="text-zinc-400">,</span></JsonLine>
              <JsonLine indent={1}><JKey k="name" /><span className="text-zinc-400">: </span><JStr v="Alice Smith" /><span className="text-zinc-400">,</span></JsonLine>
              <JsonLine indent={1}><JKey k="email" /><span className="text-zinc-400">: </span><JStr v="alice@example.com" /><span className="text-zinc-400">,</span></JsonLine>
              <JsonLine indent={1}><JKey k="created_at" /><span className="text-zinc-400">: </span><JStr v="2024-01-15..." /><span className="text-zinc-400">,</span></JsonLine>
              <JsonLine indent={1}><JKey k="status" /><span className="text-zinc-400">: </span><JStr v="active" /></JsonLine>
              <JsonLine><span className="text-zinc-400">{"}"}</span></JsonLine>
            </div>

            {/* Progress bar for request anim */}
            {animState !== "idle" && (
              <div className="space-y-1">
                <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-75"
                    style={{ width: `${restProgress}%` }}
                  />
                </div>
                {animState === "done" && (
                  <div className="flex items-center gap-1 text-[10px] text-amber-500">
                    <CheckCircle className="w-3 h-3" />
                    <span>{restLatencyMs}ms</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* gRPC column */}
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                gRPC
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 font-mono">
                protobuf
              </span>
            </div>

            {/* Method */}
            <div className="font-mono text-[11px] text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 rounded-md px-2 py-1.5 truncate">
              {grpcMethod}
            </div>

            {/* Binary payload */}
            <div className="bg-zinc-900 dark:bg-zinc-950 rounded-md px-3 py-2 font-mono text-[11px] space-y-1">
              <div className="text-zinc-500 text-[10px] mb-1">Response (binary):</div>
              <div className="text-violet-400 tracking-widest text-[10px] break-all">
                0a 04 31 32 33 34 12 0b 41 6c 69 63 65 20 53 6d 69 74 68
              </div>
              <div className="border-t border-zinc-700 mt-2 pt-2 text-zinc-400 text-[10px]">Decoded:</div>
              <div className="leading-5">
                <div><span className="text-blue-400">id</span><span className="text-zinc-400">: </span><span className="text-amber-400">&quot;1234&quot;</span></div>
                <div><span className="text-blue-400">name</span><span className="text-zinc-400">: </span><span className="text-emerald-400">&quot;Alice Smith&quot;</span></div>
                <div><span className="text-blue-400">email</span><span className="text-zinc-400">: </span><span className="text-emerald-400">&quot;alice@...&quot;</span></div>
              </div>
            </div>

            {/* Progress bar for request anim */}
            {animState !== "idle" && (
              <div className="space-y-1">
                <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-75"
                    style={{ width: `${grpcProgress}%` }}
                  />
                </div>
                {animState === "done" && (
                  <div className="flex items-center gap-1 text-[10px] text-blue-500">
                    <CheckCircle className="w-3 h-3" />
                    <span>{grpcLatencyMs}ms</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Metrics comparison */}
        <div className="border-t border-zinc-200 dark:border-zinc-700 px-4 py-3 space-y-2">
          {/* Payload size bars */}
          <div>
            <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
              <span>Payload size</span>
              <span className="font-mono">{ratio.toFixed(0)}x smaller with gRPC</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-0.5">
                <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full"
                    style={{ width: `${(restPayloadBytes / maxBytes) * 100}%` }}
                  />
                </div>
                <div className="text-[10px] text-zinc-500 font-mono">{restPayloadBytes} bytes</div>
              </div>
              <div className="space-y-0.5">
                <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${(grpcPayloadBytes / maxBytes) * 100}%` }}
                  />
                </div>
                <div className="text-[10px] text-zinc-500 font-mono">{grpcPayloadBytes} bytes</div>
              </div>
            </div>
          </div>

          {/* Latency bars */}
          <div>
            <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
              <span>Latency</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-0.5">
                <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full"
                    style={{ width: `${(restLatencyMs / maxLatency) * 100}%` }}
                  />
                </div>
                <div className="text-[10px] text-zinc-500 font-mono">{restLatencyMs}ms</div>
              </div>
              <div className="space-y-0.5">
                <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${(grpcLatencyMs / maxLatency) * 100}%` }}
                  />
                </div>
                <div className="text-[10px] text-zinc-500 font-mono">{grpcLatencyMs}ms</div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature comparison table */}
        <div className="border-t border-zinc-200 dark:border-zinc-700 px-4 pb-3 pt-2">
          <div className="grid grid-cols-[1fr_1fr_1fr] gap-x-2 text-[10px]">
            {/* Header */}
            <div className="text-zinc-400 font-semibold py-1">Feature</div>
            <div className="text-amber-500 font-semibold py-1 text-center">REST</div>
            <div className="text-blue-500 font-semibold py-1 text-center">gRPC</div>
            {/* Rows */}
            {COMPARISON_ROWS.map((row) => (
              <>
                <div key={`label-${row.label}`} className="text-zinc-500 dark:text-zinc-400 py-0.5 self-center">
                  {row.label}
                </div>
                <div key={`rest-${row.label}`} className="flex items-center justify-center gap-1 py-0.5">
                  {row.restOk ? (
                    <CheckCircle className="w-3 h-3 text-emerald-500 shrink-0" />
                  ) : (
                    <XCircle className="w-3 h-3 text-zinc-400 shrink-0" />
                  )}
                  <span className={cn("text-[9px]", row.restOk ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400")}>
                    {row.restLabel}
                  </span>
                </div>
                <div key={`grpc-${row.label}`} className="flex items-center justify-center gap-1 py-0.5">
                  {row.grpcOk ? (
                    <CheckCircle className="w-3 h-3 text-emerald-500 shrink-0" />
                  ) : (
                    <XCircle className="w-3 h-3 text-zinc-400 shrink-0" />
                  )}
                  <span className={cn("text-[9px]", row.grpcOk ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400")}>
                    {row.grpcLabel}
                  </span>
                </div>
              </>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-between">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          REST: human-readable · gRPC: fast + typed schema
        </p>
        <div className="flex items-center gap-2">
          {animState === "done" && (
            <button
              onClick={reset}
              className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            >
              Reset
            </button>
          )}
          <button
            onClick={sendRequest}
            disabled={animState === "running"}
            className={cn(
              "flex items-center gap-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity",
              animState === "running" && "opacity-50 cursor-not-allowed"
            )}
          >
            <Play className="w-3 h-3" />
            Send Request
          </button>
        </div>
      </div>
    </div>
  );
}
