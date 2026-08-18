"use client";

import { cn } from "@/lib/utils";
import { ApiRequest } from "@/components/api/ApiRequest";
import { ApiResponse } from "@/components/api/ApiResponse";
import { StatusCode } from "@/components/api/StatusCode";
import { ArchitectureDiagram } from "@/components/architecture/ArchitectureDiagram";
import { DatabaseTable } from "@/components/database/DatabaseTable";
import { Terminal } from "@/components/devtools/Terminal";
import { JwtViewer } from "@/components/auth/JwtViewer";
import { QueueVisualizer } from "@/components/distributed/QueueVisualizer";

const COMPONENT_MAP: Record<string, React.ComponentType<Record<string, unknown>>> = {
  "api-request":        ApiRequest as React.ComponentType<Record<string, unknown>>,
  "api-response":       ApiResponse as React.ComponentType<Record<string, unknown>>,
  "status-code":        StatusCode as React.ComponentType<Record<string, unknown>>,
  "architecture-diagram": ArchitectureDiagram as React.ComponentType<Record<string, unknown>>,
  "database-table":     DatabaseTable as React.ComponentType<Record<string, unknown>>,
  "terminal":           Terminal as React.ComponentType<Record<string, unknown>>,
  "jwt-viewer":         JwtViewer as React.ComponentType<Record<string, unknown>>,
  "queue-visualizer":   QueueVisualizer as React.ComponentType<Record<string, unknown>>,
};

export function LivePreview({
  entryId,
  props,
  darkMode,
}: {
  entryId: string;
  props: Record<string, unknown>;
  darkMode: boolean;
}) {
  const Component = COMPONENT_MAP[entryId];

  if (!Component) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 p-8 text-center text-sm text-zinc-400">
        Component <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">{entryId}</code> is not wired to LivePreview yet.
      </div>
    );
  }

  return (
    <div className={cn(darkMode ? "dark" : "")}>
      <Component {...props} />
    </div>
  );
}
