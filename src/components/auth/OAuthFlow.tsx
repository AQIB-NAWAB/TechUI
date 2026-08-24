"use client";

import { useState, useEffect, useRef } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Monitor, Shield, Server, Database, ChevronRight, Check } from "lucide-react";

export const OAuthFlowSchema = z.object({
  grant: z.enum(["authorization_code", "client_credentials", "implicit"]).default("authorization_code"),
  clientName: z.string().optional().default("My App"),
  providerName: z.string().optional().default("Auth Server"),
  scopes: z.array(z.string()).optional().default(["openid", "profile", "email"]),
  pkce: z.boolean().optional().default(true),
});

export type OAuthFlowProps = z.infer<typeof OAuthFlowSchema>;

type Step = {
  from: string;
  to: string;
  label: string;
  detail: string;
  code?: string;
};

const AUTHCODE_STEPS: Step[] = [
  {
    from: "Browser",
    to: "Auth Server",
    label: "Authorization Request",
    detail: "Your app redirects the browser to the auth server's login page, asking the user to grant permission.",
    code: "GET /authorize\n  ?response_type=code\n  &client_id=my-app\n  &redirect_uri=https://app.com/callback\n  &scope=openid profile email\n  &state=abc123\n  &code_challenge=S256 (PKCE)",
  },
  {
    from: "Auth Server",
    to: "Browser",
    label: "User Authenticates",
    detail: "The user logs in and grants consent. The auth server redirects back to your app with a short-lived authorization code.",
    code: "HTTP 302 → https://app.com/callback\n  ?code=SplxlOBeZQQYbYS6WxSbIA\n  &state=abc123",
  },
  {
    from: "Your App",
    to: "Auth Server",
    label: "Token Exchange",
    detail: "Your app server exchanges the authorization code for tokens. This happens server-side, keeping the client secret safe.",
    code: "POST /token\n  grant_type=authorization_code\n  &code=SplxlOBeZQQYbYS6WxSbIA\n  &redirect_uri=https://app.com/callback\n  &client_id=my-app\n  &client_secret=••••••••\n  &code_verifier=xyz (PKCE)",
  },
  {
    from: "Auth Server",
    to: "Your App",
    label: "Tokens Issued",
    detail: "The auth server returns an access token, refresh token, and ID token. Your app can now call APIs on behalf of the user.",
    code: '{\n  "access_token": "eyJ...",\n  "token_type": "Bearer",\n  "expires_in": 3600,\n  "refresh_token": "xyz...",\n  "id_token": "eyJ..." \n}',
  },
  {
    from: "Your App",
    to: "Resource API",
    label: "API Call",
    detail: "Your app uses the access token to make authorized API requests on behalf of the user.",
    code: "GET /api/user/profile\nAuthorization: Bearer eyJ...",
  },
];

const CLIENT_CREDS_STEPS: Step[] = [
  {
    from: "Your App",
    to: "Auth Server",
    label: "Token Request",
    detail: "Your server authenticates with its own credentials. No user is involved — this is machine-to-machine auth.",
    code: "POST /token\n  grant_type=client_credentials\n  &client_id=my-service\n  &client_secret=••••••••\n  &scope=reports:read",
  },
  {
    from: "Auth Server",
    to: "Your App",
    label: "Access Token",
    detail: "The auth server returns an access token scoped to the service. No refresh token is issued for machine-to-machine auth.",
    code: '{\n  "access_token": "eyJ...",\n  "token_type": "Bearer",\n  "expires_in": 3600\n}',
  },
  {
    from: "Your App",
    to: "Resource API",
    label: "API Call",
    detail: "Your service uses the access token to call the protected resource API.",
    code: "GET /api/reports\nAuthorization: Bearer eyJ...",
  },
];

const ACTOR_CFG: Record<string, { icon: React.ReactNode; label: string }> = {
  Browser:      { icon: <Monitor className="size-5" />,  label: "Browser"      },
  "Auth Server":  { icon: <Shield className="size-5" />,   label: "Auth Server"  },
  "Your App":     { icon: <Server className="size-5" />,   label: "Your App"     },
  "Resource API": { icon: <Database className="size-5" />, label: "Resource API" },
};

