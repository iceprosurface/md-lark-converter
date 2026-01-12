import { MarkdownToLarkConverter } from "./converter/markdownToLark.js";
export { MarkdownToLarkConverter } from "./converter/markdownToLark.js";

export { generateBlockId, generateRecordId, generatePageId } from "./utils/idGenerator.js";
export { parseMarkdown } from "./parser/markdownParser.js";
export { writeToClipboard, readClipboard } from "./clipboard/browserClipboard.js";
export { writeHtmlToClipboard } from "./clipboard/richClipboard.js";
export { generateHtml, generateBlockHtml } from "./htmlGenerator.js";

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
  snapshot: BlockSnapshot;
}

export type BlockType =
   | 'page'
   | 'text'
   | 'heading1'
   | 'heading2'
   | 'heading3'
   | 'heading4'
   | 'heading5'
   | 'heading6'
   | 'quote'
   | 'bullet'
   | 'ordered'
   | 'todo'
   | 'code'
   | 'divider'
   | 'isv'
   | 'equation'
   | 'image'
   | 'table'
   | 'table_cell';

export interface BlockSnapshot {
  type: BlockType;
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
  done?: boolean;
  seq?: string;
  language?: string;
  code?: string;
  is_language_picked?: boolean;
  caption?: {
    text: {
      initialAttributedTexts: {
        text: Record<string, string>;
        attribs: Record<string, string>;
      };
      apool: {
        numToAttrib: Record<string, unknown>;
        nextNum: number;
      };
    };
  };
  wrap?: boolean;
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
  columns_id?: string[];
  rows_id?: string[];
  column_set?: Record<string, { column_width: number }>;
  cell_set?: Record<string, { block_id: string; merge_info: { row_span: number; col_span: number } }>;
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

export async function markdownToLark(markdown: string): Promise<ClipboardData> {
  const converter = new MarkdownToLarkConverter();
  return converter.convert(markdown);
}

export function larkToMarkdown(data: ClipboardData): string {
  if (!data || !data.recordMap) {
    return '';
  }

  const result: string[] = [];
  let lastType: string = '';

  // Recursive function to process a node and its children
  function processRecord(recordId: string, depth: number = 0): void {
    const record = data.recordMap[recordId];
    if (!record || !record.snapshot) return;

    const snapshot = record.snapshot;

    // Skip page nodes (root)
    if (snapshot.type === 'page') {
      // Process children of page
      if (snapshot.children && snapshot.children.length > 0) {
        for (const childId of snapshot.children) {
          processRecord(childId);
        }
      }
      return;
    }

    const isList = ['bullet', 'ordered', 'todo'].includes(snapshot.type);

    // Add separator between different block types
    if (result.length > 0) {
      // Different types: add empty line
      if (lastType !== snapshot.type && lastType !== 'list' && !isList) {
        result.push('');
      } else if (lastType === 'text' && snapshot.type === 'text') {
        // Consecutive paragraphs: add empty line
        result.push('');
      } else if (lastType === 'list' && !isList) {
        // List to non-list: add empty line
        result.push('');
      } else if (!isList && lastType !== 'list' && !isList) {
        // Non-list consecutive items: add empty line
        result.push('');
      }
    }

    // Handle different block types
    switch (snapshot.type) {
      case 'heading1':
      case 'heading2':
      case 'heading3':
      case 'heading4':
      case 'heading5':
      case 'heading6': {
        const level = parseInt(snapshot.type.replace('heading', ''));
        const headingText = getTextContent(snapshot.text);
        result.push(`${'#'.repeat(level)} ${headingText}`);
        break;
      }

      case 'text': {
        const textContent = getTextContent(snapshot.text);
        if (textContent.trim()) {
          result.push(textContent);
        }
        break;
      }

      case 'quote': {
        const quoteText = getTextContent(snapshot.text);
        result.push(`> ${quoteText}`);
        break;
      }

      case 'bullet': {
        const bulletText = getTextContent(snapshot.text);
        const level = snapshot.level || 1;
        const indent = '  '.repeat(level - 1);
        result.push(`${indent}- ${bulletText}`);
        break;
      }

      case 'ordered': {
        const orderedText = getTextContent(snapshot.text);
        const level = snapshot.level || 1;
        const indent = '  '.repeat(level - 1);
        result.push(`${indent}1. ${orderedText}`);
        break;
      }

      case 'todo': {
        const todoText = getTextContent(snapshot.text);
        const isChecked = snapshot.done || false;
        const level = snapshot.level || 1;
        const indent = '  '.repeat(level - 1);
        result.push(`${indent}- [${isChecked ? 'x' : ' '}] ${todoText}`);
        break;
      }

      case 'code': {
        const language = snapshot.language || '';
        const code = snapshot.code || getTextContent(snapshot.text) || '';
        result.push(`\`\`\`${language}`);
        result.push(code);
        result.push(`\`\`\``);
        break;
      }

      case 'divider': {
        result.push('---');
        break;
      }

      case 'isv': {
        const mermaidCode = snapshot.data?.data || '';
        result.push(`\`\`\`mermaid`);
        result.push(mermaidCode);
        result.push(`\`\`\``);
        break;
      }

      case 'equation': {
        result.push(`$$${getTextContent(snapshot.text)}$$`);
        break;
      }

      case 'image': {
        result.push('[lark-to-markdown 暂无法支持图片转换]');
        break;
      }

      case 'table': {
        const tableMarkdown = convertTableToMarkdown(recordId, data.recordMap);
        result.push(tableMarkdown);
        break;
      }

      case 'table_cell': {
        return;
      }

      default:
        break;
    }

    lastType = isList ? 'list' : snapshot.type;

    // Process children recursively
    if (snapshot.children && snapshot.children.length > 0) {
      for (const childId of snapshot.children) {
        processRecord(childId);
      }
    }
  }

  // Start processing from root node
  if (data.rootId) {
    processRecord(data.rootId);
  }

  return result.join('\n').trim();
}

function getTextContent(textData?: TextData): string {
  if (!textData || !textData.initialAttributedTexts) {
    return '';
  }
  const texts = textData.initialAttributedTexts.text;
  const attribs = textData.initialAttributedTexts.attribs;

  if (!texts) return '';

  // If there are no apool/attribs, just return raw text
  if (!attribs || (typeof attribs === 'string' && attribs === '') || !textData.apool || !textData.apool.numToAttrib) {
    const content = Object.values(texts).join('');

    // Detect URLs and convert to Markdown link format for backward compatibility
    const placeholders: string[] = [];
    let result = content.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      (match, text, url) => {
        placeholders.push(match);
        return `__LINK_PLACEHOLDER_${placeholders.length - 1}__`;
      }
    );

    result = result.replace(
      /(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/g,
      '[$1]($1)'
    );

    result = result.replace(
      /__LINK_PLACEHOLDER_(\d+)__/g,
      (_, index) => placeholders[parseInt(index)]
    );

    return result;
  }

  // Parse attributed text to preserve links
  let attribsStr = '';
  if (typeof attribs === 'string') {
    attribsStr = attribs;
  } else if (attribs && typeof attribs === 'object') {
    const values = Object.values(attribs);
    if (values.length > 0 && typeof values[0] === 'string') {
      attribsStr = values[0];
    }
  }
  return parseAttributedText(texts, attribsStr, textData.apool.numToAttrib);
}

function convertTableToMarkdown(tableRecordId: string, recordMap: Record<string, RecordData>): string {
  const tableRecord = recordMap[tableRecordId];
  if (!tableRecord || !tableRecord.snapshot) {
    return '';
  }

  const snapshot = tableRecord.snapshot;
  const { columns_id, rows_id, cell_set } = snapshot as any;

  if (!columns_id || !rows_id || !cell_set) {
    return '';
  }

  const rows: string[][] = [];

  for (const rowId of rows_id) {
    const row: string[] = [];
    for (const colId of columns_id) {
      const cellKey = `${rowId}${colId}`;
      const cell = cell_set[cellKey];
      if (cell && cell.block_id) {
        const cellRecord = recordMap[cell.block_id];
        if (cellRecord && cellRecord.snapshot) {
          const cellSnapshot = cellRecord.snapshot;
          const childId = cellSnapshot.children && cellSnapshot.children.length > 0
            ? cellSnapshot.children[0]
            : null;
          if (childId) {
            const textRecord = recordMap[childId];
            if (textRecord && textRecord.snapshot) {
              const cellText = getTextContent(textRecord.snapshot.text);
              row.push(cellText);
            } else {
              row.push('');
            }
          } else {
            row.push('');
          }
        } else {
          row.push('');
        }
      } else {
        row.push('');
      }
    }
    rows.push(row);
  }

  if (rows.length === 0) {
    return '';
  }

  const colCount = columns_id.length;
  const alignments: string[] = [];

  for (const colId of columns_id) {
    const cellKey = `${rows_id[0]}${colId}`;
    const cell = cell_set[cellKey];
    if (cell && cell.block_id) {
      const cellRecord = recordMap[cell.block_id];
      if (cellRecord && cellRecord.snapshot) {
        const cellSnapshot = cellRecord.snapshot;
        const childId = cellSnapshot.children && cellSnapshot.children.length > 0
          ? cellSnapshot.children[0]
          : null;
        if (childId) {
          const textRecord = recordMap[childId];
          if (textRecord && textRecord.snapshot && textRecord.snapshot.align) {
            const align = textRecord.snapshot.align as string;
            alignments.push(align);
          } else {
            alignments.push('left');
          }
        } else {
          alignments.push('left');
        }
      } else {
        alignments.push('left');
      }
    } else {
      alignments.push('left');
    }
  }

  const separatorRow = alignments.map(align => {
    switch (align) {
      case 'center':
        return ':--:';
      case 'right':
        return '---:';
      case 'left':
      default:
        return ':---';
    }
  });

  const markdownRows: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const formattedRow = row.map(cell => {
      return cell.includes('|') ? `"${cell.replace(/"/g, '""')}"` : cell;
    }).join(' | ');
    markdownRows.push(`| ${formattedRow} |`);

    if (i === 0) {
      markdownRows.push(`| ${separatorRow.join(' | ')} |`);
    }
  }

