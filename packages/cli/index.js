#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { MarkdownToLarkConverter } from '@md-lark-converter/core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

program
  .name('md-to-lark')
  .description('Convert Markdown to Lark (飞书) clipboard format')
  .version('1.0.0')
  .argument('[input]', 'Input markdown file path or stdin')
  .option('-o, --output <file>', 'Output JSON file path')
  .option('--stdin', 'Read from stdin')
  .option('--copy', 'Output format compatible with clipboard (for OpenCode/Claude Code)')
  .option('--verbose', 'Show detailed output')
  .action((input, options) => {
    run(input, options);
  });

async function run(input, options) {
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
      writeFileSync(options.output, JSON.stringify(result, null, 2), 'utf-8');
      if (options.verbose) {
        console.log(chalk.green(`✓ Output written to: ${options.output}`));
      }
    } else if (options.copy) {
      // Output in clipboard-friendly format for OpenCode/Claude Code
      console.log(chalk.cyan('Clipboard Data (ready to paste):'));
      console.log(chalk.gray('---'));
      console.log(JSON.stringify(result));
      console.log(chalk.gray('---'));
      console.log(chalk.yellow('Copy the above JSON and paste it to Lark document'));
    } else {
      // Default: pretty print
      console.log(JSON.stringify(result, null, 2));
    }

    if (options.verbose) {
      console.log(chalk.green('✓ Conversion completed successfully!'));
    }
  } catch (error) {
    console.error(chalk.red('Error:'), error.message);
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

function readStdin() {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => {
      resolve(data);
    });
    process.stdin.on('error', reject);
  });
}

program.parse();
