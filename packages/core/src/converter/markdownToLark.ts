import { generateBlockId, generateRecordId, generatePageId } from '../utils/idGenerator.js';
import * as marked from 'marked';
import type { ClipboardData } from '../index.js';

interface TextSegment {
  text: string;
  linkUrl?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
}

export class MarkdownToLarkConverter {
  private rootId: string | null;
  private authorId: string;
  private recordMap: Record<string, any>;
  private blockIds: number[];
  private recordIds: string[];
  private payloadMap: Record<string, unknown>;
  private apoolNextNum: number;
  private apoolNumToAttrib: Record<string, any>;

  constructor() {
    this.rootId = null;
    this.authorId = '7092639913849389057';
    this.recordMap = {};
    this.blockIds = [];
    this.recordIds = [];
    this.payloadMap = {};
    this.apoolNextNum = 0;
    this.apoolNumToAttrib = {};
  }

  convert(markdown: string): ClipboardData {
    this.rootId = generatePageId();
    this.recordMap = {};
    this.blockIds = [];
    this.recordIds = [];
    this.payloadMap = {};
    this.apoolNextNum = 0;
    this.apoolNumToAttrib = {};

    const tokens = marked.lexer(markdown);

    this.createPageBlock(this.rootId);
    this.convertTokens(tokens);

    return this.buildClipboardData();
  }

  private createPageBlock(pageId: string): void {
    this.recordMap[pageId] = {
      id: pageId,
      snapshot: {
        type: 'page',
        parent_id: '',
        comments: null,
        revisions: null,
        locked: false,
        hidden: false,
        author: this.authorId,
        children: [],
        text: this.createTextData(''),
        align: '',
        page_style: {},
        title: {
          apool: { nextNum: 0, numToAttrib: {} },
          initialAttributedTexts: {
            attribs: {},
            text: { '0': '无标题' }
          }
        }
      }
    };
  }

  private convertTokens(tokens: any[]): void {
    for (const token of tokens) {
      const blockId = this.convertToken(token);
      if (blockId) {
        this.recordIds.push(blockId);
        this.blockIds.push(this.blockIds.length + 1);
      }
    }
  }

  private convertToken(token: any): string | null {
    const { type, raw, text, depth, items, code, lang, ordered } = token;

    const recordId = generateRecordId();

    switch (type) {
      case 'heading':
        this.recordMap[recordId] = this.createHeadingBlock(recordId, depth, this.parseInlineTokens((token as any).tokens || []));
        break;

      case 'paragraph':
        this.recordMap[recordId] = this.createTextBlock(recordId, this.parseInlineTokens((token as any).tokens || []));
        break;

      case 'blockquote':
        this.recordMap[recordId] = this.createQuoteBlock(recordId, this.parseInlineTokens((token as any).tokens || []));
        break;

      case 'list':
        this.convertListItems(items, ordered);
        return null;

      case 'code':
        const codeContent = text || code || raw;
        if (lang && lang.toLowerCase() === 'mermaid') {
          this.recordMap[recordId] = this.createMermaidBlock(recordId, codeContent);
        } else {
          this.recordMap[recordId] = this.createCodeBlock(recordId, codeContent, lang);
        }
        break;

      case 'hr':
        this.recordMap[recordId] = this.createDividerBlock(recordId);
        break;

      default:
        return null;
    }

    return recordId;
  }

