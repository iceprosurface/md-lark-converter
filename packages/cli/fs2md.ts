#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { larkToMarkdown } from '@md-lark-converter/core';
import { fetchFeishuDocument, resolveCookie } from '@md-lark-converter/core/feishu';
import { extractImageTokens, downloadAllImages } from '@md-lark-converter/core/image';

interface Options {
  output?: string;
  cookie?: string;
  verbose?: boolean;
  images?: boolean;
}

program
  .name('fs2md')
  .description('Fetch a Feishu (飞书) document and convert to Markdown')
  .version('1.0.0')
  .argument('<url>', 'Feishu document URL')
  .option('-o, --output <file>', 'Save Markdown to file (default: copy to clipboard)')
  .option('--cookie <cookie>', 'Feishu session cookie string')
  .option('--no-images', 'Skip downloading images')
  .option('--verbose', 'Show detailed output')
  .action(async (url: string, options: Options) => {
    await run(url, options);
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

    // Download images if enabled
    let imagePathMap = new Map<string, string>();
    const shouldDownloadImages = options.images !== false;

    if (shouldDownloadImages) {
      const images = extractImageTokens(clipboardData);
      if (images.length > 0) {
        const outputDir = options.output
          ? join(dirname(options.output), 'images')
          : join(process.cwd(), 'images');
        const domain = new URL(url).origin;
        const cookie = resolveCookie(options.cookie);

        console.log(chalk.yellow(`Found ${images.length} image(s), downloading...`));
        imagePathMap = await downloadAllImages(images, {
          cookie,
          domain,
          outputDir,
          verbose: options.verbose,
        });
        console.log(chalk.green(`✓ Downloaded ${imagePathMap.size} image(s) to ${outputDir}`));
      }
    }

    const markdown = larkToMarkdown(clipboardData, {
      imageResolver: (token) => {
        const filename = imagePathMap.get(token);
        return filename ? `./images/${filename}` : token;
      },
    });

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
