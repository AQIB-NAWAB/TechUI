"use client";

import { useState } from "react";
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
  "Browser":      { icon: <Monitor className="size-4" />,  label: "Browser"      },
  "Auth Server":  { icon: <Shield className="size-4" />,   label: "Auth Server"  },
  "Your App":     { icon: <Server className="size-4" />,   label: "Your App"     },
  "Resource API": { icon: <Database className="size-4" />, label: "Resource API" },
};

const ACTORS: Record<string, string[]> = {
  authorization_code: ["Browser", "Auth Server", "Your App", "Resource API"],
  client_credentials: ["Your App", "Auth Server", "Resource API"],
  implicit:           ["Browser", "Auth Server", "Resource API"],
};

export function OAuthFlow({
  grant = "authorization_code",
  scopes = ["openid", "profile", "email"],
  pkce = true,
}: OAuthFlowProps) {
  const steps = grant === "client_credentials" ? CLIENT_CREDS_STEPS : AUTHCODE_STEPS;
  const actors = ACTORS[grant] ?? ACTORS.authorization_code;

  const [activeStep, setActiveStep] = useState(0);
  const step = steps[activeStep]!;

  const fromIdx = actors.indexOf(step.from);
  const toIdx = actors.indexOf(step.to);
  const isForward = toIdx > fromIdx;
  const leftPct = (Math.min(fromIdx, toIdx) / actors.length) * 100 + 100 / actors.length / 2;
  const widthPct = (Math.abs(toIdx - fromIdx) / actors.length) * 100;

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden text-sm">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-900">
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

      {/* Participant boxes — always visible */}
      <div className="grid border-b border-zinc-100 dark:border-zinc-900" style={{ gridTemplateColumns: `repeat(${actors.length}, 1fr)` }}>
        {actors.map((actor) => {
          const cfg = ACTOR_CFG[actor];
          const isActive = actor === step.from || actor === step.to;
          return (
            <div
              key={actor}
              className={cn(
                "flex flex-col items-center gap-1 px-2 py-3 border-r last:border-r-0 border-zinc-100 dark:border-zinc-900 transition-all duration-500",
                isActive ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20" : "text-zinc-400 dark:text-zinc-500"
              )}
            >
              {cfg?.icon ?? null}
              <span className="text-[10px] font-semibold text-center leading-tight">{cfg?.label ?? actor}</span>
            </div>
          );
        })}
      </div>

      {/* Arrow area — fixed height */}
      <div className="min-h-[420px] flex flex-col">
        <div className="px-4 py-5 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/40 dark:bg-zinc-900/20">
          {/* Arrow */}
          <div className="relative h-8 flex items-center">
            {/* Lane lines */}
            <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${actors.length}, 1fr)` }}>
              {actors.map((a, i) => (
                <div key={a} className={cn(
                  "border-r border-dashed border-zinc-200 dark:border-zinc-800 last:border-r-0",
                  i === 0 && "border-l border-dashed border-zinc-200 dark:border-zinc-800"
                )} />
              ))}
            </div>

            {/* Animated arrow line */}
            <div
              className="absolute top-1/2 -translate-y-1/2 transition-all duration-500"
              style={{ left: `${leftPct}%`, width: `${widthPct}%`, transform: isForward ? "translateY(-50%)" : "translateY(-50%) scaleX(-1)" }}
            >
              <div className="flex items-center w-full">
                {!isForward && (
                  <svg width="6" height="8" viewBox="0 0 6 8" className="text-blue-500 shrink-0">
                    <path d="M6 0 L0 4 L6 8" fill="currentColor" />
                  </svg>
                )}
                <div className="flex-1 h-0.5 bg-blue-500 rounded-full" />
                {isForward && (
                  <svg width="6" height="8" viewBox="0 0 6 8" className="text-blue-500 shrink-0">
                    <path d="M0 0 L6 4 L0 8" fill="currentColor" />
                  </svg>
                )}
              </div>
            </div>

            {/* Dots */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 size-2.5 rounded-full bg-blue-500 transition-all duration-500"
              style={{ left: `${(fromIdx / actors.length) * 100 + 100 / actors.length / 2}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 size-2.5 rounded-full bg-blue-500 ring-2 ring-white dark:ring-zinc-950 transition-all duration-500"
              style={{ left: `${(toIdx / actors.length) * 100 + 100 / actors.length / 2}%` }}
            />
          </div>

          {/* Arrow label */}
          <div className="mt-2 text-center transition-all duration-500">
            <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">{step.label}</span>
          </div>
        </div>

        {/* Step explanation — fixed height */}
        <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-900 h-16 flex items-center">
          <p className="text-[12px] text-zinc-600 dark:text-zinc-400 leading-relaxed transition-all duration-500 line-clamp-2">
            {step.detail}
          </p>
        </div>

        {/* Code block — fixed height */}
        {step.code && (
          <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-900 flex-1">
            <pre className="text-[10px] font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-3 text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap h-28 overflow-y-auto transition-all duration-500">
              {step.code}
            </pre>
          </div>
        )}

        {/* Navigation */}
        <div className="px-4 py-3 mt-auto flex items-center gap-3 border-t border-zinc-100 dark:border-zinc-900">
          <div className="flex gap-1.5 flex-1">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveStep(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-500",
                  i === activeStep ? "bg-blue-500 w-6" : "bg-zinc-200 dark:bg-zinc-700 w-1.5 hover:bg-zinc-300 dark:hover:bg-zinc-600"
                )}
              />
            ))}
          </div>
          <span className="text-[11px] text-zinc-400 tabular-nums">Step {activeStep + 1} of {steps.length}</span>
          <button
            onClick={() => setActiveStep((s) => Math.max(0, s - 1))}
            disabled={activeStep === 0}
            className="text-[11px] px-2.5 py-1 rounded border border-zinc-200 dark:border-zinc-800 text-zinc-500 disabled:opacity-30 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-300"
          >
            Back
          </button>
          {activeStep < steps.length - 1 ? (
            <button
              onClick={() => setActiveStep((s) => Math.min(steps.length - 1, s + 1))}
              className="text-[11px] px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all duration-300 flex items-center gap-1"
            >
              Next <ChevronRight className="size-3" />
            </button>
          ) : (
            <button
              onClick={() => setActiveStep(0)}
              className="text-[11px] px-2.5 py-1 rounded bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-medium transition-all duration-300 flex items-center gap-1"
            >
              <Check className="size-3" /> Restart
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
