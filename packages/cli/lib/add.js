import fs from "node:fs";
import path from "node:path";
import { findConfig, resolveAlias, DEFAULT_CONFIG } from "./config.js";
import { fetchRegistryItem } from "./registry.js";

function rewriteImports(content, config) {
  let out = content;
  const utilsAlias = config.aliases?.utils ?? "@/lib/utils";
  out = out.replace(/from\s+"@\/lib\/utils"/g, `from "${utilsAlias}"`);
  return out;
}

function resolveTargetPath(config, registryPath) {
  const cwd = process.cwd();
  const aliases = config.aliases ?? {};

  if (registryPath.startsWith("src/")) {
    return path.join(cwd, registryPath);
  }
  if (registryPath.includes("components/techui")) {
    const parts = registryPath.split("/");
    const fileName = parts.pop();
    const category = parts[parts.length - 1];
    return resolveAlias(config, "components", path.join(category, fileName));
  }
  if (registryPath.includes("lib/utils")) {
    return path.join(cwd, "src/lib/utils.ts");
  }
  return path.join(cwd, registryPath);
}

export async function addComponents(names, options = {}) {
  const found = findConfig();
  if (!found && !options.yes) {
    throw new Error('No techui.json found. Run "npx @aqib_nawab/techui init" first.');
  }

  const config = found?.config ?? {
    aliases: { components: "@/components/techui", utils: "@/lib/utils" },
    registry: options.registry ?? DEFAULT_CONFIG.registry,
  };

  const registryUrl = options.registry ?? config.registry ?? DEFAULT_CONFIG.registry;
  const written = [];

  for (const name of names) {
    const item = await fetchRegistryItem(registryUrl, name);
    const deps = item.registryDependencies ?? [];
    for (const dep of deps) {
      if (dep === "utils" && !names.includes("utils")) {
        await addComponents(["utils"], { ...options, yes: true, registry: registryUrl });
      }
    }

    for (const file of item.files ?? []) {
      const target = resolveTargetPath(config, file.path);
      fs.mkdirSync(path.dirname(target), { recursive: true });

      if (fs.existsSync(target) && !options.overwrite) {
        console.log(`  skip ${file.path} (exists, use --overwrite)`);
        continue;
      }

      const content = rewriteImports(file.content, config);
      fs.writeFileSync(target, content);
      written.push(target);
      console.log(`  ✓ ${path.relative(process.cwd(), target)}`);
    }
  }

  return written;
}
