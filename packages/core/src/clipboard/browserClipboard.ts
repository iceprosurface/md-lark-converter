/// <reference lib="dom" />

export interface ClipboardResult {
  [mimeType: string]: string;
}

export async function writeToClipboard(html: string, jsonData: any): Promise<boolean> {
  try {
    const plainText = extractPlainTextFromData(jsonData);

    const clipboardItem = new ClipboardItem({
      'text/html': new Blob([html], { type: 'text/html' }),
      'text/plain': new Blob([plainText], { type: 'text/plain' })
    });

    await navigator.clipboard.write([clipboardItem]);
    return true;
  } catch (error) {
    console.error('Failed to write to clipboard:', error);
    throw new Error(`写入剪贴板失败: ${(error as Error).message}`);
  }
}

function extractPlainTextFromData(data: any): string {
  let text = '';
  for (const recordId of data.recordIds) {
    const record = data.recordMap[recordId];
    if (!record) continue;

    const snapshot = record.snapshot;
    const type = snapshot.type;

    if (type === 'isv') {
      text += '[Mermaid 图表]\n';
    } else if (type === 'code') {
      text += `\`\`\`${snapshot.language || 'text'}\n${snapshot.code}\n\`\`\`\n`;
    } else if (type === 'divider') {
      text += '---\n';
    } else if (type.startsWith('heading')) {
      const level = parseInt(type.replace('heading', ''));
      text += `${'#'.repeat(level)} ${getTextContent(snapshot.text)}\n\n`;
    } else if (type === 'text' || type === 'quote') {
      text += `${getTextContent(snapshot.text)}\n\n`;
    } else if (type === 'bullet' || type === 'ordered' || type === 'todo') {
      const marker = type === 'bullet' ? '-' : (type === 'ordered' ? '1.' : (snapshot.checked ? '- [x]' : '- [ ]'));
      text += `${marker} ${getTextContent(snapshot.text)}\n`;
    }
  }

  return text.trim();
}

interface TextData {
  initialAttributedTexts?: {
    text: Record<string, string>;
  };
}

function getTextContent(textData: TextData): string {
  if (!textData || !textData.initialAttributedTexts) {
    return '';
  }
  const texts = textData.initialAttributedTexts.text;
  return Object.values(texts).join('');
}

export async function readClipboard(): Promise<ClipboardResult> {
  try {
    const clipboardItems = await navigator.clipboard.read();
    const results: ClipboardResult = {};

    for (const item of clipboardItems) {
      for (const type of item.types) {
        const blob = await item.getType(type);
        if (type.startsWith('text/')) {
          const text = await blob.text();
          results[type] = text;
        }
      }
    }

    return results;
  } catch (error) {
    console.error('Failed to read clipboard:', error);
    throw new Error(`读取剪贴板失败: ${(error as Error).message}`);
  }
}
