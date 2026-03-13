# Markdown ↔ 飞书文档转换器

[![English](https://img.shields.io/badge/Language-English-1f6feb.svg)](./README.md)
[![简体中文](https://img.shields.io/badge/%E8%AF%AD%E8%A8%80-%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87-12b886.svg)](./README.zh.md)

![Version](https://img.shields.io/badge/version-1.2.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)

Markdown 与飞书文档格式的双向转换工具。支持将 Markdown 转换为飞书剪贴板格式直接粘贴，也支持抓取飞书文档导出为 Markdown 并自动下载图片。

## 功能特性

- ✅ **双向转换**：Markdown → 飞书 和 飞书 → Markdown
- ✅ **完整支持 Markdown**：标题、列表、引用、代码块、表格、数学公式、Mermaid 图表、图片等
- ✅ **飞书文档抓取**：通过 URL 直接抓取飞书文档并转换为 Markdown
- ✅ **自动下载图片**：自动下载飞书文档中的图片到本地
- ✅ **多种使用方式**：CLI 工具（`md2fs` / `fs2md`）、Web 界面、VSCode 扩展
- ✅ **对剪贴板友好**：一键复制，可直接粘贴到飞书文档
- ✅ **IDE 集成**：支持 OpenCode、Claude Code、VSCode、Cursor
- ✅ **Monorepo 架构**：核心逻辑可复用，易于维护和扩展

## 支持的 Markdown 语法

| 语法 | 示例 | 说明 |
|--------|----------|-------------|
| 标题 | `# Heading` | 支持 1-6 级标题 |
| 粗体 | `**bold**` | 粗体文本 |
| 斜体 | `*italic*` | 斜体文本 |
| 删除线 | `~~strike~~` | 删除线文本 |
| 行内代码 | `` `code` `` | 行内代码 |
| 代码块 | ` ```javascript``` ` | 代码块（支持语法高亮） |
| Mermaid 图表 | ` ```mermaid``` ` | 流程图、时序图等 |
| 数学公式 | `$E=mc^2$` | 行内和块级数学公式（LaTeX） |
| 引用 | `> quote` | 引用块 |
| 无序列表 | `- item` | 无序列表（支持多级） |
| 有序列表 | `1. item` | 有序列表（支持多级） |
| 任务列表 | `- [x] done` | 任务列表 |
| 表格 | `\| a \| b \|` | GFM 表格 |
| 图片 | `![alt](url)` | 图片块 |
| 分割线 | `---` | 水平分隔线 |

## 安装

### 全局安装 CLI

```bash
npm install -g @md-lark-converter/cli
# 或使用 pnpm
pnpm install -g @md-lark-converter/cli
```

### 安装 Agent Skill

为 Claude Code、Cursor、OpenCode 等 AI 编程助手安装技能：

```bash
npx skills add iceprosurface/md-lark-converter
```

安装后，编程助手会自动学会如何转换 Markdown ↔ 飞书文档以及管理飞书 cookie 配置。

### 本地开发

```bash
git clone https://github.com/iceprosurface/md-lark-converter.git
cd md-lark-converter
pnpm install
```

## 使用方式

### CLI 工具

CLI 包提供两个命令：

- **`md2fs`** — 将 Markdown 转换为飞书剪贴板格式
- **`fs2md`** — 抓取飞书文档并转换为 Markdown

#### md2fs：Markdown → 飞书

```bash
# 转换 Markdown 文件（输出 JSON 到标准输出）
md2fs input.md

# 保存为 JSON 文件
md2fs input.md -o output.json

# 从标准输入读取
echo "# Heading" | md2fs --stdin

# 复制到剪贴板（可直接粘贴到飞书文档）
md2fs input.md --copy

# 显示详细输出
md2fs input.md --verbose
```

#### fs2md：飞书 → Markdown

```bash
# 抓取飞书文档并将 Markdown 复制到剪贴板
fs2md https://example.feishu.cn/docx/xxx --cookie "session=..."

# 保存到文件（图片自动下载到 ./images/）
fs2md https://example.feishu.cn/docx/xxx -o output.md --cookie "session=..."

# 跳过图片下载
fs2md https://example.feishu.cn/docx/xxx --no-images --cookie "session=..."

# 使用 FEISHU_COOKIE 环境变量
export FEISHU_COOKIE="session=..."
fs2md https://example.feishu.cn/docx/xxx -o output.md

# 显示详细输出
fs2md https://example.feishu.cn/docx/xxx --verbose --cookie "session=..."
```

### Web 界面

#### 简洁版（面向普通用户）

```bash
pnpm dev
```

访问 http://localhost:5173

**功能**：
- Markdown ↔ 飞书 双向转换
- 简洁清爽的界面
- 一键复制 / 粘贴到剪贴板
- 适合部署到 Vercel

#### 调试版（面向开发者）

```bash
pnpm dev:debug
```

访问 http://localhost:5174

**功能**：
- 完整的转换调试信息
- 剪贴板数据对比
- 实时预览
- 适合开发与测试

### VSCode 扩展

1. 安装扩展（在扩展市场中搜索 `Markdown to Lark Converter`）
2. 打开 Markdown 文件
3. 使用快捷键 `Ctrl+Shift+L`（Windows/Linux）或 `Cmd+Shift+L`（Mac）
4. 或通过右键菜单选择 `Convert Markdown to Lark (飞书)`
5. 在飞书文档中粘贴

### OpenCode / Claude Code

在 IDE 中使用 CLI 工具：

```bash
# 将 Markdown 转换为飞书剪贴板格式
md2fs current.md --copy

# 抓取飞书文档转换为 Markdown
fs2md https://example.feishu.cn/docx/xxx -o doc.md --cookie "session=..."
```

## 项目结构

```
md-lark-converter/
├── packages/
│   ├── core/           # 核心转换逻辑（可复用）
│   │   ├── src/
│   │   │   ├── converter/
│   │   │   │   └── markdownToLark.ts  # Markdown → 飞书 Block 转换
│   │   │   ├── feishuFetcher.ts       # 飞书文档抓取
│   │   │   ├── imageDownloader.ts     # 图片下载工具
│   │   │   ├── htmlGenerator.ts       # 剪贴板 HTML 包装
│   │   │   └── index.ts              # 公开 API（markdownToLark, larkToMarkdown）
│   ├── cli/            # 命令行工具
│   │   ├── md2fs.ts    # Markdown → 飞书 CLI
│   │   └── fs2md.ts    # 飞书 → Markdown CLI
│   ├── web-app/        # Web 简洁版（用户使用 + Vercel 部署）
│   │   ├── src/App.tsx # 双向转换 + 简洁 UI
│   │   ├── index.html
│   │   └── vite.config.ts
│   └── web-debug/      # Web 调试版（开发者使用）
│       ├── src/
│       │   ├── App.tsx
│       │   └── components/DebugComparison.tsx
│       ├── index.html
│       └── vite.config.ts
├── apps/
│   └── vscode-extension/  # VSCode 扩展
│       ├── src/
│       │   └── extension.ts
│       └── package.json
├── package.json
└── pnpm-workspace.yaml
```

## 核心转换逻辑

### 转换流程

1. **解析 Markdown**：使用 `remark-parse` + `remark-gfm` + `remark-math` 将 Markdown 解析为 MDAST
2. **映射块类型**：递归将 AST 节点转换为飞书 `BlockSnapshot` 对象
3. **生成数据结构**：构建 `recordMap`、`blockIds`、`apool` 属性池
4. **生成剪贴板数据**：封装为 `ClipboardData` JSON，可选包装为 HTML 用于剪贴板粘贴

### 飞书数据结构

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

## 开发

### 安装依赖

```bash
pnpm install
```

### 运行测试

```bash
# 测试 core 包
pnpm --filter @md-lark-converter/core test

# 启动 Web 开发服务器
pnpm dev
```

### 构建

```bash
# 构建所有包
pnpm build

# 构建指定包
pnpm --filter @md-lark-converter/web-app build
```

### 代码检查

```bash
pnpm lint
```

## 扩展开发

### 新增 Markdown 语法支持

1. 在 `packages/core/src/converter/markdownToLark.ts` 中新增对应节点类型处理
2. 在对应方法中实现 block 数据生成逻辑

### 新增 IDE 支持

参考 `apps/vscode-extension` 的实现，使用 `@md-lark-converter/core` 包提供的 `MarkdownToLarkConverter` 类。

## 部署

### Vercel（Web 版本）

#### 简洁版（面向普通用户）

```bash
cd packages/web-app
pnpm build
vercel deploy
```

#### 调试版（面向开发者）

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

### 发布到 npm

```bash
# 为需要发版的改动创建 changeset
pnpm changeset

# 在本地应用待发布版本号（可选，通常由 GitHub Action 处理）
pnpm version

# 发布所有待发布的 npm 包
pnpm release
```

当前仓库使用 Changesets，并通过 `.github/workflows/publish-npm.yml` 驱动 GitHub Action 发布流程。

1. 用 `pnpm changeset` 生成变更说明
2. 将包含 changeset 的 PR 合并到 `main`
3. GitHub Action 会自动创建或更新发版 PR
4. 合并发版 PR 后，待发布的 npm 包会自动发布
5. 发布时，Changesets 会为已发布包创建对应的 git tag

当前 workflow 走 npm Trusted Publishing（OIDC）模式，不依赖长期有效的 `NPM_TOKEN`。

需要在 npm 上为每个公开包配置 Trusted Publisher：

- `@md-lark-converter/core`
- `@md-lark-converter/cli`

GitHub Actions 侧需要满足：

- 使用 `.github/workflows/publish-npm.yml`
- 使用 GitHub-hosted runner
- workflow 保留 `permissions.id-token: write`

这个工作流只会发布公开的 npm 包（`@md-lark-converter/core` 和 `@md-lark-converter/cli`）。
在这个 monorepo 里，tag 默认按包维度创建，例如 `@md-lark-converter/core@1.2.3`，而不是只打一个仓库级的 `v1.2.3`。

## 注意事项

- **兼容性**：支持 Node.js >= 18.0.0
- **飞书格式**：当前版本支持飞书文档剪贴板格式
- **文本格式**：支持基础文本格式，复杂的 `apool` 属性格式仍在持续完善
- **图片处理**：`md2fs` 保留图片链接转为飞书格式；`fs2md` 自动下载飞书文档中的图片到本地

## 常见问题

### 问：为什么粘贴后没有正确渲染？

答：请确认 JSON 数据结构完整，尤其是 `text.apool` 和 `text.initialAttributedTexts` 字段。

### 问：为什么 Mermaid 图表没有显示？

答：飞书渲染 Mermaid 图表需要一点时间，请稍等几秒。

### 问：如何提供飞书 cookie 给 fs2md？

答：使用 `--cookie` 选项或设置 `FEISHU_COOKIE` 环境变量。可以在登录飞书后，通过浏览器开发者工具（Network 标签）提取 cookie。

## 技术栈

- **核心逻辑**：TypeScript（ES Modules）
- **Markdown 解析**：remark（unified + remark-parse + remark-gfm + remark-math）
- **CLI 框架**：commander
- **Web 框架**：React 19 + Vite
- **样式方案**：Tailwind CSS
- **包管理器**：pnpm（Workspace）
- **VSCode 扩展**：TypeScript

## 许可证

MIT

## 作者

icepro

## 致谢

感谢 [Lark](https://www.feishu.cn) 提供优秀的文档编辑器。
