# Portfolio — Shamil Khaibullov

Personal portfolio/resume site, built with [Astro](https://astro.build) as a static site and deployed to Cloudflare via Wrangler.

The design follows a locked, multi-phase spec (see `../design-v2/`): a "drafting-instrument / decision-log" aesthetic on a millimetre-paper texture, with three real color modes — light (default), dark, and anoitecer (a genuine middle luminance, not a dimmed dark) — plus a precise "Detent & Settle" motion system. Design tokens (color, spacing, type) are reverse-engineered from the canonical mockup files rather than invented; see `CLAUDE.md` for the conventions this repo follows.

## Stack

- [Astro](https://astro.build) 6 (static output)
- Plain CSS with custom properties (no Tailwind) — `src/styles/tokens.css` + `src/styles/global.css`
- Self-hosted [Archivo](https://fonts.google.com/specimen/Archivo) + [IBM Plex Mono](https://fonts.google.com/specimen/IBM+Plex+Mono) via `@fontsource`
- ESLint + Prettier (JS/TS/Astro), Stylelint (CSS, including `.astro` `<style>` blocks)
- Deployed as static assets to Cloudflare via `wrangler`

## Project structure

```text
/
├── public/              # static assets (favicons, etc.)
├── src/
│   ├── pages/           # file-based routes
│   └── styles/
│       ├── tokens.css   # design tokens (:root + [data-theme] mode blocks)
│       └── global.css   # reset, base type, textures, shared component classes
├── CLAUDE.md             # commit workflow + design-system conventions
└── wrangler.jsonc        # Cloudflare static-asset deploy config
```

## Commands

All commands run from the root of this project:

| Command             | Action                                             |
| :------------------ | :------------------------------------------------- |
| `pnpm install`      | Install dependencies                               |
| `pnpm dev`          | Start local dev server at `localhost:4321`         |
| `pnpm build`        | Build the production site to `./dist/`             |
| `pnpm preview`      | Preview the build locally, before deploying        |
| `pnpm lint`         | Lint JS/TS/Astro files with ESLint                 |
| `pnpm format`       | Format the codebase with Prettier                  |
| `pnpm format:check` | Check formatting without writing changes           |
| `pnpm typecheck`    | Type-check `.astro`/`.ts` files with `astro check` |
| `pnpm stylelint`    | Lint CSS, including `.astro` `<style>` blocks      |

All of the above must pass before a commit — see `CLAUDE.md` for the full workflow.
