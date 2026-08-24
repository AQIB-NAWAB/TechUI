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

      <div className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        Turns passwords into one-way hashes so the real password is never stored in plain text.
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
      <div className="p-4 space-y-3 min-h-[280px] flex flex-col">
        {isSha && (
          <div className="flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 px-3 py-2">
            <AlertTriangle className="size-3.5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 dark:text-red-400 font-medium">
              SHA-256 is NOT for passwords — no salt, runs in ~0.003ms.
            </p>
          </div>
        )}

        <div className="flex items-center gap-2 text-xs">
          <span className="text-zinc-400 w-14 shrink-0">Input:</span>
          <span className="font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded px-2 py-0.5">
            &quot;{password}&quot;
          </span>
          <span className={cn("ml-auto text-[10px] font-semibold", isSha ? "text-red-500" : "text-zinc-400")}>
            {info.durationLabel}
          </span>
        </div>

        <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/40 p-3 space-y-2 min-h-[100px]">
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-xs font-semibold rounded px-2 py-0.5",
              isSha ? "bg-red-100 dark:bg-red-950 text-red-700" : "bg-blue-100 dark:bg-blue-950 text-blue-700"
            )}>
              {algorithm}
            </span>
            {!isSha && (
              <span className="text-[10px] text-zinc-400">
                {algorithm === "bcrypt" ? `cost ${workFactor}` : `t=${workFactor}`}
              </span>
            )}
          </div>

          <div className="relative h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
            <div
              className={cn("h-full rounded-full", isSha ? "bg-red-400" : "bg-blue-500")}
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <div className={cn(
            "font-mono text-[10px] rounded-lg px-3 py-2 break-all min-h-[40px] transition-all duration-500",
            hash
              ? isSha
                ? "bg-red-50 dark:bg-red-950/30 text-red-700 border border-red-200"
                : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 border border-emerald-200"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-700"
          )}>
            {hash ? (hash.length > 70 ? hash.slice(0, 70) + "…" : hash) : "Hash output appears here"}
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/40 p-3 min-h-[72px]">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-2">Verify</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={verifyInput}
              onChange={(e) => { setVerifyInput(e.target.value); setVerifyState("idle"); setVerifyProgress(0); }}
              placeholder="Enter password to verify…"
              disabled={!hash}
              className="flex-1 px-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-mono outline-none disabled:opacity-40"
            />
            {verifyState === "match" && <CheckCircle2 className="size-4 text-emerald-500 shrink-0 self-center" />}
            {verifyState === "no-match" && <XCircle className="size-4 text-red-500 shrink-0 self-center" />}
          </div>
        </div>
      </div>

      <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
        <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">
          {hashState === "hashing" ? "Computing hash…" :
           hashState === "done" ? (verifyState === "match" ? "Password verified!" : verifyState === "no-match" ? "No match" : "Hash ready — try verifying") :
           info.description}
        </span>
        <button
          onClick={hash ? runVerify : runHash}
          disabled={hashState === "hashing" || verifyState === "verifying" || (!!hash && !verifyInput)}
          className={cn(
            "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold transition-opacity shrink-0",
            (hashState === "hashing" || verifyState === "verifying" || (!!hash && !verifyInput)) ? "opacity-40 cursor-not-allowed" : "hover:opacity-90"
          )}
        >
          {hashState === "hashing" ? "Hashing…" :
           verifyState === "verifying" ? "Checking…" :
           hash ? "Verify Password" : "Hash Password"}
        </button>
      </div>
    </div>
  );
}
