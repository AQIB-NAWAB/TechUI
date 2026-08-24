"use client";

import { useState, useCallback } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { RotateCw, Server, Key } from "lucide-react";

export const ConsistentHashingSchema = z.object({
  servers: z.array(z.object({
    id: z.string(),
    name: z.string(),
    position: z.number(),
    color: z.enum(["blue", "emerald", "violet", "amber"]),
  })).default([
    { id: "s1", name: "Server A", position: 0.12, color: "blue"    },
    { id: "s2", name: "Server B", position: 0.38, color: "emerald" },
    { id: "s3", name: "Server C", position: 0.65, color: "violet"  },
    { id: "s4", name: "Server D", position: 0.87, color: "amber"   },
  ]),
  keys: z.array(z.object({
    id: z.string(),
    name: z.string(),
    position: z.number(),
  })).default([
    { id: "k1", name: "user:alice",   position: 0.05 },
    { id: "k2", name: "user:bob",     position: 0.25 },
    { id: "k3", name: "item:001",     position: 0.45 },
    { id: "k4", name: "session:xyz",  position: 0.55 },
    { id: "k5", name: "cache:home",   position: 0.72 },
    { id: "k6", name: "img:logo.png", position: 0.92 },
  ]),
});

export type ConsistentHashingProps = z.infer<typeof ConsistentHashingSchema>;

const SERVER_COLORS: Record<string, { fill: string; stroke: string; text: string; light: string }> = {
  blue:    { fill: "fill-blue-500",    stroke: "stroke-blue-500",    text: "text-blue-600 dark:text-blue-400",    light: "#3b82f6" },
  emerald: { fill: "fill-emerald-500", stroke: "stroke-emerald-500", text: "text-emerald-600 dark:text-emerald-400", light: "#10b981" },
  violet:  { fill: "fill-violet-500",  stroke: "stroke-violet-500",  text: "text-violet-600 dark:text-violet-400",  light: "#8b5cf6" },
  amber:   { fill: "fill-amber-500",   stroke: "stroke-amber-500",   text: "text-amber-600 dark:text-amber-400",   light: "#f59e0b" },
};

const EXTRA_SERVER_POSITIONS = [0.22, 0.50, 0.74, 0.30, 0.60];
const EXTRA_SERVER_COLORS = ["blue", "emerald", "violet", "amber", "blue"] as const;
const EXTRA_SERVER_NAMES = ["Server E", "Server F", "Server G", "Server H", "Server I"];

const CX = 110;
const CY = 110;
const R = 85;

function posToAngle(pos: number) {
  return pos * 2 * Math.PI - Math.PI / 2;
}

function posToXY(pos: number) {
  const angle = posToAngle(pos);
  return {
    x: CX + R * Math.cos(angle),
    y: CY + R * Math.sin(angle),
  };
}

function findServingServer(
  keyPos: number,
  servers: ConsistentHashingProps["servers"]
) {
  if (!servers.length) return null;
  const sorted = [...servers].sort((a, b) => a.position - b.position);
  const next = sorted.find((s) => s.position >= keyPos);
  return next ?? sorted[0];
}

