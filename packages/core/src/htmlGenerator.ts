import { ClipboardData } from './index.js';

export function generateHtml(data: ClipboardData): string {
  if (!data || !data.recordIds || !data.recordMap) {
    console.error('Invalid data structure:', data);
    return '';
  }

  const jsonStr = JSON.stringify(data);
  const encodedJson = jsonStr
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  let html = `<meta charset="utf-8"><div data-page-id="${data.rootId}" data-lark-html-role="root" data-docx-has-block-data="true">`;

  for (const recordId of data.recordIds) {
    const record = data.recordMap[recordId];
    if (!record) continue;

    const snapshot = record.snapshot;
    const blockHtml = generateBlockHtml(snapshot, recordId);
    html += blockHtml;
  }

  html += `</div><span data-lark-record-data="${encodedJson}" data-lark-record-format="docx/record" class="lark-record-clipboard"></span>`;
  return html;
}

export function generateBlockHtml(snapshot: any, recordId: string): string {
  const { type, text, code, language, level, data, checked, children } = snapshot;

  switch (type) {
    case 'page':
      return '';

    case 'isv':
      const mermaidCode = data && data.data ? data.data : '';
      return `<div class="ace-line old-record-id-${recordId}">
<span class="block-paste-placeholder">${mermaidCode || '暂时无法在飞书文档外展示此内容'}</span>
</div>`;

    case 'heading1':
      const text1 = getTextContent(text);
      return `<h1 class="heading-1 ace-line old-record-id-${recordId}">${escapeHtml(text1)}</h1>`;

    case 'heading2':
      const text2 = getTextContent(text);
      return `<h2 class="heading-2 ace-line old-record-id-${recordId}">${escapeHtml(text2)}</h2>`;

    case 'heading3':
      const text3 = getTextContent(text);
      return `<h3 class="heading-3 ace-line old-record-id-${recordId}">${escapeHtml(text3)}</h3>`;

    case 'heading4':
      const text4 = getTextContent(text);
      return `<h4 class="heading-4 ace-line old-record-id-${recordId}">${escapeHtml(text4)}</h4>`;

    case 'heading5':
      const text5 = getTextContent(text);
      return `<h5 class="heading-5 ace-line old-record-id-${recordId}">${escapeHtml(text5)}</h5>`;

    case 'heading6':
      const text6 = getTextContent(text);
      return `<h6 class="heading-6 ace-line old-record-id-${recordId}">${escapeHtml(text6)}</h6>`;

    case 'text':
      const textContent = getTextContent(text);
      return `<div class="ace-line old-record-id-${recordId}">${escapeHtml(textContent)}</div>`;

    case 'quote':
      const quoteText = getTextContent(text);
      return `<blockquote class="ace-line old-record-id-${recordId}">${escapeHtml(quoteText)}</blockquote>`;

    case 'code':
      const codeContent = code || getTextContent(text) || '';
      const escapedCode = escapeHtml(codeContent);
      return `<pre style="white-space:pre;" class="ace-line old-record-id-${recordId}"><code class="language-${language || 'plaintext'}" data-lark-language="${language || 'plaintext'}" data-wrap="false"><div>${escapedCode}</div></code></pre>`;

    case 'divider':
      return `<div data-type="divider" class="old-record-id-${recordId}"><hr></div>`;

    case 'bullet':
      const bulletText = getTextContent(text);
      return `<ul class="list-bullet1"><li class="ace-line old-record-id-${recordId}" data-list="bullet"><div>${escapeHtml(bulletText)}</div></li></ul>`;

    case 'ordered':
      const orderedText = getTextContent(text);
      return `<ol class="list-number1"><li class="ace-line old-record-id-${recordId}" data-list="number"><div>${escapeHtml(orderedText)}</div></li></ol>`;

    case 'todo':
      const todoText = getTextContent(text);
      const isChecked = snapshot.done || false;
      const listClass = isChecked ? 'list-done1' : 'list-check';
      return `<ul class="${listClass}"><li class="ace-line old-record-id-${recordId}" data-list="${isChecked ? 'done' : 'check'}"><div>${escapeHtml(todoText)}</div></li></ul>`;

    case 'image':
      return `<div class="ace-line old-record-id-${recordId}">[markdown-to-lark 暂无法支持图片转换]</div>`;

    default:
      return '';
  }
}

function getTextContent(textData: any): string {
  if (!textData || !textData.initialAttributedTexts) {
    return '';
  }
  const texts = textData.initialAttributedTexts.text;
  if (!texts) return '';
  return Object.values(texts).join('');
}

function escapeHtml(text: string): string {
  if (typeof text !== 'string' || !text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
