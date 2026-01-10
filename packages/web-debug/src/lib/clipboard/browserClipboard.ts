// Browser clipboard operations for web environments

export interface ClipboardData {
  isCut: boolean;
  rootId: string;
  parentId: string;
  blockIds: number[];
  recordIds: string[];
  recordMap: Record<string, RecordData>;
  payloadMap: Record<string, unknown>;
  selection: unknown[];
  extra: {
    channel: string;
    pasteRandomId: string;
    mention_page_title: Record<string, string>;
    external_mention_url: Record<string, string>;
    isEqualBlockSelection: boolean;
  };
  isKeepQuoteContainer: boolean;
  pasteFlag: string;
}

export interface RecordData {
  id: string;
  snapshot: {
    type: string;
    parent_id: string;
    comments: unknown[] | null;
    revisions: unknown[] | null;
    locked: boolean;
    hidden: boolean;
    author: string;
    children: string[];
    text?: TextData;
    align?: string;
    page_style?: Record<string, unknown>;
    title?: TextData;
    level?: number;
    folded?: boolean;
    checked?: boolean;
    seq?: string;
    language?: string;
    code?: string;
    data?: {
      data: string;
      theme: string;
      view: string;
    };
    app_block_id?: string;
    block_type_id?: string;
    manifest?: {
      view_type: string;
      app_version: string;
    };
    comment_details?: Record<string, unknown>;
    interaction_data_token?: string;
  };
}

export interface TextData {
  apool: {
    nextNum: number;
    numToAttrib: Record<string, unknown>;
    attribToNum?: Record<string, number>;
  };
  initialAttributedTexts: {
    attribs: string | Record<string, string>;
    text: Record<string, string>;
    rows?: Record<string, unknown>;
    cols?: Record<string, unknown>;
  };
}

export async function writeToClipboard(html: string, jsonData: ClipboardData): Promise<boolean> {
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

function extractPlainTextFromData(data: ClipboardData): string {
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

function getTextContent(textData?: TextData): string {
  if (!textData || !textData.initialAttributedTexts) {
    return '';
  }
  const texts = textData.initialAttributedTexts.text;
  return Object.values(texts).join('');
}

export async function readClipboard(): Promise<Record<string, string>> {
  try {
    const clipboardItems = await navigator.clipboard.read();
    const results: Record<string, string> = {};

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