const ACTORS: Record<string, string[]> = {
  authorization_code: ["Browser", "Auth Server", "Your App", "Resource API"],
  client_credentials: ["Your App", "Auth Server", "Resource API"],
  implicit:           ["Browser", "Auth Server", "Resource API"],
};

function FlowArrow({
  fromIdx,
  toIdx,
  count,
  stepKey,
}: {
  fromIdx: number;
  toIdx: number;
  count: number;
  stepKey: number;
}) {
  const isForward = toIdx > fromIdx;
  const leftPct = (Math.min(fromIdx, toIdx) / count) * 100 + 100 / count / 2;
  const widthPct = (Math.abs(toIdx - fromIdx) / count) * 100;

  return (
    <div
      className="absolute top-1/2 -translate-y-1/2 transition-all duration-700"
      style={{
        left: `${leftPct}%`,
        width: `${widthPct}%`,
        transform: isForward ? "translateY(-50%)" : "translateY(-50%) scaleX(-1)",
      }}
    >
      <svg width="100%" height="8" viewBox="0 0 100 8" preserveAspectRatio="none" className="overflow-visible">
        <line
          key={stepKey}
          x1="0"
          y1="4"
          x2="92"
          y2="4"
          stroke="currentColor"
          strokeWidth="2"
          className="text-blue-500"
          strokeDasharray="100"
          strokeDashoffset="100"
          style={{ animation: "oauth-draw 800ms ease-out forwards" }}
        />
        <polygon points="92,0 100,4 92,8" className="fill-blue-500" />
      </svg>
      <style jsx>{`
        @keyframes oauth-draw {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
}

export function OAuthFlow({
  grant = "authorization_code",
  scopes = ["openid", "profile", "email"],
  pkce = true,
}: OAuthFlowProps) {
  const steps = grant === "client_credentials" ? CLIENT_CREDS_STEPS : AUTHCODE_STEPS;
  const actors = ACTORS[grant] ?? ACTORS.authorization_code;

  const [activeStep, setActiveStep] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const step = steps[activeStep]!;
  const fromIdx = actors.indexOf(step.from);
  const toIdx = actors.indexOf(step.to);

  useEffect(() => {
    if (!autoPlay) return;
    timerRef.current = setTimeout(() => {
      setActiveStep((s) => (s < steps.length - 1 ? s + 1 : 0));
    }, 1500);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [activeStep, autoPlay, steps.length]);

  useEffect(() => {
    setActiveStep(0);
    setAutoPlay(false);
  }, [grant]);

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden text-sm">

      <div className="flex items-center justify-between h-12 px-4 border-b border-zinc-100 dark:border-zinc-800">
        <div>
          <span className="font-semibold text-zinc-800 dark:text-zinc-200">OAuth 2.0</span>
          <span className="ml-2 text-[11px] text-zinc-400 font-mono">
            {grant === "authorization_code" ? "Authorization Code" + (pkce ? " + PKCE" : "") :
             grant === "client_credentials" ? "Client Credentials" : "Implicit"}
          </span>
        </div>
        <div className="flex gap-1">
          {scopes.map((s) => (
            <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 font-mono">
              {s}
            </span>
          ))}
        </div>
      </div>

      <div className="grid border-b border-zinc-100 dark:border-zinc-800" style={{ gridTemplateColumns: `repeat(${actors.length}, 1fr)` }}>
        {actors.map((actor) => {
          const cfg = ACTOR_CFG[actor];
          const isActive = actor === step.from || actor === step.to;
          return (
            <div
              key={actor}
              className={cn(
                "flex flex-col items-center gap-1.5 px-2 py-3 border-r last:border-r-0 border-zinc-100 dark:border-zinc-800 transition-all duration-500",
                isActive ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20" : "text-zinc-400 dark:text-zinc-500"
              )}
            >
              {cfg?.icon ?? null}
              <span className="text-[10px] font-semibold text-center leading-tight">{cfg?.label ?? actor}</span>
            </div>
          );
        })}
      </div>

      <div className="min-h-[420px] flex flex-col">
        <div className="px-4 py-5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-800/50">
          <div className="relative h-10 flex items-center">
            <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${actors.length}, 1fr)` }}>
              {actors.map((a, i) => (
                <div key={a} className={cn(
                  "border-r border-dashed border-zinc-200 dark:border-zinc-700 last:border-r-0",
                  i === 0 && "border-l border-dashed border-zinc-200 dark:border-zinc-700"
                )} />
              ))}
            </div>

            <FlowArrow fromIdx={fromIdx} toIdx={toIdx} count={actors.length} stepKey={activeStep} />

            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 size-2.5 rounded-full bg-blue-500 transition-all duration-700"
              style={{ left: `${(fromIdx / actors.length) * 100 + 100 / actors.length / 2}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 size-2.5 rounded-full bg-blue-500 ring-2 ring-white dark:ring-zinc-900 transition-all duration-700"
              style={{ left: `${(toIdx / actors.length) * 100 + 100 / actors.length / 2}%` }}
            />
          </div>

          <div className="mt-2 text-center transition-opacity duration-500">
            <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">{step.label}</span>
          </div>
        </div>

        <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 flex-1 flex flex-col min-h-0">
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed transition-opacity duration-500 mb-3">
            {step.detail}
          </p>
          <div className="border border-zinc-100 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 p-3 flex-1 min-h-0">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2">
              Request / Response
            </div>
            <pre className="text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800 rounded-md px-2.5 py-2 text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap h-28 overflow-y-auto transition-opacity duration-500">
              {step.code ?? "// No payload for this step"}
            </pre>
          </div>
        </div>

        <div className="px-4 py-3 mt-auto flex items-center gap-3 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex gap-2 flex-1 items-center">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => { setAutoPlay(false); setActiveStep(i); }}
                className={cn(
                  "size-2 rounded-full transition-all duration-500",
                  i === activeStep
                    ? "bg-blue-500 scale-125"
                    : i < activeStep
                      ? "bg-blue-300 dark:bg-blue-700 hover:bg-blue-400"
                      : "bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600"
                )}
                aria-label={`Step ${i + 1}`}
              />
            ))}
          </div>
          <button
            onClick={() => setAutoPlay((v) => !v)}
            className={cn(
              "text-[11px] px-2.5 py-1 rounded font-medium transition-all duration-500",
              autoPlay
                ? "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
                : "border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-600"
            )}
          >
            {autoPlay ? "Pause" : "Auto-play"}
          </button>
          <span className="text-[11px] text-zinc-400 tabular-nums">Step {activeStep + 1} of {steps.length}</span>
          <button
            onClick={() => { setAutoPlay(false); setActiveStep((s) => Math.max(0, s - 1)); }}
            disabled={activeStep === 0}
            className="text-[11px] px-2.5 py-1 rounded border border-zinc-200 dark:border-zinc-800 text-zinc-500 disabled:opacity-30 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-500"
          >
            Back
          </button>
          {activeStep < steps.length - 1 ? (
            <button
              onClick={() => { setAutoPlay(false); setActiveStep((s) => Math.min(steps.length - 1, s + 1)); }}
              className="text-[11px] px-2.5 py-1 rounded bg-zinc-900 dark:bg-white hover:opacity-90 text-white dark:text-zinc-900 font-semibold transition-all duration-500 flex items-center gap-1"
            >
              Next <ChevronRight className="size-3" />
            </button>
          ) : (
            <button
              onClick={() => { setAutoPlay(false); setActiveStep(0); }}
              className="text-[11px] px-2.5 py-1 rounded bg-zinc-900 dark:bg-white hover:opacity-90 text-white dark:text-zinc-900 font-semibold transition-all duration-500 flex items-center gap-1"
            >
              <Check className="size-3" /> Restart
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
