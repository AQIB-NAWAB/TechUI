"use client";

import { useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Layers, ArrowDown, ArrowUp, RefreshCw } from "lucide-react";

export const StackVsQueueSchema = z.object({
  initialItems: z.array(z.string()).optional().default(["A", "B", "C"]),
  nextItem: z.string().optional().default("D"),
  interactive: z.boolean().optional().default(true),
});

export type StackVsQueueProps = z.infer<typeof StackVsQueueSchema>;

export function StackVsQueue({
  initialItems = ["A", "B", "C"],
  nextItem = "D",
  interactive = true,
}: StackVsQueueProps) {
  const [stack, setStack] = useState<string[]>([...initialItems]);
  const [queue, setQueue] = useState<string[]>([...initialItems]);
  const [itemCounter, setItemCounter] = useState(0);
  const [lastAction, setLastAction] = useState<{ side: "stack" | "queue"; action: "push" | "pop"; item: string } | null>(null);
  const [animating, setAnimating] = useState(false);

  const letters = "DEFGHIJKLMNOPQRSTUVWXYZ";

  function getNextLabel() {
    if (itemCounter < letters.length) return letters[itemCounter];
    return nextItem;
  }

  function addAndRemove() {
    if (animating) return;
    setAnimating(true);
    const label = getNextLabel();
    setItemCounter((c) => c + 1);
    setLastAction(null);

    setStack((s) => [...s, label]);
    setQueue((q) => [...q, label]);

    setTimeout(() => {
      setStack((s) => {
        const removed = s[s.length - 1];
        setLastAction({ side: "stack", action: "pop", item: removed });
        return s.slice(0, -1);
      });
      setTimeout(() => {
        setQueue((q) => {
          const removed = q[0];
          setLastAction({ side: "queue", action: "pop", item: removed });
          return q.slice(1);
        });
        setTimeout(() => {
          setAnimating(false);
          setTimeout(() => setLastAction(null), 1200);
        }, 600);
      }, 600);
    }, 800);
  }

  function reset() {
    setStack([...initialItems]);
    setQueue([...initialItems]);
    setItemCounter(0);
    setLastAction(null);
    setAnimating(false);
  }

  const statusText = lastAction
    ? lastAction.side === "stack"
      ? `Stack removed "${lastAction.item}" from the top (LIFO — Last In, First Out).`
      : `Queue removed "${lastAction.item}" from the front (FIFO — First In, First Out).`
    : "Add an item to both structures, then remove — stack pops from top, queue shifts from front.";

  function renderStructure(
    items: string[],
    type: "stack" | "queue",
    highlightIdx: number | null
  ) {
    const isStack = type === "stack";
    const displayItems = isStack ? [...items].reverse() : items;

    return (
      <div className="flex-1 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 p-3 flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          {isStack ? (
            <ArrowUp className="size-3.5 text-violet-500" />
          ) : (
            <ArrowDown className="size-3.5 text-blue-500" />
          )}
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            {isStack ? "Stack" : "Queue"}
          </span>
          <span className="text-[10px] text-zinc-400 ml-auto">{isStack ? "LIFO" : "FIFO"}</span>
        </div>

        <div
          className={cn(
            "flex-1 min-h-[140px] flex gap-1.5 transition-all duration-500",
            isStack ? "flex-col-reverse items-center justify-start" : "flex-row items-end justify-start"
          )}
        >
          {displayItems.length === 0 && (
            <div className="text-[11px] text-zinc-400 italic self-center m-auto">Empty</div>
          )}
          {displayItems.map((item, displayIdx) => {
            const realIdx = isStack ? items.length - 1 - displayIdx : displayIdx;
            const isHighlight = highlightIdx === realIdx;
            const isTopOrFront = isStack ? realIdx === items.length - 1 : realIdx === 0;

            return (
              <div
                key={`${type}-${realIdx}-${item}`}
                className={cn(
                  "rounded-lg border-2 flex items-center justify-center font-bold font-mono transition-all duration-500",
                  isStack ? "w-14 h-12 text-sm" : "w-12 h-14 text-sm",
                  isHighlight
                    ? "bg-amber-100 dark:bg-amber-900/40 border-amber-400 dark:border-amber-600 scale-110 text-amber-700 dark:text-amber-300"
                    : isTopOrFront
                    ? "bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 ring-2 ring-blue-200 dark:ring-blue-800"
                    : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"
                )}
              >
                {item}
              </div>
            );
          })}
        </div>

        <div className="mt-2 text-[10px] text-zinc-500 text-center">
          {isStack ? "↑ top (pop here)" : "← front (dequeue here)"}
        </div>
      </div>
    );
  }

  const stackHighlight = lastAction?.side === "stack" ? stack.length : null;
  const queueHighlight = lastAction?.side === "queue" ? 0 : null;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="h-12 px-4 flex items-center gap-3 border-b border-zinc-200 dark:border-zinc-800">
        <Layers className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex-1">Stack vs Queue</span>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
          Side by side
        </span>
      </div>

      <div className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        Two ways to store items — stacks remove the newest, queues remove the oldest.
      </div>

      <div className="min-h-[240px] px-4 py-4 flex gap-4">
        {renderStructure(stack, "stack", stackHighlight)}
        {renderStructure(queue, "queue", queueHighlight)}
      </div>

      {interactive && (
        <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-3">
          <span className="text-[11px] text-zinc-500 flex-1">{statusText}</span>
          <button
            onClick={reset}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            title="Reset"
          >
            <RefreshCw className="size-3.5" />
          </button>
          <button
            onClick={addAndRemove}
            disabled={animating}
            className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            Add & Remove
          </button>
        </div>
      )}
    </div>
  );
}
