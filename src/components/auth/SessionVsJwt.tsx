"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import {
  Shield,
  Monitor,
  Server,
  Database,
  Cookie,
  Key,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

export const SessionVsJwtSchema = z.object({
  serverName: z.string().optional().default("api.example.com"),
  initialMode: z.enum(["session", "jwt"]).optional().default("session"),
  interactive: z.boolean().optional().default(true),
});

export type SessionVsJwtProps = z.infer<typeof SessionVsJwtSchema>;

type AuthMode = "session" | "jwt";
type Phase = "idle" | "login" | "stored" | "request" | "verified";

const PHASE_LABELS: Record<Phase, { session: string; jwt: string }> = {
  idle: {
    session: "User is logged out — no cookie, no session on server.",
    jwt: "User is logged out — no token stored on client.",
  },
  login: {
    session: "Credentials sent to server — server will create a session record.",
    jwt: "Credentials sent to server — server will sign a JWT and return it.",
  },
  stored: {
    session: "Session ID saved in a cookie. Full user data lives on the server.",
    jwt: "JWT saved in memory/localStorage. Server stores nothing.",
  },
  request: {
    session: "Cookie sent automatically — server looks up session in database.",
    jwt: "Token sent in Authorization header — server verifies signature only.",
  },
  verified: {
    session: "Session found in store — request allowed. Server owns the state.",
    jwt: "Signature valid — identity read from token. Server is stateless.",
  },
};

const PHASE_ORDER: Phase[] = ["idle", "login", "stored", "request", "verified"];

