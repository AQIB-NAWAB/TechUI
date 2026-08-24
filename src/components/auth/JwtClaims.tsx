"use client";

import { useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { KeyRound, Copy, Check, AlertTriangle, ShieldCheck } from "lucide-react";

export const JwtClaimsSchema = z.object({
  algorithm: z.string().default("HS256"),
  header: z.object({
    alg: z.string(),
    typ: z.string(),
  }).default({ alg: "HS256", typ: "JWT" }),
  payload: z.record(z.string(), z.unknown()).default({
    sub: "user:1234",
    iss: "auth.freshmarket.com",
    aud: "api.freshmarket.com",
    iat: 1716239022,
    exp: 1716242622,
    role: "customer",
    storeId: "store_abc123",
  }),
  showDecoded: z.boolean().optional().default(true),
});

export type JwtClaimsProps = z.infer<typeof JwtClaimsSchema>;

// Standard JWT claim keys
const STANDARD_CLAIMS = new Set(["sub", "iss", "aud", "iat", "exp", "nbf", "jti"]);

function base64url(obj: unknown): string {
  try {
    return btoa(JSON.stringify(obj))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
  } catch {
    return "encode-error";
  }
}

function formatTs(unix: number): string {
  try {
    const d = new Date(unix * 1000);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return String(unix);
  }
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 transition-opacity"
    >
      {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
      {copied ? "Copied!" : "Copy Token"}
    </button>
  );
}

function Badge({ label, variant }: { label: string; variant: "standard" | "custom" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center w-4 h-4 rounded text-[9px] font-bold shrink-0",
        variant === "standard"
          ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
          : "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300"
      )}
    >
      {variant === "standard" ? "S" : "C"}
    </span>
  );
}

