import * as vscode from 'vscode';
import { MarkdownToLarkConverter, larkToMarkdown, ClipboardData, generateHtml, writeHtmlToClipboard } from '@md-lark-converter/core';

export function activate(context: vscode.ExtensionContext) {
  console.log('Markdown to Lark Converter is now active!');

  // 命令：复制到 Lark
  const copyToLark = vscode.commands.registerCommand(
    'md-lark.copyToLark',
    async () => {
      const editor = vscode.window.activeTextEditor;

      if (!editor) {
        vscode.window.showErrorMessage('没有打开的编辑器');
        return;
      }

      const document = editor.document;
      const selection = editor.selection;
      const markdown = document.getText(selection.isEmpty ? undefined : selection);

      try {
        const converter = new MarkdownToLarkConverter();
        const result = await converter.convert(markdown);

        // 生成 HTML 格式（飞书需要的格式）
        const html = generateHtml(result);

        // 尝试写入富文本格式到剪贴板
        try {
          await writeHtmlToClipboard(html);
          vscode.window.showInformationMessage(
            '已转换为富文本格式并复制到剪贴板！可以在飞书文档中粘贴。'
          );
        } catch (htmlError) {
          // 如果富文本写入失败，回退到纯文本
          console.warn('富文本写入失败，回退到纯文本:', htmlError);
          await vscode.env.clipboard.writeText(html);
          vscode.window.showInformationMessage(
            '已转换并复制到剪贴板（纯文本格式）！可以在飞书文档中粘贴。'
          );
        }
      } catch (error) {
        vscode.window.showErrorMessage(`转换失败: ${(error as Error).message}`);
      }
    }
  );

  // 命令：从 Lark 粘贴
  const pasteFromLark = vscode.commands.registerCommand(
    'md-lark.pasteFromLark',
    async () => {
      const editor = vscode.window.activeTextEditor;

      if (!editor) {
        vscode.window.showErrorMessage('没有打开的编辑器');
        return;
      }

      try {
        const clipboardText = await vscode.env.clipboard.readText();

        if (!clipboardText) {
          vscode.window.showErrorMessage('剪贴板为空');
          return;
        }

        // 从 HTML 中提取 Lark 数据
        let larkData: ClipboardData;

        // 检查是否是 HTML 格式（包含 data-lark-record-data）
        const match = clipboardText.match(/data-lark-record-data="([^"]+)"/);

        if (match && match[1]) {
          // 解码 HTML 实体
          let decoded = decodeURIComponent(match[1]);
          decoded = decoded
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&#39;/g, "'")
            .replace(/&#x27;/g, "'")
            .replace(/&#x3D;/g, "=");

          try {
            larkData = JSON.parse(decoded);
          } catch (parseError) {
            vscode.window.showErrorMessage('飞书数据解析失败');
            return;
          }
        } else {
          // 尝试直接解析为 JSON（用于测试）
          try {
            larkData = JSON.parse(clipboardText);
          } catch (parseError) {
            vscode.window.showErrorMessage('剪贴板内容不是有效的 Lark 格式，请从飞书文档复制内容');
            return;
          }
        }

        // 转换为 Markdown
        const markdown = larkToMarkdown(larkData);

        if (!markdown) {
          vscode.window.showErrorMessage('转换失败：无法从 Lark 数据生成 Markdown');
          return;
        }

        // 插入到当前位置
        const selection = editor.selection;
        await editor.edit(editBuilder => {
          editBuilder.replace(selection, markdown);
        });

        vscode.window.showInformationMessage(
          '已从飞书格式转换并粘贴到编辑器！'
        );
      } catch (error) {
        vscode.window.showErrorMessage(`粘贴失败: ${(error as Error).message}`);
      }
    }
  );

  context.subscriptions.push(copyToLark, pasteFromLark);
}

export function deactivate() {}
