"use client";

import { useState, useCallback } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Zap, Play, CheckCircle, XCircle, Monitor, Server } from "lucide-react";

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

    const grpcDuration = 800;
    const restDuration = Math.round(grpcDuration * (restLatencyMs / grpcLatencyMs));

    const grpcStep = 100 / (grpcDuration / 16);
    const restStep = 100 / (restDuration / 16);

    let grpcVal = 0;
    let restVal = 0;

    const tick = setInterval(() => {
      grpcVal = Math.min(100, grpcVal + grpcStep);
      restVal = Math.min(100, restVal + restStep);
      setGrpcProgress(grpcVal);
      setRestProgress(restVal);
      if (grpcVal >= 100 && restVal >= 100) {
        clearInterval(tick);
        setAnimState("done");
      }
    }, 16);
  }, [animState, restLatencyMs, grpcLatencyMs]);

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-2 px-4 h-12 border-b border-zinc-200 dark:border-zinc-800">
        <Zap className="size-4 text-zinc-500 dark:text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 flex-1">gRPC vs REST</span>
        <span className="text-xs text-zinc-400 dark:text-zinc-500 font-mono">{operation}</span>
      </div>

      <div className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        Same data, different formats — REST uses JSON text, gRPC uses compact binary protobuf.
      </div>

      <div className="min-h-[280px]">
        <div className="grid grid-cols-2 divide-x divide-zinc-200 dark:divide-zinc-700">
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Monitor className="size-3.5 text-amber-500" />
              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">REST</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-mono ml-auto">JSON</span>
            </div>
            <div className="font-mono text-[11px] text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 rounded-md px-2 py-1.5 truncate border border-zinc-200 dark:border-zinc-700">
              {restEndpoint}
            </div>
            <div className="bg-zinc-900 dark:bg-zinc-950 rounded-md px-3 py-2 font-mono text-[11px] leading-5 border border-zinc-800">
              <JsonLine><span className="text-zinc-400">{"{"}</span></JsonLine>
              <JsonLine indent={1}><JKey k="id" /><span className="text-zinc-400">: </span><JStr v="1234" /><span className="text-zinc-400">,</span></JsonLine>
              <JsonLine indent={1}><JKey k="name" /><span className="text-zinc-400">: </span><JStr v="Alice Smith" /></JsonLine>
              <JsonLine><span className="text-zinc-400">{"}"}</span></JsonLine>
            </div>
            <div className="space-y-1 min-h-[28px]">
              <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${restProgress}%` }} />
              </div>
              {animState === "done" && (
                <div className="flex items-center gap-1 text-[10px] text-amber-500 transition-all duration-500">
                  <CheckCircle className="size-3" />
                  <span>{restLatencyMs}ms · {restPayloadBytes} bytes</span>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Server className="size-3.5 text-blue-500" />
              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">gRPC</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 font-mono ml-auto">protobuf</span>
            </div>
            <div className="font-mono text-[11px] text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 rounded-md px-2 py-1.5 truncate border border-zinc-200 dark:border-zinc-700">
              {grpcMethod}
            </div>
            <div className="bg-zinc-900 dark:bg-zinc-950 rounded-md px-3 py-2 font-mono text-[11px] border border-zinc-800">
              <div className="text-violet-400 tracking-widest text-[10px] break-all">
                0a 04 31 32 33 34 12 0b 41 6c 69 63 65
              </div>
              <div className="text-zinc-400 text-[10px] mt-1">id: &quot;1234&quot; · name: &quot;Alice Smith&quot;</div>
            </div>
            <div className="space-y-1 min-h-[28px]">
              <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${grpcProgress}%` }} />
              </div>
              {animState === "done" && (
                <div className="flex items-center gap-1 text-[10px] text-blue-500 transition-all duration-500">
                  <CheckCircle className="size-3" />
                  <span>{grpcLatencyMs}ms · {grpcPayloadBytes} bytes</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-200 dark:border-zinc-700 px-4 py-3">
          <div className="grid grid-cols-[1fr_1fr_1fr] gap-x-2 text-[10px]">
            <div className="text-zinc-400 font-semibold py-1">Feature</div>
            <div className="text-amber-500 font-semibold py-1 text-center">REST</div>
            <div className="text-blue-500 font-semibold py-1 text-center">gRPC</div>
            {COMPARISON_ROWS.map((row) => (
              <div key={row.label} className="contents">
                <div className="text-zinc-500 dark:text-zinc-400 py-0.5 self-center">{row.label}</div>
                <div className="flex items-center justify-center gap-1 py-0.5">
                  {row.restOk ? <CheckCircle className="size-3 text-emerald-500 shrink-0" /> : <XCircle className="size-3 text-zinc-400 shrink-0" />}
                  <span className={cn("text-[9px]", row.restOk ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400")}>{row.restLabel}</span>
                </div>
                <div className="flex items-center justify-center gap-1 py-0.5">
                  {row.grpcOk ? <CheckCircle className="size-3 text-emerald-500 shrink-0" /> : <XCircle className="size-3 text-zinc-400 shrink-0" />}
                  <span className={cn("text-[9px]", row.grpcOk ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400")}>{row.grpcLabel}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 text-[10px] text-zinc-400 text-center font-mono">{ratio.toFixed(0)}× smaller payload with gRPC</div>
        </div>
      </div>

      <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
        <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">
          {animState === "done"
            ? `gRPC finished ${restLatencyMs - grpcLatencyMs}ms faster with ${ratio.toFixed(0)}× less data`
            : "Race both protocols fetching the same user record"}
        </span>
        <button
          onClick={sendRequest}
          disabled={animState === "running"}
          className={cn(
            "flex items-center gap-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity",
            animState === "running" && "opacity-50 cursor-not-allowed"
          )}
        >
          <Play className="size-3" />
          Send Request
        </button>
      </div>
    </div>
  );
}
