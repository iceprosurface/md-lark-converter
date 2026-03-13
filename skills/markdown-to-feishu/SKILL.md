---
name: markdown-to-feishu
description: Convert Markdown documents to Feishu (Lark) clipboard format for direct pasting, or fetch Feishu documents and export as Markdown. Use when the user wants to publish Markdown content to Feishu, convert Feishu docs to Markdown, or manage Feishu authentication cookies.
---

# Markdown ↔ Feishu Converter

This skill provides bidirectional conversion between Markdown and Feishu (Lark) documents using the `@md-lark-converter/cli` package.

## Prerequisites

Ensure the CLI is installed:

```bash
npm install -g @md-lark-converter/cli
```

This provides two commands: `md2fs` (Markdown → Feishu) and `fs2md` (Feishu → Markdown).

## When to Use

- User wants to publish a Markdown file or content to Feishu
- User wants to convert a Feishu document to Markdown
- User asks to "paste to Feishu", "send to Lark", or "export from Feishu"
- User needs to set up Feishu authentication

## Feishu Cookie Setup

Before using `fs2md` (fetching from Feishu), a valid session cookie is required. The cookie is read in this priority order:

1. `--cookie` CLI flag
2. `FEISHU_COOKIE` environment variable
3. Config file `~/.md-lark-converter.json`

### How to Get the Cookie

Guide the user through these steps:

1. Open Feishu in a browser (e.g. `https://xxx.feishu.cn`)
2. Log in to their account
3. Open browser DevTools (`F12` or `Cmd+Option+I`)
4. Go to the **Network** tab
5. Navigate to any Feishu document
6. Click on any request to `feishu.cn`
7. In the request headers, find the `Cookie` header
8. Copy the **entire** cookie string

### Save Cookie to Config File

After obtaining the cookie, save it to `~/.md-lark-converter.json` so the user doesn't need to pass it every time:

```bash
cat > ~/.md-lark-converter.json << 'EOF'
{
  "cookie": "PASTE_COOKIE_STRING_HERE"
}
EOF
```

Or use a one-liner:

```bash
echo '{"cookie":"PASTE_COOKIE_STRING_HERE"}' > ~/.md-lark-converter.json
```

**Important**: The cookie expires periodically. If `fs2md` returns authentication errors, the user needs to repeat the steps above to get a fresh cookie.

## Markdown → Feishu (md2fs)

Convert a Markdown file and copy to clipboard for pasting into Feishu:

```bash
# Copy to clipboard — paste directly into Feishu document
md2fs <file.md> --copy

# Read from stdin
echo "# Hello" | md2fs --stdin --copy

# Save as JSON file instead
md2fs <file.md> -o output.json
```

After running `md2fs --copy`, tell the user to paste (`Cmd+V` / `Ctrl+V`) directly into a Feishu document.

## Feishu → Markdown (fs2md)

Fetch a Feishu document and convert to Markdown:

```bash
# Save to file (images auto-downloaded to ./images/)
fs2md <feishu-url> -o output.md

# Copy Markdown to clipboard
fs2md <feishu-url>

# Skip image downloading
fs2md <feishu-url> -o output.md --no-images
```

### Supported URL Formats

- `https://xxx.feishu.cn/docx/TOKEN` — Feishu docx documents
- `https://xxx.feishu.cn/wiki/TOKEN` — Feishu wiki pages (auto-resolved to underlying docx)

### Image Handling

By default, `fs2md` automatically downloads all images from the Feishu document:

- Images are saved to an `images/` directory next to the output file
- Markdown image references are rewritten to `./images/filename.png`
- Use `--no-images` to skip downloading

## Workflow Example

When the user says "convert this document to Feishu":

1. Identify the Markdown file path
2. Run `md2fs <path> --copy`
3. Tell the user the content is in their clipboard, ready to paste into Feishu

When the user says "export this Feishu doc as Markdown":

1. Get the Feishu document URL from the user
2. Check if cookie is configured: `cat ~/.md-lark-converter.json 2>/dev/null`
3. If no cookie, guide the user through the cookie setup steps above
4. Run `fs2md <url> -o <output-path>`
5. Report the saved file path and number of images downloaded
