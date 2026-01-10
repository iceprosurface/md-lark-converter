import * as vscode from 'vscode';
import { MarkdownToLarkConverter } from '@md-lark-converter/core';

export function activate(context: vscode.ExtensionContext) {
  console.log('Markdown to Lark Converter is now active!');

  const disposable = vscode.commands.registerCommand(
    'md-lark.convertToLark',
    async () => {
      const editor = vscode.window.activeTextEditor;

      if (!editor) {
        vscode.window.showErrorMessage('No active editor found');
        return;
      }

      const document = editor.document;
      const selection = editor.selection;
      const markdown = document.getText(selection.isEmpty ? undefined : selection);

      try {
        const converter = new MarkdownToLarkConverter();
        const result = converter.convert(markdown);

        await vscode.env.clipboard.writeText(JSON.stringify(result));

        vscode.window.showInformationMessage(
          'Converted! Clipboard ready. Paste in Lark (飞书) document.'
        );
      } catch (error) {
        vscode.window.showErrorMessage(`Conversion failed: ${error.message}`);
      }
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
