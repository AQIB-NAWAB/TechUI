"use client";

import { useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Shield, Monitor, Server, ArrowRight, CheckCircle2 } from "lucide-react";

export const JwtFlowSchema = z.object({
  issuer: z.string().optional().default("auth.example.com"),
  audience: z.string().optional().default("api.example.com"),
  subject: z.string().optional().default("user:1234"),
  expiresIn: z.string().optional().default("1h"),
  algorithm: z.string().optional().default("HS256"),
  interactive: z.boolean().optional().default(true),
});

export type JwtFlowProps = z.infer<typeof JwtFlowSchema>;

const FAKE_HEADER = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9";
const FAKE_PAYLOAD = "eyJzdWIiOiJ1c2VyOjEyMzQiLCJpc3MiOiJhdXRoLmV4YW1wbGUuY29tIiwiZXhwIjoxNzE2MjQyNjIyfQ";
const FAKE_SIG = "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

type StepDef = {
  label: string;
  subtitle: string;
  from: number;
  to: number;
  description: string;
};

const STEPS: StepDef[] = [
  {
    label: "Login",
    subtitle: "Browser → Auth Server",
    from: 1,
    to: 0,
    description: "The browser sends credentials (username + password) to the auth server over HTTPS.",
  },
  {
    label: "Issue Token",
    subtitle: "Auth Server → Browser",
    from: 0,
    to: 1,
    description: "The auth server verifies credentials, creates a signed JWT, and returns it. The token carries the user identity — no session stored on the server.",
  },
  {
    label: "API Request",
    subtitle: "Browser → API Server",
    from: 1,
    to: 2,
    description: "The browser includes the JWT in the Authorization header on every API request. No cookie needed.",
  },
  {
    label: "Verify",
    subtitle: "API Server checks signature",
    from: 2,
    to: 2,
    description: "The API verifies the JWT signature using a shared secret — no database lookup needed. The payload is decoded directly from the token.",
  },
];

const ACTORS = [
  { id: "auth",    label: "Auth Server", icon: Shield   },
  { id: "browser", label: "Browser/App", icon: Monitor  },
  { id: "api",     label: "API Server",  icon: Server   },
];

export function JwtFlow({
  issuer = "auth.example.com",
  audience = "api.example.com",
  subject = "user:1234",
  expiresIn = "1h",
  algorithm = "HS256",
  interactive = true,
}: JwtFlowProps) {
  const [stepIdx, setStepIdx] = useState(0);
  const step = STEPS[stepIdx]!;

  const isLastStep = stepIdx === STEPS.length - 1;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="h-12 px-4 flex items-center gap-3 border-b border-zinc-200 dark:border-zinc-800">
        <Shield className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex-1">JWT Auth Flow</span>
        <span className="text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded">
          Step {stepIdx + 1} of {STEPS.length}
        </span>
      </div>

      <div className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        Full JWT lifecycle: login → issue → transmit → verify, showing how stateless auth works with no server-side sessions.
      </div>

      <div className="min-h-[280px] px-4 py-4 flex flex-col gap-3">
        <div className="grid grid-cols-3 gap-2">
          {ACTORS.map((actor, idx) => {
            const Icon = actor.icon;
            const isActive = idx === step.from || idx === step.to;
            return (
              <div
                key={actor.id}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-lg border px-2 py-3 transition-all duration-500",
                  isActive
                    ? "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400"
                    : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/40 text-zinc-400"
                )}
              >
                <Icon className="size-4" />
                <span className="text-[10px] font-semibold text-center leading-tight">{actor.label}</span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2 min-h-[20px]">
          {step.from !== step.to ? (
            <>
              <span className="text-[10px] font-mono text-zinc-500 shrink-0">{ACTORS[step.from]?.label}</span>
              <div className="flex-1 flex items-center gap-1">
                <div className="flex-1 h-0.5 rounded-full bg-blue-400 transition-all duration-700" />
                <ArrowRight className="size-3.5 text-blue-400 shrink-0" />
              </div>
              <span className="text-[10px] font-mono text-zinc-500 shrink-0">{ACTORS[step.to]?.label}</span>
            </>
          ) : (
            <div className="flex items-center gap-2 w-full justify-center">
              <CheckCircle2 className="size-4 text-emerald-500" />
              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">Verified locally — no DB needed</span>
            </div>
          )}
        </div>

        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 px-3 py-2">
          <div className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-0.5">{step.label}</div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">{step.description}</div>
        </div>

        <div className="h-[88px] rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/40 px-3 py-2 font-mono text-[10px] transition-all duration-500 overflow-hidden">
          {stepIdx === 1 && (
            <>
              <div className="mb-1 text-[9px] text-zinc-400 uppercase tracking-wider">JWT Token (3 parts)</div>
              <div className="break-all leading-relaxed">
                <span className="text-violet-600 dark:text-violet-400">{FAKE_HEADER.slice(0, 20)}…</span>
                <span className="text-zinc-400">.</span>
                <span className="text-blue-600 dark:text-blue-400">{FAKE_PAYLOAD.slice(0, 20)}…</span>
                <span className="text-zinc-400">.</span>
                <span className="text-emerald-600 dark:text-emerald-400">{FAKE_SIG.slice(0, 12)}…</span>
              </div>
            </>
          )}
          {stepIdx === 2 && (
            <>
              <div className="mb-1 text-[9px] text-zinc-400 uppercase tracking-wider">Authorization Header</div>
              <span className="text-zinc-500">Bearer </span>
              <span className="text-blue-600 dark:text-blue-400">{FAKE_HEADER.slice(0, 24)}…</span>
            </>
          )}
          {stepIdx === 3 && (
            <>
              <div className="mb-1 text-[9px] text-zinc-400 uppercase tracking-wider">Decoded Payload</div>
              <div className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
                <span className="text-zinc-400">sub: </span><span className="text-blue-600 dark:text-blue-400">&quot;{subject}&quot;</span>
                {" · "}
                <span className="text-zinc-400">iss: </span><span className="text-violet-600 dark:text-violet-400">&quot;{issuer}&quot;</span>
                {" · "}
                <span className="text-zinc-400">alg: </span><span className="text-emerald-600 dark:text-emerald-400">{algorithm}</span>
              </div>
            </>
          )}
          {stepIdx === 0 && (
            <div className="h-full flex items-center justify-center text-[11px] text-zinc-400">
              Credentials travel over HTTPS — no token yet
            </div>
          )}
        </div>
      </div>

      <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/30 min-h-[52px]">
        <div className="flex gap-1.5 flex-1">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all duration-500",
                i === stepIdx ? "bg-blue-500 w-6" : i < stepIdx ? "bg-blue-300 dark:bg-blue-700 w-3" : "bg-zinc-200 dark:bg-zinc-700 w-3"
              )}
            />
          ))}
        </div>
        <span className="text-sm text-zinc-500 dark:text-zinc-400 shrink-0 hidden sm:inline">{step.label}</span>
        {interactive && (
          !isLastStep ? (
            <button
              type="button"
              onClick={() => setStepIdx((s) => Math.min(STEPS.length - 1, s + 1))}
              className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-all duration-500 flex items-center gap-1 shrink-0"
            >
              Next <ArrowRight className="size-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setStepIdx(0)}
              className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-all duration-500 flex items-center gap-1 shrink-0"
            >
              <CheckCircle2 className="size-3.5" /> Restart
            </button>
          )
        )}
      </div>
    </div>
  );
}
