"use client";

import { useState } from "react";
import { Lock, Key, Shield, Copy, Check, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { z } from "zod";

export const JwtViewerSchema = z.object({
  token: z.string().optional(),
  header: z.record(z.string(), z.unknown()).optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
  showSignature: z.boolean().default(true),
  interactive: z.boolean().default(false),
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

function Section({
  label, color, icon: Icon, children, defaultOpen = true
}: {
  label: string;
  color: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={cn("rounded-lg border overflow-hidden", color)}>
      <button
        className="w-full flex items-center gap-2.5 px-4 py-3 text-left"
        onClick={() => setOpen(v => !v)}
      >
        <Icon className="size-4 shrink-0" />
        <span className="text-xs font-semibold uppercase tracking-wider flex-1">{label}</span>
        {open ? <ChevronDown className="size-3.5 opacity-60" /> : <ChevronRight className="size-3.5 opacity-60" />}
      </button>
      {open && (
        <div className="border-t border-current/10 px-4 py-3">
          {children}
        </div>
      )}
    </div>
  );
}

function JsonFields({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="space-y-1.5 font-mono text-xs">
      {Object.entries(data).map(([k, v]) => (
        <div key={k} className="flex items-start gap-2">
          <span className="opacity-60 min-w-[80px]">{k}:</span>
          <span className="font-medium">
            {typeof v === "string"
              ? <span className="text-emerald-700 dark:text-emerald-400">"{v}"</span>
              : typeof v === "number"
              ? <span className="text-blue-700 dark:text-blue-400">{v}</span>
              : <span className="text-amber-700 dark:text-amber-400">{JSON.stringify(v)}</span>
            }
          </span>
        </div>
      ))}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-all duration-500"
    >
      {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
    </button>
  );
}

export function JwtViewer({ token, header, payload, showSignature = true }: JwtViewerProps) {
  const h = header ?? DEFAULT_HEADER;
  const p = payload ?? DEFAULT_PAYLOAD;

  const encodedHeader = base64url(h);
  const encodedPayload = base64url(p);
  const signature = "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

  const fullToken = token ?? `${encodedHeader}.${encodedPayload}.${signature}`;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Token display */}
      <div className="h-12 px-4 flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <div className="flex items-center gap-2 mb-2">
          <Lock className="size-3.5 text-zinc-500" />
          <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">JWT Token</span>
          <CopyButton text={fullToken} />
        </div>
        <div className="font-mono text-[11px] break-all leading-relaxed">
          <span className="text-red-600 dark:text-red-400">{encodedHeader}</span>
          <span className="text-zinc-400">.</span>
          <span className="text-violet-600 dark:text-violet-400">{encodedPayload}</span>
          <span className="text-zinc-400">.</span>
          {showSignature && <span className="text-emerald-600 dark:text-emerald-400">{signature}</span>}
        </div>
      </div>

      {/* Sections */}
      <div className="p-4 space-y-3">
        <Section
          label="Header"
          icon={Key}
          color="border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-300"
        >
          <JsonFields data={h as Record<string, unknown>} />
        </Section>

        <Section
          label="Payload"
          icon={Shield}
          color="border-violet-200 dark:border-violet-900 bg-violet-50 dark:bg-violet-950/20 text-violet-800 dark:text-violet-300"
        >
          <JsonFields data={p as Record<string, unknown>} />
          {typeof p.exp === "number" && (
            <div className="mt-2 pt-2 border-t border-violet-200 dark:border-violet-900/50 text-[10px] text-violet-500 dark:text-violet-500 font-sans">
              Expires: {new Date(p.exp * 1000).toLocaleString()}
            </div>
          )}
        </Section>

        {showSignature && (
          <Section
            label="Signature"
            icon={Lock}
            color="border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300"
            defaultOpen={false}
          >
            <div className="font-mono text-[11px] text-emerald-700 dark:text-emerald-400">
              HMACSHA256(<br />
              &nbsp;&nbsp;base64UrlEncode(header) + "." +<br />
              &nbsp;&nbsp;base64UrlEncode(payload),<br />
              &nbsp;&nbsp;secret<br />
              )
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}
