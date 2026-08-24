# TechUI

Interactive React components that make software engineering concepts **visually obvious** — rate limiters, circuit breakers, DNS lookups, JWT flows, and 180+ more.

**Live playground:** [techui.vercel.app/playground](https://techui.vercel.app/playground)

**npm package:** [@aqib_nawab/techui](https://www.npmjs.com/package/@aqib_nawab/techui) — full docs and component screenshots in [packages/cli/README.md](./packages/cli/README.md)

## Add to your project (like shadcn)

```bash
npx @aqib_nawab/techui init
npx @aqib_nawab/techui add rate-limiter
npx @aqib_nawab/techui add circuit-breaker dns-lookup
npx @aqib_nawab/techui list --category api
```

See [docs/CLI.md](./docs/CLI.md) for full CLI documentation.

## Project structure

```
techui/
├── app/                    # Next.js App Router (playground site)
├── src/
│   ├── components/         # Component source library (185+)
│   ├── registry/           # Runtime registry for playground
│   ├── playground/         # Interactive demo UI
│   └── lib/                # Shared utilities (cn)
├── packages/
│   └── cli/                # `@aqib_nawab/techui` npm CLI
├── registry/               # Public JSON registry (shadcn-style)
│   ├── index.json
│   └── r/*.json
├── skills/
│   └── techui/             # Cursor / agent skill
├── docs/
│   ├── CLI.md
│   └── COMPONENT_SPEC.md   # Design system for contributors
└── scripts/
    └── generate-registry.mjs
```

## Development

```bash
npm install
npm run dev          # http://localhost:3000/playground
npm run build
npm run generate:registry   # rebuild registry/r/*.json from src/
```

## For AI agents & IDEs

- **Skill:** `skills/techui/SKILL.md` — add to Cursor or copy to `.cursor/skills/`
- **Spec:** `docs/COMPONENT_SPEC.md` — design system all components must follow
- **Registry:** `registry/index.json` — machine-readable component catalog

## Categories

API · Architecture · Database · Auth · Networking · Cloud · Containers · Distributed · Code · DevTools · UI · AI · Education

## License

MIT
