#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import { readFileSync, existsSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { MarkdownToLarkConverter, generateHtml } from '@md-lark-converter/core';
import { writeHtmlToClipboard } from '@md-lark-converter/core/node';

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
    const result = await converter.convert(markdown);

    // Output
    if (options.output) {
      writeFileSync(options.output, JSON.stringify(result, null, 2), 'utf-8');
      if (options.verbose) {
        console.log(chalk.green(`✓ Output written to: ${options.output}`));
      }
    } else if (options.copy) {
      // 使用 core 包的 generateHtml 函数
      const html = generateHtml(result);

      try {
        // 尝试写入富文本格式
        await writeHtmlToClipboard(html);
        if (options.verbose) {
          console.log(chalk.green('✓ Copied rich text to clipboard! Paste directly to Lark document'));
        } else {
          console.log(chalk.green('✓ Copied to clipboard!'));
        }
      } catch (htmlError) {
        // 如果富文本失败，显示错误信息
        if (options.verbose) {
          console.warn(chalk.yellow('⚠ Rich text copy failed, HTML content printed below:'));
          console.warn(chalk.dim((htmlError as Error).message));
        } else {
          console.warn(chalk.yellow('⚠ Rich text clipboard not supported on this platform'));
        }
        // 输出 HTML 到控制台
        console.log(html);
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

program.parse();
