import { describe, it, expect } from 'vitest';
import { MarkdownToLarkConverter, markdownToLark, larkToMarkdown } from '@md-lark-converter/core';

describe('markdownToLarkConverter', () => {
  it('should convert heading to lark format', () => {
    const converter = new MarkdownToLarkConverter();
    const result = converter.convert('# Test Heading');

    expect(result).toBeDefined();
    expect(result.rootId).toMatch(/^Wqf[a-z0-9_]+$/);
    expect(result.recordIds.length).toBeGreaterThan(0);
    expect(result.recordMap).toBeDefined();
  });

  it('should convert paragraph to lark format', () => {
    const converter = new MarkdownToLarkConverter();
    const result = converter.convert('This is a test paragraph.');

    expect(result).toBeDefined();
    expect(result.recordIds.length).toBeGreaterThan(0);
  });

  it('should convert list to lark format', () => {
    const converter = new MarkdownToLarkConverter();
    const result = converter.convert('- Item 1\n- Item 2\n');

    expect(result).toBeDefined();
    expect(result.recordIds.length).toBeGreaterThan(0);
  });

  it('should convert code block to lark format', () => {
    const converter = new MarkdownToLarkConverter();
    const result = converter.convert('```javascript\nconst a = 1;\n```');

    expect(result).toBeDefined();
    expect(result.recordIds.length).toBeGreaterThan(0);
  });

  it('should convert link to lark format with correct attribs', () => {
    const converter = new MarkdownToLarkConverter();
    const result = converter.convert('111 [222](http://baidu.com) 333');

    expect(result).toBeDefined();
    expect(result.recordIds.length).toBeGreaterThan(0);

    const recordId = result.recordIds[0];
    const record = result.recordMap[recordId];
    const textData = record.snapshot.text;

    expect(textData).toBeDefined();
    expect(textData.initialAttributedTexts.text).toEqual({ '0': '111 222 333' });
    expect(textData.initialAttributedTexts.attribs).toEqual({ '0': '*0+4*0*1+3*0+4' });
    expect(textData.apool.nextNum).toBe(2);
    expect(textData.apool.numToAttrib['0']).toEqual(['author', '7092639913849389057']);
    expect(textData.apool.numToAttrib['1']).toEqual(['link', 'http%3A%2F%2Fbaidu.com']);
  });
});

