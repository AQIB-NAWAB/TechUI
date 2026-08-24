#!/usr/bin/env node
/**
 * Capture playground screenshots for packages/cli/README.md
 * Usage: node scripts/capture-readme-screenshots.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "packages/cli/assets");
const BASE = process.env.TECHUI_URL ?? "https://techui.vercel.app/playground";

const COMPONENTS = [
  { id: "rate-limiter", label: "Rate Limiter" },
  { id: "circuit-breaker", label: "Circuit Breaker" },
  { id: "dns-lookup", label: "DNS Lookup" },
  { id: "jwt-flow", label: "JWT Auth Flow" },
  { id: "ai-rag", label: "RAG Pipeline" },
];

async function captureComponent(page, { id, label }) {
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForSelector('input[placeholder="Search…"]', { timeout: 30000 });
  await page.fill('input[placeholder="Search…"]', label);
  await page.waitForTimeout(600);
  const item = page.locator("nav span.truncate", { hasText: label }).first();
  await item.click({ timeout: 15000 });
  await page.waitForTimeout(1500);

  const preview = page.locator('[data-preview="component"]').first();
  const outPath = path.join(OUT, `${id}.png`);
  if ((await preview.count()) > 0) {
    await preview.screenshot({ path: outPath });
  } else {
    await page.locator(".overflow-auto").nth(1).screenshot({ path: outPath });
  }
  console.log(`  ✓ ${id}.png`);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    channel: process.env.PLAYWRIGHT_CHROME_CHANNEL ?? "chrome",
  });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
  });

  console.log(`Capturing from ${BASE}\n`);
  for (const component of COMPONENTS) {
    await captureComponent(page, component);
  }

  await browser.close();
  console.log(`\nSaved to ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