  return markdownRows.join('\n');
}

function parseAttributedText(
  texts: Record<string, string>,
  attribsStr: string,
  numToAttrib: Record<string, unknown>
): string {
  let content = Object.values(texts).join('');
  const segments: Array<{
    text: string;
    attrs: Record<string, unknown>;
  }> = [];

  // Parse attribs string (e.g., "*0+5*0*1+3*0*2+2")
  let pos = 0;
  while (pos < attribsStr.length) {
    if (attribsStr[pos] === '*') {
      pos++;

      const attrNums: string[] = [];
      while (pos < attribsStr.length && /[0-9]/.test(attribsStr[pos])) {
        let numStr = '';
        while (pos < attribsStr.length && /[0-9]/.test(attribsStr[pos])) {
          numStr += attribsStr[pos];
          pos++;
        }
        attrNums.push(numStr);

        if (pos < attribsStr.length && attribsStr[pos] === '*') {
          pos++;
        } else {
          break;
        }
      }

      if (pos >= attribsStr.length || attribsStr[pos] !== '+') break;
      pos++;

      let lengthStr = '';
      while (pos < attribsStr.length) {
        const char = attribsStr[pos];
        if (/[0-9]/.test(char)) {
          lengthStr += char;
          pos++;
        } else {
          break;
        }
      }

      if (!lengthStr) {
        continue;
      }

      const length = parseInt(lengthStr, 10) || 0;
      const text = content.substring(0, length);
      content = content.substring(length);

      const attrs: Record<string, unknown> = {};
      for (const num of attrNums) {
        const attrValue = numToAttrib[num];
        if (attrValue && Array.isArray(attrValue) && attrValue.length >= 2) {
          attrs[String(attrValue[0])] = attrValue[1];
        }
      }

      if (text) {
        segments.push({ text, attrs });
      }
    } else {
      pos++;
    }
  }

  if (content) {
    segments.push({ text: content, attrs: {} });
  }

  let result = '';

  for (const segment of segments) {
    const { text, attrs } = segment;

    if (attrs.link) {
      const url = decodeURIComponent(String(attrs.link));
      result += `[${text}](${url})`;
    } else if (attrs.equation) {
      const equation = String(attrs.equation).trim();
      const isDisplay = equation.endsWith('_display');
      const cleanEquation = isDisplay ? equation.slice(0, -8) : equation;
      result += isDisplay ? `$$${cleanEquation}$$` : `$${cleanEquation}$`;
    } else {
      let formattedText = text;

      if (attrs.strikethrough === 'true') {
        formattedText = `~~${formattedText}~~`;
      }
      if (attrs.bold === 'true') {
        formattedText = `**${formattedText}**`;
      }
      if (attrs.italic === 'true') {
        formattedText = `*${formattedText}*`;
      }

      result += formattedText;
    }
  }

  return result;
}

