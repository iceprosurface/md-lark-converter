import { readFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import type { ClipboardData } from './index.js';

const CONFIG_PATH = join(homedir(), '.md-lark-converter.json');

interface FetchOptions {
  cookie?: string;
  verbose?: boolean;
}

interface BlockMapEntry {
  id: string;
  version: number;
  data: Record<string, unknown>;
}

interface ClientVarResponse {
  code: number;
  msg: string;
  data: {
    block_map: Record<string, BlockMapEntry>;
    block_sequence?: string[];
    id: string;
    has_more: boolean;
    next_cursors: string[];
    cursor?: string;
    meta_map?: Record<string, unknown>;
    editor_map?: Record<string, unknown>;
    [key: string]: unknown;
  };
}

/**
 * Parse a Feishu document URL.
 * Supports:
 *   https://xxx.feishu.cn/wiki/TOKEN
 *   https://xxx.feishu.cn/docx/TOKEN
 */
export function parseFeishuUrl(url: string): { origin: string; token: string; type: 'wiki' | 'docx' } {
  const parsed = new URL(url);
  const pathParts = parsed.pathname.split('/').filter(Boolean);

  if (pathParts.length < 2) {
    throw new Error(`Invalid Feishu URL: ${url}`);
  }

  const docType = pathParts[0] as 'wiki' | 'docx';
  if (docType !== 'wiki' && docType !== 'docx') {
    throw new Error(`Unsupported document type: ${docType}. Expected 'wiki' or 'docx'.`);
  }

  return {
    origin: parsed.origin,
    token: pathParts[1],
    type: docType,
  };
}

/**
 * Resolve a wiki token to its underlying docx obj_token.
 */
async function resolveWikiToken(
  origin: string,
  wikiToken: string,
  cookie: string,
  csrfToken: string,
): Promise<string> {
  const url = `${origin}/space/api/wiki/v2/tree/get_node/?wiki_token=${wikiToken}`;
  const resp = await fetch(url, {
    headers: {
      'Cookie': cookie,
      'X-CSRFToken': csrfToken,
    },
  });

  if (!resp.ok) {
    throw new Error(`Failed to resolve wiki token: HTTP ${resp.status}`);
  }

  const body = await resp.json() as any;
  if (body.code !== 0) {
    throw new Error(`Failed to resolve wiki token: ${body.msg}`);
  }

  return body.data.obj_token;
}

/**
 * Fetch document blocks via the clientvar HTTP API.
 * Handles pagination if the document is large.
 */
async function fetchClientVars(
  origin: string,
  objToken: string,
  cookie: string,
  csrfToken: string,
  verbose: boolean,
): Promise<ClientVarResponse['data']> {
  const allBlocks: Record<string, BlockMapEntry> = {};
  let allSequence: string[] = [];
  let docId = '';
  let cursors: string[] = [];
  let isFirst = true;

  do {
    const params = new URLSearchParams({
      id: objToken,
      mode: '7',
      limit: '239',
    });

    if (!isFirst && cursors.length > 0) {
      params.set('cursor', cursors[0]);
    }

    const url = `${origin}/space/api/docx/pages/client_vars?${params}`;
    if (verbose) console.log(`Fetching: ${url}`);

    const resp = await fetch(url, {
      headers: {
        'Cookie': cookie,
        'X-CSRFToken': csrfToken,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      },
    });

    if (!resp.ok) {
      throw new Error(`API request failed: HTTP ${resp.status}`);
    }

    const body = await resp.json() as ClientVarResponse;
    if (body.code !== 0) {
      throw new Error(`API error: ${body.msg} (code: ${body.code})`);
    }

    const data = body.data;
    Object.assign(allBlocks, data.block_map);

    if (data.block_sequence) {
      allSequence = allSequence.concat(data.block_sequence);
    }

    if (isFirst) {
      docId = data.id;
    }

    if (verbose) {
      const count = Object.keys(data.block_map).length;
      console.log(`  Got ${count} blocks, has_more: ${data.has_more}`);
    }

    cursors = data.next_cursors || [];
    isFirst = false;
  } while (cursors.length > 0);

  return {
    block_map: allBlocks,
    block_sequence: allSequence.length > 0 ? allSequence : Object.keys(allBlocks),
    id: docId,
    has_more: false,
    next_cursors: [],
  };
}

/**
 * Resolve the cookie string from various sources.
 * Priority: --cookie flag > FEISHU_COOKIE env > config file
 */
export function resolveCookie(flagCookie?: string): string {
  if (flagCookie) return flagCookie;

  const envCookie = process.env.FEISHU_COOKIE;
  if (envCookie) return envCookie;

  if (existsSync(CONFIG_PATH)) {
    try {
      const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
      if (config.cookie) return config.cookie;
    } catch {
      // ignore parse errors
    }
  }

  throw new Error(
    'No cookie provided. Use one of:\n' +
    '  --cookie "your_cookie_string"\n' +
    '  FEISHU_COOKIE environment variable\n' +
    `  ${CONFIG_PATH} with {"cookie": "..."}`
  );
}

/**
 * Extract the _csrf_token from a cookie string.
 */
function extractCsrfToken(cookie: string): string {
  const match = cookie.match(/_csrf_token=([^;]+)/);
  return match ? match[1] : '';
}

/**
 * Convert clientvar block_map to ClipboardData format for larkToMarkdown.
 */
function blockMapToClipboardData(data: ClientVarResponse['data']): ClipboardData {
  const recordMap: Record<string, { id: string; snapshot: Record<string, unknown> }> = {};

  for (const [id, entry] of Object.entries(data.block_map)) {
    recordMap[id] = {
      id: entry.id,
      snapshot: entry.data,
    };
  }

  return {
    isCut: false,
    rootId: data.id,
    parentId: '',
    blockIds: [],
    recordIds: data.block_sequence || Object.keys(data.block_map),
    recordMap: recordMap as any,
    payloadMap: {},
    selection: [],
    extra: {
      channel: '',
      pasteRandomId: '',
      mention_page_title: {},
      external_mention_url: {},
      isEqualBlockSelection: false,
    },
    isKeepQuoteContainer: false,
    pasteFlag: '',
  };
}

/**
 * Fetch a Feishu document and return it as ClipboardData.
 */
export async function fetchFeishuDocument(
  url: string,
  options: FetchOptions = {}
): Promise<ClipboardData> {
  const { verbose = false } = options;

  const cookie = resolveCookie(options.cookie);
  const csrfToken = extractCsrfToken(cookie);
  const { origin, token, type } = parseFeishuUrl(url);

  if (verbose) console.log(`Document type: ${type}, token: ${token}`);

  // Resolve wiki token to obj_token if needed
  let objToken = token;
  if (type === 'wiki') {
    if (verbose) console.log('Resolving wiki token...');
    objToken = await resolveWikiToken(origin, token, cookie, csrfToken);
    if (verbose) console.log(`Resolved to obj_token: ${objToken}`);
  }

  // Fetch document blocks
  const data = await fetchClientVars(origin, objToken, cookie, csrfToken, verbose);

  const blockCount = Object.keys(data.block_map).length;
  if (verbose) console.log(`Total blocks: ${blockCount}`);

  if (blockCount === 0) {
    throw new Error('No blocks found. The document may be empty or inaccessible.');
  }

  return blockMapToClipboardData(data);
}
