import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CLI_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LOCAL_REGISTRY = path.resolve(CLI_ROOT, "../../registry");

function registryBase(registryUrl) {
  return registryUrl.replace(/\/$/, "");
}

export async function fetchRegistryIndex(registryUrl) {
  if (registryUrl.startsWith("http")) {
    const res = await fetch(`${registryBase(registryUrl)}/index.json`);
    if (!res.ok) throw new Error(`Failed to fetch registry: ${res.status}`);
    return res.json();
  }
  const local = path.join(LOCAL_REGISTRY, "index.json");
  if (!fs.existsSync(local)) {
    throw new Error("Local registry not found. Run: node scripts/generate-registry.mjs");
  }
  return JSON.parse(fs.readFileSync(local, "utf8"));
}

export async function fetchRegistryItem(registryUrl, name) {
  if (registryUrl.startsWith("http")) {
    const res = await fetch(`${registryBase(registryUrl)}/${name}.json`);
    if (!res.ok) throw new Error(`Component "${name}" not found (${res.status})`);
    return res.json();
  }
  const local = path.join(LOCAL_REGISTRY, "r", `${name}.json`);
  if (!fs.existsSync(local)) {
    throw new Error(`Component "${name}" not found in local registry`);
  }
  return JSON.parse(fs.readFileSync(local, "utf8"));
}

export function getLocalRegistryPath() {
  return LOCAL_REGISTRY;
}
