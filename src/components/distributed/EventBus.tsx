"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Radio } from "lucide-react";

const PublisherSchema = z.object({
  id: z.string(),
  label: z.string(),
  events: z.array(z.string()),
});

const SubscriberSchema = z.object({
  id: z.string(),
  label: z.string(),
  subscribesTo: z.array(z.string()),
});

const TopicSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
});

export const EventBusSchema = z.object({
  name: z.string().optional().default("Event Bus"),
  topics: z.array(TopicSchema),
  publishers: z.array(PublisherSchema),
  subscribers: z.array(SubscriberSchema),
  interactive: z.boolean().optional().default(true),
});

export type EventBusProps = z.infer<typeof EventBusSchema>;

type AnimPhase = "idle" | "pub-to-topic" | "topic-to-subs" | "done";

type LogEntry = { topic: string; from: string; to: string; ts: string };

let _logId = 0;

export function EventBus({
  name = "Event Bus",
  topics,
  publishers,
  subscribers,
  interactive = true,
}: EventBusProps) {
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [activePublisher, setActivePublisher] = useState<string | null>(null);
  const [activeSubscriberIds, setActiveSubscriberIds] = useState<Set<string>>(new Set());
  const [phase, setPhase] = useState<AnimPhase>("idle");
  const [pulseBadge, setPulseBadge] = useState<{ pubId: string; evt: string } | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const animTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  function clearTimers() {
    animTimers.current.forEach(clearTimeout);
    animTimers.current = [];
  }

  const publish = useCallback((publisherId: string, topic: string) => {
    if (phase !== "idle") return;
    clearTimers();

    const subs = subscribers.filter((s) => s.subscribesTo.includes(topic));
    const pub = publishers.find((p) => p.id === publisherId);
    if (!pub) return;

    setPulseBadge({ pubId: publisherId, evt: topic });
    const t1 = setTimeout(() => setPulseBadge(null), 600);

    setPhase("pub-to-topic");
    setActivePublisher(publisherId);
    setActiveTopic(topic);
    setActiveSubscriberIds(new Set());

    const t2 = setTimeout(() => {
      setPhase("topic-to-subs");
      setActiveSubscriberIds(new Set(subs.map((s) => s.id)));

      const ts = new Date().toLocaleTimeString("en", { hour12: false });
      const newEntries: LogEntry[] = subs.map((sub) => ({
        topic,
        from: pub.label,
        to: sub.label,
        ts,
      }));
      setLog((prev) => [...newEntries, ...prev].slice(0, 8));

      const t3 = setTimeout(() => {
        setPhase("done");
        const t4 = setTimeout(() => {
          setPhase("idle");
          setActiveTopic(null);
          setActivePublisher(null);
          setActiveSubscriberIds(new Set());
        }, 800);
        animTimers.current.push(t4);
      }, 1000);
      animTimers.current.push(t3);
    }, 800);

    animTimers.current.push(t1, t2);
  }, [phase, publishers, subscribers]);

  useEffect(() => () => clearTimers(), []);

  function publishSample() {
    const pub = publishers[0];
    const evt = pub?.events[0];
    if (pub && evt) publish(pub.id, evt);
  }

  const statusText = phase !== "idle"
    ? activeTopic
      ? `Delivering "${activeTopic}" through the bus…`
      : "Event delivered to subscribers"
    : log.length > 0
    ? `Last event: ${log[0]?.topic} → ${log[0]?.to}`
    : "Click an event badge or Publish Sample to see message travel";

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden text-sm">
      <div className="flex items-center gap-2 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <Radio className="size-4 text-violet-500 shrink-0" />
        <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex-1">{name}</span>
        <span className="text-[10px] text-zinc-400">
          {topics.length} topics · {publishers.length} pubs · {subscribers.length} subs
        </span>
      </div>

      <div className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        Publishers emit events to topics; subscribers listen and react — no direct coupling.
      </div>

      <div className="relative grid grid-cols-[1fr_auto_1fr] divide-x divide-zinc-100 dark:divide-zinc-800 min-h-[220px]">
        {/* Traveling dot overlay */}
        {phase !== "idle" && (
          <div className="absolute top-0 left-0 right-0 h-1 z-20 pointer-events-none mx-4 mt-16">
            <div
              className={cn(
                "size-2.5 rounded-full bg-blue-500 shadow-sm transition-all ease-in-out",
                phase === "pub-to-topic" && "duration-[700ms] translate-x-[25%] opacity-100",
                phase === "topic-to-subs" && "duration-[700ms] translate-x-[75%] opacity-100",
                phase === "done" && "duration-500 translate-x-[90%] opacity-0"
              )}
              style={{ transform: phase === "pub-to-topic" ? "translateX(10%)" : undefined }}
            />
          </div>
        )}

        {/* Publishers */}
        <div>
          <div className="px-3 py-2 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-50 dark:border-zinc-900/60">
            Publishers
          </div>
          <div className="p-2 space-y-1.5">
            {publishers.map((pub) => (
              <div
                key={pub.id}
                className={cn(
                  "rounded-lg border px-3 py-2 transition-all duration-500",
                  activePublisher === pub.id
                    ? "border-blue-300 dark:border-blue-700 bg-blue-50/60 dark:bg-blue-950/20 shadow-sm"
                    : "border-zinc-200 dark:border-zinc-800"
                )}
              >
                <div className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">{pub.label}</div>
                <div className="flex flex-wrap gap-1">
                  {pub.events.map((evt) => {
                    const isPulsing = pulseBadge?.pubId === pub.id && pulseBadge?.evt === evt;
                    return (
                      <button
                        key={evt}
                        onClick={() => interactive && publish(pub.id, evt)}
                        disabled={!interactive || phase !== "idle"}
                        className={cn(
                          "text-[9px] font-mono px-1.5 py-0.5 rounded border transition-all duration-500",
                          activeTopic === evt
                            ? "border-blue-400 dark:border-blue-600 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400"
                            : "border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-500",
                          isPulsing && "scale-110 duration-500"
                        )}
                      >
                        {evt}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Topics (Bus) */}
        <div className="w-36 shrink-0">
          <div className="px-3 py-2 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-50 dark:border-zinc-900/60 text-center">
            Topics
          </div>
          <div className="p-2 space-y-1.5">
            {topics.map((topic) => {
              const isActive = activeTopic === topic.name;
              return (
                <div
                  key={topic.name}
                  className={cn(
                    "rounded-lg border px-2.5 py-2 text-center transition-all duration-500",
                    isActive && phase === "pub-to-topic"
                      ? "border-blue-400 dark:border-blue-600 bg-blue-50 dark:bg-blue-950/30 scale-105"
                      : isActive && phase === "topic-to-subs"
                      ? "border-violet-400 dark:border-violet-600 bg-violet-50 dark:bg-violet-950/20"
                      : "border-zinc-200 dark:border-zinc-700 bg-zinc-50/40 dark:bg-zinc-900/20"
                  )}
                >
                  <div className={cn(
                    "text-[10px] font-mono font-semibold transition-colors duration-500",
                    isActive ? "text-blue-600 dark:text-blue-400" : "text-zinc-600 dark:text-zinc-400"
                  )}>
                    {topic.name}
                  </div>
                  {topic.description && (
                    <div className="text-[9px] text-zinc-400 leading-tight mt-0.5 truncate">{topic.description}</div>
                  )}
                  {isActive && phase === "topic-to-subs" && (
                    <div className="mt-1 flex justify-center">
                      <span className="size-1.5 rounded-full bg-blue-500 animate-ping" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Subscribers */}
        <div>
          <div className="px-3 py-2 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-50 dark:border-zinc-900/60">
            Subscribers
          </div>
          <div className="p-2 space-y-1.5">
            {subscribers.map((sub) => {
              const isReceiving = activeSubscriberIds.has(sub.id);
              const isNotMatched = phase === "topic-to-subs" && !isReceiving && activeSubscriberIds.size > 0;
              return (
                <div
                  key={sub.id}
                  className={cn(
                    "rounded-lg border px-3 py-2 transition-all duration-500",
                    isReceiving
                      ? "ring-2 ring-emerald-400 border-emerald-300 dark:border-emerald-700 bg-emerald-50/60 dark:bg-emerald-950/20"
                      : isNotMatched
                      ? "border-zinc-200 dark:border-zinc-800 opacity-40"
                      : "border-zinc-200 dark:border-zinc-800"
                  )}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    {isReceiving && (
                      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    )}
                    <div className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300 truncate">
                      {sub.label}
                    </div>
                  </div>
                  {isReceiving && (
                    <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold mb-1 transition-all duration-500">
                      ✓ received
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1">
                    {sub.subscribesTo.map((t) => (
                      <span
                        key={t}
                        className={cn(
                          "text-[9px] font-mono px-1.5 py-0.5 rounded border transition-all duration-500",
                          activeTopic === t && isReceiving
                            ? "border-emerald-400 dark:border-emerald-600 text-emerald-600 dark:text-emerald-400"
                            : "border-zinc-200 dark:border-zinc-700 text-zinc-400"
                        )}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Event log — fixed height */}
      <div className="border-t border-zinc-100 dark:border-zinc-800 min-h-[72px]">
        {log.length > 0 ? (
          <>
            <div className="px-4 py-1.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">Event Log</div>
            <div className="px-4 pb-3 space-y-1 max-h-20 overflow-y-auto">
              {log.map((entry, i) => (
                <div key={i} className="flex items-center gap-2 text-[10px] font-mono">
                  <span className="text-zinc-300 dark:text-zinc-700 shrink-0">{entry.ts}</span>
                  <span className="text-violet-600 dark:text-violet-400 shrink-0">{entry.topic}</span>
                  <span className="text-zinc-400 shrink-0">{entry.from}</span>
                  <span className="text-zinc-300 dark:text-zinc-600">→</span>
                  <span className="text-zinc-500 dark:text-zinc-400 truncate">{entry.to}</span>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>

      {interactive && (
        <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/30">
          <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">{statusText}</span>
          <button
            type="button"
            onClick={publishSample}
            disabled={phase !== "idle" || !publishers[0]?.events[0]}
            className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0"
          >
            Publish Sample
          </button>
        </div>
      )}
    </div>
  );
}
