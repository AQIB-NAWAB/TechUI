"use client";

import { useState, useEffect, useRef } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Radar, RefreshCw, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

export const ServiceDiscoverySchema = z.object({
  registryType: z.enum(["consul", "kubernetes", "eureka"]).default("consul"),
  services: z
    .array(
      z.object({
        name: z.string(),
        instances: z.number(),
        healthy: z.number(),
        port: z.number(),
      })
    )
    .default([
      { name: "api-gateway", instances: 2, healthy: 2, port: 8080 },
      { name: "user-service", instances: 3, healthy: 3, port: 3001 },
      { name: "order-service", instances: 2, healthy: 1, port: 3002 },
      { name: "product-service", instances: 1, healthy: 1, port: 3003 },
    ]),
});

export type ServiceDiscoveryProps = z.infer<typeof ServiceDiscoverySchema>;

type ServiceState = {
  name: string;
  instances: number;
  healthy: number;
  port: number;
};

type AnimState = "idle" | "registering" | "discovering" | "done";

const REGISTRY_LABELS: Record<string, string> = {
  consul: "Consul",
  kubernetes: "K8s DNS",
  eureka: "Eureka",
};

function getIP(seed: number) {
  return `10.0.0.${10 + seed}`;
}

export function ServiceDiscovery({
  registryType = "consul",
  services: initialServices = [
    { name: "api-gateway", instances: 2, healthy: 2, port: 8080 },
    { name: "user-service", instances: 3, healthy: 3, port: 3001 },
    { name: "order-service", instances: 2, healthy: 1, port: 3002 },
    { name: "product-service", instances: 1, healthy: 1, port: 3003 },
  ],
}: ServiceDiscoveryProps) {
  const [services, setServices] = useState<ServiceState[]>(initialServices);
  const [selected, setSelected] = useState<string | null>(null);
  const [animState, setAnimState] = useState<AnimState>("idle");
  const [animTarget, setAnimTarget] = useState<string | null>(null);
  const [resolvedIP, setResolvedIP] = useState<string | null>(null);
  const [registering, setRegistering] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearTimer() {
    if (timerRef.current) clearTimeout(timerRef.current);
  }

  function triggerRegister(svcName: string) {
    clearTimer();
    setRegistering(svcName);
    setAnimState("registering");
    timerRef.current = setTimeout(() => {
      setRegistering(null);
      setAnimState("done");
      timerRef.current = setTimeout(() => setAnimState("idle"), 1500);
    }, 1200);
  }

  function triggerDiscover(svc: ServiceState, idx: number) {
    clearTimer();
    setAnimTarget(svc.name);
    setAnimState("discovering");
    setResolvedIP(null);
    timerRef.current = setTimeout(() => {
      setResolvedIP(`${getIP(idx)}:${svc.port}`);
      setAnimState("done");
      timerRef.current = setTimeout(() => {
        setAnimState("idle");
        setAnimTarget(null);
        setResolvedIP(null);
      }, 2000);
    }, 1200);
  }

  function killInstance(svcName: string) {
    setServices((prev) =>
      prev.map((s) =>
        s.name === svcName && s.healthy > 0
          ? { ...s, healthy: s.healthy - 1 }
          : s
      )
    );
  }

  function resetAll() {
    clearTimer();
    setServices(initialServices);
    setSelected(null);
    setAnimState("idle");
    setAnimTarget(null);
    setResolvedIP(null);
    setRegistering(null);
  }

  useEffect(() => () => clearTimer(), []);

  const selectedSvc = services.find((s) => s.name === selected);

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <Radar className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">Service Discovery</span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold">
          {REGISTRY_LABELS[registryType]}
        </span>
        <button onClick={resetAll} className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all duration-500">
          <RefreshCw className="size-3.5" />
        </button>
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        Services register with a central registry so clients can find healthy instances without hard-coded URLs.
      </p>

      <div className="p-4 min-h-[260px]">
        {/* Registry box */}
        <div className="flex justify-center mb-2">
          <div className={cn(
            "px-5 py-2 rounded-lg border-2 text-center transition-all duration-500",
            animState === "registering" || animState === "done"
              ? "border-emerald-400 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-950/20"
              : animState === "discovering"
              ? "border-blue-400 dark:border-blue-600 bg-blue-50 dark:bg-blue-950/20"
              : "border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/40"
          )}>
            <div className="text-xs font-bold text-zinc-700 dark:text-zinc-200">Service Registry</div>
            <div className="text-[10px] text-zinc-400 dark:text-zinc-500">({REGISTRY_LABELS[registryType]})</div>
            {animState === "registering" && registering && (
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 animate-pulse">
                ↑ registering {registering}…
              </div>
            )}
            {animState === "discovering" && animTarget && (
              <div className="text-[10px] text-blue-600 dark:text-blue-400 mt-1 animate-pulse">
                resolving {animTarget}…
              </div>
            )}
            {animState === "done" && resolvedIP && (
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 justify-center">
                <CheckCircle2 className="size-2.5" />
                → {resolvedIP}
              </div>
            )}
            {animState === "done" && !resolvedIP && registering === null && (
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 justify-center">
                <CheckCircle2 className="size-2.5" />
                registered!
              </div>
            )}
          </div>
        </div>

        {/* Arrows */}
        <div className="flex justify-center gap-4 text-[10px] text-zinc-400 mb-3">
          <span className="flex items-center gap-1">
            <span className="text-emerald-500">↑</span> register
          </span>
          <span className="flex items-center gap-1">
            <span className="text-blue-500">↓</span> discover
          </span>
        </div>

        {/* Service boxes */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {services.map((svc, idx) => {
            const isUnhealthy = svc.healthy < svc.instances;
            const isSelected = selected === svc.name;
            return (
              <button
                key={svc.name}
                onClick={() => setSelected(isSelected ? null : svc.name)}
                className={cn(
                  "rounded-lg border p-2.5 text-left transition-all duration-500 cursor-pointer",
                  isSelected
                    ? "border-blue-400 dark:border-blue-600 bg-blue-50 dark:bg-blue-950/20"
                    : isUnhealthy
                    ? "border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/10"
                    : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/40 hover:border-zinc-300 dark:hover:border-zinc-600"
                )}
              >
                <div className="flex items-center gap-1 mb-1.5">
                  <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-200 truncate flex-1">{svc.name}</span>
                  {isUnhealthy && <AlertTriangle className="size-3 text-amber-500 shrink-0" />}
                </div>
                {/* Health dots */}
                <div className="flex gap-0.5 mb-1.5">
                  {Array.from({ length: svc.instances }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "size-2 rounded-full",
                        i < svc.healthy
                          ? "bg-emerald-500"
                          : "bg-zinc-300 dark:bg-zinc-600"
                      )}
                    />
                  ))}
                </div>
                <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
                  {svc.healthy}/{svc.instances} healthy · :{svc.port}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected service detail */}
        {selected && selectedSvc && (
          <div className="mt-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/10 p-3 space-y-2 transition-all duration-500 min-h-[88px]">
            <div className="flex items-center gap-2">
              <div className="text-xs font-bold text-blue-700 dark:text-blue-300">{selectedSvc.name}</div>
              <span className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-full font-semibold",
                selectedSvc.healthy === selectedSvc.instances
                  ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                  : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
              )}>
                {selectedSvc.healthy}/{selectedSvc.instances} healthy
              </span>
            </div>
            <div className="text-[10px] text-zinc-500 dark:text-zinc-400 space-y-0.5">
              <div>Endpoint: <span className="font-mono text-zinc-700 dark:text-zinc-300">{getIP(services.indexOf(selectedSvc))}:{selectedSvc.port}</span></div>
              <div>TTL: <span className="font-mono text-zinc-700 dark:text-zinc-300">10s</span> (heartbeat required)</div>
            </div>
            {selectedSvc.healthy > 0 ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => triggerRegister(selectedSvc.name)}
                  disabled={animState !== "idle"}
                  className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline disabled:opacity-40"
                >
                  Register heartbeat
                </button>
                <button
                  onClick={() => killInstance(selectedSvc.name)}
                  className="text-[10px] font-semibold text-red-600 dark:text-red-400 hover:underline"
                >
                  Kill one instance
                </button>
              </div>
            ) : (
              <span className="flex items-center gap-1 text-[10px] text-red-500 dark:text-red-400">
                <XCircle className="size-3" /> All instances down — removed from registry
              </span>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/30">
        <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">
          {animState === "discovering" && animTarget
            ? `Resolving ${animTarget}…`
            : animState === "done" && resolvedIP
              ? `Discovered → ${resolvedIP}`
              : selected
                ? `Selected ${selected} — click Discover to resolve its address`
                : "Click a service, then discover where it lives"}
        </span>
        <button
          onClick={() => {
            const svc = selectedSvc ?? services[0];
            if (svc) triggerDiscover(svc, services.indexOf(svc));
          }}
          disabled={animState !== "idle"}
          className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-all duration-500 disabled:opacity-50"
        >
          Discover
        </button>
      </div>
    </div>
  );
}
