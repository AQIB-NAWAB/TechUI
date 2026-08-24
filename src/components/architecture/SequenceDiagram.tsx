"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Play, RotateCcw, Monitor, Server, Database, Zap, Globe } from "lucide-react";

export const SequenceDiagramSchema = z.object({
  title: z.string().optional(),
  participants: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      type: z
        .enum(["client", "server", "database", "service", "external"])
        .optional()
        .default("server"),
    })
  ),
  messages: z.array(
    z.object({
      from: z.string(),
      to: z.string(),
      label: z.string(),
      type: z
        .enum(["request", "response", "async", "error"])
        .optional()
        .default("request"),
      note: z.string().optional(),
    })
  ),
  animate: z.boolean().optional().default(false),
});

export type SequenceDiagramProps = z.infer<typeof SequenceDiagramSchema>;

const COL_W = 160;
const ROW_H = 68;
const BOX_W = 124;
const BOX_H = 44;
const BOX_Y = 10;
const LIFE_Y = BOX_Y + BOX_H;
const MSG_Y0 = LIFE_Y + 34;
const ARROW = 8;
const GAP = 5;

const PARTICIPANT_ICON: Record<string, React.ElementType> = {
  client:   Monitor,
  server:   Server,
  database: Database,
  service:  Zap,
  external: Globe,
};

