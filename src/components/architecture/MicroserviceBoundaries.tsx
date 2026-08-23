"use client";

import { useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Boxes, Database, ArrowRight } from "lucide-react";

export const MicroserviceBoundariesSchema = z.object({
  services: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        color: z.enum(["blue", "emerald", "violet", "amber", "red"]),
        dbType: z.string(),
        dbLabel: z.string(),
        endpoints: z.array(
          z.object({
            method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]),
            path: z.string(),
            description: z.string(),
          })
        ),
        dependencies: z.array(z.string()).optional(),
      })
    )
    .default([
      {
        id: "user-svc",
        name: "User Service",
        color: "blue",
        dbType: "postgres",
        dbLabel: "PostgreSQL",
        endpoints: [
          { method: "GET", path: "/users/:id", description: "Get user profile" },
          { method: "POST", path: "/users", description: "Create account" },
          { method: "PUT", path: "/users/:id", description: "Update profile" },
        ],
        dependencies: [],
      },
      {
        id: "order-svc",
        name: "Order Service",
        color: "emerald",
        dbType: "mongodb",
        dbLabel: "MongoDB",
        endpoints: [
          { method: "GET", path: "/orders/:id", description: "Get order" },
          { method: "POST", path: "/orders", description: "Place order" },
          { method: "GET", path: "/orders/user/:userId", description: "User orders" },
        ],
        dependencies: ["user-svc", "product-svc"],
      },
      {
        id: "product-svc",
        name: "Product Service",
        color: "violet",
        dbType: "mongodb",
        dbLabel: "MongoDB",
        endpoints: [
          { method: "GET", path: "/products", description: "List products" },
          { method: "GET", path: "/products/:id", description: "Get product" },
          { method: "POST", path: "/products", description: "Create product" },
        ],
        dependencies: [],
      },
      {
        id: "payment-svc",
        name: "Payment Service",
        color: "amber",
        dbType: "postgres",
        dbLabel: "PostgreSQL",
        endpoints: [
          { method: "POST", path: "/payments", description: "Process payment" },
          { method: "GET", path: "/payments/:id", description: "Payment status" },
        ],
        dependencies: ["order-svc"],
      },
    ]),
});

export type MicroserviceBoundariesProps = z.infer<typeof MicroserviceBoundariesSchema>;

const COLOR_CLASSES = {
  blue: {
    border: "border-blue-500",
    bg: "bg-blue-500",
    text: "text-blue-600 dark:text-blue-400",
    badge: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800",
    ring: "ring-blue-400 dark:ring-blue-500",
    topBar: "bg-blue-500",
    dbBg: "bg-blue-50 dark:bg-blue-900/20",
  },
  emerald: {
    border: "border-emerald-500",
    bg: "bg-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
    badge: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800",
    ring: "ring-emerald-400 dark:ring-emerald-500",
    topBar: "bg-emerald-500",
    dbBg: "bg-emerald-50 dark:bg-emerald-900/20",
  },
  violet: {
    border: "border-violet-500",
    bg: "bg-violet-500",
    text: "text-violet-600 dark:text-violet-400",
    badge: "bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800",
    ring: "ring-violet-400 dark:ring-violet-500",
    topBar: "bg-violet-500",
    dbBg: "bg-violet-50 dark:bg-violet-900/20",
  },
  amber: {
    border: "border-amber-500",
    bg: "bg-amber-500",
    text: "text-amber-600 dark:text-amber-400",
    badge: "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800",
    ring: "ring-amber-400 dark:ring-amber-500",
    topBar: "bg-amber-500",
    dbBg: "bg-amber-50 dark:bg-amber-900/20",
  },
  red: {
    border: "border-red-500",
    bg: "bg-red-500",
    text: "text-red-600 dark:text-red-400",
    badge: "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800",
    ring: "ring-red-400 dark:ring-red-500",
    topBar: "bg-red-500",
    dbBg: "bg-red-50 dark:bg-red-900/20",
  },
} as const;

const METHOD_COLORS: Record<string, string> = {
  GET:    "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
  POST:   "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300",
  PUT:    "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
  DELETE: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300",
  PATCH:  "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300",
};

