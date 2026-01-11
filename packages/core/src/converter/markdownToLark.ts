/// <reference types="mdast-util-math" />
import { generateBlockId, generateRecordId, generatePageId } from '../utils/idGenerator.js';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import { visit, SKIP } from 'unist-util-visit';
import type { Root, Heading, Paragraph, List, ListItem, Blockquote, Code, ThematicBreak, Strong, Emphasis, Link, InlineCode, Delete } from 'mdast';
import type { Math, InlineMath } from 'mdast-util-math';
import type { ClipboardData } from '../index.js';

interface TextSegment {
  text: string;
  linkUrl?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  equation?: string;
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

  async convert(markdown: string): Promise<ClipboardData> {
    this.rootId = generatePageId();
    this.recordMap = {};
    this.blockIds = [];
    this.recordIds = [];
    this.payloadMap = {};
    this.apoolNextNum = 0;
    this.apoolNumToAttrib = {};

    const normalizedMarkdown = this.normalizeMathBlocks(markdown);

    const tree = await unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkMath)
      .parse(normalizedMarkdown);

    this.createPageBlock(this.rootId);
    this.convertTree(tree);

    return this.buildClipboardData();
  }

  private normalizeMathBlocks(markdown: string): string {
    return markdown.replace(/\$\$([^\n]+?)\$\$/g, (_, content) => {
      return `$$\n${content.trim()}\n$$`;
    });
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

  private convertTree(tree: Root): void {
    const topLevelRecordIds: string[] = [];

    visit(tree, (node, index, parent) => {
      if (parent?.type === 'listItem') {
        return SKIP;
      }

      if (node.type === 'heading') {
        const recordId = generateRecordId();
        this.recordMap[recordId] = this.createHeadingBlock(recordId, node as Heading);
        this.recordIds.push(recordId);
        this.blockIds.push(this.blockIds.length + 1);
        topLevelRecordIds.push(recordId);
      } else if (node.type === 'paragraph') {
        const recordId = generateRecordId();
        this.recordMap[recordId] = this.createTextBlock(recordId, node as Paragraph);
        this.recordIds.push(recordId);
        this.blockIds.push(this.blockIds.length + 1);
        topLevelRecordIds.push(recordId);
      } else if (node.type === 'blockquote') {
        const recordId = generateRecordId();
        this.recordMap[recordId] = this.createQuoteBlock(recordId, node as Blockquote);
        this.recordIds.push(recordId);
        this.blockIds.push(this.blockIds.length + 1);
        topLevelRecordIds.push(recordId);
        return SKIP;
      } else if (node.type === 'code') {
        const recordId = generateRecordId();
        const codeNode = node as Code;
        if (codeNode.lang && codeNode.lang.toLowerCase() === 'mermaid') {
          this.recordMap[recordId] = this.createMermaidBlock(recordId, codeNode.value);
        } else {
          this.recordMap[recordId] = this.createCodeBlock(recordId, codeNode.value, codeNode.lang ?? undefined);
        }
        this.recordIds.push(recordId);
        this.blockIds.push(this.blockIds.length + 1);
        topLevelRecordIds.push(recordId);
      } else if (node.type === 'thematicBreak') {
        const recordId = generateRecordId();
        this.recordMap[recordId] = this.createDividerBlock(recordId);
        this.recordIds.push(recordId);
        this.blockIds.push(this.blockIds.length + 1);
        topLevelRecordIds.push(recordId);
      } else if (node.type === 'math') {
        const mathNode = node as any;
        const recordId = generateRecordId();
        const equation = mathNode.value ?? '';
        this.recordMap[recordId] = this.createEquationParagraphBlock(recordId, equation);
        this.recordIds.push(recordId);
        this.blockIds.push(this.blockIds.length + 1);
        topLevelRecordIds.push(recordId);
      } else if (node.type === 'table') {
        const tableRecordIds = this.convertTable(node);
        topLevelRecordIds.push(tableRecordIds.tableId);
      }
    });

    const processedLists = new Set<any>();
    visit(tree, 'list', (node, index, parent) => {
      if (processedLists.has(node)) {
        return SKIP;
      }
      processedLists.add(node);
      if (parent?.type === 'listItem') {
        return SKIP;
      }
      const listRecordIds = this.convertList(node as List);
      topLevelRecordIds.push(...listRecordIds);
    });

    if (this.rootId && this.recordMap[this.rootId]) {
      this.recordMap[this.rootId].snapshot.children = topLevelRecordIds;
    }
  }

  private convertList(listNode: List): string[] {
    const ordered = listNode.ordered || false;
    return this.convertListItems(listNode.children as ListItem[], ordered, null, 0, true);
  }

  private convertListItems(
    items: ListItem[],
    ordered: boolean,
    parentId: string | null = null,
    level: number = 0,
    isTopLevel: boolean = false
  ): string[] {
    const childRecordIds: string[] = [];
    const topLevelIds: string[] = [];
    let index = 1;

    for (const item of items) {
      const recordId = generateRecordId();
      const blockId = this.blockIds.length + 1;
      let blockType = ordered ? 'ordered' : 'bullet';

      const isTaskItem = item.checked !== undefined && item.checked !== null;
      if (isTaskItem) {
        blockType = 'todo';
      }

      const listContent = item.children;
      const segments = listContent.length > 0 && listContent[0].type === 'paragraph'
        ? this.parseInlineContent(listContent[0].children)
        : this.parseInlineContent(listContent);

      // Only add to recordIds for top-level items (matching Lark's structure)
      if (isTopLevel && level === 0) {
        this.recordIds.push(recordId);
      }

      const snapshot: any = {
        type: blockType,
        parent_id: parentId || this.rootId,
        comments: [],
        revisions: [],
        locked: false,
        hidden: false,
        author: this.authorId,
        children: [],
        text: ordered ? this.createListItemTextData(segments) : this.createTextData(segments),
        align: '',
        folded: false
      };

      if (isTaskItem) {
        snapshot.done = item.checked || false;
      }

      // Set level for all list items, not just ordered lists
      if (ordered) {
        snapshot.level = level + 1;
        snapshot.seq = index === 1 ? '1' : 'auto';
        index++;
      } else {
        // Set level for bullet lists too (1 for top-level, 2 for nested, etc.)
        snapshot.level = level + 1;
      }

      for (const child of item.children) {
        if (child.type === 'list') {
          const nestedChildIds = this.convertListItems(
            (child as List).children as ListItem[],
            (child as List).ordered || false,
            recordId,
            level + 1,
            false
          );
          snapshot.children.push(...nestedChildIds);
        }
      }

      this.recordMap[recordId] = {
        id: recordId,
        snapshot
      };

      this.blockIds.push(blockId);
      childRecordIds.push(recordId);

      if (isTopLevel && level === 0) {
        topLevelIds.push(recordId);
      }
    }

    return isTopLevel ? topLevelIds : childRecordIds;
  }

  private parseInlineContent(children: any[]): TextSegment[] {
    const segments: TextSegment[] = [];

    for (const child of children) {
      if (child.type === 'text') {
        segments.push({ text: child.value });
      } else if (child.type === 'strong') {
        const text = this.extractTextContent(child);
        segments.push({ text, bold: true });
      } else if (child.type === 'emphasis') {
        const text = this.extractTextContent(child);
        segments.push({ text, italic: true });
      } else if (child.type === 'delete') {
        const text = this.extractTextContent(child);
        segments.push({ text, strikethrough: true });
      } else if (child.type === 'inlineCode') {
        segments.push({ text: child.value });
      } else if (child.type === 'link') {
        const linkNode = child as Link;
        const text = this.extractTextContent(linkNode);
        segments.push({ text, linkUrl: linkNode.url });
      } else if (child.type === 'image') {
        segments.push({ text: ' [markdown-to-lark 暂无法支持图片转换] ' });
      } else if (child.type === 'inlineMath') {
        const mathNode = child as any;
        segments.push({ text: 'E', equation: mathNode.value ?? '' });
      } else if (child.type === 'break') {
        segments.push({ text: '\n' });
      }
    }

    return segments;
  }

  private extractTextContent(node: any): string {
    let text = '';
    if (node.type === 'text') {
      text = node.value;
    } else if (node.children) {
      for (const child of node.children) {
        text += this.extractTextContent(child);
      }
    }
    return text;
  }

  private createHeadingBlock(recordId: string, node: Heading): any {
    const depth = node.depth;
    const segments = this.parseInlineContent(node.children);

    return {
      id: recordId,
      snapshot: {
        type: `heading${depth}`,
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

  private createTextBlock(recordId: string, node: Paragraph): any {
    const segments = this.parseInlineContent(node.children);

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

  private createQuoteBlock(recordId: string, node: Blockquote): any {
    const flattenedContent = this.flattenNestedBlockquotes(node.children);
    const segments = this.parseInlineContent(flattenedContent);

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

  private flattenNestedBlockquotes(children: any[]): any[] {
    const result: any[] = [];

    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (child.type === 'blockquote') {
        const nestedContent = this.flattenNestedBlockquotes(child.children);
        if (result.length > 0) {
          result.push({ type: 'text', value: '\n\n' });
        }
        result.push(...nestedContent);
      } else if (child.type === 'paragraph') {
        if (result.length > 0) {
          result.push({ type: 'text', value: '\n\n' });
        }
        result.push(...child.children);
      } else {
        result.push(child);
      }
    }

    return result;
  }

  private createEquationBlock(recordId: string, equation: string): any {
    const segments: TextSegment[] = [{ text: 'E', equation }];

    return {
      id: recordId,
      snapshot: {
        type: 'equation',
        parent_id: this.rootId,
        comments: [],
        revisions: [],
        locked: false,
        hidden: false,
        author: this.authorId,
        children: [],
        elements: [{
          equation: {
            latex: equation
          }
        }],
        text: this.createTextData(segments),
        folded: false
      }
    };
  }

  private createEquationParagraphBlock(recordId: string, equation: string): any {
    const segments: TextSegment[] = [{ text: 'E', equation: equation + '_display' }];

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

  private createTextData(segments: TextSegment[] | string): any {
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
        const boldAttrKey = 'bold,true';
        let boldAttrNum = attribToNum[boldAttrKey];
        if (boldAttrNum === undefined) {
          boldAttrNum = apoolNextNum;
          apoolNextNum++;
          apoolNumToAttrib[boldAttrNum.toString()] = ['bold', 'true'];
          attribToNum[boldAttrKey] = boldAttrNum;
        }
        activeAttrs.push(boldAttrNum.toString());
      }

      if (segment.italic) {
        const italicAttrKey = 'italic,true';
        let italicAttrNum = attribToNum[italicAttrKey];
        if (italicAttrNum === undefined) {
          italicAttrNum = apoolNextNum;
          apoolNextNum++;
          apoolNumToAttrib[italicAttrNum.toString()] = ['italic', 'true'];
          attribToNum[italicAttrKey] = italicAttrNum;
        }
        activeAttrs.push(italicAttrNum.toString());
      }

      if (segment.underline) {
        const underlineAttrKey = 'underline,true';
        let underlineAttrNum = attribToNum[underlineAttrKey];
        if (underlineAttrNum === undefined) {
          underlineAttrNum = apoolNextNum;
          apoolNextNum++;
          apoolNumToAttrib[underlineAttrNum.toString()] = ['underline', 'true'];
          attribToNum[underlineAttrKey] = underlineAttrNum;
        }
        activeAttrs.push(underlineAttrNum.toString());
      }

      if (segment.strikethrough) {
        const strikeAttrKey = 'strikethrough,true';
        let strikeAttrNum = attribToNum[strikeAttrKey];
        if (strikeAttrNum === undefined) {
          strikeAttrNum = apoolNextNum;
          apoolNextNum++;
          apoolNumToAttrib[strikeAttrNum.toString()] = ['strikethrough', 'true'];
          attribToNum[strikeAttrKey] = strikeAttrNum;
        }
        activeAttrs.push(strikeAttrNum.toString());
      }

      if (segment.equation) {
        const eqAttrNum = apoolNextNum.toString();
        apoolNextNum++;
        apoolNumToAttrib[eqAttrNum] = ['equation', segment.equation];
        attribToNum[`equation,${segment.equation}`] = parseInt(eqAttrNum);
        activeAttrs.push(eqAttrNum);
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
        const boldAttrKey = 'bold,true';
        let boldAttrNum = attribToNum[boldAttrKey];
        if (boldAttrNum === undefined) {
          boldAttrNum = apoolNextNum;
          apoolNextNum++;
          apoolNumToAttrib[boldAttrNum.toString()] = ['bold', 'true'];
          attribToNum[boldAttrKey] = boldAttrNum;
        }
        activeAttrs.push(boldAttrNum.toString());
      }

      if (segment.italic) {
        const italicAttrKey = 'italic,true';
        let italicAttrNum = attribToNum[italicAttrKey];
        if (italicAttrNum === undefined) {
          italicAttrNum = apoolNextNum;
          apoolNextNum++;
          apoolNumToAttrib[italicAttrNum.toString()] = ['italic', 'true'];
          attribToNum[italicAttrKey] = italicAttrNum;
        }
        activeAttrs.push(italicAttrNum.toString());
      }

      if (segment.underline) {
        const underlineAttrKey = 'underline,true';
        let underlineAttrNum = attribToNum[underlineAttrKey];
        if (underlineAttrNum === undefined) {
          underlineAttrNum = apoolNextNum;
          apoolNextNum++;
          apoolNumToAttrib[underlineAttrNum.toString()] = ['underline', 'true'];
          attribToNum[underlineAttrKey] = underlineAttrNum;
        }
        activeAttrs.push(underlineAttrNum.toString());
      }

      if (segment.strikethrough) {
        const strikeAttrKey = 'strikethrough,true';
        let strikeAttrNum = attribToNum[strikeAttrKey];
        if (strikeAttrNum === undefined) {
          strikeAttrNum = apoolNextNum;
          apoolNextNum++;
          apoolNumToAttrib[strikeAttrNum.toString()] = ['strikethrough', 'true'];
          attribToNum[strikeAttrKey] = strikeAttrNum;
        }
        activeAttrs.push(strikeAttrNum.toString());
      }

      if (segment.equation) {
        const eqAttrNum = apoolNextNum.toString();
        apoolNextNum++;
        apoolNumToAttrib[eqAttrNum] = ['equation', segment.equation];
        attribToNum[`equation,${segment.equation}`] = parseInt(eqAttrNum);
        activeAttrs.push(eqAttrNum);
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

  private convertTable(tableNode: any): { tableId: string } {
    const tableRecordId = generateRecordId();
    const children = tableNode.children as any[];

    if (!children || children.length === 0) {
      return { tableId: tableRecordId };
    }

    const alignments = (tableNode.align as string[]) || [];
    const rows = children as any[];

    const columnIds: string[] = [];
    const rowIds: string[] = [];
    const columnSet: Record<string, { column_width: number }> = {};
    const cellSet: Record<string, { block_id: string; merge_info: { row_span: number; col_span: number } }> = {};
    const tableCellIds: string[] = [];

    const numCols = alignments.length || rows[0]?.children?.length || 0;
    const numRows = rows.length;

    for (let i = 0; i < numCols; i++) {
      const colId = `col${this.generateRandomId().replace(/-/g, '')}`;
      columnIds.push(colId);
      columnSet[colId] = { column_width: 200 };
    }

    for (let i = 0; i < numRows; i++) {
      const rowId = `row${this.generateRandomId().replace(/-/g, '')}`;
      rowIds.push(rowId);
    }

    const processRow = (rowIndex: number, rowCells: any[]) => {
      const rowId = rowIds[rowIndex];
      for (let colIndex = 0; colIndex < rowCells.length && colIndex < numCols; colIndex++) {
        const colId = columnIds[colIndex];
        const cellNode = rowCells[colIndex];
        const cellRecordId = generateRecordId();

        const cellTextSegments = this.parseInlineContent(cellNode.children || []);
        const align = alignments[colIndex] || 'left';

        this.recordMap[cellRecordId] = {
          id: cellRecordId,
          snapshot: {
            type: 'table_cell',
            parent_id: tableRecordId,
            comments: [],
            revisions: [],
            locked: false,
            hidden: false,
            author: this.authorId,
            children: [],
            text: this.createTextData(cellTextSegments)
          }
        };

        const textRecordId = generateRecordId();
        this.recordMap[textRecordId] = {
          id: textRecordId,
          snapshot: {
            type: 'text',
            parent_id: cellRecordId,
            comments: [],
            revisions: [],
            locked: false,
            hidden: false,
            author: this.authorId,
            children: [],
            text: this.createTextData(cellTextSegments),
            folded: false,
            align
          }
        };

        this.recordMap[cellRecordId].snapshot.children.push(textRecordId);

        const cellKey = `${rowId}${colId}`;
        cellSet[cellKey] = {
          block_id: cellRecordId,
          merge_info: { row_span: 1, col_span: 1 }
        };

        tableCellIds.push(cellRecordId);
      }
    };

    for (let i = 0; i < rows.length; i++) {
      processRow(i, rows[i].children);
    }

    this.recordMap[tableRecordId] = {
      id: tableRecordId,
      snapshot: {
        type: 'table',
        parent_id: this.rootId,
        comments: [],
        revisions: [],
        locked: false,
        hidden: false,
        author: this.authorId,
        children: tableCellIds,
        columns_id: columnIds,
        rows_id: rowIds,
        column_set: columnSet,
        cell_set: cellSet
      }
    };

    this.recordIds.push(tableRecordId);
    this.blockIds.push(this.blockIds.length + 1);

    return { tableId: tableRecordId };
  }
}
