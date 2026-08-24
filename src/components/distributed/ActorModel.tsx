"use client";

import { useState, useEffect, useRef } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { MessageCircle, Cpu, Mail, ArrowRight } from "lucide-react";

export const ActorModelSchema = z.object({
  actors: z.array(z.object({
    id: z.string(),
    name: z.string(),
    color: z.enum(["blue", "emerald", "violet", "amber"]),
    mailboxSize: z.number().optional().default(0),
  })).default([
    { id: "a1", name: "UserActor",    color: "blue",    mailboxSize: 0 },
    { id: "a2", name: "OrderActor",   color: "emerald", mailboxSize: 0 },
    { id: "a3", name: "PaymentActor", color: "violet",  mailboxSize: 0 },
    { id: "a4", name: "NotifyActor",  color: "amber",   mailboxSize: 0 },
  ]),
});

export type ActorModelProps = z.infer<typeof ActorModelSchema>;

// ── Color maps ────────────────────────────────────────────────────────────────

const COLOR_MAP = {
  blue:    { border: "border-blue-300 dark:border-blue-600",   bg: "bg-blue-50 dark:bg-blue-900/30",   text: "text-blue-700 dark:text-blue-300",   badge: "bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300" },
  emerald: { border: "border-emerald-300 dark:border-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-300", badge: "bg-emerald-100 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-300" },
  violet:  { border: "border-violet-300 dark:border-violet-600",  bg: "bg-violet-50 dark:bg-violet-900/30",  text: "text-violet-700 dark:text-violet-300",  badge: "bg-violet-100 dark:bg-violet-800 text-violet-700 dark:text-violet-300" },
  amber:   { border: "border-amber-300 dark:border-amber-600",   bg: "bg-amber-50 dark:bg-amber-900/30",   text: "text-amber-700 dark:text-amber-300",   badge: "bg-amber-100 dark:bg-amber-800 text-amber-700 dark:text-amber-300" },
};

// ── Message types ─────────────────────────────────────────────────────────────

interface Message {
  id: string;
  type: string;
  data: string;
  fromActor: string;
  toActor: string;
}

interface AnimatingDot {
  id: string;
  fromActorId: string;
  toActorId: string;
  progress: number; // 0..1
}