export function JwtClaims({
  algorithm = "HS256",
  header = { alg: "HS256", typ: "JWT" },
  payload = {
    sub: "user:1234",
    iss: "auth.freshmarket.com",
    aud: "api.freshmarket.com",
    iat: 1716239022,
    exp: 1716242622,
    role: "customer",
    storeId: "store_abc123",
  },
}: JwtClaimsProps) {
  const [toastVisible, setToastVisible] = useState(false);

  const encodedHeader = base64url(header);
  const encodedPayload = base64url(payload);
  const signature = "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
  const fullToken = `${encodedHeader}.${encodedPayload}.${signature}`;

  function handleCopyToken() {
    navigator.clipboard.writeText(fullToken).catch(() => {});
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 1500);
  }

  const standardEntries = Object.entries(payload).filter(([k]) => STANDARD_CLAIMS.has(k));
  const customEntries = Object.entries(payload).filter(([k]) => !STANDARD_CLAIMS.has(k));

  // Calculate exp progress — demo: treat exp as 1h total, 40min remaining
  const expPct = 67; // demo: ~40min of 60min remaining

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Header bar */}
      <div className="h-12 px-4 flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <KeyRound className="size-3.5 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex-1">JWT Claims</span>
        <span className="text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded">
          {algorithm}
        </span>
        <CopyButton text={fullToken} />
      </div>

      {/* Token string — clickable */}
      <div className="relative px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30">
        <button
          onClick={handleCopyToken}
          className="w-full text-left font-mono text-[11px] break-all leading-loose hover:opacity-80 transition-opacity"
          title="Click to copy token"
        >
          <span className="text-violet-600 dark:text-violet-400">
            {encodedHeader.slice(0, 20)}…
          </span>
          <span className="text-zinc-400">.</span>
          <span className="text-blue-600 dark:text-blue-400">
            {encodedPayload.slice(0, 24)}…
          </span>
          <span className="text-zinc-400">.</span>
          <span className="text-emerald-600 dark:text-emerald-400">
            {signature.slice(0, 16)}…
          </span>
        </button>

        {/* Toast */}
        <div className={cn(
          "absolute right-4 top-1/2 -translate-y-1/2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[10px] font-semibold px-2 py-1 rounded pointer-events-none transition-all duration-500",
          toastVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2"
        )}>
          Copied!
        </div>
      </div>

      {/* Three panels */}
      <div className="p-4 min-h-[280px]">
        <div className="grid grid-cols-[1fr_2fr_1fr] gap-3">
          {/* HEADER — violet */}
          <div className="rounded-lg border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/30 overflow-hidden">
            <div className="px-3 py-2 bg-violet-100 dark:bg-violet-900/40">
              <span className="text-[10px] font-bold uppercase tracking-wider text-violet-700 dark:text-violet-300">
                Header
              </span>
            </div>
            <div className="px-3 py-2.5 space-y-2">
              {Object.entries(header).map(([k, v]) => (
                <div key={k}>
                  <div className="text-[9px] text-violet-500 dark:text-violet-400 font-semibold uppercase">{k}</div>
                  <div className="text-[11px] font-mono font-bold text-violet-800 dark:text-violet-200 truncate">
                    {String(v)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* PAYLOAD — blue */}
          <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 overflow-hidden">
            <div className="px-3 py-2 bg-blue-100 dark:bg-blue-900/40 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                Payload
              </span>
              <div className="flex gap-1 items-center text-[9px] text-blue-500">
                <Badge label="S" variant="standard" /> Std
                <Badge label="C" variant="custom" /> Custom
              </div>
            </div>
            <div className="px-3 py-2.5 space-y-1.5">
              {/* Standard claims */}
              {standardEntries.map(([k, v]) => {
                const isTimestamp = (k === "iat" || k === "exp") && typeof v === "number";
                return (
                  <div key={k} className="flex items-start gap-1.5">
                    <Badge label="S" variant="standard" />
                    <div className="min-w-0 flex-1">
                      <span className="text-[9px] text-blue-500 dark:text-blue-400 font-semibold">{k}: </span>
                      <span className="text-[10px] font-mono text-blue-800 dark:text-blue-200 break-all">
                        {isTimestamp ? formatTs(v as number) : String(v)}
                      </span>
                      {k === "exp" && (
                        <div className="mt-0.5">
                          <div className="h-1 bg-blue-100 dark:bg-blue-900/50 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-400 dark:bg-blue-500 rounded-full transition-all duration-500"
                              style={{ width: `${expPct}%` }}
                            />
                          </div>
                          <div className="text-[9px] text-blue-400 mt-0.5">~1hr remaining</div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Custom claims */}
              {customEntries.map(([k, v]) => (
                <div key={k} className="flex items-start gap-1.5">
                  <Badge label="C" variant="custom" />
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] text-amber-600 dark:text-amber-400 font-semibold">{k}: </span>
                    <span className="text-[10px] font-mono text-blue-800 dark:text-blue-200 break-all">
                      {typeof v === "string" ? v : JSON.stringify(v)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SIGNATURE — emerald */}
          <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 overflow-hidden">
            <div className="px-3 py-2 bg-emerald-100 dark:bg-emerald-900/40">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                Signature
              </span>
            </div>
            <div className="px-3 py-2.5 space-y-2.5">
              <div className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 leading-relaxed">
                HMAC-SHA256(<br />
                &nbsp;header +<br />
                &nbsp;&quot;.&quot; +<br />
                &nbsp;payload,<br />
                &nbsp;secret<br />
                )
              </div>

              <div className="flex items-start gap-1.5 bg-emerald-100 dark:bg-emerald-900/40 rounded px-2 py-1.5">
                <ShieldCheck className="size-3 text-emerald-600 dark:text-emerald-400 shrink-0 mt-px" />
                <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold leading-tight">
                  Server verifies without database lookup
                </span>
              </div>

              <div className="flex items-start gap-1.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded px-2 py-1.5">
                <AlertTriangle className="size-3 text-amber-500 shrink-0 mt-px" />
                <span className="text-[10px] text-amber-700 dark:text-amber-400 leading-tight">
                  Never put secrets in payload — it&apos;s only base64!
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-3 flex items-center gap-2 text-[10px] text-zinc-400">
          <Badge label="S" variant="standard" />
          <span>Standard claims: sub iss aud iat exp</span>
          <span className="mx-1">·</span>
          <Badge label="C" variant="custom" />
          <span>Custom: {customEntries.map(([k]) => k).join(", ") || "none"}</span>
        </div>
      </div>
    </div>
  );
}
