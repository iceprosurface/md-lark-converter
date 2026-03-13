# Markdown ↔ Lark Converter

[![English](https://img.shields.io/badge/Language-English-1f6feb.svg)](./README.md)
[![简体中文](https://img.shields.io/badge/%E8%AF%AD%E8%A8%80-%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87-12b886.svg)](./README.zh.md)

![Version](https://img.shields.io/badge/version-1.2.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)

Bidirectional converter between Markdown and Lark (Feishu) document format. Convert Markdown to Lark clipboard format for direct pasting, or fetch Feishu documents and export them as Markdown with automatic image downloading.

## Features

- ✅ **Bidirectional Conversion**: Markdown → Lark and Lark → Markdown
- ✅ **Complete Markdown Support**: Headings, lists, quotes, code blocks, tables, math equations, Mermaid charts, images, and more
- ✅ **Feishu Document Fetching**: Fetch Feishu documents directly via URL and convert to Markdown
- ✅ **Automatic Image Download**: Download images from Feishu documents to local files
- ✅ **Multiple Usage Methods**: CLI tools (`md2fs` / `fs2md`), Web interface, VSCode extension
- ✅ **Clipboard Friendly**: One-click copy, paste directly to Lark documents
- ✅ **IDE Integration**: Supports OpenCode, Claude Code, VSCode, Cursor
- ✅ **Monorepo Architecture**: Reusable core logic, easy to maintain and extend

## Supported Markdown Syntax

| Syntax | Example | Description |
|--------|----------|-------------|
| Headings | `# Heading` | Supports 1-6 level headings |
| Bold | `**bold**` | Bold text |
| Italic | `*italic*` | Italic text |
| Strikethrough | `~~strike~~` | Strikethrough text |
| Code | `` `code` `` | Inline code |
| Code blocks | ` ```javascript``` ` | Code blocks (with syntax highlighting) |
| Mermaid charts | ` ```mermaid``` ` | Flowcharts, sequence diagrams, etc. |
| Math equations | `$E=mc^2$` | Inline and block math (LaTeX) |
| Quotes | `> quote` | Quote blocks |
| Unordered lists | `- item` | Unordered lists (multi-level supported) |
| Ordered lists | `1. item` | Ordered lists (multi-level supported) |
| Task lists | `- [x] done` | Task lists |
| Tables | `\| a \| b \|` | GFM tables |
| Images | `![alt](url)` | Image blocks |
| Horizontal rule | `---` | Horizontal divider |

## Installation

### Global CLI Install

```bash
npm install -g @md-lark-converter/cli
# or using pnpm
pnpm install -g @md-lark-converter/cli
```

### Agent Skill Install

Install the agent skill for Claude Code, Cursor, OpenCode, and other AI coding agents:

```bash
npx skills add iceprosurface/md-lark-converter
```

This adds the `markdown-to-feishu` skill so your coding agent knows how to convert Markdown ↔ Feishu documents and manage Feishu cookies.

### Local Development

```bash
git clone https://github.com/iceprosurface/md-lark-converter.git
cd md-lark-converter
pnpm install
```

## Usage

### CLI Tools

The CLI package provides two commands:

- **`md2fs`** — Convert Markdown to Lark (Feishu) clipboard format
- **`fs2md`** — Fetch a Feishu document and convert to Markdown

#### md2fs: Markdown → Lark

```bash
# Convert Markdown file (output JSON to stdout)
md2fs input.md

# Save as JSON file
md2fs input.md -o output.json

# Read from stdin
echo "# Heading" | md2fs --stdin

# Copy to clipboard (paste directly to Lark document)
md2fs input.md --copy

# Show detailed output
md2fs input.md --verbose
```

#### fs2md: Feishu → Markdown

```bash
# Fetch Feishu document and copy Markdown to clipboard
fs2md https://example.feishu.cn/docx/xxx --cookie "session=..."

# Save to file (images downloaded to ./images/)
fs2md https://example.feishu.cn/docx/xxx -o output.md --cookie "session=..."

# Skip image downloading
fs2md https://example.feishu.cn/docx/xxx --no-images --cookie "session=..."

# Use FEISHU_COOKIE environment variable
export FEISHU_COOKIE="session=..."
fs2md https://example.feishu.cn/docx/xxx -o output.md

# Show detailed output
fs2md https://example.feishu.cn/docx/xxx --verbose --cookie "session=..."
```

### Web Interface

#### Simple Version (For Users)

```bash
pnpm dev
```

Visit http://localhost:5173

**Features**:
- Markdown ↔ Lark bidirectional conversion
- Clean minimalist interface
- One-click copy/paste to clipboard
- Suitable for Vercel deployment

#### Debug Version (For Developers)

```bash
pnpm dev:debug
```

Visit http://localhost:5174

**Features**:
- Complete conversion debug info
- Clipboard data comparison
- Real-time preview
- Suitable for development and testing

### VSCode Extension

1. Install extension (search "Markdown to Lark Converter" in marketplace)
2. Open Markdown file
3. Use shortcut `Ctrl+Shift+L` (Windows/Linux) or `Cmd+Shift+L` (Mac)
4. Or right-click menu and select "Convert Markdown to Lark (飞书)"
5. Paste in Lark document

### OpenCode / Claude Code

Use CLI tools in IDE:

```bash
# Convert Markdown to Lark clipboard format
md2fs current.md --copy

# Fetch Feishu document to Markdown
fs2md https://example.feishu.cn/docx/xxx -o doc.md --cookie "session=..."
```

## Project Structure

```
md-lark-converter/
├── packages/
│   ├── core/           # Core conversion logic (shared)
│   │   ├── src/
│   │   │   ├── converter/
│   │   │   │   └── markdownToLark.ts  # Markdown → Lark Block conversion
│   │   │   ├── feishuFetcher.ts       # Feishu document fetcher
│   │   │   ├── imageDownloader.ts     # Image download utilities
│   │   │   ├── htmlGenerator.ts       # HTML wrapper for clipboard
│   │   │   └── index.ts              # Public API (markdownToLark, larkToMarkdown)
│   ├── cli/            # Command line tools
│   │   ├── md2fs.ts    # Markdown → Lark CLI
│   │   └── fs2md.ts    # Feishu → Markdown CLI
│   ├── web-app/        # Web simple version (for users + Vercel deployment)
│   │   ├── src/App.tsx # Bidirectional conversion + clean UI
│   │   ├── index.html
│   │   └── vite.config.ts
│   └── web-debug/      # Web Debug version (for developers)
│       ├── src/
│       │   ├── App.tsx
│       │   └── components/DebugComparison.tsx
│       ├── index.html
│       └── vite.config.ts
├── apps/
│   └── vscode-extension/  # VSCode extension
│       ├── src/
│       │   └── extension.ts
│       └── package.json
├── package.json
└── pnpm-workspace.yaml
```

## Core Conversion Logic

### Conversion Process

1. **Parse Markdown**: Use `remark-parse` + `remark-gfm` + `remark-math` to parse Markdown into MDAST
2. **Map Block Types**: Recursively transform AST nodes into Lark `BlockSnapshot` objects
3. **Generate Data Structure**: Build `recordMap`, `blockIds`, `apool` attribute pools
4. **Generate Clipboard Data**: Package as `ClipboardData` JSON, optionally wrap in HTML for clipboard paste

### Lark Data Structure

```json
{
  "isCut": false,
  "rootId": "pageId",
  "parentId": "pageId",
  "blockIds": [1, 2, 3, ...],
  "recordIds": ["doxcn...", ...],
  "recordMap": {
    "doxcn...": {
      "id": "doxcn...",
      "snapshot": {
        "type": "text",
        "parent_id": "rootId",
        "text": { ... }
      }
    }
  },
  "extra": { ... }
}
```

## Development

### Install Dependencies

```bash
pnpm install
```

### Run Tests

```bash
# Test core package
pnpm --filter @md-lark-converter/core test

# Run web dev server
pnpm dev
```

### Build

```bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter @md-lark-converter/web-app build
```

### Lint

```bash
pnpm lint
```

## Extension Development

### Adding New Markdown Syntax Support

1. Add new node type handling in `packages/core/src/converter/markdownToLark.ts`
2. Implement block data generation logic in corresponding method

### Adding New IDE Support

Reference `apps/vscode-extension` implementation, use `MarkdownToLarkConverter` class provided by `@md-lark-converter/core` package.

## Deployment

### Vercel (Web Version)

#### Simple Version (For Users)

```bash
cd packages/web-app
pnpm build
vercel deploy
```

#### Debug Version (For Developers)

```bash
cd packages/web-debug
pnpm build
vercel deploy
```

### VSCode Marketplace

```bash
cd apps/vscode-extension
vsce package
vsce publish
```

### npm Publish

```bash
# Create a changeset for a release-worthy change
pnpm changeset

# Apply pending version bumps locally (optional, usually done by GitHub Action)
pnpm version

# Publish all pending package releases
pnpm release
```

This repository uses Changesets together with `.github/workflows/publish-npm.yml`.

1. Add a changeset file with `pnpm changeset`
2. Merge the PR into `main`
3. The GitHub Action opens or updates a release PR
4. Merging that release PR publishes pending npm packages automatically
5. During publish, Changesets creates git tags for the published package versions

This workflow uses npm Trusted Publishing (OIDC), so it does not require a long-lived `NPM_TOKEN` for publishing.

Configure a Trusted Publisher on npm for each public package:

- `@md-lark-converter/core`
- `@md-lark-converter/cli`

GitHub Actions requirements:

- workflow filename: `.github/workflows/publish-npm.yml`
- GitHub-hosted runner
- `permissions.id-token: write`

The workflow only publishes the public npm packages (`@md-lark-converter/core` and `@md-lark-converter/cli`).
In this monorepo, published package tags are package-scoped (for example `@md-lark-converter/core@1.2.3`) rather than a single repo-wide `v1.2.3` tag.

## Notes

- **Compatibility**: Supports Node.js >= 18.0.0
- **Lark Format**: Current version supports Lark document clipboard format
- **Text Formatting**: Supports basic formats, complex apool attribute format is being refined
- **Image Handling**: `md2fs` preserves image links in Lark format; `fs2md` automatically downloads images from Feishu documents to local files

## FAQ

### Q: Why doesn't it render after pasting?

A: Ensure that JSON data structure is complete, especially `text.apool` and `text.initialAttributedTexts` fields.

### Q: Mermaid charts not showing?

A: Lark takes time to render Mermaid charts, please wait a few seconds.

### Q: How to provide Feishu cookie for fs2md?

A: Use `--cookie` option or set the `FEISHU_COOKIE` environment variable. You can extract the cookie from your browser's DevTools (Network tab) after logging into Feishu.

## Tech Stack

- **Core Logic**: TypeScript (ES Modules)
- **Markdown Parsing**: remark (unified + remark-parse + remark-gfm + remark-math)
- **CLI Framework**: commander
- **Web Framework**: React 19 + Vite
- **Styling**: Tailwind CSS
- **Package Manager**: pnpm (Workspace)
- **VSCode Extension**: TypeScript

## License

MIT

## Author

icepro

## Acknowledgments

Thanks to [Lark](https://www.feishu.cn) for providing an excellent document editor.
