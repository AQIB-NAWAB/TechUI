import type { ComponentType } from "react";
import type { z } from "zod";

export type ComponentCategory =
  | "api"
  | "architecture"
  | "database"
  | "auth"
  | "networking"
  | "cloud"
  | "containers"
  | "distributed"
  | "code"
  | "devtools"
  | "ui"
  | "ai"
  | "edu";

export type ComponentEntry<Props = Record<string, unknown>> = {
  id: string;
  name: string;
  category: ComponentCategory;
  description: string;
  schema: z.ZodType<Props>;
  defaultProps: Props;
  examples: Array<{ label: string; props: Props }>;
  Component: ComponentType<Props>;
  tags?: string[];
  interactive?: boolean;
};

export type Registry = Record<string, ComponentEntry>;