const DB_ICON_COLOR: Record<string, string> = {
  postgres: "text-blue-500",
  mongodb:  "text-emerald-500",
  mysql:    "text-orange-500",
  redis:    "text-red-500",
};

export function MicroserviceBoundaries({
  services = [],
}: MicroserviceBoundariesProps) {
  const [selectedId, setSelectedId] = useState<string | null>(services[0]?.id ?? null);

  const selectedService = services.find((s) => s.id === selectedId) ?? null;

  function getDependencyNames(deps: string[] | undefined): string[] {
    if (!deps || deps.length === 0) return [];
    return deps
      .map((depId) => services.find((s) => s.id === depId)?.name)
      .filter(Boolean) as string[];
  }

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <Boxes className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
          <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
            Microservice Boundaries
          </span>
        </div>
        <span className="text-xs text-zinc-400 dark:text-zinc-500">
          Click a service to inspect
        </span>
      </div>

      {/* Service grid */}
      <div className="p-4 min-h-[240px]">
        <div className="grid grid-cols-2 gap-3 mb-4">
          {services.map((svc) => {
            const c = COLOR_CLASSES[svc.color];
            const isSelected = svc.id === selectedId;
            const depNames = getDependencyNames(svc.dependencies);

            return (
              <button
                key={svc.id}
                onClick={() => setSelectedId(svc.id)}
                className={cn(
                  "text-left rounded-lg border-2 overflow-hidden transition-all duration-500 cursor-pointer",
                  "hover:shadow-md focus:outline-none",
                  c.border,
                  isSelected
                    ? cn("ring-2 ring-offset-2 dark:ring-offset-zinc-900 shadow-md", c.ring)
                    : "opacity-80 hover:opacity-100"
                )}
              >
                {/* Color top bar */}
                <div className={cn("h-1.5 w-full", c.topBar)} />

                <div className="px-3 py-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className={cn("text-xs font-bold", c.text)}>
                      {svc.name}
                    </span>
                    <span className="text-xs text-zinc-400">
                      {svc.endpoints.length} endpoints
                    </span>
                  </div>

                  {/* DB badge */}
                  <div
                    className={cn(
                      "flex items-center gap-1.5 rounded-md px-2 py-1 w-fit",
                      c.dbBg
                    )}
                  >
                    <Database
                      className={cn(
                        "w-3 h-3",
                        DB_ICON_COLOR[svc.dbType] ?? "text-zinc-500"
                      )}
                    />
                    <span className="text-xs font-mono text-zinc-600 dark:text-zinc-400">
                      {svc.dbLabel}
                    </span>
                  </div>

                  {/* Dependencies */}
                  {depNames.length > 0 && (
                    <div className="mt-2 flex items-center gap-1 flex-wrap">
                      <ArrowRight className="w-3 h-3 text-zinc-400 shrink-0" />
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                        {depNames.join(", ")}
                      </span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* API Contract Panel */}
        <div className="transition-all duration-500">
          {selectedService ? (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">
                  {selectedService.name}
                </span>
                <span className="text-xs text-zinc-400">— API Contract</span>
              </div>
              <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                {selectedService.endpoints.map((ep, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 text-xs transition-all duration-300",
                      i !== 0 && "border-t border-zinc-100 dark:border-zinc-800"
                    )}
                  >
                    <span
                      className={cn(
                        "font-mono font-bold px-1.5 py-0.5 rounded text-[10px] shrink-0 w-14 text-center",
                        METHOD_COLORS[ep.method]
                      )}
                    >
                      {ep.method}
                    </span>
                    <span className="font-mono text-zinc-700 dark:text-zinc-300 shrink-0">
                      {ep.path}
                    </span>
                    <span className="text-zinc-400 dark:text-zinc-500 truncate">
                      {ep.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-xs text-zinc-400 text-center py-4">
              Select a service to view its API contract
            </div>
          )}
        </div>
      </div>

      {/* Footer insight */}
      <div className="px-4 py-2.5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
          Each service owns its database — no shared tables
        </p>
      </div>
    </div>
  );
}
