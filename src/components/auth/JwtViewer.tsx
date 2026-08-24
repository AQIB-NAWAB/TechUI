"use client";

import { useState } from "react";
import { Shield, User, Mail, Clock, CheckCircle, ScanLine } from "lucide-react";
import { cn } from "@/lib/utils";
import { z } from "zod";

export const JwtViewerSchema = z.object({
  token: z.string().optional(),
  header: z.record(z.string(), z.unknown()).optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
  showSignature: z.boolean().default(true),
  interactive: z.boolean().default(true),
});

export type JwtViewerProps = z.infer<typeof JwtViewerSchema>;

const DEFAULT_HEADER = { alg: "HS256", typ: "JWT" };
const DEFAULT_PAYLOAD = {
  sub: "1234567890",
  name: "John Doe",
  email: "john@example.com",
  iat: 1516239022,
  exp: 1516242622,
  role: "user",
};

function base64url(obj: unknown): string {
  return btoa(JSON.stringify(obj)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function JwtViewer({ token, header, payload, showSignature = true, interactive = true }: JwtViewerProps) {
  const [verified, setVerified] = useState(false);
  const [scanning, setScanning] = useState(false);
  const h = header ?? DEFAULT_HEADER;
  const p = payload ?? DEFAULT_PAYLOAD;

  const encodedHeader = base64url(h);
  const encodedPayload = base64url(p);
  const signature = "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
  const fullToken = token ?? `${encodedHeader}.${encodedPayload}.${signature}`;

  const name = typeof p.name === "string" ? p.name : "Unknown User";
  const email = typeof p.email === "string" ? p.email : "—";
  const role = typeof p.role === "string" ? p.role : "guest";
  const exp = typeof p.exp === "number" ? new Date(p.exp * 1000) : null;
  const isExpired = exp ? exp < new Date() : false;

  function verifyPassport() {
    if (scanning) return;
    setScanning(true);
    setVerified(false);
    setTimeout(() => {
      setScanning(false);
      setVerified(true);
    }, 1500);
  }

  return (
    <>
      <style>{`
        @keyframes scanLine {
          0% { top: 0; opacity: 0.8; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
      <div className={cn(
        "rounded-xl border bg-white dark:bg-zinc-900 overflow-hidden transition-all duration-500",
        verified ? "border-emerald-300 dark:border-emerald-800" : "border-zinc-200 dark:border-zinc-800"
      )}>
        <div className="h-12 px-4 flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
          <Shield className="size-4 text-zinc-400 shrink-0" />
          <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex-1">Digital Passport</span>
          <span className={cn(
            "text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-all duration-500",
            verified
              ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
              : "bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800"
          )}>
            {verified ? "Verified" : "JWT"}
          </span>
        </div>

        <div className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
          A signed digital ID card — proves who you are without storing passwords on every request.
        </div>

        <div className="min-h-[240px] px-4 py-4 flex flex-col items-center justify-center">
          <div className={cn(
            "relative w-full max-w-sm rounded-xl border-2 overflow-hidden transition-all duration-700",
            verified
              ? "border-emerald-400 dark:border-emerald-600 shadow-lg shadow-emerald-100 dark:shadow-emerald-950/30"
              : "border-zinc-200 dark:border-zinc-700",
            scanning && "ring-2 ring-violet-400 ring-offset-2 dark:ring-offset-zinc-900"
          )}>
            {scanning && (
              <div
                className="absolute left-0 right-0 h-0.5 bg-violet-500 z-10 pointer-events-none"
                style={{ animation: "scanLine 1.5s ease-in-out forwards" }}
              />
            )}

            <div className="bg-gradient-to-br from-violet-600 to-indigo-700 dark:from-violet-800 dark:to-indigo-900 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="size-5 text-white/90" />
                <span className="text-xs font-bold text-white/90 uppercase tracking-widest">Access Token</span>
              </div>
              <span className="text-[10px] font-mono text-white/60">{String(h.alg ?? "HS256")}</span>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-800/60 p-4 flex gap-4">
              <div className={cn(
                "size-16 rounded-full flex items-center justify-center text-lg font-bold shrink-0 transition-all duration-500",
                verified
                  ? "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-400"
                  : "bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300"
              )}>
                {initials(name)}
              </div>

              <div className="flex-1 min-w-0 space-y-2">
                <div>
                  <div className="flex items-center gap-1 text-[10px] text-zinc-400 uppercase tracking-wide">
                    <User className="size-3" /> Name
                  </div>
                  <div className="text-sm font-bold text-zinc-800 dark:text-zinc-100 truncate">{name}</div>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-[10px] text-zinc-400 uppercase tracking-wide">
                    <Mail className="size-3" /> Email
                  </div>
                  <div className="text-xs text-zinc-600 dark:text-zinc-300 truncate">{email}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full transition-all duration-500",
                    role === "admin"
                      ? "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300"
                      : "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                  )}>
                    {role}
                  </span>
                  {exp && (
                    <span className={cn(
                      "flex items-center gap-1 text-[10px] transition-all duration-500",
                      isExpired ? "text-red-500" : verified ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400"
                    )}>
                      <Clock className="size-3" />
                      {isExpired ? "Expired" : `Valid until ${exp.toLocaleDateString()}`}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {showSignature && (
              <div className={cn(
                "px-4 py-2 border-t flex items-center gap-2 transition-all duration-500",
                verified
                  ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800"
                  : "bg-zinc-100 dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700"
              )}>
                {verified ? (
                  <>
                    <CheckCircle className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
                      Signature valid — token was not tampered with
                    </span>
                  </>
                ) : (
                  <>
                    <div className="size-3 rounded-full bg-zinc-300 dark:bg-zinc-600 shrink-0" />
                    <span className="text-[10px] text-zinc-500 font-mono truncate">
                      {signature.slice(0, 20)}…
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="mt-3 w-full max-w-sm">
            <div className="bg-zinc-100 dark:bg-zinc-800 rounded-md px-2.5 py-1 font-mono text-[9px] text-zinc-400 truncate">
              {fullToken.slice(0, 48)}…
            </div>
          </div>
        </div>

        <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/30 min-h-[52px]">
          <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">
            {scanning
              ? "Scanning signature…"
              : verified
                ? "Passport verified — this user is authenticated"
                : "Click to verify the token signature like a border checkpoint"}
          </span>
          {interactive && (
            <button
              type="button"
              onClick={verifyPassport}
              disabled={scanning}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-all duration-500 flex items-center gap-1.5 shrink-0",
                verified && !scanning
                  ? "bg-emerald-600 text-white"
                  : "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900",
                scanning && "opacity-60 cursor-not-allowed"
              )}
            >
              <ScanLine className="size-3.5" />
              {scanning ? "Scanning…" : verified ? "Re-scan" : "Verify Passport"}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
