# Markdown to Lark Converter

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)

将 Markdown 内容转换为飞书文档剪贴板格式，支持直接粘贴到飞书文档中使用。兼容 OpenCode 和 Claude Code。

## 功能特性

- ✅ **完整的 Markdown 支持**：标题、列表、引用、代码块、Mermaid 图表等
- ✅ **多种使用方式**：CLI 工具、Web 界面、VSCode 插件
- ✅ **剪贴板友好**：一键复制，直接粘贴到飞书文档
- ✅ **IDE 集成**：支持 OpenCode、Claude Code、VSCode、Cursor
- ✅ **Monorepo 架构**：核心逻辑可复用，易于维护和扩展

## 支持的 Markdown 语法

| 语法 | 示例 | 说明 |
|------|--------|------|
| 标题 | `# 标题` | 支持 1-6 级标题 |
| 粗体 | `**粗体**` | 加粗文本 |
| 斜体 | `*斜体*` | 斜体文本 |
| 删除线 | `~~删除~~` | 删除线文本 |
| 代码 | `` `代码` `` | 行内代码 |
| 代码块 | ```javascript``` | 代码块（支持语法高亮） |
| Mermaid 图表 | ```mermaid``` | 流程图、时序图等 |
| 引用 | `> 引用` | 引用块 |
| 无序列表 | `- 项目` | 无序列表（支持多级） |
| 有序列表 | `1. 项目` | 有序列表（支持多级） |
| 任务列表 | `- [x] 已完成` | 任务列表 |
| 分隔线 | `---` | 水平分隔线 |

## 安装

### 全局安装 CLI

```bash
npm install -g @md-lark-converter/cli
# 或使用 pnpm
pnpm install -g @md-lark-converter/cli
```

### 本地开发

```bash
git clone https://github.com/icepro/md-lark-converter.git
cd md-lark-converter
pnpm install
```

## 使用方法

### CLI 命令行工具

#### 转换文件

```bash
# 转换 Markdown 文件
md-to-lark input.md

# 保存为 JSON 文件
md-to-lark input.md -o output.json

# 从标准输入读取
echo "# 标题" | md-to-lark --stdin

# 复制到剪贴板（OpenCode/Claude Code 友好）
md-to-lark input.md --copy
```

#### 详细输出

```bash
md-to-lark input.md --verbose
```

### Web 界面

#### 简化版（用户使用）

```bash
pnpm dev
```

访问 http://localhost:5173

**功能**：
- Markdown ↔ Lark 双向转换
- 简洁的纯色界面
- 一键复制/粘贴到剪贴板
- 适合 Vercel 部署

#### Debug 版本（开发者使用）

```bash
pnpm dev:debug
```

访问 http://localhost:5174

**功能**：
- 完整的转换调试信息
- 剪贴板数据对比
- 实时预览
- 适合开发和测试

### VSCode 插件

1. 安装插件（市场搜索 "Markdown to Lark Converter"）
2. 打开 Markdown 文件
3. 使用快捷键 `Ctrl+Shift+L` (Windows/Linux) 或 `Cmd+Shift+L` (Mac)
4. 或者右键菜单选择 "Convert Markdown to Lark (飞书)"
5. 粘贴到飞书文档中

### OpenCode / Claude Code

在 IDE 中使用 CLI 工具：

```bash
# 转换当前文件
md-to-lark current.md --copy

# 转换选中内容（需要先保存）
# 将输出复制到剪贴板，粘贴到飞书文档
```

## 项目结构

```
md-lark-converter/
├── packages/
│   ├── core/           # 核心转换逻辑（通用）
│   │   ├── lib/
│   │   │   ├── converter/
│   │   │   │   └── markdownToLark.js  # Markdown → Lark Block 转换
│   │   │   └── utils/
│   │   │       └── idGenerator.js     # ID 生成器
│   │   └── index.js
│   ├── cli/            # 命令行工具
│   │   └── index.js
│   ├── web-app/        # Web 简化版（用户使用 + Vercel 部署）
│   │   ├── src/App.jsx # 双向转换 + 简洁 UI
│   │   ├── index.html
│   │   └── vite.config.js
│   └── web/            # Web Debug 版（开发者使用）
│       ├── src/
│       │   ├── App.jsx
│       │   └── components/DebugComparison.jsx
│       ├── index.html
│       └── vite.config.js
├── apps/
│   └── vscode-extension/  # VSCode 插件
│       ├── src/
│       │   └── extension.ts
│       └── package.json
├── package.json
└── pnpm-workspace.yaml
```

## 核心转换逻辑

### 转换流程

1. **解析 Markdown**：使用 marked 库解析 Markdown 为 tokens
2. **映射块类型**：将 Markdown tokens 映射到飞书 block 类型
3. **生成数据结构**：构建 recordMap、blockIds、recordIds
4. **生成剪贴板数据**：打包为 data-lark-record-data 格式

### 飞书数据结构

```json
{
  "isCut": false,
  "rootId": "页面ID",
  "parentId": "页面ID",
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
# 测试核心包
pnpm --filter @md-lark-converter/core test

# 测试 CLI
pnpm --filter @md-lark-converter/cli start

# 运行 Web 开发服务器
pnpm dev
```

### 构建

```bash
# 构建所有包
pnpm build

# 构建特定包
pnpm --filter @md-lark-converter/web build
```

### 代码检查

```bash
pnpm lint
```

## 扩展开发

### 添加新的 Markdown 语法支持

1. 在 `packages/core/lib/converter/markdownToLark.js` 的 `convertToken` 方法中添加新的 token 类型处理
2. 在相应的 `createXXXBlock` 方法中实现块数据生成逻辑

### 添加新的 IDE 支持

参考 `apps/vscode-extension` 的实现，使用 `@md-lark-converter/core` 包提供的 `MarkdownToLarkConverter` 类。

## 部署

### Vercel (Web 版本)

#### 简化版（用户使用）

```bash
cd packages/web-app
pnpm build
vercel deploy
```

#### Debug 版本（开发者使用）

```bash
cd packages/web
pnpm build
vercel deploy
```

### VSCode 市场

```bash
cd apps/vscode-extension
vsce package
vsce publish
```

### npm 发布

```bash
# 发布 CLI
pnpm --filter @md-lark-converter/cli publish

# 发布 Core
pnpm --filter @md-lark-converter/core publish
```

## 注意事项

- **兼容性**：支持 Node.js >= 18.0.0
- **飞书格式**：当前版本支持飞书文档剪贴板格式
- **文本格式**：支持基本格式，复杂的 apool 属性格式持续完善中
- **图片处理**：图片链接会被保留，但无法自动上传到飞书

## 常见问题

### Q: 为什么粘贴后没有渲染？

A: 确保 JSON 数据结构完整，特别是 `text.apool` 和 `text.initialAttributedTexts` 字段。

### Q: Mermaid 图表不显示？

A: 飞书需要时间渲染 Mermaid 图表，请稍等几秒。

### Q: 如何支持自定义 ID 生成？

A: 修改 `packages/core/lib/utils/idGenerator.js` 中的生成逻辑。

## 技术栈

- **核心逻辑**：JavaScript (ES Modules)
- **Markdown 解析**：marked
- **CLI 框架**：commander
- **Web 框架**：React 19 + Vite
- **样式框架**：Tailwind CSS
- **包管理器**：pnpm (Workspace)
- **VSCode 插件**：TypeScript

## License

MIT

## 作者

icepro

## 致谢

感谢 [飞书](https://www.feishu.cn) 提供优秀的文档编辑器。
