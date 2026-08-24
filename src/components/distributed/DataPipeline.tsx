"use client";

import { useState, useEffect, useRef } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Play, Pause, RotateCcw, Database, Settings, Server, Filter } from "lucide-react";

const StageSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(["source", "transform", "filter", "join", "aggregate", "sink"]),
  description: z.string().optional(),
  records: z.number().optional(),
  latencyMs: z.number().optional(),
  status: z.enum(["idle", "running", "error", "done"]).optional().default("idle"),
});

const EdgeSchema = z.object({
  from: z.string(),
  to: z.string(),
  label: z.string().optional(),
  recordsPerSec: z.number().optional(),
});

export const DataPipelineSchema = z.object({
  title: z.string().optional().default("Data Pipeline"),
  stages: z.array(StageSchema),
  edges: z.array(EdgeSchema).optional(),
  interactive: z.boolean().optional().default(true),
});

export type DataPipelineProps = z.infer<typeof DataPipelineSchema>;

type StageStatus = "idle" | "running" | "error" | "done";

type Pill = { id: number; colorIdx: number; stageIdx: number; progress: number; failed: boolean };

const STAGE_ICONS: Record<string, React.ElementType> = {
  source:    Database,
  transform: Settings,
  filter:    Filter,
  join:      Settings,
  aggregate: Settings,
  sink:      Server,
};

const PILL_COLORS = [
  "bg-blue-400", "bg-emerald-400", "bg-violet-400",
  "bg-amber-400", "bg-rose-400", "bg-cyan-400",
];

let _pillIdCounter = 0;

