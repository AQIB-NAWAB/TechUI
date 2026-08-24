import fs from "node:fs";
import path from "node:path";

export const DEFAULT_CONFIG = {
  $schema: "https://techui.dev/schema/techui.json",
  style: "default",
  rsc: true,
  tsx: true,
  tailwind: {
    config: "",
    css: "src/app/globals.css",
    baseColor: "zinc",
    cssVariables: true,
  },
  aliases: {
    components: "@/components/techui",
    utils: "@/lib/utils",
  },
  registry: "https://techui.vercel.app/r",
};

export function findConfig(cwd = process.cwd()) {
  let dir = cwd;
  while (true) {
    const candidate = path.join(dir, "techui.json");
    if (fs.existsSync(candidate)) {
      return { path: candidate, config: JSON.parse(fs.readFileSync(candidate, "utf8")), root: dir };
    }
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

export function resolveAlias(config, aliasKey, filePath) {
  const alias = config.aliases?.[aliasKey] ?? `@/${aliasKey}`;
  if (alias.startsWith("@/")) {
    return path.join(process.cwd(), "src", alias.slice(2), filePath);
  }
  return path.join(process.cwd(), alias, filePath);
}