const MESSAGE_TEMPLATES: Array<{ type: string; data: string; from: number; to: number }> = [
  { type: "PlaceOrder",      data: 'userId: "u1", total: $49',   from: 0, to: 1 },
  { type: "ProcessPayment",  data: 'orderId: "o42", amount: $49', from: 1, to: 2 },
  { type: "SendEmail",       data: 'to: "alice@ex.com"',          from: 2, to: 3 },
  { type: "CancelOrder",     data: 'orderId: "o99"',              from: 0, to: 1 },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function ActorModel({ actors }: ActorModelProps) {
  const clampedActors = actors.slice(0, 6);

  const [mailboxes, setMailboxes] = useState<Record<string, Message[]>>(() => {
    const init: Record<string, Message[]> = {};
    clampedActors.forEach((a) => { init[a.id] = []; });
    return init;
  });
  const [selectedActor, setSelectedActor] = useState<string | null>(null);
  const [processingActor, setProcessingActor] = useState<string | null>(null);
  const [animatingDots, setAnimatingDots] = useState<AnimatingDot[]>([]);
  const [lastReply, setLastReply] = useState<string | null>(null);
  const [templateIdx, setTemplateIdx] = useState(0);
  const msgCounterRef = useRef(0);
  const dotCounterRef = useRef(0);
  const animFrameRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animate dots
  useEffect(() => {
    animFrameRef.current = setInterval(() => {
      setAnimatingDots((dots) => {
        const updated = dots
          .map((d) => ({ ...d, progress: d.progress + 0.07 }))
          .filter((d) => d.progress <= 1);
        return updated;
      });
    }, 60);
    return () => { if (animFrameRef.current) clearInterval(animFrameRef.current); };
  }, []);

  function sendMessage(templateIdx: number) {
    const tmpl = MESSAGE_TEMPLATES[templateIdx % MESSAGE_TEMPLATES.length];
    const fromActorIdx = Math.min(tmpl.from, clampedActors.length - 1);
    const toActorIdx = Math.min(tmpl.to, clampedActors.length - 1);
    const fromActor = clampedActors[fromActorIdx];
    const toActor = clampedActors[toActorIdx];
    if (!fromActor || !toActor || fromActor.id === toActor.id) return;

    const msgId = `msg-${++msgCounterRef.current}`;
    const msg: Message = {
      id: msgId,
      type: tmpl.type,
      data: tmpl.data,
      fromActor: fromActor.name,
      toActor: toActor.name,
    };

    // Animate dot
    const dotId = `dot-${++dotCounterRef.current}`;
    setAnimatingDots((dots) => [...dots, { id: dotId, fromActorId: fromActor.id, toActorId: toActor.id, progress: 0 }]);

    // Add to mailbox after animation (~900ms)
    setTimeout(() => {
      setMailboxes((prev) => ({
        ...prev,
        [toActor.id]: [...(prev[toActor.id] ?? []), msg],
      }));
    }, 900);

    setLastReply(null);
  }

  function processMessage(actorId: string) {
    const msgs = mailboxes[actorId];
    if (!msgs || msgs.length === 0) return;
    if (processingActor) return;

    setProcessingActor(actorId);
    setLastReply(null);

    setTimeout(() => {
      setMailboxes((prev) => ({
        ...prev,
        [actorId]: prev[actorId].slice(1),
      }));
      const processed = msgs[0];
      setLastReply(`Processed [${processed.type}] from ${processed.fromActor} → reply: [${processed.type}Done, status: ok]`);
      setProcessingActor(null);
    }, 1400);
  }

  function sendNextMessage() {
    sendMessage(templateIdx);
    setTemplateIdx((i) => (i + 1) % MESSAGE_TEMPLATES.length);
  }

  const nextTemplate = MESSAGE_TEMPLATES[templateIdx % MESSAGE_TEMPLATES.length];

  // Layout: 2×2 grid positions (or linear for <4)
  const gridCols = clampedActors.length <= 2 ? clampedActors.length : 2;

  const selectedActorData = clampedActors.find((a) => a.id === selectedActor);

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800">
        <MessageCircle className="size-4 text-violet-500 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">Actor Model</span>
        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-700 px-2 py-0.5 rounded">
          {clampedActors.length} actors
        </span>
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        Isolated workers communicate only by passing messages — no shared memory.
      </p>

      <div className="min-h-[220px] px-4 pt-4 pb-3 flex flex-col gap-3">

        {/* Actor grid */}
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(${gridCols}, 1fr)` }}
        >
          {clampedActors.map((actor) => {
            const colors = COLOR_MAP[actor.color];
            const mailbox = mailboxes[actor.id] ?? [];
            const isSelected = selectedActor === actor.id;
            const isProcessing = processingActor === actor.id;

            return (
              <button
                key={actor.id}
                onClick={() => setSelectedActor(isSelected ? null : actor.id)}
                className={cn(
                  "relative border-2 rounded-xl p-3 text-left transition-all duration-500 cursor-pointer",
                  colors.border,
                  isSelected
                    ? `${colors.bg} ring-2 ring-offset-1 ring-offset-white dark:ring-offset-zinc-900 ring-zinc-400 dark:ring-zinc-500`
                    : "bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                )}
              >
                <div className="flex items-center gap-1.5">
                  <Cpu className={cn("size-3.5", colors.text)} />
                  <div className={cn("text-xs font-bold truncate", colors.text)}>{actor.name}</div>
                </div>

                <div className="flex items-center gap-1 mt-1">
                  <Mail className="size-3 text-zinc-400" />
                  <span className={cn(
                    "text-[11px] font-bold px-1.5 py-0.5 rounded",
                    colors.badge
                  )}>
                    {mailbox.length}
                  </span>
                  {isProcessing && (
                    <span className="ml-1 text-[10px] text-zinc-400 animate-pulse">processing…</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Animating dots overlay description */}
        {animatingDots.length > 0 && (
          <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
            {animatingDots.map((dot) => {
              const from = clampedActors.find((a) => a.id === dot.fromActorId);
              const to = clampedActors.find((a) => a.id === dot.toActorId);
              return (
                <span key={dot.id} className="inline-flex items-center gap-1">
                  <span className={cn(
                    "inline-block w-2 h-2 rounded-full animate-bounce",
                    "bg-violet-400 dark:bg-violet-500"
                  )} />
                  {from?.name} → {to?.name}
                </span>
              );
            })}
          </div>
        )}

        {/* Selected actor mailbox */}
        {selectedActorData && (
          <div className="border border-zinc-100 dark:border-zinc-800 rounded-lg p-2 bg-zinc-50 dark:bg-zinc-800/40">
            <div className="flex items-center justify-between mb-1">
              <span className={cn("text-[11px] font-bold", COLOR_MAP[selectedActorData.color].text)}>
                {selectedActorData.name} — Mailbox
              </span>
              {mailboxes[selectedActorData.id]?.length > 0 && (
                <button
                  onClick={() => processMessage(selectedActorData.id)}
                  disabled={processingActor !== null}
                  className="px-2 py-0.5 text-[10px] font-semibold rounded bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  Process next
                </button>
              )}
            </div>
            {mailboxes[selectedActorData.id]?.length === 0 ? (
              <div className="text-[10px] text-zinc-400 italic">Empty mailbox</div>
            ) : (
              <div className="flex flex-col gap-1 max-h-[80px] overflow-y-auto">
                {mailboxes[selectedActorData.id].map((msg, i) => (
                  <div key={msg.id} className={cn(
                    "text-[10px] font-mono rounded px-2 py-1 border transition-all duration-500",
                    i === 0
                      ? "bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-600"
                      : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 opacity-70"
                  )}>
                    <span className="font-bold text-violet-600 dark:text-violet-400">[{msg.type}]</span>
                    <span className="text-zinc-500 dark:text-zinc-400 ml-1">{msg.data}</span>
                    {i === 0 && <span className="ml-1 text-emerald-500 text-[9px]">← next</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Reply display */}
        {lastReply && (
          <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded px-2 py-1 transition-all duration-500">
            ✓ {lastReply}
          </div>
        )}

      </div>

      <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
        <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1 truncate">
          {lastReply ? (
            <span className="text-emerald-600 dark:text-emerald-400">{lastReply}</span>
          ) : animatingDots.length > 0 ? (
            <span className="flex items-center gap-1"><ArrowRight className="size-3.5" /> Message in flight…</span>
          ) : nextTemplate ? (
            <>Next: <strong className="text-zinc-700 dark:text-zinc-300">{nextTemplate.type}</strong></>
          ) : (
            "Click an actor to inspect its mailbox"
          )}
        </span>
        <button
          onClick={sendNextMessage}
          className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity shrink-0"
        >
          Send Message
        </button>
      </div>
    </div>
  );
}