  private convertListItems(items: any[], ordered: boolean | undefined, parentId: string | null = null, level: number = 0): string[] {
    const childRecordIds: string[] = [];
    let index = 1;

    for (const item of items) {
      const recordId = generateRecordId();
      const blockId = this.blockIds.length + 1;
      let blockType = ordered ? 'ordered' : 'bullet';

      if (item.checked !== undefined) {
        blockType = 'todo';
      }

      // Parse text content - exclude nested lists from text
      const textContent = item.text.split('\n')[0] || '';
      const textData = this.parseInlineText(textContent);

      this.recordIds.push(recordId);

      const snapshot: any = {
        type: blockType,
        parent_id: parentId || this.rootId,
        comments: [],
        revisions: [],
        locked: false,
        hidden: false,
        author: this.authorId,
        children: [],
        text: ordered ? this.createListItemTextData(textData) : this.createTextData(textData),
        align: '',
        folded: false
      };

      if (item.checked !== undefined) {
        snapshot.done = item.checked;
      }

      if (ordered) {
        snapshot.level = level + 1;
        snapshot.seq = index === 1 ? '1' : 'auto';
        index++;
      } else if (level > 0) {
        // For bullet lists, level starts from 1 for nested items
        snapshot.level = level;
      }

      // Check if this item has nested lists
      if (item.tokens && Array.isArray(item.tokens)) {
        for (const token of item.tokens) {
          if (token.type === 'list' && token.items) {
            // Recursively convert nested list items
            const nestedChildIds = this.convertListItems(token.items, token.ordered, recordId, level + 1);
            // Add nested items to current item's children
            snapshot.children.push(...nestedChildIds);
          }
        }
      }

      this.recordMap[recordId] = {
        id: recordId,
        snapshot
      };

      this.blockIds.push(blockId);
      childRecordIds.push(recordId);
    }

    return childRecordIds;
  }

  private createListItemTextData(segments: TextSegment[]): any {
    if (!segments || segments.length === 0) {
      return {
        apool: { nextNum: 0, numToAttrib: {} },
        initialAttributedTexts: {
          attribs: "",
          text: { '0': '' },
          rows: {},
          cols: {}
        }
      };
    }

    const apoolNumToAttrib: Record<string, unknown> = {
      '0': ['author', this.authorId]
    };
    const attribToNum: Record<string, number> = {
      [`author,${this.authorId}`]: 0
    };

    let apoolNextNum = 1;
    const attribParts: string[] = [];
    const textParts: string[] = [];

    for (const segment of segments) {
      const text = segment.text || '';
      const length = text.length;

      if (length === 0) continue;

      textParts.push(text);

      const activeAttrs: string[] = ['0'];

      if (segment.linkUrl) {
        const linkAttrNum = apoolNextNum.toString();
        apoolNextNum++;
        const encodedUrl = encodeURIComponent(segment.linkUrl);
        apoolNumToAttrib[linkAttrNum] = ['link', encodedUrl];
        attribToNum[`link,${encodedUrl}`] = parseInt(linkAttrNum);
        activeAttrs.push(linkAttrNum);
      }

      if (segment.bold) {
        const boldAttrNum = apoolNumToAttrib['1'] ? '1' : apoolNextNum.toString();
        if (!apoolNumToAttrib['1']) {
          apoolNextNum++;
          apoolNumToAttrib[boldAttrNum] = ['bold', 'true'];
          attribToNum['bold,true'] = parseInt(boldAttrNum);
        }
        activeAttrs.push(boldAttrNum);
      }

      if (segment.italic) {
        const italicAttrNum = apoolNumToAttrib['2'] ? '2' : apoolNextNum.toString();
        if (!apoolNumToAttrib['2']) {
          apoolNextNum++;
          apoolNumToAttrib[italicAttrNum] = ['italic', 'true'];
          attribToNum['italic,true'] = parseInt(italicAttrNum);
        }
        activeAttrs.push(italicAttrNum);
      }

      if (segment.underline) {
        const underlineAttrNum = apoolNumToAttrib['4'] ? '4' : apoolNextNum.toString();
        if (!apoolNumToAttrib['4']) {
          apoolNextNum++;
          apoolNumToAttrib[underlineAttrNum] = ['underline', 'true'];
          attribToNum['underline,true'] = parseInt(underlineAttrNum);
        }
        activeAttrs.push(underlineAttrNum);
      }

      if (segment.strikethrough) {
        const strikeAttrNum = apoolNumToAttrib['5'] ? '5' : apoolNextNum.toString();
        if (!apoolNumToAttrib['5']) {
          apoolNextNum++;
          apoolNumToAttrib[strikeAttrNum] = ['strikethrough', 'true'];
          attribToNum['strikethrough,true'] = parseInt(strikeAttrNum);
        }
        activeAttrs.push(strikeAttrNum);
      }

      const attrsPart = activeAttrs.join('*');
      attribParts.push(`*${attrsPart}+${length}`);
    }

    const fullText = textParts.join('');
    const attribsStr = attribParts.join('');

    return {
      apool: {
        nextNum: apoolNextNum,
        numToAttrib: apoolNumToAttrib,
        attribToNum
      },
      initialAttributedTexts: {
        attribs: { '0': attribsStr },
        text: { '0': fullText },
        rows: {},
        cols: {}
      }
    };
  }

