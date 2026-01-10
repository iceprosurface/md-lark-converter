import { marked } from 'marked';

export interface MarkdownBlock {
  type: string;
  text?: string;
  language?: string;
  ordered?: boolean;
  items?: MarkdownListItem[];
}

export interface MarkdownListItem {
  text: string;
  task: boolean;
  checked?: boolean;
}

const MARKDOWN_TOKEN_MAP: Record<string, { type: string; levels?: number[] }> = {
  heading: { type: 'heading', levels: [1, 2, 3, 4, 5, 6] },
  paragraph: { type: 'text' },
  blockquote: { type: 'quote' },
  list: { type: 'list' },
  code: { type: 'code' },
  hr: { type: 'divider' },
  space: { type: 'text' }
};

export function parseMarkdown(markdown: string): MarkdownBlock[] {
  const tokens = marked.lexer(markdown);
  return convertTokens(tokens);
}

function convertTokens(tokens: any[], parentType: string | null = null): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];

  for (const token of tokens) {
    const block = convertToken(token, parentType);
    if (Array.isArray(block)) {
      blocks.push(...block);
    } else if (block) {
      blocks.push(block);
    }
  }

  return blocks;
}

function convertToken(token: any, parentType: string | null): MarkdownBlock | MarkdownBlock[] | null {
  const { type, raw, text, depth, items, code, lang } = token;

  switch (type) {
    case 'heading':
      return {
        type: `heading${depth}`,
        text: parseInlineText(text)
      };

    case 'paragraph':
      return {
        type: 'text',
        text: parseInlineText(text)
      };

    case 'blockquote':
      return {
        type: 'quote',
        text: parseInlineText(text)
      };

    case 'list':
      return {
        type: 'list',
        ordered: token.ordered,
        items: items.map((item: any) => ({
          text: parseInlineText(item.text),
          task: item.checked !== undefined,
          checked: item.checked
        }))
      };

    case 'code':
      return {
        type: 'code',
        language: lang || 'plaintext',
        text: code
      };

    case 'hr':
      return {
        type: 'divider'
      };

    case 'space':
      return null;

    default:
      return null;
  }
}

function parseInlineText(text: string): string {
  if (!text) return '';

  const inlineTokens = (marked as any).lexerInline(text);
  return convertInlineTokens(inlineTokens);
}

function convertInlineTokens(tokens: any[]): string {
  let result = '';
  for (const token of tokens) {
    switch (token.type) {
      case 'text':
        result += (token as any).raw;
        break;
      case 'strong':
        result += `**${(token as any).text}**`;
        break;
      case 'em':
        result += `*${(token as any).text}*`;
        break;
      case 'del':
        result += `~~${(token as any).text}~~`;
        break;
      case 'codespan':
        result += `\`${(token as any).text}\``;
        break;
      case 'link':
        result += `[$(token as any).text}](${(token as any).href})`;
        break;
      case 'image':
        result += `![${(token as any).text}](${(token as any).href})`;
        break;
      default:
        result += (token as any).raw || '';
    }
  }
  return result;
}
