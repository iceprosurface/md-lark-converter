#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { MarkdownToLarkConverter } from '@md-lark-converter/core';
import clipboardy from 'clipboardy';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface Options {
  output?: string;
  stdin?: boolean;
  copy?: boolean;
  verbose?: boolean;
}

program
  .name('md-to-lark')
  .description('Convert Markdown to Lark (飞书) clipboard format')
  .version('1.0.0')
  .argument('[input]', 'Input markdown file path or stdin')
  .option('-o, --output <file>', 'Output JSON file path')
  .option('--stdin', 'Read from stdin')
  .option('--copy', 'Copy to system clipboard directly')
  .option('--verbose', 'Show detailed output')
  .action((input: string, options: Options) => {
    run(input, options);
  });

async function run(input: string, options: Options): Promise<void> {
  try {
    let markdown = '';

    // Read input
    if (options.stdin) {
      if (options.verbose) {
        console.log(chalk.yellow('Reading from stdin...'));
      }
      markdown = await readStdin();
    } else if (input) {
      if (options.verbose) {
        console.log(chalk.yellow(`Reading from file: ${input}`));
      }
      if (!existsSync(input)) {
        console.error(chalk.red(`Error: File not found: ${input}`));
        process.exit(1);
      }
      markdown = readFileSync(input, 'utf-8');
    } else {
      console.error(chalk.red('Error: Please provide input file or use --stdin'));
      program.help();
      process.exit(1);
    }

    // Convert
    if (options.verbose) {
      console.log(chalk.yellow('Converting markdown to Lark format...'));
    }
    const converter = new MarkdownToLarkConverter();
    const result = converter.convert(markdown);

    // Output
    if (options.output) {
      const { writeFileSync } = await import('fs');
      writeFileSync(options.output, JSON.stringify(result, null, 2), 'utf-8');
      if (options.verbose) {
        console.log(chalk.green(`✓ Output written to: ${options.output}`));
      }
    } else if (options.copy) {
      const html = generateLarkHtml(result);
      await clipboardy.write(html);
      if (options.verbose) {
        console.log(chalk.green('✓ Copied HTML to clipboard! Paste directly to Lark document'));
      } else {
        console.log(chalk.green('✓ Copied to clipboard!'));
      }
    } else {
      // Default: pretty print
      console.log(JSON.stringify(result, null, 2));
    }

    if (options.verbose) {
      console.log(chalk.green('✓ Conversion completed successfully!'));
    }
  } catch (error) {
    console.error(chalk.red('Error:'), (error as Error).message);
    if (options.verbose) {
      console.error((error as Error).stack);
    }
    process.exit(1);
  }
}

function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', (chunk: string) => {
      data += chunk;
    });
    process.stdin.on('end', () => {
      resolve(data);
    });
    process.stdin.on('error', reject);
  });
}

function generateLarkHtml(data: any): string {
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

function generateBlockHtml(snapshot: any, recordId: string): string {
  const { type, text, code, language, level, data } = snapshot;

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

program.parse();
