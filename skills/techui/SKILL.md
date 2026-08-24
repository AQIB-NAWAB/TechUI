---
name: techui
description: Add and use TechUI interactive engineering education components. Use when the user wants to add rate limiters, circuit breakers, DNS lookups, JWT flows, or any TechUI visual component via CLI, or when building/improving TechUI components in this repo.
---

# TechUI Agent Skill

TechUI makes software engineering concepts **visually obvious** to beginners through interactive React components.

## Adding components to a user project

```bash
npx @aqib_nawab/techui init
npx @aqib_nawab/techui add rate-limiter
npx @aqib_nawab/techui list --category distributed
```

Components copy into `src/components/techui/{category}/` with Zod schemas and lucide icons.

## Component design rules

Read `docs/COMPONENT_SPEC.md` before creating or editing components.

Gold standard: **Rate Limiter** — one obvious action, fixed card height, plain-English description, `duration-500+` animations.

### Card layout (required)

1. **Header** (`h-12`) — icon + title + badge
2. **Description** — one sentence in plain English
3. **Main visual** — `min-h-[220px]`, never shifts on interaction
4. **Footer** — status text + **one** primary button

### Never

- `duration-150` or `duration-300` (use `duration-500` minimum)
- Step delays under 1000ms for visible animations
- Multiple competing primary actions in footer
- Raw jargon without a visual metaphor

## Registry workflow (this repo)

1. Create component in `src/components/{category}/ComponentName.tsx`
2. Export Zod schema: `export const FooSchema = z.object({...})`
3. Register in `src/registry/index.ts` with `defaultProps` + 2 `examples`
4. Wire in `src/playground/LivePreview.tsx` COMPONENT_MAP
5. Run `npm run generate:registry` to update public JSON registry
6. Run `npm run build`

## Categories

`api` · `architecture` · `database` · `auth` · `networking` · `cloud` · `containers` · `distributed` · `code` · `devtools` · `ui` · `ai` · `edu`

## Playground

Local demo: `npm run dev` → `/playground`
