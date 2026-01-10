import { generateBlockId, generateRecordId, generatePageId } from '../utils/idGenerator.js';
import * as marked from 'marked';

export class MarkdownToLarkConverter {
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

  convert(markdown) {
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

  createPageBlock(pageId) {
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

  convertTokens(tokens) {
    for (const token of tokens) {
      const blockId = this.convertToken(token);
      if (blockId) {
        this.recordIds.push(blockId);
        this.blockIds.push(this.blockIds.length + 1);
      }
    }
  }

  convertToken(token) {
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

  convertListItems(items, ordered) {
    const blocks = [];
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

      const snapshot = {
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
        snapshot.checked = item.checked;
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
    return blocks;
  }

  createListItemTextData(text) {
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

  parseInlineText(text) {
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

  createTextData(text) {
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

  createHeadingBlock(recordId, depth, text) {
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

  createTextBlock(recordId, text) {
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

  createQuoteBlock(recordId, text) {
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

  createCodeBlock(recordId, code, lang) {
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
        folded: false
      }
    };
  }

  createDividerBlock(recordId) {
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

  createMermaidBlock(recordId, code) {
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

  buildClipboardData() {
    const data = {
      isCut: false,
      rootId: this.rootId,
      parentId: this.rootId,
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

  generateRandomId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}
