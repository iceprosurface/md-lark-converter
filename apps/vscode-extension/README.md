# Markdown to Lark Converter - VSCode 扩展

一个将 Markdown 与飞书（Lark）文档格式互相转换的 VSCode 扩展。

## 功能特性

- ✅ **复制到 Lark**：将 Markdown 转换为飞书格式并复制到剪贴板
- ✅ **从 Lark 粘贴**：将飞书格式转换为 Markdown 并粘贴到编辑器
- ✅ 只在 Markdown 文件中显示右键菜单选项
- ✅ 支持选中文本转换或全文转换

## 使用方法

### 方法一：右键菜单（推荐）

1. 在 VSCode 中打开任意 Markdown 文件（`.md` 文件）
2. 右键点击编辑器，在菜单中找到：
   - **复制到 Lark** - 将当前选中的 Markdown（或全文）转换为飞书格式
   - **从 Lark 粘贴** - 将剪贴板中的飞书格式转换为 Markdown

### 方法二：命令面板

1. 按 `Cmd+Shift+P`（Mac）或 `Ctrl+Shift+P`（Windows/Linux）打开命令面板
2. 输入以下命令之一：
   - `Markdown to Lark: 复制到 Lark`
   - `Markdown to Lark: 从 Lark 粘贴`

## 工作流程示例

### Markdown → 飞书

1. 在 VSCode 中编写或打开 Markdown 文档
2. 选中要转换的内容（不选则转换全文）
3. 右键选择 **复制到 Lark**
4. 打开飞书文档，按 `Cmd+V`（或 `Ctrl+V`）粘贴

### 飞书 → Markdown

1. 在飞书文档中选中要复制的内容
2. 按 `Cmd+C`（或 `Ctrl+C`）复制
3. 在 VSCode 的 Markdown 文件中，右键选择 **从 Lark 粘贴**
4. 飞书内容将自动转换为 Markdown 并插入

## 自定义快捷键

虽然扩展默认不配置快捷键，但你可以根据个人习惯自定义快捷键。

### 配置步骤

1. 打开 VSCode 的键盘快捷键设置：
   - Mac: `Cmd+K Cmd+S`
   - Windows/Linux: `Ctrl+K Ctrl+S`

2. 在搜索框中输入 `md-lark` 查找相关命令

3. 点击命令左侧的 `+` 号添加快捷键

### 推荐的快捷键配置

你可以手动添加以下快捷键（或选择你喜欢的组合）：

#### 方式一：通过 UI 配置
按照上述步骤在快捷键设置界面手动配置。

#### 方式二：编辑 keybindings.json

1. 按 `Cmd+Shift+P`（或 `Ctrl+Shift+P`）打开命令面板
2. 输入 `Preferences: Open Keyboard Shortcuts (JSON)` 并回车
3. 添加以下配置：

```json
[
  {
    "key": "cmd+shift+l",           // Mac
    "command": "md-lark.copyToLark",
    "when": "editorLangId == markdown"
  },
  {
    "key": "ctrl+shift+l",          // Windows/Linux
    "command": "md-lark.copyToLark",
    "when": "editorLangId == markdown"
  },
  {
    "key": "cmd+shift+v",           // Mac
    "command": "md-lark.pasteFromLark",
    "when": "editorLangId == markdown"
  },
  {
    "key": "ctrl+shift+v",          // Windows/Linux
    "command": "md-lark.pasteFromLark",
    "when": "editorLangId == markdown"
  }
]
```

**注意**：
- `when` 条件确保快捷键只在 Markdown 文件中生效
- 如果快捷键冲突，VSCode 会提示你，你可以选择其他组合键

### 常用快捷键建议

| 功能 | Mac | Windows/Linux | 说明 |
|------|-----|---------------|------|
| 复制到 Lark | `Cmd+Shift+L` | `Ctrl+Shift+L` | L 代表 Lark |
| 从 Lark 粘贴 | `Cmd+Shift+V` | `Ctrl+Shift+V` | V 代表粘贴 |

## 支持的 Markdown 语法

- 标题（H1-H6）
- 段落
- 粗体、斜体、删除线
- 链接
- 无序列表、有序列表
- 待办事项（Todo）
- 引用块
- 代码块（支持语法高亮）
- 分隔线
- 数学公式（行内公式、块级公式）
- 表格
- Mermaid 图表

## 开发

### 构建扩展

```bash
# 在项目根目录
pnpm install

# 构建 core 包
pnpm --filter @md-lark-converter/core build

# 构建扩展
cd apps/vscode-extension
pnpm build
```

### 调试

1. 在 VSCode 中打开 `apps/vscode-extension` 目录
2. 按 F5 启动调试
3. 在新打开的 VSCode 窗口中测试扩展

## 许可证

MIT

## 作者

icepro