export function ConsistentHashing({
  servers: initServers = [],
  keys = [],
}: ConsistentHashingProps) {
  const [servers, setServers] = useState(initServers);
  const [extraCount, setExtraCount] = useState(0);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [remapMsg, setRemapMsg] = useState<string | null>(null);

  const addServer = useCallback(() => {
    if (extraCount >= EXTRA_SERVER_POSITIONS.length) return;
    const newServer = {
      id: `extra-${extraCount}`,
      name: EXTRA_SERVER_NAMES[extraCount],
      position: EXTRA_SERVER_POSITIONS[extraCount],
      color: EXTRA_SERVER_COLORS[extraCount],
    };
    const newServers = [...servers, newServer].sort((a, b) => a.position - b.position);

    // Count how many keys now go to the new server
    let moved = 0;
    for (const key of keys) {
      const oldServer = findServingServer(key.position, servers);
      const newServingServer = findServingServer(key.position, newServers);
      if (oldServer?.id !== newServingServer?.id) moved++;
    }

    setServers(newServers);
    setExtraCount((c) => c + 1);
    setRemapMsg(`${moved} of ${keys.length} keys moved to ${newServer.name}`);
    setTimeout(() => setRemapMsg(null), 3500);
  }, [extraCount, servers, keys]);

  const removeServer = useCallback(() => {
    if (extraCount === 0) return;
    const removedId = `extra-${extraCount - 1}`;
    const removedServer = servers.find((s) => s.id === removedId);
    if (!removedServer) return;
    const newServers = servers.filter((s) => s.id !== removedId);

    // Count how many keys move away from removed server
    let moved = 0;
    for (const key of keys) {
      const oldServer = findServingServer(key.position, servers);
      if (oldServer?.id === removedId) moved++;
    }

    setServers(newServers);
    setExtraCount((c) => c - 1);
    setRemapMsg(`${moved} of ${keys.length} keys remapped from ${removedServer.name}`);
    setTimeout(() => setRemapMsg(null), 3500);
  }, [extraCount, servers, keys]);

  const selectedKeyObj = selectedKey ? keys.find((k) => k.id === selectedKey) : null;
  const servingServer = selectedKeyObj ? findServingServer(selectedKeyObj.position, servers) : null;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-2 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800">
        <RotateCw className="size-4 text-blue-500 shrink-0" />
        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex-1">Consistent Hashing</span>
        <span className="text-xs font-mono text-zinc-400 border border-zinc-200 dark:border-zinc-700 px-2 py-0.5 rounded">
          {servers.length} servers
        </span>
        {extraCount > 0 && (
          <button
            onClick={removeServer}
            className="text-[10px] font-semibold text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-all duration-500"
          >
            Undo
          </button>
        )}
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        Keys map to the next server clockwise — adding a server only remaps ~1/N of keys.
      </p>

      <div className="flex flex-col sm:flex-row items-start gap-4 p-4 min-h-[240px]">
        {/* Ring SVG */}
        <div className="flex-shrink-0 w-full sm:w-auto flex justify-center">
          <svg viewBox="0 0 220 220" className="w-full max-w-[220px]">
            {/* Ring */}
            <circle
              cx={CX} cy={CY} r={R}
              fill="none"
              className="stroke-zinc-200 dark:stroke-zinc-700"
              strokeWidth="2"
            />

            {/* Clockwise path from selected key to serving server */}
            {selectedKeyObj && servingServer && (() => {
              const keyAngleDeg = selectedKeyObj.position * 360 - 90;
              const srvAngleDeg = servingServer.position * 360 - 90;
              const keyAngle = posToAngle(selectedKeyObj.position);
              const srvAngle = posToAngle(servingServer.position);

              // Arc from key clockwise to server
              let sweep = servingServer.position - selectedKeyObj.position;
              if (sweep < 0) sweep += 1;
              const largeArc = sweep > 0.5 ? 1 : 0;

              const kx = CX + R * Math.cos(keyAngle);
              const ky = CY + R * Math.sin(keyAngle);
              const sx = CX + R * Math.cos(srvAngle);
              const sy = CY + R * Math.sin(srvAngle);

              void keyAngleDeg; void srvAngleDeg;

              return (
                <path
                  d={`M ${kx} ${ky} A ${R} ${R} 0 ${largeArc} 1 ${sx} ${sy}`}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="3"
                  strokeDasharray="5 3"
                  className="transition-all duration-500"
                  opacity="0.8"
                />
              );
            })()}

            {/* Keys */}
            {keys.map((key) => {
              const { x, y } = posToXY(key.position);
              const isSelected = key.id === selectedKey;
              return (
                <g key={key.id} className="cursor-pointer" onClick={() => setSelectedKey((prev) => prev === key.id ? null : key.id)}>
                  <circle
                    cx={x} cy={y} r={isSelected ? 7 : 5}
                    className={cn(
                      "transition-all duration-500",
                      isSelected
                        ? "fill-amber-400 stroke-amber-600"
                        : "fill-zinc-300 dark:fill-zinc-600 stroke-zinc-400 dark:stroke-zinc-500"
                    )}
                    strokeWidth="1.5"
                  />
                  {isSelected && (
                    <text
                      x={x + 10} y={y + 4}
                      fontSize="8"
                      className="fill-amber-600 dark:fill-amber-400 font-semibold"
                      style={{ fontFamily: "monospace" }}
                    >
                      {key.name}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Servers */}
            {servers.map((server) => {
              const { x, y } = posToXY(server.position);
              const color = SERVER_COLORS[server.color] ?? SERVER_COLORS.blue;
              const isServing = servingServer?.id === server.id;
              return (
                <g key={server.id} className="transition-all duration-500">
                  <circle
                    cx={x} cy={y} r={isServing ? 11 : 9}
                    fill={color.light}
                    stroke={color.light}
                    strokeWidth={isServing ? 3 : 1.5}
                    opacity={isServing ? 1 : 0.85}
                    className="transition-all duration-500"
                  />
                  <text
                    x={x}
                    y={y < CY ? y - 14 : y + 18}
                    textAnchor="middle"
                    fontSize="7.5"
                    fontWeight="600"
                    fill={color.light}
                    style={{ fontFamily: "system-ui, sans-serif" }}
                  >
                    {server.name.replace("Server ", "")}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Side panel */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Server list */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Server className="size-3 text-zinc-400" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                Servers ({servers.length})
              </span>
            </div>
            <div className="space-y-1">
              {[...servers].sort((a, b) => a.position - b.position).map((server) => {
                const color = SERVER_COLORS[server.color] ?? SERVER_COLORS.blue;
                const isServing = servingServer?.id === server.id;
                // Count keys this server handles
                const handledKeys = keys.filter((k) => findServingServer(k.position, servers)?.id === server.id);
                return (
                  <div
                    key={server.id}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-all duration-500 border",
                      isServing
                        ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-700"
                        : "bg-zinc-50 dark:bg-zinc-800/40 border-zinc-100 dark:border-zinc-800"
                    )}
                  >
                    <div className="size-2.5 rounded-full shrink-0 flex items-center justify-center">
                      <Server className="size-2" style={{ color: color.light }} />
                    </div>
                    <span className={cn("font-medium", color.text)}>{server.name}</span>
                    <span className="text-zinc-400 text-[9px] ml-auto font-mono">
                      {Math.round(server.position * 100)}%
                    </span>
                    <span className="text-zinc-500 dark:text-zinc-400 text-[9px] font-medium">
                      {handledKeys.length} key{handledKeys.length !== 1 ? "s" : ""}
                    </span>
                    {isServing && (
                      <span className="text-[9px] font-semibold text-amber-600 dark:text-amber-400">← serving</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Key selection info */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Key className="size-3 text-zinc-400" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                Keys — click ring to select
              </span>
            </div>
            {selectedKeyObj && servingServer ? (
              <div className="rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 px-3 py-2 text-xs space-y-0.5">
                <div className="font-semibold text-amber-800 dark:text-amber-200">
                  {selectedKeyObj.name}
                </div>
                <div className="text-amber-600 dark:text-amber-400">
                  → handled by <strong>{servingServer.name}</strong> (next clockwise)
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                Click a gray dot on the ring to see which server handles that key
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
        <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1 min-h-[20px]">
          {remapMsg
            ? remapMsg
            : selectedKeyObj && servingServer
              ? `${selectedKeyObj.name} → ${servingServer.name}`
              : "Click a dot on the ring, then add a server to see minimal remapping"}
        </span>
        <button
          onClick={addServer}
          disabled={extraCount >= EXTRA_SERVER_POSITIONS.length}
          className={cn(
            "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity shrink-0",
            extraCount >= EXTRA_SERVER_POSITIONS.length && "opacity-40 cursor-not-allowed"
          )}
        >
          Add Server
        </button>
      </div>
    </div>
  );
}
