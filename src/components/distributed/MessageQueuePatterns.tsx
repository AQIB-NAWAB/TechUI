"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Mail, Server, Cpu, Monitor, Radio } from "lucide-react";

export const MessageQueuePatternsSchema = z.object({
  pattern: z.enum(["pub-sub", "point-to-point", "request-reply"]).default("pub-sub"),
  topic: z.string().optional().default("order.created"),
});

export type MessageQueuePatternsProps = z.infer<typeof MessageQueuePatternsSchema>;

type Pattern = "pub-sub" | "point-to-point" | "request-reply";
type AnimPhase = "idle" | "to-broker" | "fan-out" | "done";

type PatternControls = {
  run: () => void;
  label: string;
  status: string;
  disabled: boolean;
};

const TABS: { id: Pattern; label: string }[] = [
  { id: "pub-sub", label: "Pub/Sub" },
  { id: "point-to-point", label: "Point-to-Point" },
  { id: "request-reply", label: "Request/Reply" },
];

function PubSubPattern({
  topic = "order.created",
  onControlsChange,
}: {
  topic: string;
  onControlsChange: (controls: PatternControls) => void;
}) {
  const [phase, setPhase] = useState<AnimPhase>("idle");
  const [activeSubscribers, setActiveSubscribers] = useState<Set<number>>(new Set());
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };

  const run = useCallback(() => {
    if (phase !== "idle" && phase !== "done") return;
    clearTimers();
    setActiveSubscribers(new Set());
    setPhase("to-broker");

    const t1 = setTimeout(() => {
      setPhase("fan-out");
      const t2 = setTimeout(() => setActiveSubscribers(new Set([0, 1, 2])), 1000);
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

  useEffect(() => {
    onControlsChange({
      run,
      label: phase === "idle" ? "Publish" : phase === "done" ? "Publish Again" : "Publishing…",
      status: phase === "idle" ? "One message copied to every subscriber" : phase === "done" ? "Delivered to all subscribers" : "Routing message…",
      disabled: phase !== "idle" && phase !== "done",
    });
  }, [phase, onControlsChange, run]);

  return (
    <div className="flex flex-col min-h-[200px]">
      <div className="flex items-start gap-3 flex-1">
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200 text-center min-w-[80px] flex items-center gap-1.5 justify-center">
            <Server className="size-3.5 text-blue-500" />
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
            "rounded-lg border px-3 py-2 text-xs font-semibold text-center min-w-[110px] transition-all duration-500 flex items-center gap-1.5 justify-center",
            phase === "fan-out" || phase === "done"
              ? "border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
              : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200"
          )}>
            <Radio className="size-3.5" />
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
                "rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-500 min-w-[90px] flex items-center gap-1.5",
                activeSubscribers.has(i)
                  ? "border-emerald-400 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                  : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
              )} style={{ transitionDelay: `${i * 150}ms` }}>
                <Cpu className="size-3 shrink-0" />
                {sub.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-3 border border-zinc-100 dark:border-zinc-800 rounded-lg p-2 bg-zinc-50 dark:bg-zinc-800/40">
        One message → many receivers. Every subscriber gets a copy.
      </p>
    </div>
  );
}

function PointToPointPattern({ onControlsChange }: { onControlsChange: (controls: PatternControls) => void }) {
  const [phase, setPhase] = useState<AnimPhase>("idle");
  const [activeConsumer, setActiveConsumer] = useState<number | null>(null);
  const [nextConsumer, setNextConsumer] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };

  const run = useCallback(() => {
    if (phase !== "idle" && phase !== "done") return;
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

  useEffect(() => {
    onControlsChange({
      run,
      label: phase === "idle" ? "Send" : phase === "done" ? "Send Again" : "Sending…",
      status: phase === "idle" ? "One message → one consumer wins the race" : phase === "done" ? "Message consumed by one worker" : "Dispatching…",
      disabled: phase !== "idle" && phase !== "done",
    });
  }, [phase, onControlsChange, run]);

  return (
    <div className="flex flex-col min-h-[200px]">
      <div className="flex items-start gap-3 flex-1">
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200 text-center min-w-[70px] flex items-center gap-1.5 justify-center">
            <Server className="size-3.5" />
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
            "rounded-lg border px-3 py-2 text-xs font-semibold text-center min-w-[80px] transition-all duration-500 flex items-center gap-1.5 justify-center",
            phase === "to-broker" || phase === "fan-out" || phase === "done"
              ? "border-amber-400 dark:border-amber-500 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
              : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200"
          )}>
            <Mail className="size-3.5" />
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
                  "rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-500 min-w-[90px] flex items-center gap-1.5",
                  isTarget
                    ? "border-emerald-400 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                    : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-500"
                )}>
                  <Cpu className="size-3 shrink-0" />
                  {label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-3 border border-zinc-100 dark:border-zinc-800 rounded-lg p-2 bg-zinc-50 dark:bg-zinc-800/40">
        One message → one receiver. Consumers compete — only one wins.
      </p>
    </div>
  );
}

