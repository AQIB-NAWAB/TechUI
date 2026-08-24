import type { ComponentCategory } from "@/registry/types";

export const NPM_PACKAGE = "@aqib_nawab/techui";
export const REGISTRY_URL = "https://techui.vercel.app/r";
export const COMPONENTS_ALIAS = "@/components/techui";

const CAT_DIR: Record<ComponentCategory, string> = {
  api: "api",
  architecture: "architecture",
  database: "database",
  auth: "auth",
  networking: "networking",
  cloud: "cloud",
  containers: "containers",
  distributed: "distributed",
  code: "code",
  devtools: "devtools",
  ui: "ui",
  ai: "ai",
  edu: "edu",
};

export function toComponentName(id: string): string {
  return id.split("-").map((s) => (s[0]?.toUpperCase() ?? "") + s.slice(1)).join("");
}

export function getInstallPath(category: ComponentCategory, id: string): string {
  const name = toComponentName(id);
  const dir = CAT_DIR[category] ?? category;
  return `src/components/techui/${dir}/${name}.tsx`;
}

export function getImportPath(category: ComponentCategory, id: string): string {
  const name = toComponentName(id);
  const dir = CAT_DIR[category] ?? category;
  return `${COMPONENTS_ALIAS}/${dir}/${name}`;
}

export function getAddCommand(id: string): string {
  return `npx ${NPM_PACKAGE} add ${id}`;
}

export function getInitCommand(): string {
  return `npx ${NPM_PACKAGE} init`;
}

export function getAddUtilsCommand(): string {
  return `npx ${NPM_PACKAGE} add utils`;
}
