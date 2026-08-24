"use client";

import { useState, useEffect, useRef } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Shield, Monitor, Server, Key, RefreshCw, ArrowRight, CheckCircle } from "lucide-react";

export const OAuth2PkceFlowSchema = z.object({
  title: z.string().optional().default("OAuth 2.0 PKCE Flow"),
  clientName: z.string().optional().default("Mobile App"),
  authServer: z.string().optional().default("auth.example.com"),
  redirectUri: z.string().optional().default("myapp://callback"),
  interactive: z.boolean().optional().default(true),
});

export type OAuth2PkceFlowProps = z.infer<typeof OAuth2PkceFlowSchema>;

type Step = {
  id: number;
  title: string;
  actor: "client" | "browser" | "auth";
  description: string;
  detail: string;
  highlight?: "verifier" | "challenge" | "code" | "token";
};

const STEPS: Step[] = [
  {
    id: 1,
    title: "Generate PKCE secrets",
    actor: "client",
    description: "The app creates a random code_verifier and hashes it into a code_challenge before login starts.",
    detail: "code_verifier = random 43–128 chars\ncode_challenge = BASE64URL(SHA256(verifier))",
    highlight: "verifier",
  },
  {
    id: 2,
    title: "Authorization redirect",
    actor: "browser",
    description: "The browser opens the auth server with the challenge — the verifier never leaves the app yet.",
    detail: "GET /authorize\n  ?response_type=code\n  &client_id=mobile-app\n  &redirect_uri=myapp://callback\n  &code_challenge=S256:E9Mel...xR\n  &code_challenge_method=S256",
    highlight: "challenge",
  },
  {
    id: 3,
    title: "User logs in",
    actor: "auth",
    description: "The user authenticates and approves scopes. The auth server stores the challenge with the session.",
    detail: "Session stores:\n  code_challenge = E9Mel...xR\n  method = S256\n\nUser grants: openid profile",
  },
  {
    id: 4,
    title: "Auth code returned",
    actor: "browser",
    description: "The auth server redirects back with a short-lived authorization code — useless without the verifier.",
    detail: "302 → myapp://callback\n  ?code=SplxlOBeZQQYbYS6WxSbIA\n  &state=abc123",
    highlight: "code",
  },
  {
    id: 5,
    title: "Token exchange + verify",
    actor: "client",
    description: "The app sends the code plus the original code_verifier. The server re-hashes and must match the challenge.",
    detail: "POST /token\n  grant_type=authorization_code\n  &code=SplxlOBeZQQYbYS6WxSbIA\n  &code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk\n  &redirect_uri=myapp://callback",
    highlight: "verifier",
  },
  {
    id: 6,
    title: "Access token issued",
    actor: "auth",
    description: "Challenge verified — the server returns tokens. Intercepting the auth code alone is not enough to steal a session.",
    detail: '{\n  "access_token": "eyJhbG...",\n  "token_type": "Bearer",\n  "expires_in": 3600,\n  "refresh_token": "def502..."\n}',
    highlight: "token",
  },
];

const ACTOR_LABEL = {
  client: "App",
  browser: "Browser",
  auth: "Auth Server",
};