function RequestReplyPattern({ onControlsChange }: { onControlsChange: (controls: PatternControls) => void }) {
  const [phase, setPhase] = useState<"idle" | "request" | "processing" | "reply" | "done">("idle");
  const [corrId] = useState(() => Math.random().toString(36).slice(2, 10));
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };

  const run = useCallback(() => {
    if (phase !== "idle" && phase !== "done") return;
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

  useEffect(() => {
    onControlsChange({
      run,
      label: phase === "idle" ? "Send Request" : phase === "done" ? "Send Again" : "Waiting…",
      status: phase === "idle" ? "Client sends a request and waits for an async reply" : phase === "done" ? "Reply matched by correlation ID" : "Request in flight…",
      disabled: phase !== "idle" && phase !== "done",
    });
  }, [phase, onControlsChange, run]);

  return (
    <div className="flex flex-col min-h-[200px]">
      <div className="flex items-center gap-4 flex-1">
        <div className={cn(
          "rounded-lg border px-3 py-3 text-xs font-semibold text-center min-w-[70px] transition-all duration-500",
          showReply
            ? "border-emerald-400 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
            : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200"
        )}>
          <Monitor className="size-4 mx-auto mb-1 text-zinc-400" />
          Client
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
          <Server className="size-4 mx-auto mb-1 text-zinc-400" />
          Server
        </div>
      </div>

      {showRequest && (
        <p className="text-[10px] font-mono text-blue-600 dark:text-blue-400 mt-2 border border-zinc-100 dark:border-zinc-800 rounded-md px-2 py-1 bg-zinc-50 dark:bg-zinc-800/40">
          corr-id: {corrId}
        </p>
      )}
    </div>
  );
}

export function MessageQueuePatterns({
  pattern: initialPattern = "pub-sub",
  topic = "order.created",
}: MessageQueuePatternsProps) {
  const [pattern, setPattern] = useState<Pattern>(initialPattern);
  const [controls, setControls] = useState<PatternControls>({
    run: () => {},
    label: "Publish",
    status: "One message copied to every subscriber",
    disabled: false,
  });

  const handleControlsChange = useCallback((next: PatternControls) => {
    setControls(next);
  }, []);

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-2 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800">
        <Mail className="size-4 text-zinc-500 dark:text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 flex-1">Message Queue Patterns</span>
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        Different ways messages flow between producers and consumers.
      </p>

      <div className="flex border-b border-zinc-100 dark:border-zinc-800">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setPattern(tab.id)}
            className={cn(
              "px-4 py-2 text-xs font-semibold transition-all duration-500 border-b-2",
              pattern === tab.id
                ? "border-zinc-900 dark:border-white text-zinc-900 dark:text-white bg-white dark:bg-zinc-900"
                : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-4 min-h-[240px] flex flex-col">
        {pattern === "pub-sub" && <PubSubPattern key="pub-sub" topic={topic} onControlsChange={handleControlsChange} />}
        {pattern === "point-to-point" && <PointToPointPattern key="ptp" onControlsChange={handleControlsChange} />}
        {pattern === "request-reply" && <RequestReplyPattern key="rr" onControlsChange={handleControlsChange} />}
      </div>

      <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/30">
        <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">{controls.status}</span>
        <button
          onClick={controls.run}
          disabled={controls.disabled}
          className={cn(
            "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-500 shrink-0",
            controls.disabled ? "opacity-40 cursor-not-allowed" : "hover:opacity-90"
          )}
        >
          {controls.label}
        </button>
      </div>
    </div>
  );
}
