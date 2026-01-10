import { marked } from 'marked';

const MARKDOWN_TOKEN_MAP = {
  heading: { type: 'heading', levels: [1, 2, 3, 4, 5, 6] },
  paragraph: { type: 'text' },
  blockquote: { type: 'quote' },
  list: { type: 'list' },
  code: { type: 'code' },
  hr: { type: 'divider' },
  space: { type: 'text' }
};

export function parseMarkdown(markdown) {
  const tokens = marked.lexer(markdown);
  return convertTokens(tokens);
}

function convertTokens(tokens, parentType = null) {
  const blocks = [];

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

function convertToken(token, parentType) {
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
        items: items.map(item => ({
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

function parseInlineText(text) {
  if (!text) return '';

  const inlineTokens = marked.lexerInline(text);
  return convertInlineTokens(inlineTokens);
}

function convertInlineTokens(tokens) {
  let result = '';
  for (const token of tokens) {
    switch (token.type) {
      case 'text':
        result += token.raw;
        break;
      case 'strong':
        result += `**${token.text}**`;
        break;
      case 'em':
        result += `*${token.text}*`;
        break;
      case 'del':
        result += `~~${token.text}~~`;
        break;
      case 'codespan':
        result += `\`${token.text}\``;
        break;
      case 'link':
        result += `[${token.text}](${token.href})`;
        break;
      case 'image':
        result += `![${token.text}](${token.href})`;
        break;
      default:
        result += token.raw || '';
    }
  }
  return result;
}
