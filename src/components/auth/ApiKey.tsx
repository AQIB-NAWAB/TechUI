"use client";

import { useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, Copy, Check, Key, AlertTriangle } from "lucide-react";

export const ApiKeySchema = z.object({
  name: z.string().optional().default("Production API Key"),
  prefix: z.string().optional().default("sk_live"),
  maskedValue: z.string().optional().default("•••••••••••••••••••••••••••••••"),
  revealedValue: z.string().optional(),
  created: z.string().optional().default("2026-01-15"),
  lastUsed: z.string().optional().default("2 minutes ago"),
  expires: z.string().optional(),
  environment: z.enum(["production", "staging", "development", "test"]).optional().default("production"),
  scopes: z.array(z.string()).optional().default(["read:users", "write:orders", "read:products"]),
  status: z.enum(["active", "revoked", "expired"]).optional().default("active"),
  allowedIps: z.array(z.string()).optional(),
});

export type ApiKeyProps = z.infer<typeof ApiKeySchema>;

const ENV_CFG = {
  production:  { label: "prod",  cls: "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800"         },
  staging:     { label: "stage", cls: "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800" },
  development: { label: "dev",   cls: "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800"       },
  test:        { label: "test",  cls: "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700"           },
};

const STATUS_CFG = {
  active:  { dot: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400", label: "Active"  },
  revoked: { dot: "bg-red-500",     text: "text-red-600 dark:text-red-400",         label: "Revoked" },
  expired: { dot: "bg-zinc-400",    text: "text-zinc-500 dark:text-zinc-500",       label: "Expired" },
};

export function ApiKey({
  name = "Production API Key",
  prefix = "sk_live",
  maskedValue = "•••••••••••••••••••••••••••••••",
  revealedValue = "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
  created = "2026-01-15",
  lastUsed = "2 minutes ago",
  expires,
  environment = "production",
  scopes = ["read:users", "write:orders", "read:products"],
  status = "active",
}: ApiKeyProps) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const displayValue = revealed
    ? `${prefix}_${revealedValue}`
    : `${prefix}_${maskedValue}`;

  function copy() {
    const val = revealed ? `${prefix}_${revealedValue}` : `${prefix}_${maskedValue}`;
    navigator.clipboard.writeText(val);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const envCfg = ENV_CFG[environment];
  const statusCfg = STATUS_CFG[status];

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="h-12 px-4 flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800">
        <Key className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex-1">{name}</span>
        <div className="flex items-center gap-1.5">
          <span className={cn("size-1.5 rounded-full", statusCfg.dot)} />
          <span className={cn("text-[10px] font-semibold", statusCfg.text)}>{statusCfg.label}</span>
        </div>
      </div>

      <div className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        API keys authenticate machine-to-machine requests — treat them like passwords.
      </div>

      <div className="min-h-[220px] p-4 space-y-3">
        <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900 rounded-lg px-3 py-4 border border-zinc-200 dark:border-zinc-800 min-h-[56px]">
          <code className="flex-1 text-sm font-mono text-zinc-700 dark:text-zinc-300 truncate">
            {displayValue}
          </code>
          <button
            onClick={copy}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all duration-500 shrink-0 p-1"
            title="Copy key"
          >
            {copied ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn("text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wide", envCfg.cls)}>
            {envCfg.label}
          </span>
          <span className="text-[10px] text-zinc-400 font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-2.5 py-1 rounded-full">
            Created {created}
          </span>
          <span className="text-[10px] text-zinc-400 font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-2.5 py-1 rounded-full">
            Last used {lastUsed}
          </span>
          {expires && (
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 px-2.5 py-1 rounded-full">
              Expires {expires}
            </span>
          )}
        </div>

        {scopes.length > 0 && (
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-2">Scopes</div>
            <div className="flex flex-wrap gap-1.5 min-h-[28px]">
              {scopes.map((scope) => {
                const isWrite = scope.startsWith("write:") || scope === "admin";
                return (
                  <span
                    key={scope}
                    className={cn(
                      "text-[10px] font-mono px-2 py-0.5 rounded border",
                      isWrite
                        ? "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800 font-semibold"
                        : "bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700"
                    )}
                  >
                    {scope}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
          <AlertTriangle className="size-3.5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-700 dark:text-amber-400">
            Never share your API key. Rotate it immediately if compromised.
          </p>
        </div>
      </div>

      <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
        <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">
          {revealed ? "Key visible — copy and store securely" : "Key is masked until you reveal it"}
        </span>
        <button
          onClick={() => setRevealed((v) => !v)}
          className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5"
        >
          {revealed ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
          {revealed ? "Hide Key" : "Reveal Key"}
        </button>
      </div>
    </div>
  );
}