export function SequenceDiagram({
  title,
  participants,
  messages,
  animate = false,
}: SequenceDiagramProps) {
  const [step, setStep] = useState(animate ? 0 : messages.length);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    setStep(animate ? 0 : messages.length);
    setPlaying(false);
  }, [animate, messages.length]);

  const colX = (idx: number) => idx * COL_W + COL_W / 2;
  const msgY = (idx: number) => MSG_Y0 + idx * ROW_H;

  const svgW = Math.max(participants.length * COL_W, 320);
  const svgH = MSG_Y0 + messages.length * ROW_H + 50;

  function play() {
    if (playing) return;
    setStep(0);
    setPlaying(true);
    let i = 0;
    const tick = () => {
      i++;
      setStep(i);
      if (i < messages.length) setTimeout(tick, 1200);
      else setPlaying(false);
    };
    setTimeout(tick, 1200);
  }

  function reset() {
    setStep(0);
    setPlaying(false);
  }

  const visible = messages.slice(0, step);

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-100 dark:border-zinc-900">
        <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex-1">
          {title ?? "Sequence Diagram"}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={reset}
            disabled={playing}
            className="p-1.5 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors disabled:opacity-40"
          >
            <RotateCcw className="size-3.5" />
          </button>
          <button
            onClick={play}
            disabled={playing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-medium hover:bg-zinc-700 dark:hover:bg-zinc-100 transition-colors disabled:opacity-40"
          >
            <Play className="size-3" fill="currentColor" />
            {playing ? "Playing…" : step === messages.length ? "Replay" : "Play"}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto min-h-[300px]">
        <svg
          width={svgW}
          height={svgH}
          viewBox={`0 0 ${svgW} ${svgH}`}
          style={{ minWidth: svgW, display: "block" }}
        >
          {/* Active message highlight bar */}
          {step > 0 && step <= messages.length && (
            <rect
              x={0}
              y={msgY(step - 1) - 20}
              width={svgW}
              height={40}
              rx={4}
              className="fill-blue-50 dark:fill-blue-950/30"
              style={{ opacity: 0.6 }}
            />
          )}

          {/* Participant boxes + lifelines */}
          {participants.map((p, i) => {
            const cx = colX(i);
            const ParticipantIcon = PARTICIPANT_ICON[p.type ?? "server"] ?? Server;
            return (
              <g key={p.id}>
                <rect
                  x={cx - BOX_W / 2}
                  y={BOX_Y}
                  width={BOX_W}
                  height={BOX_H}
                  rx={6}
                  strokeWidth={1.5}
                  className="fill-zinc-50 dark:fill-zinc-900 stroke-zinc-200 dark:stroke-zinc-800"
                />
                {/* Icon using foreignObject */}
                <foreignObject
                  x={cx - 8}
                  y={BOX_Y + 5}
                  width={16}
                  height={16}
                >
                  <div className="flex items-center justify-center w-full h-full">
                    <ParticipantIcon
                      style={{ width: 12, height: 12, color: "#71717a" }}
                    />
                  </div>
                </foreignObject>
                <text
                  x={cx}
                  y={BOX_Y + BOX_H - 10}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={600}
                  fontFamily="system-ui, -apple-system, sans-serif"
                  className="fill-zinc-700 dark:fill-zinc-300"
                >
                  {p.label}
                </text>
                <line
                  x1={cx}
                  y1={LIFE_Y}
                  x2={cx}
                  y2={svgH - 16}
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  className="stroke-zinc-200 dark:stroke-zinc-800"
                />
              </g>
            );
          })}

          {/* Messages */}
          {visible.map((msg, mi) => {
            const fromIdx = participants.findIndex((p) => p.id === msg.from);
            const toIdx = participants.findIndex((p) => p.id === msg.to);
            if (fromIdx === -1 || toIdx === -1) return null;

            const type = msg.type ?? "request";
            const isError = type === "error";
            const isResponse = type === "response";
            const isActive = mi === step - 1; // most recently revealed

            // Color only for error (semantic) or the active step (focus)
            const lineColor = isError
              ? "stroke-red-500 dark:stroke-red-400"
              : isActive
              ? "stroke-blue-500 dark:stroke-blue-400"
              : "stroke-zinc-400 dark:stroke-zinc-600";

            const arrowColor = isError
              ? "fill-red-500 dark:fill-red-400"
              : isActive
              ? "fill-blue-500 dark:fill-blue-400"
              : "fill-zinc-400 dark:fill-zinc-600";

            const labelColor = isError
              ? "fill-red-600 dark:fill-red-400"
              : isActive
              ? "fill-blue-600 dark:fill-blue-400"
              : "fill-zinc-500 dark:fill-zinc-400";

            const dashed = isResponse || type === "async";

            const y = msgY(mi);
            const x1 = colX(fromIdx);
            const x2 = colX(toIdx);
            const right = x2 >= x1;

            // Self-loop
            if (fromIdx === toIdx) {
              const loopX = x1 + BOX_W / 2 - 10;
              const loopW = 38;
              const loopY1 = y - 14;
              const loopY2 = y + 14;
              return (
                <g key={mi}>
                  <path
                    d={`M ${x1} ${loopY1} H ${loopX + loopW} V ${loopY2} H ${x1}`}
                    fill="none"
                    strokeWidth={1.5}
                    strokeDasharray={dashed ? "5 3" : undefined}
                    className={lineColor}
                  />
                  <polygon
                    points={`${x1},${loopY2} ${x1 + ARROW},${loopY2 - ARROW / 2} ${x1 + ARROW},${loopY2 + ARROW / 2}`}
                    className={arrowColor}
                  />
                  <text
                    x={loopX + loopW + 6}
                    y={y + 4}
                    fontSize={11}
                    fontFamily="ui-monospace, monospace"
                    fontWeight={500}
                    className={labelColor}
                  >
                    {msg.label}
                  </text>
                </g>
              );
            }

            const lineX1 = right ? x1 + GAP : x1 - GAP;
            const lineX2 = right ? x2 - ARROW - 2 : x2 + ARROW + 2;
            const tipX = right ? x2 - 1 : x2 + 1;
            const backX = right ? x2 - ARROW - 1 : x2 + ARROW + 1;

            return (
              <g key={mi}>
                <line
                  x1={lineX1}
                  y1={y}
                  x2={lineX2}
                  y2={y}
                  strokeWidth={2}
                  strokeDasharray={dashed ? "5 3" : undefined}
                  className={lineColor}
                />
                <polygon
                  points={`${tipX},${y} ${backX},${y - ARROW / 2} ${backX},${y + ARROW / 2}`}
                  className={arrowColor}
                />
                <text
                  x={(x1 + x2) / 2}
                  y={y - 10}
                  textAnchor="middle"
                  fontSize={11}
                  fontFamily="ui-monospace, monospace"
                  fontWeight={500}
                  className={labelColor}
                >
                  {msg.label}
                </text>
                {msg.note && (
                  <text
                    x={(x1 + x2) / 2}
                    y={y + 18}
                    textAnchor="middle"
                    fontSize={10}
                    fontFamily="system-ui, sans-serif"
                    className="fill-zinc-400 dark:fill-zinc-500"
                  >
                    {msg.note}
                  </text>
                )}
              </g>
            );
          })}

          {/* Step counter */}
          {animate && (
            <text
              x={svgW - 10}
              y={svgH - 10}
              textAnchor="end"
              fontSize={10}
              fontFamily="system-ui, sans-serif"
              className="fill-zinc-300 dark:fill-zinc-700"
            >
              {step}/{messages.length}
            </text>
          )}
        </svg>
      </div>
    </div>
  );
}
