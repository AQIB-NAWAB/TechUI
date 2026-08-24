"use client";

import { useState, useRef, useCallback } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Lock, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

export const PasswordHashingSchema = z.object({
  algorithm: z.enum(["bcrypt", "argon2", "sha256"]).default("bcrypt"),
  workFactor: z.number().int().min(1).max(15).default(12),
  password: z.string().default("hunter2"),
});

export type PasswordHashingProps = z.infer<typeof PasswordHashingSchema>;

type Algorithm = "bcrypt" | "argon2" | "sha256";

/* ── Deterministic fake hashes (stable for same input) ─────────────── */
function simpleHash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0;
  return h.toString(16).padStart(8, "0");
}

function makeBcryptHash(password: string, cost: number): string {
  const seed = simpleHash(password + cost);
  const body = Array.from({ length: 7 }, (_, i) => simpleHash(seed + i)).join("").slice(0, 53);
  return `$2b$${String(cost).padStart(2, "0")}$${body}`;
}

function makeArgon2Hash(password: string, factor: number): string {
  const seed = simpleHash(password + "argon2" + factor);
  const salt = simpleHash(seed + "salt").slice(0, 22);
  const body = Array.from({ length: 6 }, (_, i) => simpleHash(seed + i)).join("").slice(0, 43);
  return `$argon2id$v=19$m=65536,t=${factor},p=4$${salt}$${body}`;
}

function makeSha256Hash(password: string): string {
  const seed = simpleHash(password + "sha256");
  return Array.from({ length: 8 }, (_, i) => simpleHash(seed + i)).join("").slice(0, 64);
}

function generateHash(algorithm: Algorithm, password: string, workFactor: number): string {
  switch (algorithm) {
    case "bcrypt":  return makeBcryptHash(password, workFactor);
    case "argon2":  return makeArgon2Hash(password, workFactor);
    case "sha256":  return makeSha256Hash(password);
  }
}

/* ── Timing info ────────────────────────────────────────────────────── */
const ALGO_INFO: Record<Algorithm, { duration: number; durationLabel: string; description: string }> = {
  bcrypt:  { duration: 1200, durationLabel: "~250ms",  description: "Adaptive cost factor — gets slower as hardware improves" },
  argon2:  { duration: 1400, durationLabel: "~300ms",  description: "Memory-hard — also resists GPU/ASIC attacks" },
  sha256:  { duration: 400,  durationLabel: "~0.003ms", description: "General-purpose hash — NOT designed for passwords" },
};

const BCRYPT_COSTS = [
  { cost: 10, label: "~65ms" },
  { cost: 11, label: "~130ms" },
  { cost: 12, label: "~250ms" },
  { cost: 13, label: "~500ms" },
  { cost: 14, label: "~1000ms" },
];

type HashState = "idle" | "hashing" | "done";
type VerifyState = "idle" | "verifying" | "match" | "no-match";

const TABS: { id: Algorithm; label: string }[] = [
  { id: "bcrypt",  label: "bcrypt" },
  { id: "argon2",  label: "argon2" },
  { id: "sha256",  label: "SHA-256" },
];

