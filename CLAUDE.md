# CLAUDE.md

## Commit workflow

- One task / one logical change per commit.
- Implement, then stop — show a summary of the diff and wait for explicit approval before committing. Never commit automatically.
- `pnpm lint` and `pnpm format:check` must both pass before a commit.
- No `Co-Authored-By` trailer — solo project.

## Commit message rules

- List every file path in the diff, including deletion-only files.
- Describe changes in terms of code structure (files, functions, behavior), not intent or impact, unless the diff includes an inline comment or commit trailer (e.g. `Fixes:`, `Refs:`) stating the reason.
- If purely formatting/whitespace, say so plainly.
- Classify as one of: `fix`, `feat`, `refactor`, `chore`, `docs`, `test`, `build`, `perf`. If more than one applies, pick the dominant type and note the secondary in one sentence.
- Summary line: max 72 chars, imperative mood.
