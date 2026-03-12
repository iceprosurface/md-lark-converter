---
"@md-lark-converter/core": minor
"@md-lark-converter/cli": minor
---

feat: support image block conversion in larkToMarkdown with automatic download

- Add `LarkToMarkdownOptions` with `imageResolver` callback to `larkToMarkdown()`
- Add `@md-lark-converter/core/image` entry point with `extractImageTokens` and `downloadAllImages`
- Extend `BlockSnapshot` with `image` field matching Feishu API structure
- fs2md CLI now downloads images to local `images/` directory during conversion
- Add `--no-images` flag to skip image downloading
