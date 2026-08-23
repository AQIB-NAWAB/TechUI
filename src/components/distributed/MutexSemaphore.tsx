"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";

export const MutexSemaphoreSchema = z.object({
  type: z.enum(["mutex", "semaphore"]).default("mutex"),
  maxPermits: z.number().default(3),
  threads: z.number().default(5),
});

export type MutexSemaphoreProps = z.infer<typeof MutexSemaphoreSchema>;

type ThreadState = "idle" | "waiting" | "active" | "done";

interface ThreadInfo {
  id: number;
  state: ThreadState;
  label: string;
}

interface DeadlockThread {
  id: number;
  holds: string;
  wants: string;
}

const STATE_COLORS: Record<ThreadState, string> = {
  idle:    "bg-zinc-200 dark:bg-zinc-700",
  waiting: "bg-amber-400 dark:bg-amber-500",
  active:  "bg-blue-500 dark:bg-blue-400",
  done:    "bg-emerald-500 dark:bg-emerald-400",
};

const STATE_LABELS: Record<ThreadState, string> = {
  idle:    "IDLE",
  waiting: "WAITING",
  active:  "ACTIVE",
  done:    "DONE",
};

const STATE_TEXT: Record<ThreadState, string> = {
  idle:    "text-zinc-400 dark:text-zinc-500",
  waiting: "text-amber-600 dark:text-amber-400",
  active:  "text-blue-600 dark:text-blue-400",
  done:    "text-emerald-600 dark:text-emerald-400",
};

function buildInitialThreads(count: number): ThreadInfo[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    label: `Thread ${i + 1}`,
    state: "idle" as ThreadState,
  }));
}