  private parseInlineText(text: string): TextSegment[] {
    if (!text) return [];

    const inlineTokens = marked.lexer(text, { breaks: true });

    return this.parseInlineTokens(inlineTokens);
  }

  private parseInlineTokens(inlineTokens: any[]): TextSegment[] {
    const segments: TextSegment[] = [];
    for (const token of inlineTokens) {
      switch (token.type) {
        case 'text':
          segments.push({ text: token.raw });
          break;
        case 'strong':
          segments.push({ text: token.text, bold: true });
          break;
        case 'em':
          segments.push({ text: token.text, italic: true });
          break;
        case 'del':
          segments.push({ text: token.text, strikethrough: true });
          break;
        case 'codespan':
          segments.push({ text: token.raw });
          break;
        case 'link':
          segments.push({ text: token.text, linkUrl: token.href });
          break;
        case 'image':
          segments.push({ text: `![${token.text}](${token.href})` });
          break;
        default:
          segments.push({ text: token.raw || '' });
      }
    }
    return segments;
  }

  private createTextData(segments: TextSegment[] | string): any {
    // Handle backward compatibility - accept string as well
    if (typeof segments === 'string') {
      segments = [{ text: segments }];
    }

    if (!segments || segments.length === 0) {
      return {
        apool: { nextNum: 0, numToAttrib: {} },
        initialAttributedTexts: {
          attribs: "",
          text: { '0': "" },
          rows: {},
          cols: {}
        }
      };
    }

    const apoolNumToAttrib: Record<string, unknown> = {
      '0': ['author', this.authorId]
    };
    const attribToNum: Record<string, number> = {
      [`author,${this.authorId}`]: 0
    };

    let apoolNextNum = 1;
    const attribParts: string[] = [];
    const textParts: string[] = [];

    // Build full text and attribs string
    for (const segment of segments) {
      const text = segment.text || '';
      const length = text.length;

      if (length === 0) continue;

      textParts.push(text);

      // Collect all active attributes for this segment
      const activeAttrs: string[] = ['0']; // Always include author

      if (segment.linkUrl) {
        const linkAttrNum = apoolNextNum.toString();
        apoolNextNum++;
        const encodedUrl = encodeURIComponent(segment.linkUrl);
        apoolNumToAttrib[linkAttrNum] = ['link', encodedUrl];
        attribToNum[`link,${encodedUrl}`] = parseInt(linkAttrNum);
        activeAttrs.push(linkAttrNum);
      }

      if (segment.bold) {
        const boldAttrNum = apoolNumToAttrib['1'] ? '1' : apoolNextNum.toString();
        if (!apoolNumToAttrib['1']) {
          apoolNextNum++;
          apoolNumToAttrib[boldAttrNum] = ['bold', 'true'];
          attribToNum['bold,true'] = parseInt(boldAttrNum);
        }
        activeAttrs.push(boldAttrNum);
      }

      if (segment.italic) {
        const italicAttrNum = apoolNumToAttrib['2'] ? '2' : apoolNextNum.toString();
        if (!apoolNumToAttrib['2']) {
          apoolNextNum++;
          apoolNumToAttrib[italicAttrNum] = ['italic', 'true'];
          attribToNum['italic,true'] = parseInt(italicAttrNum);
        }
        activeAttrs.push(italicAttrNum);
      }

      if (segment.underline) {
        const underlineAttrNum = apoolNumToAttrib['4'] ? '4' : apoolNextNum.toString();
        if (!apoolNumToAttrib['4']) {
          apoolNextNum++;
          apoolNumToAttrib[underlineAttrNum] = ['underline', 'true'];
          attribToNum['underline,true'] = parseInt(underlineAttrNum);
        }
        activeAttrs.push(underlineAttrNum);
      }

      if (segment.strikethrough) {
        const strikeAttrNum = apoolNumToAttrib['5'] ? '5' : apoolNextNum.toString();
        if (!apoolNumToAttrib['5']) {
          apoolNextNum++;
          apoolNumToAttrib[strikeAttrNum] = ['strikethrough', 'true'];
          attribToNum['strikethrough,true'] = parseInt(strikeAttrNum);
        }
        activeAttrs.push(strikeAttrNum);
      }

      // Create attribs string: *attr1*attr2+length
      const attrsPart = activeAttrs.join('*');
      attribParts.push(`*${attrsPart}+${length}`);
    }

    const fullText = textParts.join('');
    const attribsStr = attribParts.join('');

    return {
      apool: {
        nextNum: apoolNextNum,
        numToAttrib: apoolNumToAttrib,
        attribToNum
      },
      initialAttributedTexts: {
        attribs: { '0': attribsStr },
        text: { '0': fullText },
        rows: {},
        cols: {}
      }
    };
  }