export function SessionVsJwt({
  serverName = "api.example.com",
  initialMode = "session",
  interactive = true,
}: SessionVsJwtProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [phase, setPhase] = useState<Phase>("idle");
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    setMode(initialMode);
    setPhase("idle");
    setAnimating(false);
  }, [initialMode, serverName]);

  function runFlow() {
    if (animating || !interactive) return;
    setAnimating(true);
    setPhase("idle");

    PHASE_ORDER.slice(1).forEach((p, i) => {
      setTimeout(() => {
        setPhase(p);
        if (p === "verified") {
          setTimeout(() => setAnimating(false), 1200);
        }
      }, (i + 1) * 1200);
    });
  }

  function reset() {
    setPhase("idle");
    setAnimating(false);
  }

  const statusText = PHASE_LABELS[phase][mode];
  const phaseIdx = PHASE_ORDER.indexOf(phase);

  return (
    <>
      <style>{`
        @keyframes packetTravel {
          0% { transform: translateX(0); opacity: 1; }
          100% { transform: translateX(100%); opacity: 0; }
        }
      `}</style>
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
        <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
          <Shield className="size-4 text-zinc-400 shrink-0" />
          <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex-1">
            Session vs JWT
          </span>
          <div className="flex rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden text-[10px] font-semibold">
            {(["session", "jwt"] as AuthMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  reset();
                }}
                className={cn(
                  "px-2.5 py-1 transition-all duration-500 uppercase tracking-wide",
                  mode === m
                    ? m === "session"
                      ? "bg-blue-600 text-white"
                      : "bg-emerald-600 text-white"
                    : "bg-zinc-50 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                )}
              >
                {m === "session" ? "Session" : "JWT"}
              </button>
            ))}
          </div>
          {interactive && (
            <button
              type="button"
              onClick={reset}
              className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all duration-500"
              title="Reset"
            >
              <RefreshCw className="size-3.5" />
            </button>
          )}
        </div>

        <div className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
          Where does login state live? Sessions keep data on the server; JWTs carry identity on the client.
        </div>

        <div className="min-h-[240px] px-4 py-4">
          <div className="grid grid-cols-3 gap-3 items-stretch mb-4">
            {/* Client */}
            <div
              className={cn(
                "rounded-lg border p-3 flex flex-col items-center gap-2 transition-all duration-500",
                phaseIdx >= 2
                  ? "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/20"
                  : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/40"
              )}
            >
              <Monitor className="size-5 text-zinc-500" />
              <span className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-300">Browser</span>
              <div className="w-full min-h-[52px] flex flex-col items-center justify-center gap-1">
                {mode === "session" ? (
                  <div
                    className={cn(
                      "flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-mono transition-all duration-500",
                      phaseIdx >= 2
                        ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-700"
                    )}
                  >
                    <Cookie className="size-3 shrink-0" />
                    {phaseIdx >= 2 ? "session_id=abc123" : "no cookie"}
                  </div>
                ) : (
                  <div
                    className={cn(
                      "flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-mono transition-all duration-500 max-w-full truncate",
                      phaseIdx >= 2
                        ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-700"
                    )}
                  >
                    <Key className="size-3 shrink-0" />
                    {phaseIdx >= 2 ? "eyJhbG…token" : "no token"}
                  </div>
                )}
              </div>
            </div>

            {/* Arrow / packet lane */}
            <div className="flex flex-col items-center justify-center gap-2 relative min-h-[100px]">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                {phase === "login" || phase === "request" ? "in flight" : "idle"}
              </span>
              <div className="w-full h-0.5 bg-zinc-200 dark:bg-zinc-700 relative overflow-hidden rounded-full">
                {(phase === "login" || phase === "request") && (
                  <div
                    className={cn(
                      "absolute top-1/2 -translate-y-1/2 size-2.5 rounded-full",
                      mode === "session" ? "bg-blue-500" : "bg-emerald-500"
                    )}
                    style={{ animation: "packetTravel 800ms ease-in-out infinite" }}
                  />
                )}
              </div>
              <ArrowRight className="size-4 text-zinc-300 dark:text-zinc-600" />
            </div>

            {/* Server + store */}
            <div className="flex flex-col gap-2">
              <div
                className={cn(
                  "rounded-lg border p-3 flex flex-col items-center gap-2 flex-1 transition-all duration-500",
                  phaseIdx >= 1
                    ? "border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800/40"
                    : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/40"
                )}
              >
                <Server className="size-5 text-zinc-500" />
                <span className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-300 truncate max-w-full">
                  {serverName}
                </span>
                {phaseIdx >= 4 && (
                  <CheckCircle2 className="size-4 text-emerald-500 transition-all duration-500" />
                )}
              </div>
              <div
                className={cn(
                  "rounded-lg border p-2 flex items-center gap-2 transition-all duration-500",
                  mode === "session" && phaseIdx >= 2
                    ? "border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/20"
                    : mode === "jwt"
                    ? "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/30 opacity-60"
                    : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/30"
                )}
              >
                <Database className="size-3.5 text-zinc-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[10px] font-semibold text-zinc-500">Session store</div>
                  <div className="text-[10px] font-mono text-zinc-400 truncate">
                    {mode === "session" && phaseIdx >= 2 ? "user:1234 → admin" : mode === "session" ? "empty" : "unused"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step indicators */}
          <div className="flex gap-1.5 justify-center">
            {PHASE_ORDER.map((p, i) => (
              <div
                key={p}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-500",
                  i <= phaseIdx
                    ? mode === "session"
                      ? "bg-blue-500 w-8"
                      : "bg-emerald-500 w-8"
                    : "bg-zinc-200 dark:bg-zinc-700 w-4"
                )}
              />
            ))}
          </div>

          {/* Comparison chips */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            <div
              className={cn(
                "rounded-lg border p-2 transition-all duration-500",
                mode === "session"
                  ? "border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20"
                  : "border-zinc-100 dark:border-zinc-800 opacity-50"
              )}
            >
              <div className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 mb-0.5">Session</div>
              <div className="text-[10px] text-zinc-500">State on server · cookie is just an ID</div>
            </div>
            <div
              className={cn(
                "rounded-lg border p-2 transition-all duration-500",
                mode === "jwt"
                  ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20"
                  : "border-zinc-100 dark:border-zinc-800 opacity-50"
              )}
            >
              <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mb-0.5">JWT</div>
              <div className="text-[10px] text-zinc-500">State on client · server verifies signature</div>
            </div>
          </div>
        </div>

        {interactive && (
          <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/30 min-h-[52px]">
            <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">{statusText}</span>
            <button
              type="button"
              onClick={runFlow}
              disabled={animating}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-500 shrink-0 hover:opacity-90",
                "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900",
                animating && "opacity-50 cursor-not-allowed"
              )}
            >
              {animating ? "Running…" : "Simulate Login"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
