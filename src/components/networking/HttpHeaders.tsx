"use client";

import { useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Lock, Shield, Network } from "lucide-react";

const HeaderSchema = z.object({
  name: z.string(),
  value: z.string(),
  description: z.string().optional(),
  highlight: z.enum(["security", "cache", "content", "auth", "custom"]).optional(),
});

export const HttpHeadersSchema = z.object({
  title: z.string().optional().default("HTTP Headers"),
  direction: z.enum(["request", "response", "both"]).optional().default("request"),
  requestHeaders: z.array(HeaderSchema).optional(),
  responseHeaders: z.array(HeaderSchema).optional(),
  showDescriptions: z.boolean().optional().default(true),
});

export type HttpHeadersProps = z.infer<typeof HttpHeadersSchema>;

type Category = "all" | "auth" | "content" | "cache" | "security" | "custom";

const CATEGORY_LABELS: Record<Category, string> = {
  all: "all",
  auth: "auth",
  content: "content",
  cache: "cache",
  security: "security",
  custom: "custom",
};

const HEADER_DESCRIPTIONS: Record<string, string> = {
  "Content-Type": "Tells the server what format the body is in",
  "Authorization": "Proves the client's identity to the server",
  "Cache-Control": "Controls how and how long responses are cached",
  "Strict-Transport-Security": "Forces HTTPS connections for a period of time",
  "X-Content-Type-Options": "Prevents browsers from MIME-sniffing the response",
  "X-Frame-Options": "Stops this page from being loaded in an iframe",
  "Accept": "The formats the client can handle in the response",
  "User-Agent": "Identifies the client software making the request",
  "Cookie": "Session or auth cookies sent to the server",
  "Set-Cookie": "Tells the browser to store a cookie",
  "X-Request-Id": "Unique ID for correlating logs across services",
  "X-RateLimit-Limit": "Maximum number of requests allowed in the window",
  "X-RateLimit-Remaining": "Requests remaining before rate limit is hit",
  "Access-Control-Allow-Origin": "Which origins are permitted to read the response",
};

function HeaderRow({
  header,
  dimmed,
}: {
  header: z.infer<typeof HeaderSchema>;
  dimmed: boolean;
}) {
  const isSecurityHeader = header.highlight === "security";
  const isAuthHeader = header.highlight === "auth";
  const isImportant = header.highlight === "content" || header.highlight === "auth" || header.highlight === "cache";
  const description = header.description ?? HEADER_DESCRIPTIONS[header.name];

  return (
    <div
      className={cn(
        "flex items-start gap-2 px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-all duration-500 rounded-md",
        dimmed && "opacity-40"
      )}
    >
      {/* Icon prefix */}
      <div className="shrink-0 mt-0.5 w-3.5 flex items-center justify-center">
        {isSecurityHeader && <Lock className="size-3 text-zinc-400 dark:text-zinc-500" />}
        {isAuthHeader && !isSecurityHeader && <Shield className="size-3 text-zinc-400 dark:text-zinc-500" />}
      </div>

      {/* Name + description */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5">
          <code
            className={cn(
              "text-xs font-mono shrink-0",
              isImportant || isSecurityHeader || isAuthHeader
                ? "font-semibold text-zinc-800 dark:text-zinc-200"
                : "text-zinc-600 dark:text-zinc-400"
            )}
          >
            {header.name}
          </code>
          {header.highlight && header.highlight !== "custom" && (
            <span
              className={cn(
                "text-[9px] font-semibold uppercase tracking-wide px-1 py-0.5 rounded leading-none shrink-0",
                header.highlight === "security" && "bg-red-50 dark:bg-red-950/30 text-red-500 dark:text-red-400",
                header.highlight === "auth" && "bg-violet-50 dark:bg-violet-950/30 text-violet-500 dark:text-violet-400",
                header.highlight === "content" && "bg-blue-50 dark:bg-blue-950/30 text-blue-500 dark:text-blue-400",
                header.highlight === "cache" && "bg-amber-50 dark:bg-amber-950/30 text-amber-500 dark:text-amber-400",
              )}
            >
              {header.highlight}
            </span>
          )}
        </div>
        {description && (
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-snug mt-0.5">{description}</p>
        )}
      </div>

      {/* Value */}
      <code
        className="text-xs font-mono text-zinc-600 dark:text-zinc-400 truncate max-w-[180px] shrink-0"
        title={header.value}
      >
        {header.value}
      </code>
    </div>
  );
}

function Panel({
  label,
  headers,
  accentClass,
  headerCountClass,
}: {
  label: string;
  headers: z.infer<typeof HeaderSchema>[];
  accentClass: string;
  headerCountClass: string;
}) {
  const [activeCategory, setActiveCategory] = useState<Category>("all");

  const categories: Category[] = ["all", "auth", "content", "cache", "security", "custom"];
  const presentCategories = categories.filter(
    (c) => c === "all" || headers.some((h) => h.highlight === c)
  );

  return (
    <div className={cn("flex-1 min-w-0 border-l-4 rounded-r-lg overflow-hidden", accentClass)}>
      {/* Panel header */}
      <div className="px-3 py-2 bg-zinc-50 dark:bg-zinc-900/40 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2 mb-2">
          <Network className="size-3 text-zinc-400" />
          <span className={cn("text-[10px] font-semibold uppercase tracking-widest", headerCountClass)}>
            {label}
          </span>
          <span className="text-[10px] text-zinc-400 ml-auto">({headers.length})</span>
        </div>
        {/* Category pills */}
        <div className="flex items-center gap-1 flex-wrap">
          {presentCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "text-[10px] px-2 py-0.5 rounded-full font-medium transition-all duration-500",
                activeCategory === cat
                  ? "bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              )}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* Header rows */}
      <div className="p-1.5 space-y-0">
        {headers.map((h, i) => {
          const dimmed = activeCategory !== "all" && h.highlight !== activeCategory;
          return <HeaderRow key={i} header={h} dimmed={dimmed} />;
        })}
      </div>
    </div>
  );
}

export function HttpHeaders({
  title = "HTTP Headers",
  direction = "request",
  requestHeaders,
  responseHeaders,
}: HttpHeadersProps) {
  const showRequest = (direction === "request" || direction === "both") && requestHeaders && requestHeaders.length > 0;
  const showResponse = (direction === "response" || direction === "both") && responseHeaders && responseHeaders.length > 0;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
      {/* Header */}
      <div className="px-4 h-12 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/50 flex items-center">
        <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{title}</span>
      </div>

      {/* Two-panel layout */}
      <div className={cn("flex gap-0 divide-x divide-zinc-100 dark:divide-zinc-800", direction === "both" ? "flex-row" : "flex-col")}>
        {showRequest && (
          <Panel
            label="Request"
            headers={requestHeaders!}
            accentClass="border-l-blue-400 dark:border-l-blue-500"
            headerCountClass="text-blue-600 dark:text-blue-400"
          />
        )}
        {showResponse && (
          <Panel
            label="Response"
            headers={responseHeaders!}
            accentClass="border-l-emerald-400 dark:border-l-emerald-500"
            headerCountClass="text-emerald-600 dark:text-emerald-400"
          />
        )}
      </div>
    </div>
  );
}
