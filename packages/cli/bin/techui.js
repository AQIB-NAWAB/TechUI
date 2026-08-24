#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { DEFAULT_CONFIG, findConfig } from "../lib/config.js";
import { addComponents } from "../lib/add.js";
import { fetchRegistryIndex, getLocalRegistryPath } from "../lib/registry.js";

const [,, cmd, ...args] = process.argv;

function usage() {
  console.log(`
techui — interactive engineering education components

Usage:
  npx @aqib_nawab/techui init              Create techui.json in your project
  npx @aqib_nawab/techui add <component>   Add one or more components (e.g. rate-limiter)
  npx @aqib_nawab/techui list              List all available components
  npx @aqib_nawab/techui list --category api   Filter by category

Examples:
  npx @aqib_nawab/techui init
  npx @aqib_nawab/techui add rate-limiter
  npx @aqib_nawab/techui add circuit-breaker dns-lookup jwt-flow
  npx @aqib_nawab/techui add utils rate-limiter --overwrite
`);
}

async function cmdInit() {
  const target = path.join(process.cwd(), "techui.json");
  if (fs.existsSync(target)) {
    console.log("techui.json already exists.");
    return;
  }
  fs.writeFileSync(target, JSON.stringify(DEFAULT_CONFIG, null, 2) + "\n");
  console.log("Created techui.json");
  console.log('Run: npx @aqib_nawab/techui add rate-limiter');
}

async function cmdList() {
  const found = findConfig();
  const registry = found?.config?.registry ?? DEFAULT_CONFIG.registry;
  const index = await fetchRegistryIndex(registry.startsWith("http") ? registry : "local");

  const catFlag = args.indexOf("--category");
  const category = catFlag >= 0 ? args[catFlag + 1] : null;

  let items = index.items ?? [];
  if (category) items = items.filter((i) => i.categories?.includes(category));

  console.log(`\nTechUI registry (${items.length} items)\n`);
  const byCat = {};
  for (const item of items) {
    const cat = item.categories?.[0] ?? "other";
    (byCat[cat] ??= []).push(item);
  }
  for (const [cat, list] of Object.entries(byCat).sort(([a], [b]) => a.localeCompare(b))) {
    console.log(`  ${cat}`);
    for (const item of list.sort((a, b) => a.name.localeCompare(b.name))) {
      console.log(`    ${item.name.padEnd(28)} ${item.title}`);
    }
    console.log();
  }
}

async function cmdAdd() {
  const overwrite = args.includes("--overwrite");
  const names = args.filter((a) => !a.startsWith("--"));
  if (names.length === 0) {
    console.error("Error: specify at least one component name.");
    console.error('Example: npx @aqib_nawab/techui add rate-limiter');
    process.exit(1);
  }

  const found = findConfig();
  const registry = found?.config?.registry ?? DEFAULT_CONFIG.registry;

  console.log(`Adding: ${names.join(", ")}\n`);
  await addComponents(names, { overwrite, registry });
  console.log("\nDone.");
}

async function main() {
  try {
    switch (cmd) {
      case "init":
        await cmdInit();
        break;
      case "add":
        await cmdAdd();
        break;
      case "list":
      case "ls":
        await cmdList();
        break;
      case "--help":
      case "-h":
      case undefined:
        usage();
        break;
      default:
        console.error(`Unknown command: ${cmd}`);
        usage();
        process.exit(1);
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
    if (!fs.existsSync(getLocalRegistryPath())) {
      console.error("Hint: run node scripts/generate-registry.mjs from the TechUI repo first.");
    }
    process.exit(1);
  }
}

main();