describe('larkToMarkdown', () => {
  it('should convert lark heading back to markdown', () => {
    const larkData = markdownToLark('# 一级标题\n## 二级标题\n### 三级标题');
    console.log('Heading test - recordIds:', larkData.recordIds);
    for (const rid of larkData.recordIds) {
      const r = larkData.recordMap[rid];
      console.log(`  Record ${rid}: type=${r.snapshot.type}, parent_id=${r.snapshot.parent_id}`);
    }
    const markdown = larkToMarkdown(larkData);
    console.log('Generated markdown:', JSON.stringify(markdown));
    console.log('Expected markdown:', JSON.stringify('# 一级标题\n\n## 二级标题\n\n### 三级标题'));
    expect(markdown).toBe('# 一级标题\n\n## 二级标题\n\n### 三级标题');
  });

  it('should convert lark paragraph back to markdown', () => {
    const larkData = markdownToLark('这是普通文本段落。\n\n这是第二段。');
    const markdown = larkToMarkdown(larkData);

    expect(markdown).toBe('这是普通文本段落。\n\n这是第二段。');
  });

  it('should convert lark list back to markdown', () => {
    const larkData = markdownToLark('- 项目 1\n- 项目 2\n- 项目 3\n');
    const markdown = larkToMarkdown(larkData);

    expect(markdown).toBe('- 项目 1\n- 项目 2\n- 项目 3');
  });

  it('should convert lark code block back to markdown', () => {
    const larkData = markdownToLark('```javascript\nfunction hello() {\n  console.log(\'Hello\');\n}\n```');
    const markdown = larkToMarkdown(larkData);

    expect(markdown).toBe('```javascript\nfunction hello() {\n  console.log(\'Hello\');\n}\n```');
  });

  it('should convert lark link back to markdown', () => {
    const larkData = markdownToLark('这是一个 [链接](https://feishu.cn)。');
    const markdown = larkToMarkdown(larkData);

    expect(markdown).toBe('这是一个 [链接](https://feishu.cn)。');
  });

  it('should convert complex inline styles', () => {
    const markdown = `这里是 **加粗** 这里是 *斜体* ，这里是 [链接](http://baidu.com)， 这里是 ~~删除线~~。`;
    const larkData = markdownToLark(markdown);
    const resultMarkdown = larkToMarkdown(larkData);

    expect(resultMarkdown).toBe(markdown);
  });

  it('should verify Lark format matches expected structure', () => {
    const markdown = `这里是 **加粗** 这里是 *斜体* ，这里是 [链接](http://baidu.com)， 这里是 ~~删除线~~。`;
    const larkData = markdownToLark(markdown);

    const recordId = larkData.recordIds[0];
    const record = larkData.recordMap[recordId];
    const textData = record.snapshot.text;

    expect(textData).toBeDefined();
    expect(textData.initialAttributedTexts.text).toEqual({ '0': '这里是 加粗 这里是 斜体 ，这里是 链接， 这里是 删除线。' });
    expect(textData.apool.nextNum).toBe(5);
    expect(textData.apool.numToAttrib['0']).toEqual(['author', '7092639913849389057']);
    expect(textData.apool.numToAttrib['1']).toEqual(['bold', 'true']);
    expect(textData.apool.numToAttrib['2']).toEqual(['italic', 'true']);
    expect(textData.apool.numToAttrib['3']).toEqual(['link', 'http%3A%2F%2Fbaidu.com']);
    expect(textData.apool.numToAttrib['4']).toEqual(['strikethrough', 'true']);
  });

  it('should convert mixed bold and italic styles', () => {
    const markdown = `这是 **混合**样式`;
    const larkData = markdownToLark(markdown);
    const resultMarkdown = larkToMarkdown(larkData);

    expect(resultMarkdown).toBe(markdown);
  });

  it('should handle empty data gracefully', () => {
    const markdown = larkToMarkdown({} as any);
    expect(markdown).toBe('');
  });

  it('should convert text with link', () => {
    const markdown = '111 [222](http://baidu.com) 333';
    const larkData = markdownToLark(markdown);
    const resultMarkdown = larkToMarkdown(larkData);
    expect(resultMarkdown).toBe(markdown);
  });

  it('should convert text with bold', () => {
    const markdown = '这里是 **加粗**';
    const larkData = markdownToLark(markdown);
    const resultMarkdown = larkToMarkdown(larkData);
    expect(resultMarkdown).toBe(markdown);
  });

  it('should convert text with italic', () => {
    const markdown = '这里是 *斜体*';
    const larkData = markdownToLark(markdown);
    const resultMarkdown = larkToMarkdown(larkData);
    expect(resultMarkdown).toBe(markdown);
  });

  it('should convert text with strikethrough', () => {
    const markdown = '这里是 ~~删除线~~';
    const larkData = markdownToLark(markdown);
    const resultMarkdown = larkToMarkdown(larkData);
    expect(resultMarkdown).toBe(markdown);
  });

  it('should convert text with multiple formats', () => {
    const markdown = '这里是 **加粗** 这里是 *斜体* ，这里是 [链接](http://baidu.com)， 这里是 ~~删除线~~。';
    const larkData = markdownToLark(markdown);
    const resultMarkdown = larkToMarkdown(larkData);
    expect(resultMarkdown).toBe(markdown);
  });

  it('should convert text with mixed formats on same word', () => {
    const markdown = '这里是 **混合样式**';
    const larkData = markdownToLark(markdown);
    const resultMarkdown = larkToMarkdown(larkData);
    expect(resultMarkdown).toBe(markdown);
  });

  it('should handle complex mixed formatting from real Lark data', () => {
    const markdown = '这里是 **加粗** 这里是 *斜体*';
    const larkData = markdownToLark(markdown);
    const resultMarkdown = larkToMarkdown(larkData);
    expect(resultMarkdown).toBe(markdown);
  });
});
