"use client";

import { useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { RefreshCw } from "lucide-react";

export const JwtRefreshSchema = z.object({
  accessTokenTtl: z.number().default(15),
  refreshTokenTtl: z.number().default(7),
  scenario: z.enum(["normal", "expired", "refresh", "revoked"]).default("normal"),
});

export type JwtRefreshProps = z.infer<typeof JwtRefreshSchema>;

type Step = {
  label: string;
  detail: string;
  code?: string;
  status?: "ok" | "error" | "info" | "warn";
};

const SCENARIOS: Record<string, { title: string; steps: Step[] }> = {
  normal: {
    title: "Normal Flow",
    steps: [
      {
        label: "1. Login → Server issues tokens",
        detail: "User authenticates. Server issues short-lived access token and long-lived refresh token.",
        code: "POST /auth/login\n← 200 OK\n  access_token:  eyJ... (15 min)\n  refresh_token: xyz... (7 days)",
        status: "ok",
      },
      {
        label: "2. API request with valid access token",
        detail: "Client sends the access token on each request. Server validates and responds.",
        code: "GET /api/profile\nAuthorization: Bearer eyJ...\n← 200 OK  { name: 'Alice', ... }",
        status: "ok",
      },
      {
        label: "3. Both tokens remain valid",
        detail: "Access token has 14 min remaining. No refresh needed yet.",
        code: "// Token status\naccess_token:  valid (14 min remaining)\nrefresh_token: valid (6d 23h remaining)",
        status: "info",
      },
    ],
  },
  expired: {
    title: "Token Expired",
    steps: [
      {
        label: "1. Access token expires",
        detail: "After 15 minutes, the access token is no longer valid. Server will reject it.",
        code: "// Access token has expired!\naccess_token:  EXPIRED\nrefresh_token: valid (6d remaining)",
        status: "warn",
      },
      {
        label: "2. API request fails with 401",
        detail: "Client tries to use the expired access token. Server returns 401 Unauthorized.",
        code: "GET /api/profile\nAuthorization: Bearer eyJ... (expired)\n← 401 Unauthorized\n  { error: 'token_expired' }",
        status: "error",
      },
      {
        label: "3. Silent refresh — get new access token",
        detail: "Client automatically calls /auth/refresh with the refresh token to get a new access token.",
        code: "POST /auth/refresh\n  { refreshToken: 'xyz...' }\n← 200 OK\n  access_token: eyJ... (NEW, 15 min)\n  (old token invalidated)",
        status: "ok",
      },
      {
        label: "4. Retry original request — success",
        detail: "Client retries the original request with the new access token. It succeeds transparently.",
        code: "GET /api/profile\nAuthorization: Bearer eyJ... (new)\n← 200 OK  { name: 'Alice', ... }",
        status: "ok",
      },
    ],
  },
  refresh: {
    title: "Refresh Flow",
    steps: [
      {
        label: "1. Client detects expiring access token",
        detail: "Client proactively checks token expiry. Access token will expire soon.",
        code: "// Proactive check\nconst exp = decodeJwt(accessToken).exp;\nconst remaining = exp - Date.now() / 1000;\n// remaining = 45 seconds — refresh now!",
        status: "warn",
      },
      {
        label: "2. POST /auth/refresh",
        detail: "Client sends refresh token to the token endpoint. This is a server-side request.",
        code: "POST /auth/refresh\nContent-Type: application/json\n\n{ \"refreshToken\": \"xyz_abc_123...\" }",
        status: "info",
      },
      {
        label: "3. Server rotates tokens",
        detail: "Server invalidates old refresh token and issues new access + refresh tokens (rotation).",
        code: "// Server:\n// 1. Validate refresh token\n// 2. Check not revoked\n// 3. Issue new tokens\n// 4. Revoke old refresh token",
        status: "info",
      },
      {
        label: "4. New tokens returned",
        detail: "Client receives fresh tokens. Old refresh token is now invalid (rotation prevents reuse).",
        code: "← 200 OK\n{\n  access_token:  eyJ... (15 min)\n  refresh_token: new_xyz... (7 days)\n  token_type: 'Bearer'\n}",
        status: "ok",
      },
    ],
  },
  revoked: {
    title: "Revoked (Logout)",
    steps: [
      {
        label: "1. User logs out — revoke refresh token",
        detail: "On logout, client calls /auth/logout. Server invalidates the refresh token in the database.",
        code: "POST /auth/logout\nAuthorization: Bearer eyJ...\n  { refreshToken: 'xyz...' }\n← 200 OK  { message: 'Logged out' }",
        status: "ok",
      },
      {
        label: "2. Access token expires (15 min)",
        detail: "The short-lived access token eventually expires. Client tries a silent refresh.",
        code: "// Access token expired\n// Client attempts silent refresh...\nPOST /auth/refresh\n  { refreshToken: 'xyz...' }",
        status: "warn",
      },
      {
        label: "3. Refresh token rejected — 401",
        detail: "Server looks up the refresh token in the revocation store — it was invalidated on logout.",
        code: "← 401 Unauthorized\n{\n  error: 'refresh_token_revoked',\n  message: 'Token has been revoked'\n}",
        status: "error",
      },
      {
        label: "4. User must log in again",
        detail: "Both tokens are now invalid. The user must re-authenticate to get new tokens.",
        code: "// Client redirects to login\nwindow.location.href = '/login';\n// User must enter credentials again",
        status: "error",
      },
    ],
  },
};

function TokenBar({
  label,
  ttl,
  unit,
  color,
  pct,
}: {
  label: string;
  ttl: number;
  unit: string;
  color: string;
  pct: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-zinc-500 dark:text-zinc-400 w-28 shrink-0">{label}</span>
      <div className="flex-1 h-3 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 w-16 shrink-0 text-right">
        {ttl} {unit}
      </span>
    </div>
  );
}

export function JwtRefresh({
  accessTokenTtl = 15,
  refreshTokenTtl = 7,
  scenario: initialScenario = "normal",
}: JwtRefreshProps) {
  const [scenario, setScenario] = useState<"normal" | "expired" | "refresh" | "revoked">(initialScenario);
  const [step, setStep] = useState(0);

  function changeScenario(s: typeof scenario) {
    setScenario(s);
    setStep(0);
  }

  function next() {
    const maxSteps = SCENARIOS[scenario].steps.length;
    setStep((prev) => Math.min(prev + 1, maxSteps - 1));
  }

  const scenarioData = SCENARIOS[scenario];
  const steps = scenarioData.steps;
  const currentStep = steps[step];

  const STATUS_STYLE: Record<string, string> = {
    ok:    "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20",
    error: "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20",
    warn:  "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20",
    info:  "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20",
  };

  const STATUS_DOT: Record<string, string> = {
    ok:    "bg-emerald-500",
    error: "bg-red-500",
    warn:  "bg-amber-500",
    info:  "bg-blue-500",
  };

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="h-12 px-4 flex items-center gap-2.5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
        <RefreshCw className="size-3.5 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex-1">JWT Token Refresh</span>
        <span className="text-[10px] text-zinc-400">
          Access: {accessTokenTtl}min · Refresh: {refreshTokenTtl}d
        </span>
      </div>

      {/* Scenario tabs */}
      <div className="flex border-b border-zinc-100 dark:border-zinc-800 overflow-x-auto">
        {(["normal", "expired", "refresh", "revoked"] as const).map((s) => (
          <button
            key={s}
            onClick={() => changeScenario(s)}
            className={cn(
              "px-3 py-2 text-xs font-semibold whitespace-nowrap transition-all duration-500 capitalize",
              scenario === s
                ? "border-b-2 border-zinc-900 dark:border-white text-zinc-900 dark:text-white"
                : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            )}
          >
            {s === "normal" ? "Normal" : s === "expired" ? "Expired" : s === "refresh" ? "Refresh" : "Revoked"}
          </button>
        ))}
      </div>

      <div className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        Short-lived access tokens limit damage; refresh tokens keep users signed in.
      </div>

      <div className="min-h-[300px] p-4 space-y-4">
        {/* Token bars */}
        <div className="space-y-2">
          <TokenBar
            label={`Access Token`}
            ttl={accessTokenTtl}
            unit="min"
            color={
              scenario === "expired" && step >= 1
                ? "bg-red-400 dark:bg-red-500"
                : "bg-blue-400 dark:bg-blue-500"
            }
            pct={
              scenario === "expired" && step >= 1
                ? 0
                : scenario === "revoked" && step >= 2
                ? 0
                : 35
            }
          />
          <TokenBar
            label={`Refresh Token`}
            ttl={refreshTokenTtl}
            unit="days"
            color={
              scenario === "revoked" && step >= 2
                ? "bg-red-400 dark:bg-red-500"
                : "bg-emerald-400 dark:bg-emerald-500"
            }
            pct={
              scenario === "revoked" && step >= 2 ? 0 : 85
            }
          />
        </div>

        {/* Step progress */}
        <div className="flex items-center gap-1">
          {steps.map((s, i) => (
            <div
              key={i}
              className={cn(
                "flex-1 h-1 rounded-full transition-all duration-500",
                i <= step
                  ? s.status === "error" ? "bg-red-400" : s.status === "warn" ? "bg-amber-400" : "bg-blue-400"
                  : "bg-zinc-100 dark:bg-zinc-800"
              )}
            />
          ))}
        </div>

        {/* Current step — fixed height */}
        <div
          className={cn(
            "rounded-lg border px-3 py-3 space-y-2 transition-all duration-500 min-h-[160px]",
            currentStep.status ? STATUS_STYLE[currentStep.status] : STATUS_STYLE.info
          )}
        >
          <div className="flex items-center gap-2">
            <div className={cn("size-2 rounded-full shrink-0", currentStep.status ? STATUS_DOT[currentStep.status] : "bg-blue-500")} />
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{currentStep.label}</span>
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 pl-4">{currentStep.detail}</p>
          <pre className="text-[10px] font-mono bg-zinc-900 dark:bg-zinc-950 text-zinc-200 rounded p-2 overflow-y-auto leading-relaxed ml-4 h-20">
            {currentStep.code ?? "// waiting…"}
          </pre>
        </div>
      </div>

      <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
        <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">
          Step {step + 1} of {steps.length} · {scenarioData.title}
        </span>
        <button
          onClick={next}
          disabled={step >= steps.length - 1}
          className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          Next Step →
        </button>
      </div>
    </div>
  );
}
