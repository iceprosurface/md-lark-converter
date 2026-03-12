import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import type { ClipboardData } from './index.js';

export interface ImageMeta {
  token: string;
  width?: number;
  height?: number;
  mimeType?: string;
  name?: string;
}

export interface ImageDownloadOptions {
  cookie: string;
  domain: string;
  outputDir: string;
  concurrency?: number;
  verbose?: boolean;
}

/**
 * Extract image tokens and metadata from ClipboardData.
 */
export function extractImageTokens(data: ClipboardData): ImageMeta[] {
  const seen = new Set<string>();
  const images: ImageMeta[] = [];
  for (const record of Object.values(data.recordMap)) {
    const snapshot = record.snapshot;
    if (snapshot?.type === 'image' && snapshot.image?.token) {
      const img = snapshot.image;
      if (seen.has(img.token)) continue;
      seen.add(img.token);
      images.push({
        token: img.token,
        width: img.width,
        height: img.height,
        mimeType: img.mimeType,
        name: img.name,
      });
    }
  }
  return images;
}

function extFromContentType(contentType: string): string {
  if (contentType.includes('jpeg') || contentType.includes('jpg')) return '.jpg';
  if (contentType.includes('png')) return '.png';
  if (contentType.includes('gif')) return '.gif';
  if (contentType.includes('webp')) return '.webp';
  if (contentType.includes('svg')) return '.svg';
  return '.png';
}

/**
 * Download a single image by token, returns the saved filename.
 */
export async function downloadImage(
  token: string,
  options: Pick<ImageDownloadOptions, 'cookie' | 'domain' | 'outputDir'>
): Promise<string> {
  if (!/^[a-zA-Z0-9_-]+$/.test(token)) {
    throw new Error(`Invalid image token format: ${token}`);
  }
  const { cookie, domain, outputDir } = options;
  const url = `${domain}/space/api/box/stream/download/all/${token}`;

  const res = await fetch(url, {
    headers: {
      Cookie: cookie,
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)',
    },
    redirect: 'follow',
  });

  if (!res.ok) throw new Error(`Failed to download image ${token}: ${res.status}`);

  const contentType = res.headers.get('content-type') || 'image/png';
  const ext = extFromContentType(contentType);
  const filename = `${token}${ext}`;

  const buffer = Buffer.from(await res.arrayBuffer());
  await writeFile(join(outputDir, filename), buffer);

  return filename;
}

/**
 * Download all images in batches, returns token → filename mapping.
 */
export async function downloadAllImages(
  images: ImageMeta[],
  options: ImageDownloadOptions
): Promise<Map<string, string>> {
  const { outputDir, concurrency = 5, verbose = false } = options;
  await mkdir(outputDir, { recursive: true });

  const tokenToFile = new Map<string, string>();

  for (let i = 0; i < images.length; i += concurrency) {
    const batch = images.slice(i, i + concurrency);
    const results = await Promise.allSettled(
      batch.map(img => downloadImage(img.token, options))
    );
    for (let j = 0; j < results.length; j++) {
      const result = results[j];
      const img = batch[j];
      if (result.status === 'fulfilled') {
        tokenToFile.set(img.token, result.value);
        if (verbose) console.log(`  Downloaded: ${img.token} → ${result.value}`);
      } else {
        console.warn(`  Failed to download ${img.token}: ${result.reason}`);
      }
    }
  }

  return tokenToFile;
}
