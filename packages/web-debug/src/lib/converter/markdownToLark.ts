import { generateBlockId, generateRecordId, generatePageId } from '../utils/idGenerator.js';
import * as marked from 'marked';

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

  convert(markdown: string): any {
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
        this.recordMap[recordId] = this.createHeadingBlock(recordId, depth, text);
        break;

      case 'paragraph':
        this.recordMap[recordId] = this.createTextBlock(recordId, this.parseInlineText(text));
        break;

      case 'blockquote':
        this.recordMap[recordId] = this.createQuoteBlock(recordId, text);
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

  private convertListItems(items: any[], ordered: boolean | undefined): void {
    let index = 1;
    for (const item of items) {
      const recordId = generateRecordId();
      const blockId = this.blockIds.length + 1;
      let blockType = ordered ? 'ordered' : 'bullet';

      if (item.checked !== undefined) {
        blockType = 'todo';
      }

      const textData = this.parseInlineText(item.text);

      this.recordIds.push(recordId);

      const snapshot: any = {
        type: blockType,
        parent_id: this.rootId,
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
        snapshot.level = 1;
        snapshot.seq = index === 1 ? '1' : 'auto';
        index++;
      }

      this.recordMap[recordId] = {
        id: recordId,
        snapshot
      };

      this.blockIds.push(blockId);
    }
  }

  private createListItemTextData(text: string): any {
    if (!text) {
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

    return {
      apool: {
        nextNum: 1,
        numToAttrib: {
          '0': ['author', this.authorId]
        },
        attribToNum: {
          [`author,${this.authorId}`]: 0
        }
      },
      initialAttributedTexts: {
        attribs: {
          '0': '*0+' + text.length
        },
        text: {
          '0': text
        },
        rows: {},
        cols: {}
      }
    };
  }

  private parseInlineText(text: string): string {
    if (!text) return '';

    const inlineTokens = marked.lexer(text, { breaks: true });

    let result = '';
    for (const token of inlineTokens) {
      switch (token.type) {
        case 'text':
          result += token.raw;
          break;
        case 'strong':
          result += `**${token.text}**`;
          break;
        case 'em':
          result += `*${token.text}*`;
          break;
        case 'del':
          result += `~~${token.text}~~`;
          break;
        case 'codespan':
          result += `\`${token.text}\``;
          break;
        case 'link':
          result += `[${token.text}](${token.href})`;
          break;
        case 'image':
          result += `![${token.text}](${token.href})`;
          break;
        default:
          result += token.raw || '';
      }
    }
    return result;
  }

  private createTextData(text: string): any {
    if (!text) {
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

    return {
      apool: {
        nextNum: 1,
        numToAttrib: {
          '0': ['author', this.authorId]
        },
        attribToNum: {
          [`author,${this.authorId}`]: 0
        }
      },
      initialAttributedTexts: {
        attribs: { '0': "*0+" + text.length },
        text: { '0': text },
        rows: {},
        cols: {}
      }
    };
  }

  private createHeadingBlock(recordId: string, depth: number, text: string): any {
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
        text: this.createTextData(text),
        level: depth,
        folded: false
      }
    };
  }

  private createTextBlock(recordId: string, text: string): any {
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
        text: this.createTextData(text),
        align: '',
        folded: false
      }
    };
  }

  private createQuoteBlock(recordId: string, text: string): any {
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
        text: this.createTextData(text),
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

  private buildClipboardData(): any {
    const data = {
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