function MutexTab({ threads: threadCount }: { threads: number }) {
  const [threads, setThreads] = useState<ThreadInfo[]>(() => buildInitialThreads(threadCount));
  const [lockHolder, setLockHolder] = useState<number | null>(null);
  const [deadlock, setDeadlock] = useState(false);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [autoRunning, setAutoRunning] = useState(false);

  const stopAuto = useCallback(() => {
    if (autoRef.current) {
      clearInterval(autoRef.current);
      autoRef.current = null;
    }
    setAutoRunning(false);
  }, []);

  useEffect(() => () => { stopAuto(); }, [stopAuto]);

  function reset() {
    stopAuto();
    setDeadlock(false);
    setLockHolder(null);
    setThreads(buildInitialThreads(threadCount));
  }

  function acquire() {
    setDeadlock(false);
    setThreads((prev) => {
      if (lockHolder !== null) {
        // make idle ones waiting
        const next = prev.map((t) =>
          t.id !== lockHolder && t.state === "idle" ? { ...t, state: "waiting" as ThreadState } : t
        );
        return next;
      }
      // find first idle/waiting thread
      const first = prev.find((t) => t.state === "idle" || t.state === "waiting");
      if (!first) return prev;
      const next = prev.map((t) => {
        if (t.id === first.id) return { ...t, state: "active" as ThreadState };
        if (t.state === "idle") return { ...t, state: "waiting" as ThreadState };
        return t;
      });
      setLockHolder(first.id);
      return next;
    });
  }

  function release() {
    setDeadlock(false);
    setThreads((prev) => {
      if (lockHolder === null) return prev;
      // current holder -> done
      const next = prev.map((t) =>
        t.id === lockHolder ? { ...t, state: "done" as ThreadState } : t
      );
      // next waiter gets lock
      const waiter = next.find((t) => t.state === "waiting");
      if (waiter) {
        waiter.state = "active";
        setLockHolder(waiter.id);
      } else {
        setLockHolder(null);
      }
      return [...next];
    });
  }

  function showDeadlock() {
    stopAuto();
    setLockHolder(null);
    setDeadlock(true);
    setThreads(buildInitialThreads(threadCount));
  }

  function startAutoRun() {
    if (autoRunning) { stopAuto(); return; }
    reset();
    setAutoRunning(true);
    let step = 0;
    autoRef.current = setInterval(() => {
      step++;
      if (step % 2 === 1) acquire();
      else release();
      if (step >= threadCount * 2 + 2) {
        stopAuto();
      }
    }, 1200);
  }

  const deadlockThreads: DeadlockThread[] = [
    { id: 1, holds: "Lock A", wants: "Lock B" },
    { id: 2, holds: "Lock B", wants: "Lock A" },
  ];

  return (
    <div className="space-y-3">
      {deadlock ? (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-1.5">
            <span className="inline-block size-2 rounded-full bg-red-500 animate-pulse" />
            Deadlock detected — both threads waiting forever
          </div>
          {deadlockThreads.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-3 px-3 py-2 rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/20"
            >
              <span className="text-xs font-mono font-bold text-red-600 dark:text-red-400 w-16">Thread {t.id}</span>
              <span className="text-xs text-zinc-600 dark:text-zinc-300">
                holds <span className="font-semibold text-red-600 dark:text-red-400">{t.holds}</span>,
                waiting for <span className="font-semibold text-red-600 dark:text-red-400">{t.wants}</span>
              </span>
            </div>
          ))}
          <p className="text-[10px] text-zinc-400 mt-1">Neither thread can proceed — classic deadlock.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {threads.map((t) => (
            <div key={t.id} className="flex items-center gap-3">
              <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 w-16 shrink-0">{t.label}</span>
              <div className="flex-1 h-5 rounded bg-zinc-100 dark:bg-zinc-800 overflow-hidden relative">
                <div
                  className={cn(
                    "h-full rounded transition-all duration-500",
                    STATE_COLORS[t.state],
                    t.state === "waiting" && "animate-pulse",
                    t.state === "active" && "w-full"
                  )}
                  style={{ width: t.state === "active" ? "100%" : t.state === "waiting" ? "45%" : t.state === "done" ? "100%" : "0%" }}
                />
              </div>
              <span className={cn("text-[10px] font-semibold w-14 shrink-0", STATE_TEXT[t.state])}>
                {STATE_LABELS[t.state]}
              </span>
              {t.id === lockHolder && (
                <span className="text-[10px] text-blue-500 dark:text-blue-400 shrink-0">writing...</span>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        <button
          onClick={acquire}
          className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Acquire Lock
        </button>
        <button
          onClick={release}
          disabled={lockHolder === null}
          className="bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          Release Lock
        </button>
        <button
          onClick={startAutoRun}
          className={cn(
            "rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity",
            autoRunning
              ? "bg-amber-500 text-white"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
          )}
        >
          {autoRunning ? "Stop" : "Auto-Run"}
        </button>
        <button
          onClick={showDeadlock}
          className="bg-red-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Deadlock
        </button>
        <button
          onClick={reset}
          className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 px-2 transition-colors"
        >
          Reset
        </button>
      </div>

      <p className="text-[10px] text-zinc-400 border-t border-zinc-100 dark:border-zinc-800 pt-2 mt-1">
        Only <span className="font-semibold text-zinc-600 dark:text-zinc-300">ONE</span> thread can hold the mutex at a time — all others block.
      </p>
    </div>
  );
}

function SemaphoreTab({ maxPermits, threads: threadCount }: { maxPermits: number; threads: number }) {
  const [threads, setThreads] = useState<ThreadInfo[]>(() => buildInitialThreads(threadCount));
  const [permits, setPermits] = useState(maxPermits);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [autoRunning, setAutoRunning] = useState(false);

  const stopAuto = useCallback(() => {
    if (autoRef.current) {
      clearInterval(autoRef.current);
      autoRef.current = null;
    }
    setAutoRunning(false);
  }, []);

  useEffect(() => () => { stopAuto(); }, [stopAuto]);

  function reset() {
    stopAuto();
    setThreads(buildInitialThreads(threadCount));
    setPermits(maxPermits);
  }

  function acquire() {
    setThreads((prev) => {
      const currentActive = prev.filter((t) => t.state === "active").length;
      const availablePermits = maxPermits - currentActive;
      if (availablePermits <= 0) {
        return prev.map((t) =>
          t.state === "idle" ? { ...t, state: "waiting" as ThreadState } : t
        );
      }
      const first = prev.find((t) => t.state === "idle" || t.state === "waiting");
      if (!first) return prev;
      const next = prev.map((t) =>
        t.id === first.id ? { ...t, state: "active" as ThreadState } : t
      );
      setPermits(maxPermits - (currentActive + 1));
      return next;
    });
  }

  function release() {
    setThreads((prev) => {
      const active = prev.find((t) => t.state === "active");
      if (!active) return prev;
      let next = prev.map((t) =>
        t.id === active.id ? { ...t, state: "done" as ThreadState } : t
      );
      // promote one waiter
      const waiter = next.find((t) => t.state === "waiting");
      if (waiter) {
        next = next.map((t) => t.id === waiter.id ? { ...t, state: "active" as ThreadState } : t);
      } else {
        setPermits((p) => Math.min(maxPermits, p + 1));
      }
      return next;
    });
  }

  function startAutoRun() {
    if (autoRunning) { stopAuto(); return; }
    reset();
    setAutoRunning(true);
    let step = 0;
    autoRef.current = setInterval(() => {
      step++;
      if (step % 3 !== 0) acquire();
      else release();
      if (step >= threadCount * 3) stopAuto();
    }, 1200);
  }

  const activeCount = threads.filter((t) => t.state === "active").length;
  const availablePermits = maxPermits - activeCount;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs">
        <span className="text-zinc-500 dark:text-zinc-400">Available permits:</span>
        <span className="font-bold text-blue-600 dark:text-blue-400">{availablePermits}/{maxPermits}</span>
        <div className="flex gap-1 ml-1">
          {Array.from({ length: maxPermits }, (_, i) => (
            <div
              key={i}
              className={cn(
                "size-3 rounded-sm transition-all duration-500",
                i < availablePermits ? "bg-blue-400 dark:bg-blue-500" : "bg-zinc-200 dark:bg-zinc-700"
              )}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {threads.map((t, idx) => {
          const permit = threads.slice(0, idx).filter((x) => x.state === "active").length;
          return (
            <div key={t.id} className="flex items-center gap-3">
              <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 w-16 shrink-0">{t.label}</span>
              <div className="flex-1 h-5 rounded bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded transition-all duration-500",
                    STATE_COLORS[t.state],
                    t.state === "waiting" && "animate-pulse"
                  )}
                  style={{
                    width: t.state === "active" ? "100%" : t.state === "waiting" ? "40%" : t.state === "done" ? "100%" : "0%",
                  }}
                />
              </div>
              <span className={cn("text-[10px] font-semibold w-14 shrink-0", STATE_TEXT[t.state])}>
                {STATE_LABELS[t.state]}
              </span>
              {t.state === "active" && (
                <span className="text-[10px] text-zinc-400 shrink-0">permit {permit + 1}/{maxPermits}</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        <button
          onClick={acquire}
          className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Acquire
        </button>
        <button
          onClick={release}
          disabled={activeCount === 0}
          className="bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          Release
        </button>
        <button
          onClick={startAutoRun}
          className={cn(
            "rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity",
            autoRunning
              ? "bg-amber-500 text-white"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
          )}
        >
          {autoRunning ? "Stop" : "Auto-Run"}
        </button>
        <button
          onClick={reset}
          className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 px-2 transition-colors"
        >
          Reset
        </button>
      </div>

      <p className="text-[10px] text-zinc-400 border-t border-zinc-100 dark:border-zinc-800 pt-2 mt-1">
        Up to <span className="font-semibold text-zinc-600 dark:text-zinc-300">{maxPermits}</span> threads can be active simultaneously — others wait for a permit.
      </p>
    </div>
  );
}

export function MutexSemaphore({
  type = "mutex",
  maxPermits = 3,
  threads = 5,
}: MutexSemaphoreProps) {
  const [tab, setTab] = useState<"mutex" | "semaphore">(type);

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
        <Lock className="size-3.5 text-zinc-400 shrink-0" />
        <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex-1">
          {tab === "mutex" ? "Mutex" : "Semaphore"}
        </span>
        <span className="text-[10px] text-zinc-400">
          {tab === "mutex" ? "exclusive lock — 1 thread max" : `counting lock — ${maxPermits} permits`}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-100 dark:border-zinc-800">
        {(["mutex", "semaphore"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-2 text-xs font-semibold capitalize transition-all duration-200",
              tab === t
                ? "border-b-2 border-zinc-900 dark:border-white text-zinc-900 dark:text-white"
                : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-[300px] p-4">
        {tab === "mutex" ? (
          <MutexTab threads={threads} />
        ) : (
          <SemaphoreTab maxPermits={maxPermits} threads={threads} />
        )}
      </div>
    </div>
  );
}