  private createHeadingBlock(recordId: string, depth: number, segments: TextSegment[]): any {
    const blockType = `heading${depth}`;

    return {
      id: recordId,
      snapshot: {
        type: blockType,
        parent_id: this.rootId,
        comments: [],
        revisions: [],
        locked: false,
        hidden: false,
        author: this.authorId,
        children: [],
        text: this.createTextData(segments),
        level: depth,
        folded: false
      }
    };
  }

  private createTextBlock(recordId: string, segments: TextSegment[]): any {
    return {
      id: recordId,
      snapshot: {
        type: 'text',
        parent_id: this.rootId,
        comments: [],
        revisions: [],
        locked: false,
        hidden: false,
        author: this.authorId,
        children: [],
        text: this.createTextData(segments),
        align: '',
        folded: false
      }
    };
  }

  private createQuoteBlock(recordId: string, segments: TextSegment[]): any {
    return {
      id: recordId,
      snapshot: {
        type: 'quote',
        parent_id: this.rootId,
        comments: [],
        revisions: [],
        locked: false,
        hidden: false,
        author: this.authorId,
        children: [],
        text: this.createTextData(segments),
        folded: false
      }
    };
  }

  private createCodeBlock(recordId: string, code: string, lang: string | undefined): any {
    return {
      id: recordId,
      snapshot: {
        type: 'code',
        parent_id: this.rootId,
        comments: [],
        revisions: [],
        locked: false,
        hidden: false,
        author: this.authorId,
        children: [],
        language: lang || 'plaintext',
        code,
        text: this.createTextData(code),
        is_language_picked: true,
        caption: {
          text: {
            initialAttributedTexts: {
              text: { '0': '\n' },
              attribs: { '0': '|1+1' }
            },
            apool: { numToAttrib: {}, nextNum: 0 }
          }
        },
        wrap: false,
        folded: false
      }
    };
  }

  private createDividerBlock(recordId: string): any {
    return {
      id: recordId,
      snapshot: {
        type: 'divider',
        parent_id: this.rootId,
        comments: [],
        revisions: [],
        locked: false,
        hidden: false,
        author: this.authorId,
        folded: false
      }
    };
  }

  private createMermaidBlock(recordId: string, code: string): any {
    const blockId = generateBlockId();

    return {
      id: recordId,
      snapshot: {
        type: 'isv',
        parent_id: this.rootId,
        comments: null,
        revisions: null,
        locked: false,
        hidden: false,
        author: this.authorId,
        children: [],
        data: {
          data: code,
          theme: 'default',
          view: 'codeChart'
        },
        app_block_id: '',
        block_type_id: 'blk_631fefbbae02400430b8f9f4',
        manifest: {
          view_type: 'block_h5',
          app_version: '0.0.112'
        },
        comment_details: {},
        interaction_data_token: this.generateRandomId()
      }
    };
  }

  private buildClipboardData(): ClipboardData {
    const data: ClipboardData = {
      isCut: false,
      rootId: this.rootId!,
      parentId: this.rootId!,
      blockIds: this.blockIds,
      recordIds: this.recordIds,
      recordMap: this.recordMap,
      payloadMap: {},
      selection: [],
      extra: {
        channel: 'saas',
        pasteRandomId: this.generateRandomId(),
        mention_page_title: {},
        external_mention_url: {},
        isEqualBlockSelection: true
      },
      isKeepQuoteContainer: false,
      pasteFlag: this.generateRandomId()
    };

    return data;
  }

  private generateRandomId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}
