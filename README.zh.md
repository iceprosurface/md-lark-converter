# Markdown to Lark Converter

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)

Convert Markdown content to Lark (Feishu) document clipboard format with support for direct pasting. Compatible with OpenCode and Claude Code.

## Features

- ✅ **Complete Markdown Support**: Headings, lists, quotes, code blocks, Mermaid charts, and more
- ✅ **Multiple Usage Methods**: CLI tools, Web interface, VSCode extension
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
| Code blocks | ```javascript``` | Code blocks (with syntax highlighting) |
| Mermaid charts | ```mermaid``` | Flowcharts, sequence diagrams, etc. |
| Quotes | `> quote` | Quote blocks |
| Unordered lists | `- item` | Unordered lists (multi-level supported) |
| Ordered lists | `1. item` | Ordered lists (multi-level supported) |
| Task lists | `- [x] done` | Task lists |
| Horizontal rule | `---` | Horizontal divider |

## Installation

### Global CLI Install

```bash
npm install -g @md-lark-converter/cli
# or using pnpm
pnpm install -g @md-lark-converter/cli
```

### Local Development

```bash
git clone https://github.com/iceprosurface/md-lark-converter.git
cd md-lark-converter
pnpm install
```

## Usage

### CLI Tool

#### Convert Files

```bash
# Convert Markdown file
md-to-lark input.md

# Save as JSON file
md-to-lark input.md -o output.json

# Read from stdin
echo "# Heading" | md-to-lark --stdin

# Copy to clipboard (OpenCode/Claude Code friendly)
md-to-lark input.md --copy
```

#### Verbose Output

```bash
md-to-lark input.md --verbose
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

Use CLI tool in IDE:

```bash
# Convert current file
md-to-lark current.md --copy

# Convert selected content (need to save first)
# Copy output to clipboard, then paste to Lark document
```

## Project Structure

```
md-lark-converter/
├── packages/
│   ├── core/           # Core conversion logic (shared)
│   │   ├── lib/
│   │   │   ├── converter/
│   │   │   │   └── markdownToLark.ts  # Markdown → Lark Block conversion
│   │   │   └── utils/
│   │   │       └── idGenerator.ts       # ID generator
│   │   └── index.ts
│   ├── cli/            # Command line tool
│   │   └── index.ts
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

1. **Parse Markdown**: Use marked library to parse Markdown into tokens
2. **Map Block Types**: Map Markdown tokens to Lark block types
3. **Generate Data Structure**: Build recordMap, blockIds, recordIds
4. **Generate Clipboard Data**: Package as data-lark-record-data format

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

# Test CLI
pnpm --filter @md-lark-converter/cli start

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

1. Add new token type handling in `convertToken` method in `packages/core/lib/converter/markdownToLark.ts`
2. Implement block data generation logic in corresponding `createXXXBlock` method

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
# Publish CLI
pnpm --filter @md-lark-converter/cli publish

# Publish Core
pnpm --filter @md-lark-converter/core publish
```

## Notes

- **Compatibility**: Supports Node.js >= 18.0.0
- **Lark Format**: Current version supports Lark document clipboard format
- **Text Formatting**: Supports basic formats, complex apool attribute format is being refined
- **Image Handling**: Image links are preserved but cannot be automatically uploaded to Lark

## FAQ

### Q: Why doesn't it render after pasting?

A: Ensure the JSON data structure is complete, especially `text.apool` and `text.initialAttributedTexts` fields.

### Q: Mermaid charts not showing?

A: Lark takes time to render Mermaid charts, please wait a few seconds.

### Q: How to support custom ID generation?

A: Modify generation logic in `packages/core/lib/utils/idGenerator.ts`.

## Tech Stack

- **Core Logic**: TypeScript (ES Modules)
- **Markdown Parsing**: marked
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

Thanks to [Lark](https://www.feishu.cn) for providing the excellent document editor.