export const TEST_CASES = {
  heading: `# 一级标题\n## 二级标题\n### 三级标题\n`,
  paragraph: `这是普通文本段落。\n\n这是第二段。`,
  list: `- 项目 1\n- 项目 2\n- 项目 3\n`,
  ordered: `1. 第一项\n2. 第二项\n3. 第三项\n`,
  todo: `- [ ] 未完成任务\n- [x] 已完成任务\n`,
  quote: `> 这是一段引用文本。\n\n> 多行引用。`,
  code: `\`\`\`javascript\nfunction hello() {\n  console.log('Hello');\n}\n\`\`\``,
  divider: `---\n`,
  link: `这是一个 [链接](https://feishu.cn)。\n`,
  image: `![图片](https://example.com/img.png)\n`,
  mermaid: `\`\`\`mermaid\ngraph TD\n    A[开始] --> B[结束]\n\`\`\``,
  nested: `- 一级项目\n  - 二级项目\n    - 三级项目\n`,
  mixed: `# 标题\n\n这是段落，包含**粗体**和*斜体*。\n\n- 列表项\n- 另一项\n\n\`\`\`代码\`\`\``,
  complex: `# 完整文档\n\n## 章节\n\n这是段落。\n\n- 列表项 1\n- 列表项 2\n\n\n> 引用块\n\n\`\`\`javascript\nconst a = 1;\n\`\`\`\n\n---\n\n## 下一个章节\n\n内容。`
};
