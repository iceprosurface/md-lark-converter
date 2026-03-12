# @md-lark-converter/cli

## 1.2.0

### Minor Changes

- f1bb504: feat: support image block conversion in larkToMarkdown with automatic download

  - Add `LarkToMarkdownOptions` with `imageResolver` callback to `larkToMarkdown()`
  - Add `@md-lark-converter/core/image` entry point with `extractImageTokens` and `downloadAllImages`
  - Extend `BlockSnapshot` with `image` field matching Feishu API structure
  - fs2md CLI now downloads images to local `images/` directory during conversion
  - Add `--no-images` flag to skip image downloading

### Patch Changes

- Updated dependencies [f1bb504]
  - @md-lark-converter/core@1.2.0

## 1.1.1

### Patch Changes

- 6512713: Upgrade the repository and GitHub Actions workflows to pnpm 10 so frozen installs use a lockfile format that matches CI.

  Also document the Changesets-based release flow and the move to npm trusted publishing with OIDC.

- Updated dependencies [6512713]
  - @md-lark-converter/core@1.1.1

## 1.1.0

### Minor Changes

- feat: add Feishu document fetcher (`@md-lark-converter/core/feishu`) and `fs2md` CLI; rename `md-to-lark` to `md2fs`

### Patch Changes

- Updated dependencies
  - @md-lark-converter/core@1.1.0

## 1.0.3

### Patch Changes

- 6f42486: Harden package publishing by validating the packed tarballs and republish the workspace packages together so the CLI no longer ships with broken internal dependency metadata.
- Updated dependencies [6f42486]
  - @md-lark-converter/core@1.0.3

## 1.0.2

### Patch Changes

- a3cdff2: Setup Changesets for automated version management and publishing
- f67ca85: update version
- Updated dependencies [a3cdff2]
- Updated dependencies [f67ca85]
  - @md-lark-converter/core@1.0.2

## 1.0.2

### Patch Changes

- a3cdff2: Setup Changesets for automated version management and publishing
- Updated dependencies [a3cdff2]
  - @md-lark-converter/core@1.0.2
