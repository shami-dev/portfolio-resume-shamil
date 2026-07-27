# CLAUDE.md

## Commit workflow

- One task / one logical change per commit.
- Implement, then stop — show a summary of the diff and wait for explicit approval before committing. Never commit automatically.
- `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, and `pnpm stylelint` must all pass before a commit.
- No `Co-Authored-By` trailer — solo project.

## Commit message rules

- List every file path in the diff, including deletion-only files.
- Describe changes in terms of code structure (files, functions, behavior), not intent or impact, unless the diff includes an inline comment or commit trailer (e.g. `Fixes:`, `Refs:`) stating the reason.
- If purely formatting/whitespace, say so plainly.
- Classify as one of: `fix`, `feat`, `refactor`, `chore`, `docs`, `test`, `build`, `perf`. If more than one applies, pick the dominant type and note the secondary in one sentence.
- Summary line: max 72 chars, imperative mood.

## Framework & platform APIs

- Verify Astro and Cloudflare APIs, config options, and version availability against the docs MCP servers (`.mcp.json`) before asserting them — do not answer from memory. Model knowledge lags both products; several APIs this project depends on (`security.csp`, `Astro.logger`, the adapter's `imageService` default) shipped after the cutoff.
- Check the version an API was added in against the installed version before using it.

## Design-system conventions

- Colors, spacing, and type are reverse-engineered from the canonical mockups (design-v2/files_for_implementation/ + phase_5a_v2's dark-mode doc), not invented. Cite the source mockup value and the scale factor applied (desktop 1.636x, mobile 1.44x — from Phase 7) in a token comment.
- Verify empirically before trusting a derived value or tool config — run the actual command/build/browser check rather than reasoning from memory or a single example.
- When building a page/component, reproduce the exact DOM structure and class names from the Phase 5 mockup — don't reinterpret. This keeps Stylelint's token-enforcement meaningful and the density-tested spec's contrast/hierarchy intact.
- New design-system tokens get a throwaway visual smoke-test (temp page, `pnpm dev`, screenshot, delete) before being considered done.
