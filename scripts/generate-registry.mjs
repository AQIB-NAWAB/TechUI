#!/usr/bin/env node
/**
 * Generates shadcn-style JSON registry from src/components + src/registry/index.ts
 * Run: node scripts/generate-registry.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REGISTRY_DIR = path.join(ROOT, "registry");
const R_DIR = path.join(REGISTRY_DIR, "r");
const REGISTRY_TS = path.join(ROOT, "src/registry/index.ts");
const COMPONENTS_DIR = path.join(ROOT, "src/components");

function parseImports(source) {
  const map = new Map();
  const re = /import\s+\{\s*(\w+Schema)\s*\}\s+from\s+"@\/components\/([^"]+)"/g;
  let m;
  while ((m = re.exec(source)) !== null) {
    map.set(m[1].replace(/Schema$/, ""), m[2]);
  }
  return map;
}

/** Extract top-level registry blocks by brace counting */
function parseEntryBlocks(source) {
  const startRe = /^  "([a-z0-9-]+)":\s*\{/gm;
  const blocks = [];
  let m;
  while ((m = startRe.exec(source)) !== null) {
    const id = m[1];
    const start = m.index + m[0].length - 1;
    let depth = 0;
    let i = start;
    for (; i < source.length; i++) {
      if (source[i] === "{") depth++;
      else if (source[i] === "}") {
        depth--;
        if (depth === 0) {
          blocks.push({ id, body: source.slice(start + 1, i) });
          break;
        }
      }
    }
  }
  return blocks;
}

function parseEntryMeta(id, body) {
  const name = body.match(/name:\s*"([^"]+)"/)?.[1] ?? id;
  const category = body.match(/category:\s*"([^"]+)"/)?.[1] ?? "ui";
  const description = body.match(/description:\s*"([^"]+)"/)?.[1] ?? "";
  const interactive = /interactive:\s*true/.test(body);
  const tagsMatch = body.match(/tags:\s*\[([\s\S]*?)\]/);
  const tags = tagsMatch ? [...tagsMatch[1].matchAll(/"([^"]+)"/g)].map((t) => t[1]) : [];
  const schemaName = body.match(/schema:\s*(\w+)/)?.[1]?.replace(/Schema$/, "") ?? null;
  return { id, name, category, description, interactive, tags, schemaName };
}

function resolveComponentFile(importPath, schemaName) {
  if (importPath) {
    const tsx = path.join(COMPONENTS_DIR, `${importPath}.tsx`);
    if (fs.existsSync(tsx)) return tsx;
  }
  if (!schemaName) return null;
  for (const cat of fs.readdirSync(COMPONENTS_DIR)) {
    const candidate = path.join(COMPONENTS_DIR, cat, `${schemaName}.tsx`);
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function main() {
  const source = fs.readFileSync(REGISTRY_TS, "utf8");
  const importMap = parseImports(source);
  const blocks = parseEntryBlocks(source);

  fs.mkdirSync(R_DIR, { recursive: true });

  const index = [];
  let written = 0;

  for (const block of blocks) {
    if (!/schema:\s*\w+Schema/.test(block.body)) continue;
    const entry = parseEntryMeta(block.id, block.body);
    const importPath = entry.schemaName ? importMap.get(entry.schemaName) : null;
    const filePath = resolveComponentFile(importPath, entry.schemaName);
    if (!filePath) {
      console.warn(`skip ${entry.id}: component file not found (${entry.schemaName})`);
      continue;
    }

    const content = fs.readFileSync(filePath, "utf8");
    const fileName = path.basename(filePath);
    const installPath = `src/components/techui/${entry.category}/${fileName}`;

    const item = {
      $schema: "https://techui.dev/schema/registry-item.json",
      name: entry.id,
      type: "registry:component",
      title: entry.name,
      description: entry.description,
      categories: [entry.category],
      tags: entry.tags,
      interactive: entry.interactive,
      dependencies: ["zod", "lucide-react"],
      registryDependencies: ["utils"],
      files: [{ path: installPath, type: "registry:component", content }],
    };

    fs.writeFileSync(path.join(R_DIR, `${entry.id}.json`), JSON.stringify(item, null, 2));
    index.push({
      name: entry.id,
      type: "registry:component",
      title: entry.name,
      description: entry.description,
      categories: [entry.category],
      tags: entry.tags,
    });
    written++;
  }

  const utilsContent = fs.readFileSync(path.join(ROOT, "src/lib/utils.ts"), "utf8");
  fs.writeFileSync(
    path.join(R_DIR, "utils.json"),
    JSON.stringify(
      {
        $schema: "https://techui.dev/schema/registry-item.json",
        name: "utils",
        type: "registry:lib",
        title: "Utils",
        description: "cn() helper for Tailwind class merging",
        files: [{ path: "src/lib/utils.ts", type: "registry:lib", content: utilsContent }],
        dependencies: ["clsx", "tailwind-merge"],
      },
      null,
      2
    )
  );
  index.unshift({
    name: "utils",
    type: "registry:lib",
    title: "Utils",
    description: "cn() helper for Tailwind class merging",
    categories: ["lib"],
  });

  fs.writeFileSync(
    path.join(REGISTRY_DIR, "index.json"),
    JSON.stringify(
      {
        $schema: "https://techui.dev/schema/registry.json",
        name: "techui",
        homepage: "https://techui.dev",
        items: index.sort((a, b) => a.name.localeCompare(b.name)),
      },
      null,
      2
    )
  );

  // Mirror to public/r for static hosting (Vercel CDN)
  const PUBLIC_R = path.join(ROOT, "public/r");
  fs.mkdirSync(PUBLIC_R, { recursive: true });
  for (const file of fs.readdirSync(R_DIR)) {
    fs.copyFileSync(path.join(R_DIR, file), path.join(PUBLIC_R, file));
  }
  fs.copyFileSync(path.join(REGISTRY_DIR, "index.json"), path.join(PUBLIC_R, "index.json"));

  console.log(`Registry generated: ${written} components + utils → registry/ + public/r/`);
}

main();