export function OAuth2PkceFlow({
  title = "OAuth 2.0 PKCE Flow",
  clientName = "Mobile App",
  authServer = "auth.example.com",
  redirectUri = "myapp://callback",
  interactive = true,
}: OAuth2PkceFlowProps) {
  const [step, setStep] = useState(-1);
  const [running, setRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const current = step >= 0 ? STEPS[step] : null;
  const done = step >= STEPS.length - 1;
  const progress = step < 0 ? 0 : ((step + 1) / STEPS.length) * 100;

  function reset() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setStep(-1);
    setRunning(false);
  }

  function handlePrimary() {
    if (running) return;
    setStep(-1);
    setRunning(true);
  }

  useEffect(() => {
    if (!running) return;
    if (step >= STEPS.length - 1) {
      setRunning(false);
      return;
    }
    timerRef.current = setTimeout(() => setStep((s) => s + 1), 1200);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [running, step]);

  const statusText =
    step < 0
      ? "PKCE lets public clients (mobile/SPA) log in safely — the auth code alone cannot be exchanged without the secret verifier."
      : done
        ? "PKCE verified — even if someone steals the auth code, they cannot get tokens without the original code_verifier."
        : current?.description ?? "Stepping through the PKCE flow…";

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <Shield className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">{title}</span>
        <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">PKCE</span>
        {interactive && (
          <button
            type="button"
            onClick={reset}
            className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all duration-500"
          >
            <RefreshCw className="size-3.5" />
          </button>
        )}
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        PKCE adds a secret handshake for mobile and browser apps — stealing the auth code alone is not enough to get tokens.
      </p>

      <div className="p-4 min-h-[280px] flex flex-col">
        {/* Flow actors */}
        <div className="flex items-center justify-between mb-4 px-2">
          {[
            { key: "client", label: clientName, icon: Monitor },
            { key: "browser", label: "Browser", icon: Monitor },
            { key: "auth", label: authServer, icon: Server },
          ].map((actor, i, arr) => {
            const active = current?.actor === actor.key;
            const past = step >= 0 && STEPS[step].id > (i === 0 ? 0 : i === 1 ? 1 : 2);
            const Icon = actor.icon;
            return (
              <div key={actor.key} className="flex items-center flex-1">
                <div
                  className={cn(
                    "flex flex-col items-center gap-1 transition-all duration-500",
                    active ? "scale-105" : "scale-100"
                  )}
                >
                  <div
                    className={cn(
                      "size-10 rounded-lg flex items-center justify-center border-2 transition-all duration-500",
                      active
                        ? "border-blue-400 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
                        : past
                          ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400"
                          : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-400"
                    )}
                  >
                    <Icon className="size-5" />
                  </div>
                  <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 max-w-[72px] truncate text-center">
                    {actor.label}
                  </span>
                </div>
                {i < arr.length - 1 && (
                  <ArrowRight className="size-4 text-zinc-300 dark:text-zinc-600 mx-1 shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        {/* PKCE secrets panel */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div
            className={cn(
              "rounded-lg border p-3 transition-all duration-500",
              current?.highlight === "verifier"
                ? "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/30"
                : "border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50"
            )}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Key className="size-3 text-zinc-400" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">code_verifier</span>
            </div>
            <div className="font-mono text-[10px] text-zinc-600 dark:text-zinc-300 break-all">
              dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk
            </div>
            <div className="text-[10px] text-zinc-400 mt-1">Stays in app — never sent in redirect</div>
          </div>
          <div
            className={cn(
              "rounded-lg border p-3 transition-all duration-500",
              current?.highlight === "challenge"
                ? "border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30"
                : "border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50"
            )}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Shield className="size-3 text-zinc-400" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">code_challenge</span>
            </div>
            <div className="font-mono text-[10px] text-zinc-600 dark:text-zinc-300 break-all">
              S256:E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
            </div>
            <div className="text-[10px] text-zinc-400 mt-1">SHA-256 hash sent in /authorize</div>
          </div>
        </div>

        {/* Current step */}
        <div className="min-h-[88px]">
          {current ? (
            <div
              className={cn(
                "rounded-lg border p-3 transition-all duration-500",
                done
                  ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30"
                  : "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20"
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                {done ? (
                  <CheckCircle className="size-4 text-emerald-500 shrink-0" />
                ) : (
                  <span className="text-[10px] font-mono text-zinc-400">Step {current.id}/{STEPS.length}</span>
                )}
                <span className="text-sm font-bold text-zinc-700 dark:text-zinc-200">{current.title}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-mono">
                  {ACTOR_LABEL[current.actor]}
                </span>
              </div>
              <pre className="text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800 rounded-md px-2.5 py-1.5 text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed mt-2">
                {current.detail.replace("myapp://callback", redirectUri)}
              </pre>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-zinc-200 dark:border-zinc-700 p-6 text-center text-sm text-zinc-400 min-h-[88px] flex items-center justify-center">
              Click Run Flow to watch how PKCE protects a public client login
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-[10px] mb-1">
            <span className="text-zinc-400">Flow progress</span>
            <span className="font-mono font-semibold text-zinc-500">{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                done ? "bg-emerald-500" : "bg-blue-500"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {interactive && (
        <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/30 min-h-[52px]">
          <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">{statusText}</span>
          <button
            type="button"
            onClick={handlePrimary}
            disabled={running}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 transition-all duration-500 hover:opacity-90 shrink-0 disabled:opacity-50"
          >
            {running ? "Running…" : done ? "Run Again" : "Run Flow"}
          </button>
        </div>
      )}
    </div>
  );
}
