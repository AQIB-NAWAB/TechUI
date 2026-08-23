"use client";

import { useState, useRef, useCallback } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Mail } from "lucide-react";

export const MessageQueuePatternsSchema = z.object({
  pattern: z.enum(["pub-sub", "point-to-point", "request-reply"]).default("pub-sub"),
  topic: z.string().optional().default("order.created"),
});

export type MessageQueuePatternsProps = z.infer<typeof MessageQueuePatternsSchema>;

type Pattern = "pub-sub" | "point-to-point" | "request-reply";
type AnimPhase = "idle" | "to-broker" | "fan-out" | "done";

const TABS: { id: Pattern; label: string }[] = [
  { id: "pub-sub", label: "Pub/Sub" },
  { id: "point-to-point", label: "Point-to-Point" },
  { id: "request-reply", label: "Request/Reply" },
];

/* ── Pub/Sub ─────────────────────────────────────────────────────────── */

function PubSubPattern({ topic = "order.created" }: { topic: string }) {
  const [phase, setPhase] = useState<AnimPhase>("idle");
  const [activeSubscribers, setActiveSubscribers] = useState<Set<number>>(new Set());
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };

  const run = useCallback(() => {
    if (phase !== "idle") return;
    clearTimers();
    setActiveSubscribers(new Set());
    setPhase("to-broker");

    const t1 = setTimeout(() => {
      setPhase("fan-out");
      const t2 = setTimeout(() => setActiveSubscribers(new Set([0, 1, 2])), 300);
      const t3 = setTimeout(() => { setPhase("done"); }, 1200);
      const t4 = setTimeout(() => { setPhase("idle"); setActiveSubscribers(new Set()); }, 2800);
      timers.current.push(t2, t3, t4);
    }, 900);
    timers.current.push(t1);
  }, [phase]);

  const subscribers = [
    { label: "Inventory", color: "blue" },
    { label: "Email",     color: "violet" },
    { label: "Analytics", color: "amber" },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Layout */}
      <div className="flex items-start gap-3">
        {/* Publisher */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200 text-center min-w-[80px]">
            Publisher A
          </div>
          <span className="text-[10px] text-zinc-400">producer</span>
        </div>

        {/* Arrow pub → topic */}
        <div className="flex items-center mt-2 shrink-0 w-8 relative">
          <div className={cn(
            "h-0.5 bg-zinc-300 dark:bg-zinc-700 w-full origin-left transition-all duration-700",
            phase === "to-broker" || phase === "fan-out" || phase === "done"
              ? "scale-x-100" : "scale-x-0"
          )} />
          {(phase === "to-broker" || phase === "fan-out" || phase === "done") && (
            <div className="absolute right-0 w-2 h-2 rounded-full bg-blue-500 animate-ping" style={{ top: "-3px" }} />
          )}
        </div>

        {/* Topic */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div className={cn(
            "rounded-lg border px-3 py-2 text-xs font-semibold text-center min-w-[110px] transition-all duration-500",
            phase === "fan-out" || phase === "done"
              ? "border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
              : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200"
          )}>
            <div className="text-[9px] font-normal text-zinc-400 dark:text-zinc-500 mb-0.5">Topic</div>
            {topic}
          </div>
        </div>

        {/* Fan-out arrows + subscribers */}
        <div className="flex flex-col gap-2 ml-1">
          {subscribers.map((sub, i) => (
            <div key={i} className="flex items-center gap-2">
              {/* Arrow */}
              <div className="relative w-8 flex items-center">
                <div className={cn(
                  "h-0.5 w-full origin-left transition-all duration-700",
                  phase === "fan-out" || phase === "done"
                    ? "bg-blue-400 dark:bg-blue-500 scale-x-100"
                    : "bg-zinc-300 dark:bg-zinc-700 scale-x-0"
                )}
                style={{
                  transitionDelay: phase === "fan-out" ? `${i * 150}ms` : "0ms",
                }} />
              </div>
              {/* Subscriber box */}
              <div className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-500 min-w-[90px]",
                activeSubscribers.has(i)
                  ? "border-emerald-400 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                  : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
              )} style={{ transitionDelay: `${i * 150}ms` }}>
                <div className="text-[9px] font-normal text-zinc-400 dark:text-zinc-500">subscriber {i + 1}</div>
                {sub.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Label */}
      <p className="text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg px-3 py-2">
        <span className="font-semibold text-zinc-700 dark:text-zinc-300">One message → many receivers.</span>{" "}
        Every subscriber gets a copy. Used in Kafka, SNS, and Redis Pub/Sub.
      </p>

      {/* Button */}
      <button
        onClick={run}
        disabled={phase !== "idle"}
        className={cn(
          "self-start bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold transition-opacity",
          phase !== "idle" ? "opacity-40 cursor-not-allowed" : "hover:opacity-90"
        )}
      >
        {phase === "idle" ? "Publish" : phase === "to-broker" ? "Routing…" : phase === "fan-out" ? "Delivering…" : "Delivered ✓"}
      </button>
    </div>
  );
}

/* ── Point-to-Point ──────────────────────────────────────────────────── */

function PointToPointPattern() {
  const [phase, setPhase] = useState<AnimPhase>("idle");
  const [activeConsumer, setActiveConsumer] = useState<number | null>(null);
  const [nextConsumer, setNextConsumer] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };

  const run = useCallback(() => {
    if (phase !== "idle") return;
    clearTimers();
    const target = nextConsumer % 3;
    setActiveConsumer(null);
    setPhase("to-broker");

    const t1 = setTimeout(() => {
      setPhase("fan-out");
      const t2 = setTimeout(() => {
        setActiveConsumer(target);
        setPhase("done");
        setNextConsumer((n) => n + 1);
        const t3 = setTimeout(() => { setPhase("idle"); setActiveConsumer(null); }, 2000);
        timers.current.push(t3);
      }, 700);
      timers.current.push(t2);
    }, 900);
    timers.current.push(t1);
  }, [phase, nextConsumer]);

  const consumers = ["Consumer 1", "Consumer 2", "Consumer 3"];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        {/* Producer */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200 text-center min-w-[70px]">
            Producer
          </div>
          <span className="text-[10px] text-zinc-400">sender</span>
        </div>

        {/* Arrow */}
        <div className="flex items-center mt-2 shrink-0 w-8 relative">
          <div className={cn(
            "h-0.5 bg-zinc-300 dark:bg-zinc-700 w-full origin-left transition-all duration-700",
            phase !== "idle" ? "scale-x-100" : "scale-x-0"
          )} />
        </div>

        {/* Queue */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div className={cn(
            "rounded-lg border px-3 py-2 text-xs font-semibold text-center min-w-[80px] transition-all duration-500",
            phase === "to-broker" || phase === "fan-out" || phase === "done"
              ? "border-amber-400 dark:border-amber-500 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
              : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200"
          )}>
            <div className="text-[9px] font-normal text-zinc-400 dark:text-zinc-500 mb-0.5">Queue</div>
            task-queue
          </div>
        </div>

        {/* Arrows + consumers */}
        <div className="flex flex-col gap-2 ml-1">
          {consumers.map((label, i) => {
            const isTarget = activeConsumer === i;
            const showArrow = phase === "fan-out" || phase === "done";
            return (
              <div key={i} className="flex items-center gap-2">
                <div className="relative w-8 flex items-center">
                  <div className={cn(
                    "h-0.5 w-full origin-left transition-all duration-500",
                    showArrow && isTarget
                      ? "bg-amber-400 dark:bg-amber-500 scale-x-100"
                      : showArrow
                        ? "bg-zinc-200 dark:bg-zinc-700 scale-x-100"
                        : "bg-zinc-300 dark:bg-zinc-700 scale-x-0"
                  )} />
                </div>
                <div className={cn(
                  "rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-500 min-w-[90px]",
                  isTarget
                    ? "border-emerald-400 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                    : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-500"
                )}>
                  <div className="text-[9px] font-normal text-zinc-400 dark:text-zinc-500">
                    {isTarget ? "processing ✓" : "waiting"}
                  </div>
                  {label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg px-3 py-2">
        <span className="font-semibold text-zinc-700 dark:text-zinc-300">One message → one receiver.</span>{" "}
        Consumers compete. Only one wins. Message is consumed and removed. Used in RabbitMQ, SQS.
      </p>

      <button
        onClick={run}
        disabled={phase !== "idle"}
        className={cn(
          "self-start bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold transition-opacity",
          phase !== "idle" ? "opacity-40 cursor-not-allowed" : "hover:opacity-90"
        )}
      >
        {phase === "idle" ? "Send" : phase === "to-broker" ? "Queuing…" : phase === "fan-out" ? "Dispatching…" : "Consumed ✓"}
      </button>
    </div>
  );
}

/* ── Request/Reply ───────────────────────────────────────────────────── */

function RequestReplyPattern() {
  const [phase, setPhase] = useState<"idle" | "request" | "processing" | "reply" | "done">("idle");
  const [corrId] = useState(() => Math.random().toString(36).slice(2, 10));
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };

  const run = useCallback(() => {
    if (phase !== "idle") return;
    clearTimers();
    setPhase("request");

    const t1 = setTimeout(() => {
      setPhase("processing");
      const t2 = setTimeout(() => {
        setPhase("reply");
        const t3 = setTimeout(() => {
          setPhase("done");
          const t4 = setTimeout(() => setPhase("idle"), 2000);
          timers.current.push(t4);
        }, 900);
        timers.current.push(t3);
      }, 1000);
      timers.current.push(t2);
    }, 900);
    timers.current.push(t1);
  }, [phase]);

  const showRequest = phase === "request" || phase === "processing" || phase === "reply" || phase === "done";
  const showReply   = phase === "reply" || phase === "done";

  return (
    <div className="flex flex-col gap-4">
      {/* Diagram */}
      <div className="flex items-center gap-4">
        {/* Client */}
        <div className={cn(
          "rounded-lg border px-3 py-3 text-xs font-semibold text-center min-w-[70px] transition-all duration-500",
          showReply
            ? "border-emerald-400 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
            : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200"
        )}>
          <div className="text-[9px] font-normal text-zinc-400 dark:text-zinc-500 mb-1">client</div>
          Client
          {phase === "processing" && (
            <div className="text-[9px] text-amber-500 dark:text-amber-400 mt-1 font-normal">waiting…</div>
          )}
        </div>

        {/* Arrow column */}
        <div className="flex flex-col gap-2 flex-1">
          {/* Request arrow → */}
          <div className="flex items-center gap-1">
            <div className={cn(
              "h-0.5 flex-1 origin-left transition-all duration-700",
              showRequest ? "bg-blue-500 scale-x-100" : "bg-zinc-200 dark:bg-zinc-700 scale-x-0"
            )} />
            <span className="text-[10px] font-medium text-blue-500 shrink-0">→</span>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 shrink-0">request</span>
          </div>

          {/* Correlation ID chip */}
          <div className={cn(
            "self-center transition-all duration-500",
            showRequest ? "opacity-100" : "opacity-0"
          )}>
            <span className="text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded px-1.5 py-0.5">
              corr-id: {corrId}
            </span>
          </div>

          {/* Reply arrow ← */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 shrink-0">reply</span>
            <span className="text-[10px] font-medium text-emerald-500 shrink-0">←</span>
            <div className={cn(
              "h-0.5 flex-1 origin-right transition-all duration-700",
              showReply ? "bg-emerald-500 scale-x-100" : "bg-zinc-200 dark:bg-zinc-700 scale-x-0"
            )} />
          </div>
        </div>

        {/* Server */}
        <div className={cn(
          "rounded-lg border px-3 py-3 text-xs font-semibold text-center min-w-[70px] transition-all duration-500",
          phase === "processing"
            ? "border-amber-400 dark:border-amber-500 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
            : showRequest
              ? "border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
              : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200"
        )}>
          <div className="text-[9px] font-normal text-zinc-400 dark:text-zinc-500 mb-1">server</div>
          Server
          {phase === "processing" && (
            <div className="text-[9px] text-amber-500 dark:text-amber-400 mt-1 font-normal">processing…</div>
          )}
        </div>
      </div>

      {/* Insight box */}
      <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 px-3 py-2 space-y-1">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          <span className="font-semibold text-zinc-700 dark:text-zinc-300">Synchronous over async.</span>{" "}
          Client blocks until the reply arrives. The correlation ID lets the client match the reply to its request.
        </p>
        {showRequest && (
          <p className="text-[10px] font-mono text-blue-600 dark:text-blue-400">
            reply-to: client-inbox &nbsp;|&nbsp; corr-id: {corrId}
          </p>
        )}
      </div>

      <button
        onClick={run}
        disabled={phase !== "idle"}
        className={cn(
          "self-start bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold transition-opacity",
          phase !== "idle" ? "opacity-40 cursor-not-allowed" : "hover:opacity-90"
        )}
      >
        {phase === "idle" ? "Send Request"
          : phase === "request" ? "Sending…"
          : phase === "processing" ? "Waiting for reply…"
          : phase === "reply" ? "Reply arrived!"
          : "Done ✓"}
      </button>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────────── */

export function MessageQueuePatterns({
  pattern: initialPattern = "pub-sub",
  topic = "order.created",
}: MessageQueuePatternsProps) {
  const [pattern, setPattern] = useState<Pattern>(initialPattern);

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
        <Mail className="size-3.5 text-zinc-500 dark:text-zinc-400 shrink-0" />
        <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">Message Queue Patterns</span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setPattern(tab.id)}
            className={cn(
              "px-4 py-2 text-xs font-semibold transition-all duration-200 border-b-2",
              pattern === tab.id
                ? "border-zinc-900 dark:border-white text-zinc-900 dark:text-white bg-white dark:bg-zinc-900"
                : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-5 min-h-[260px]">
        {pattern === "pub-sub" && <PubSubPattern topic={topic} />}
        {pattern === "point-to-point" && <PointToPointPattern />}
        {pattern === "request-reply" && <RequestReplyPattern />}
      </div>
    </div>
  );
}
