"use client";

import { z } from "zod";
import { useState, useEffect } from "react";
import { Key, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const ScopeSchema = z.object({
  scope: z.string(),
  description: z.string(),
  sensitivity: z.enum(["low", "medium", "high"]),
  granted: z.boolean().optional().default(false),
});

export const OAuthScopesSchema = z.object({
  appName: z.string().default("FreshMarket"),
  provider: z.string().default("Google"),
  requestedScopes: z.array(ScopeSchema).default([
    { scope: "openid",           description: "Verify your identity",                      sensitivity: "low",    granted: true  },
    { scope: "email",            description: "See your email address",                     sensitivity: "low",    granted: true  },
    { scope: "profile",          description: "See your name and profile picture",          sensitivity: "low",    granted: true  },
    { scope: "drive.readonly",   description: "Read your Google Drive files",               sensitivity: "high",   granted: false },
    { scope: "contacts.read",    description: "Read your Google Contacts",                  sensitivity: "medium", granted: false },
    { scope: "calendar.events",  description: "Create and edit Google Calendar events",     sensitivity: "medium", granted: false },
  ]),
});

export type OAuthScopesProps = z.infer<typeof OAuthScopesSchema>;

const SENSITIVITY_CFG = {
  low:    { badge: "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800", label: "low" },
  medium: { badge: "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",           label: "med" },
  high:   { badge: "bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",                       label: "HIGH" },
};

export function OAuthScopes({
  appName = "FreshMarket",
  provider = "Google",
  requestedScopes = [],
}: OAuthScopesProps) {
  const [scopes, setScopes] = useState(requestedScopes.map(s => ({ ...s, granted: s.granted ?? false })));
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setScopes(requestedScopes.map(s => ({ ...s, granted: s.granted ?? false })));
    setSuccess(false);
  }, [requestedScopes]);

  function toggle(idx: number) {
    setScopes(prev => prev.map((s, i) => i === idx ? { ...s, granted: !s.granted } : s));
    setSuccess(false);
  }

  function denyAll() {
    setScopes(prev => prev.map(s => ({ ...s, granted: false })));
    setSuccess(false);
  }

  function grantSelected() {
    setSuccess(true);
  }

  const grantedScopes = scopes.filter(s => s.granted).map(s => s.scope);
  const tokenScope = grantedScopes.join(" ");
  const anyGranted = grantedScopes.length > 0;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="h-12 px-4 flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800">
        <Key className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex-1">OAuth Scopes</span>
      </div>

      <div className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        Shows which permissions an app is asking for so you can grant only what it needs.
      </div>

      {/* Body */}
      <div className="px-4 py-4 min-h-[300px] flex flex-col gap-3">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          <span className="font-bold text-zinc-900 dark:text-zinc-100">{appName}</span> wants access to your{" "}
          <span className="font-bold text-zinc-900 dark:text-zinc-100">{provider}</span> account
        </p>

        <div className="flex flex-col gap-1.5 flex-1">
          {scopes.map((scope, i) => {
            const cfg = SENSITIVITY_CFG[scope.sensitivity];
            return (
              <button
                key={scope.scope}
                onClick={() => toggle(i)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg border text-left transition-all duration-500 w-full",
                  scope.granted
                    ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20"
                    : "border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                )}
              >
                {/* Checkbox */}
                <div className={cn(
                  "w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all duration-500",
                  scope.granted
                    ? "bg-emerald-500 border-emerald-500"
                    : "border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900"
                )}>
                  {scope.granted && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                </div>
                {/* Scope name */}
                <span className="font-mono text-xs font-semibold text-zinc-700 dark:text-zinc-300 w-32 shrink-0">
                  {scope.scope}
                </span>
                {/* Description */}
                <span className="text-xs text-zinc-500 dark:text-zinc-400 flex-1">
                  {scope.description}
                </span>
                {/* Sensitivity badge */}
                <span className={cn(
                  "text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0",
                  cfg.badge
                )}>
                  {cfg.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 px-3 py-2 min-h-[44px]">
          <p className="text-[10px] text-zinc-400 uppercase tracking-wide font-semibold mb-1">Token scope string</p>
          <p className={cn("font-mono text-xs break-all transition-all duration-500", anyGranted ? "text-zinc-700 dark:text-zinc-300" : "text-zinc-400")}>
            {anyGranted ? tokenScope : "Select scopes above to preview"}
          </p>
        </div>
      </div>

      <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-3">
        <button
          onClick={denyAll}
          className="text-xs font-semibold text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-all duration-500"
        >
          Deny all
        </button>
        <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1 text-center">
          {success ? `${grantedScopes.length} scope(s) granted` : "Only grant what the app needs"}
        </span>
        <button
          onClick={grantSelected}
          disabled={!anyGranted}
          className={cn(
            "rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-500 shrink-0",
            success
              ? "bg-emerald-500 text-white"
              : "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 disabled:opacity-40"
          )}
        >
          {success ? "Access Granted ✓" : "Grant Selected"}
        </button>
      </div>
    </div>
  );
}