export function PasswordHashing({
  algorithm: initialAlgorithm = "bcrypt",
  workFactor = 12,
  password = "hunter2",
}: PasswordHashingProps) {
  const [algorithm, setAlgorithm] = useState<Algorithm>(initialAlgorithm);
  const [progress, setProgress] = useState(0);
  const [hashState, setHashState] = useState<HashState>("idle");
  const [hash, setHash] = useState<string | null>(null);
  const [verifyInput, setVerifyInput] = useState("");
  const [verifyState, setVerifyState] = useState<VerifyState>("idle");
  const [verifyProgress, setVerifyProgress] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const animFrame = useRef<number | null>(null);

  const clearAll = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (animFrame.current !== null) cancelAnimationFrame(animFrame.current);
  };

  const info = ALGO_INFO[algorithm];

  const runHash = useCallback(() => {
    if (hashState === "hashing") return;
    clearAll();
    setProgress(0);
    setHash(null);
    setHashState("hashing");
    setVerifyState("idle");
    setVerifyProgress(0);

    const start = performance.now();
    const dur = info.duration;

    const tick = () => {
      const elapsed = performance.now() - start;
      const p = Math.min(elapsed / dur, 1);
      setProgress(p);
      if (p < 1) {
        animFrame.current = requestAnimationFrame(tick);
      } else {
        setHash(generateHash(algorithm, password, workFactor));
        setHashState("done");
      }
    };
    animFrame.current = requestAnimationFrame(tick);
  }, [hashState, algorithm, password, workFactor, info.duration]);

  const runVerify = useCallback(() => {
    if (!hash || verifyState === "verifying") return;
    clearAll();
    setVerifyProgress(0);
    setVerifyState("verifying");

    const start = performance.now();
    const dur = info.duration;

    const tick = () => {
      const elapsed = performance.now() - start;
      const p = Math.min(elapsed / dur, 1);
      setVerifyProgress(p);
      if (p < 1) {
        animFrame.current = requestAnimationFrame(tick);
      } else {
        const expected = generateHash(algorithm, verifyInput, workFactor);
        setVerifyState(expected === hash ? "match" : "no-match");
      }
    };
    animFrame.current = requestAnimationFrame(tick);
  }, [hash, verifyState, algorithm, verifyInput, workFactor, info.duration]);

  const handleAlgoChange = (algo: Algorithm) => {
    clearAll();
    setAlgorithm(algo);
    setHashState("idle");
    setHash(null);
    setProgress(0);
    setVerifyState("idle");
    setVerifyProgress(0);
    setVerifyInput("");
  };

  const isSha = algorithm === "sha256";
  const progressPct = Math.round(progress * 100);

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="h-12 px-4 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
        <div className="flex items-center gap-2">
          <Lock className="size-3.5 text-zinc-500 dark:text-zinc-400 shrink-0" />
          <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Password Hashing</span>
        </div>
        <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800 rounded px-1.5 py-0.5">
          {algorithm}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleAlgoChange(tab.id)}
            className={cn(
              "px-4 py-2 text-xs font-semibold transition-all duration-500 border-b-2",
              algorithm === tab.id
                ? "border-zinc-900 dark:border-white text-zinc-900 dark:text-white bg-white dark:bg-zinc-900"
                : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
            )}
          >
            {tab.label}
            {tab.id === "sha256" && (
              <span className="ml-1 text-red-500 text-[9px]">⚠</span>
            )}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="p-4 space-y-4 min-h-[280px]">

        {/* SHA-256 warning banner */}
        {isSha && (
          <div className="flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 px-3 py-2">
            <AlertTriangle className="size-3.5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 dark:text-red-400 font-medium">
              DO NOT use SHA-256 for passwords. It has no salt and runs in ~0.003ms — an attacker can check billions of guesses per second with a GPU.
            </p>
          </div>
        )}

        {/* Hash flow */}
        <div className="space-y-2">
          {/* Input row */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-400 dark:text-zinc-500 w-14 shrink-0">Input:</span>
            <span className="font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded px-2 py-0.5">
              &quot;{password}&quot;
            </span>
          </div>

          {/* Down arrow */}
          <div className="flex items-center gap-2 text-xs pl-16">
            <span className="text-zinc-300 dark:text-zinc-600">↓</span>
          </div>

          {/* Algorithm box + progress */}
          <div className="flex items-start gap-2 text-xs">
            <span className="text-zinc-400 dark:text-zinc-500 w-14 shrink-0 pt-1">Function:</span>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "font-semibold rounded px-2 py-0.5",
                  isSha
                    ? "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400"
                    : "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                )}>
                  {algorithm}
                </span>
                {!isSha && (
                  <span className="text-zinc-400 dark:text-zinc-500">
                    {algorithm === "bcrypt"
                      ? `work factor: ${workFactor}`
                      : `t=${workFactor}, m=65536`}
                  </span>
                )}
                <span className={cn(
                  "ml-auto text-[10px] font-semibold",
                  isSha ? "text-red-500" : "text-zinc-400 dark:text-zinc-500"
                )}>
                  {info.durationLabel}
                </span>
              </div>

              {/* Progress bar */}
              {hashState !== "idle" && (
                <div className="space-y-1">
                  <div className="relative h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-none",
                        isSha ? "bg-red-400 dark:bg-red-500" : "bg-blue-500 dark:bg-blue-400"
                      )}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-zinc-400 dark:text-zinc-500">
                    <span>{hashState === "hashing" ? "Computing…" : "Done"}</span>
                    <span>{progressPct}%</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Down arrow */}
          {hash && (
            <div className="flex items-center gap-2 text-xs pl-16">
              <span className="text-zinc-300 dark:text-zinc-600">↓</span>
            </div>
          )}

          {/* Hash output */}
          {hash && (
            <div className="flex items-start gap-2 text-xs">
              <span className="text-zinc-400 dark:text-zinc-500 w-14 shrink-0 pt-1">Hash:</span>
              <div
                className={cn(
                  "flex-1 font-mono text-[10px] rounded-lg px-3 py-2 break-all cursor-default select-all transition-all duration-500",
                  isSha
                    ? "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
                    : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                )}
                title={hash}
              >
                {hash.length > 70 ? hash.slice(0, 70) + "…" : hash}
              </div>
            </div>
          )}
        </div>

        {/* Bcrypt cost comparison */}
        {algorithm === "bcrypt" && (
          <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700 px-3 py-2 space-y-1.5">
            <p className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
              Work factor comparison (cost doubles time)
            </p>
            <div className="flex gap-3 flex-wrap">
              {BCRYPT_COSTS.map(({ cost, label }) => (
                <div key={cost} className={cn(
                  "text-[10px] rounded px-1.5 py-0.5 font-mono",
                  cost === workFactor
                    ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-bold"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                )}>
                  cost={cost}: {label}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Argon2 params */}
        {algorithm === "argon2" && (
          <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700 px-3 py-2 space-y-1">
            <p className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Argon2id parameters</p>
            <div className="flex gap-3 text-[10px] font-mono text-zinc-600 dark:text-zinc-400 flex-wrap">
              <span className="bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded px-1.5 py-0.5">m=65536 (64MB RAM)</span>
              <span className="bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded px-1.5 py-0.5">t={workFactor} iterations</span>
              <span className="bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded px-1.5 py-0.5">p=4 threads</span>
            </div>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500">Memory-hard = GPUs can&apos;t parallelize cheaply</p>
          </div>
        )}

        {/* Insight line */}
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 italic">{info.description}</p>

        {/* Hash button */}
        <button
          onClick={runHash}
          disabled={hashState === "hashing"}
          className={cn(
            "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold transition-opacity",
            hashState === "hashing" ? "opacity-40 cursor-not-allowed" : "hover:opacity-90"
          )}
        >
          {hashState === "idle" ? "Hash Password"
            : hashState === "hashing" ? "Hashing…"
            : "Hash Again"}
        </button>

        {/* Verify section */}
        {hash && (
          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 space-y-3">
            <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Verify a password:</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={verifyInput}
                onChange={(e) => { setVerifyInput(e.target.value); setVerifyState("idle"); setVerifyProgress(0); }}
                placeholder="Enter password to verify…"
                className="flex-1 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-600 font-mono transition"
              />
              <button
                onClick={runVerify}
                disabled={!verifyInput || verifyState === "verifying"}
                className={cn(
                  "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold transition-opacity shrink-0",
                  (!verifyInput || verifyState === "verifying") ? "opacity-40 cursor-not-allowed" : "hover:opacity-90"
                )}
              >
                {verifyState === "verifying" ? "Checking…" : "Verify"}
              </button>
            </div>

            {/* Verify progress */}
            {verifyState === "verifying" && (
              <div className="space-y-1">
                <div className="relative h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-400 dark:bg-amber-500 transition-none"
                    style={{ width: `${Math.round(verifyProgress * 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                  Re-hashing to compare… ({info.durationLabel})
                </p>
              </div>
            )}

            {/* Result */}
            {verifyState === "match" && (
              <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 font-semibold">
                <CheckCircle2 className="size-4 shrink-0" />
                Passwords match!
              </div>
            )}
            {verifyState === "no-match" && (
              <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 font-semibold">
                <XCircle className="size-4 shrink-0" />
                Passwords do not match.
              </div>
            )}

            {/* SHA-256 vs bcrypt comparison footer */}
            <div className="flex items-center justify-between text-[10px] rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700 px-3 py-2 mt-1">
              <span className="text-zinc-500 dark:text-zinc-400">SHA-256 would take: <span className="text-red-500 font-semibold">0.003ms</span></span>
              <span className="text-red-500 font-semibold">← brute-forceable!</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
