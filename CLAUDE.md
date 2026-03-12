# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

md-lark-converter is a Markdown ↔ Lark (Feishu) document format converter. It parses Markdown into an AST via remark/unified, then transforms it into Lark's proprietary clipboard format (ClipboardData with recordMap, blockIds, apool attribute system). The output can be pasted directly into Feishu documents with full fidelity.

## Commands

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests (only core has tests, uses vitest)
pnpm test

# Run a single test file
pnpm --filter @md-lark-converter/core exec vitest run path/to/test.ts

# Lint (oxlint)
pnpm lint

# Dev mode (web app)
pnpm dev

# Dev mode for specific packages
pnpm --filter @md-lark-converter/core exec tsup --watch
pnpm --filter @md-lark-converter/cli exec tsc --watch

# Release flow
pnpm build && pnpm verify:publish-manifests && pnpm exec changeset publish
```

## Architecture

```
packages/
  core/       → Core conversion library (tsup → cjs+esm+dts)
                Exports: markdownToLark, larkToMarkdown, generateHtml, clipboard utils
  cli/        → CLI tool "md-to-lark" (tsc, depends on core)
  web-app/    → Production web UI (Vite + React 19 + Tailwind)
  web-debug/  → Debug web UI (Vite + React 19 + Tailwind)
apps/
  vscode-extension/ → VSCode extension (esbuild, depends on core)
```

All packages depend on `core` via `workspace:*`. Only `core` and `cli` are published to npm.

### Core Conversion Pipeline

1. **Parse**: `remark-parse` + `remark-gfm` + `remark-math` → MDAST
2. **Convert**: `MarkdownToLarkConverter.convert()` recursively transforms AST nodes into Lark `BlockSnapshot` objects, building `recordMap`, `blockIds`, and text attribute pools (`apool`)
3. **Output**: `ClipboardData` JSON → optionally wrapped in HTML via `generateHtml()` for clipboard paste

Key source files:
- `packages/core/src/converter/markdownToLark.ts` — main conversion logic
- `packages/core/src/htmlGenerator.ts` — HTML wrapper for clipboard format
- `packages/core/src/index.ts` — public API and larkToMarkdown reverse conversion

### Supported Block Types

page, text, heading1-6, quote, bullet, ordered, todo, code, divider, isv (Mermaid), equation, image, table, table_cell

## Tooling

- **pnpm 9.0.0** workspaces (pnpm-workspace.yaml)
- **Changesets** for versioning (`pnpm exec changeset`)
- **oxlint** for linting (.oxlintrc.json)
- **TypeScript 5** with strict mode, target ES2022
- **CI**: GitHub Actions — lint → build → test on Node 18.x/20.x
- `scripts/verify-packed-manifests.mjs` ensures no `workspace:` protocol leaks into published packages
