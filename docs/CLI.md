# TechUI CLI

Add interactive engineering education components to any React / Next.js project — the same way you add shadcn/ui components.

## Quick start

```bash
# In your Next.js project
npx @aqib_nawab/techui init
npx @aqib_nawab/techui add rate-limiter
npx @aqib_nawab/techui add circuit-breaker dns-lookup jwt-flow
```

## Commands

| Command | Description |
|---------|-------------|
| `npx @aqib_nawab/techui init` | Create `techui.json` config in your project |
| `npx @aqib_nawab/techui add <name>` | Copy component source into your project |
| `npx @aqib_nawab/techui list` | List all available components |
| `npx @aqib_nawab/techui list --category api` | Filter by category |

## Configuration (`techui.json`)

```json
{
  "$schema": "https://techui.dev/schema/techui.json",
  "aliases": {
    "components": "@/components/techui",
    "utils": "@/lib/utils"
  },
  "registry": "https://techui.dev/r"
}
```

Components install to `src/components/techui/{category}/` by default.

## Dependencies

Each component requires these peer dependencies (same as the TechUI playground):

- `react` / `react-dom`
- `zod`
- `lucide-react`
- `clsx` + `tailwind-merge` (for `cn()` utils)

Run `npx @aqib_nawab/techui add utils` first if you don't have the `cn()` helper.

## Registry

The public registry lives in `/registry` at the repo root:

- `registry/index.json` — catalog of all components
- `registry/r/{name}.json` — full source for each component

Regenerate after adding components:

```bash
npm run generate:registry
```

## For agents & IDEs

See `skills/techui/SKILL.md` for Cursor/agent integration guidance.
