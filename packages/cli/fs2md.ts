#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import { writeFileSync } from 'fs';
import { larkToMarkdown } from '@md-lark-converter/core';
import { fetchFeishuDocument } from './feishuFetcher.js';

interface Options {
  output?: string;
  cookie?: string;
  verbose?: boolean;
}

program
  .name('fs2md')
  .description('Fetch a Feishu (飞书) document and convert to Markdown')
  .version('1.0.0')
  .argument('<url>', 'Feishu document URL')
  .option('-o, --output <file>', 'Save Markdown to file (default: copy to clipboard)')
  .option('--cookie <cookie>', 'Feishu session cookie string')
  .option('--verbose', 'Show detailed output')
  .action((url: string, options: Options) => {
    run(url, options);
  });

async function run(url: string, options: Options): Promise<void> {
  try {
    if (options.verbose) {
      console.log(chalk.yellow(`Fetching Feishu document: ${url}`));
    }

    const clipboardData = await fetchFeishuDocument(url, {
      cookie: options.cookie,
      verbose: options.verbose,
    });

    const markdown = larkToMarkdown(clipboardData);

    if (options.output) {
      writeFileSync(options.output, markdown, 'utf-8');
      console.log(chalk.green(`✓ Saved to ${options.output}`));
    } else {
      // Default: copy to clipboard
      try {
        const { execSync } = await import('child_process');
        execSync('pbcopy', { input: markdown });
        console.log(chalk.green('✓ Markdown copied to clipboard!'));
      } catch {
        // Fallback: print to stdout
        console.log(markdown);
      }
    }
  } catch (error) {
    console.error(chalk.red('Error:'), (error as Error).message);
    if (options.verbose) {
      console.error((error as Error).stack);
    }
    process.exit(1);
  }
}

program.parse();