export function DataPipeline({
  title = "Data Pipeline",
  stages,
  edges: edgesProp,
  interactive = true,
}: DataPipelineProps) {
  const [statuses, setStatuses] = useState<Record<string, StageStatus>>(() => {
    const m: Record<string, StageStatus> = {};
    for (const s of stages) m[s.id] = s.status ?? "idle";
    return m;
  });
  const [selected, setSelected] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [pills, setPills] = useState<Pill[]>([]);
  const [processed, setProcessed] = useState(0);
  const [failed, setFailed] = useState(0);
  const [colorCycle, setColorCycle] = useState(0);
  const pillTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const spawnTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const edges: NonNullable<DataPipelineProps["edges"]> = edgesProp ?? stages.slice(0, -1).map((s, i) => ({
    from: s.id,
    to: stages[i + 1]!.id,
  }));

  function startAnimation() {
    if (running) return;
    setRunning(true);
    setStatuses(() => {
      const m: Record<string, StageStatus> = {};
      for (const s of stages) m[s.id] = "running";
      return m;
    });

    let spawnColor = 0;
    spawnTimer.current = setInterval(() => {
      const id = ++_pillIdCounter;
      const willFail = Math.random() < 0.12;
      setPills((prev) => [
        ...prev,
        { id, colorIdx: spawnColor++ % PILL_COLORS.length, stageIdx: 0, progress: 0, failed: willFail },
      ]);
      setColorCycle((c) => c + 1);
    }, 800);

    progressTimer.current = setInterval(() => {
      setPills((prev) => {
        const next: Pill[] = [];
        for (const p of prev) {
          if (p.failed && p.stageIdx >= Math.floor(stages.length / 2)) {
            setFailed((f) => f + 1);
            continue;
          }
          const newProgress = p.progress + 12;
          if (newProgress >= 100) {
            const nextStage = p.stageIdx + 1;
            if (nextStage >= stages.length) {
              setProcessed((n) => n + 1);
              continue;
            }
            next.push({ ...p, stageIdx: nextStage, progress: 0 });
          } else {
            next.push({ ...p, progress: newProgress });
          }
        }
        return next.slice(-30);
      });
    }, 500);
  }

  function stopAnimation() {
    setRunning(false);
    if (spawnTimer.current) clearInterval(spawnTimer.current);
    if (progressTimer.current) clearInterval(progressTimer.current);
    setStatuses(() => {
      const m: Record<string, StageStatus> = {};
      for (const s of stages) m[s.id] = "done";
      return m;
    });
  }

  function resetAll() {
    setRunning(false);
    if (spawnTimer.current) clearInterval(spawnTimer.current);
    if (progressTimer.current) clearInterval(progressTimer.current);
    setPills([]);
    setProcessed(0);
    setFailed(0);
    setStatuses(() => {
      const m: Record<string, StageStatus> = {};
      for (const s of stages) m[s.id] = "idle";
      return m;
    });
  }

  useEffect(() => () => {
    if (spawnTimer.current) clearInterval(spawnTimer.current);
    if (progressTimer.current) clearInterval(progressTimer.current);
  }, []);

  const selectedStage = stages.find((s) => s.id === selected);
  const throughput = running ? Math.round(processed / Math.max(1, (processed + failed) / 10)) + 2 : 0;

  const statusText = running
    ? `Processing records… ${processed} done, ${failed} failed`
    : processed > 0
    ? `Finished — ${processed} records processed`
    : "Run the pipeline to watch data flow through each stage";

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden text-sm">
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <Database className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex-1">{title}</span>
        {interactive && (
          <button
            type="button"
            onClick={resetAll}
            className="text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all duration-500 flex items-center gap-1"
          >
            <RotateCcw className="size-3" />
            Reset
          </button>
        )}
      </div>

      <div className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        Data moves through stages — source, transform, sink — as a stream of records.
      </div>

      {/* Stats — fixed height */}
      <div className={cn(
        "flex items-center gap-6 px-4 py-2 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/60 dark:bg-zinc-900/20 text-[10px] min-h-[32px] transition-all duration-500",
        processed === 0 && failed === 0 && !running && "opacity-40"
      )}>
        <div className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          <span className="text-zinc-500 dark:text-zinc-400">Processed: <span className="font-semibold font-mono text-zinc-700 dark:text-zinc-300">{processed}</span></span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-red-500" />
          <span className="text-zinc-500 dark:text-zinc-400">Failed: <span className="font-semibold font-mono text-red-600 dark:text-red-400">{failed}</span></span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-zinc-500 dark:text-zinc-400">~<span className="font-semibold font-mono text-zinc-700 dark:text-zinc-300">{running ? throughput : 0}</span> rec/s</span>
        </div>
      </div>

      {/* Pipeline flow */}
      <div className="px-4 py-5 overflow-x-auto min-h-[220px]">
        <div className="flex items-start gap-0 min-w-max">
          {stages.map((stage, i) => {
            const status = statuses[stage.id] ?? "idle";
            const isSelected = selected === stage.id;
            const Icon = STAGE_ICONS[stage.type] ?? Settings;
            const hasNext = i < stages.length - 1;
            const outEdge = edges.find((e) => e.from === stage.id);

            const stagePills = pills.filter((p) => p.stageIdx === i);

            return (
              <div key={stage.id} className="flex items-center">
                {/* Stage box */}
                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={() => setSelected(isSelected ? null : stage.id)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl border-2 transition-all duration-500 text-left min-w-[80px] relative overflow-hidden",
                      status === "running" && "border-blue-400 dark:border-blue-500 bg-blue-50/60 dark:bg-blue-950/10",
                      status === "done"    && "border-emerald-300 dark:border-emerald-700 bg-emerald-50/30 dark:bg-emerald-950/10",
                      status === "error"   && "border-red-400 dark:border-red-600 bg-red-50/50 dark:bg-red-950/10",
                      status === "idle"    && "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950",
                      isSelected && status === "idle" && "border-blue-400 dark:border-blue-500",
                    )}
                  >
                    <Icon className={cn(
                      "size-4 transition-colors duration-500",
                      status === "running" ? "text-blue-500 animate-spin" : "",
                      status === "done" ? "text-emerald-500" : "",
                      status === "error" ? "text-red-500" : "",
                      status === "idle" ? "text-zinc-400" : "",
                    )} style={status === "running" ? { animationDuration: "3s" } : undefined} />
                    <span className={cn(
                      "text-[10px] font-mono px-1 py-0.5 rounded",
                      status === "error"
                        ? "bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                    )}>
                      {stage.type}
                    </span>
                    <span className="text-[12px] font-medium text-zinc-800 dark:text-zinc-200 text-center leading-tight">
                      {stage.label}
                    </span>
                    {stage.records !== undefined && (
                      <span className="text-[9px] font-mono text-zinc-400">{stage.records.toLocaleString()}</span>
                    )}
                  </button>

                  {/* Pill strip below stage */}
                  <div className="h-3 flex items-center gap-0.5 justify-center w-full px-1">
                    {stagePills.slice(-4).map((p) => (
                      <div
                        key={p.id}
                        className={cn(
                          "h-2 w-3 rounded-full transition-all duration-500",
                          p.failed ? "bg-red-400" : PILL_COLORS[p.colorIdx % PILL_COLORS.length]
                        )}
                        style={{ opacity: 0.7 + p.progress / 300 }}
                      />
                    ))}
                  </div>
                </div>

                {/* Arrow connector */}
                {hasNext && (
                  <div className="flex flex-col items-center mx-1 relative">
                    <div className="flex items-center gap-0 relative">
                      <div className={cn(
                        "h-0.5 w-8 transition-all duration-500",
                        status === "running" ? "bg-blue-400 dark:bg-blue-500" :
                        status === "done" ? "bg-emerald-400 dark:bg-emerald-500" :
                        "bg-zinc-200 dark:bg-zinc-700"
                      )} />
                      {running && stagePills.map((p) => (
                        <div
                          key={p.id}
                          className={cn(
                            "absolute top-1/2 -translate-y-1/2 size-2 rounded-full transition-all duration-500",
                            p.failed ? "bg-red-400" : PILL_COLORS[p.colorIdx % PILL_COLORS.length]
                          )}
                          style={{ left: `${p.progress * 0.32}px` }}
                        />
                      ))}
                      <div className={cn(
                        "border-l-[6px] border-t-[3px] border-b-[3px] border-t-transparent border-b-transparent transition-all duration-500",
                        status === "running" ? "border-l-blue-400 dark:border-l-blue-500" :
                        status === "done" ? "border-l-emerald-400 dark:border-l-emerald-500" :
                        "border-l-zinc-300 dark:border-l-zinc-700"
                      )} />
                    </div>
                    {outEdge?.recordsPerSec !== undefined && (
                      <span className="text-[8px] font-mono text-zinc-400 mt-0.5">{outEdge.recordsPerSec}/s</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Dead letter queue — reserved space */}
        <div className={cn(
          "mt-4 flex items-center gap-2 min-h-[36px] transition-all duration-500",
          failed === 0 && "opacity-0"
        )}>
          <div className="h-6 w-px bg-red-300 dark:bg-red-800 ml-[50px]" />
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
            <span className="text-[9px] font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider">Dead Letter Queue</span>
            <span className="text-[10px] font-mono font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/40 px-1.5 py-0.5 rounded">{failed}</span>
          </div>
        </div>
      </div>

      {/* Selected stage detail — fixed height */}
      <div className="border-t border-zinc-100 dark:border-zinc-800 min-h-[52px]">
        {selectedStage ? (
          <div className="px-4 py-3 flex items-start gap-4 bg-zinc-50/30 dark:bg-zinc-900/10">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">{selectedStage.label}</span>
                <span className="text-[10px] font-mono text-zinc-400">{selectedStage.type}</span>
              </div>
              {selectedStage.description && (
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">{selectedStage.description}</p>
              )}
            </div>
            {(selectedStage.records !== undefined || selectedStage.latencyMs !== undefined) && (
              <div className="flex items-center gap-4 text-[10px] font-mono text-zinc-400 shrink-0">
                {selectedStage.records !== undefined && <span>{selectedStage.records.toLocaleString()} records</span>}
                {selectedStage.latencyMs !== undefined && <span>{selectedStage.latencyMs}ms</span>}
              </div>
            )}
          </div>
        ) : null}
      </div>

      {interactive && (
        <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/30">
          <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">{statusText}</span>
          <button
            type="button"
            onClick={running ? stopAnimation : startAnimation}
            className="flex items-center gap-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity shrink-0"
          >
            {running ? <><Pause className="size-3.5" /> Pause</> : <><Play className="size-3.5" /> Run Pipeline</>}
          </button>
        </div>
      )}
    </div>
  );
}
