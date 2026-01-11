import { describe, it, expect } from 'vitest';
import { MarkdownToLarkConverter, markdownToLark, larkToMarkdown } from '@md-lark-converter/core';

describe('markdownToLarkConverter', () => {
  it('should convert heading to lark format', async () => {
    const converter = new MarkdownToLarkConverter();
    const result = await converter.convert('# Test Heading');

    expect(result).toBeDefined();
    expect(result.rootId).toMatch(/^Wqf[a-z0-9_]+$/);
    expect(result.recordIds.length).toBeGreaterThan(0);
    expect(result.recordMap).toBeDefined();
  });

  it('should convert paragraph to lark format', async () => {
    const converter = new MarkdownToLarkConverter();
    const result = await converter.convert('This is a test paragraph.');

    expect(result).toBeDefined();
    expect(result.recordIds.length).toBeGreaterThan(0);
  });

  it('should convert list to lark format', async () => {
    const converter = new MarkdownToLarkConverter();
    const result = await converter.convert('- Item 1\n- Item 2\n');

    expect(result).toBeDefined();
    expect(result.recordIds.length).toBeGreaterThan(0);
  });

  it('should convert code block to lark format', async () => {
    const converter = new MarkdownToLarkConverter();
    const result = await converter.convert('```javascript\nconst a = 1;\n```');

    expect(result).toBeDefined();
    expect(result.recordIds.length).toBeGreaterThan(0);
  });

  it('should convert link to lark format with correct attribs', async () => {
    const converter = new MarkdownToLarkConverter();
    const result = await converter.convert('111 [222](http://baidu.com) 333');

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
  it('should convert lark heading back to markdown', async () => {
    const larkData = await markdownToLark('# 一级标题\n## 二级标题\n### 三级标题');
    const markdown = larkToMarkdown(larkData);
    expect(markdown).toBe('# 一级标题\n\n## 二级标题\n\n### 三级标题');
  });

  it('should convert lark paragraph back to markdown', async () => {
    const larkData = await markdownToLark('这是普通文本段落。\n\n这是第二段。');
    const markdown = larkToMarkdown(larkData);

    expect(markdown).toBe('这是普通文本段落。\n\n这是第二段。');
  });

  it('should convert lark list back to markdown', async () => {
    const larkData = await markdownToLark('- 项目 1\n- 项目 2\n- 项目 3\n');
    const markdown = larkToMarkdown(larkData);

    expect(markdown).toBe('- 项目 1\n- 项目 2\n- 项目 3');
  });

  it('should convert lark code block back to markdown', async () => {
    const larkData = await markdownToLark('```javascript\nfunction hello() {\n  console.log(\'Hello\');\n}\n```');
    const markdown = larkToMarkdown(larkData);

    expect(markdown).toBe('```javascript\nfunction hello() {\n  console.log(\'Hello\');\n}\n```');
  });

  it('should convert lark link back to markdown', async () => {
    const larkData = await markdownToLark('这是一个 [链接](https://feishu.cn)。');
    const markdown = larkToMarkdown(larkData);

    expect(markdown).toBe('这是一个 [链接](https://feishu.cn)。');
  });

  it('should convert complex inline styles', async () => {
    const markdown = `这里是 **加粗** 这里是 *斜体* ，这里是 [链接](http://baidu.com)， 这里是 ~~删除线~~。`;
    const larkData = await markdownToLark(markdown);
    const resultMarkdown = larkToMarkdown(larkData);

    expect(resultMarkdown).toBe(markdown);
  });

  it('should verify Lark format matches expected structure', async () => {
    const markdown = `这里是 **加粗** 这里是 *斜体* ，这里是 [链接](http://baidu.com)， 这里是 ~~删除线~~。`;
    const larkData = await markdownToLark(markdown);

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

  it('should convert mixed bold and italic styles', async () => {
    const markdown = `这是 **混合**样式`;
    const larkData = await markdownToLark(markdown);
    const resultMarkdown = larkToMarkdown(larkData);

    expect(resultMarkdown).toBe(markdown);
  });

  it('should handle empty data gracefully', () => {
    const markdown = larkToMarkdown({} as any);
    expect(markdown).toBe('');
  });

  it('should convert text with link', async () => {
    const markdown = '111 [222](http://baidu.com) 333';
    const larkData = await markdownToLark(markdown);
    const resultMarkdown = larkToMarkdown(larkData);
    expect(resultMarkdown).toBe(markdown);
  });

  it('should convert text with bold', async () => {
    const markdown = '这里是 **加粗**';
    const larkData = await markdownToLark(markdown);
    const resultMarkdown = larkToMarkdown(larkData);
    expect(resultMarkdown).toBe(markdown);
  });

  it('should convert text with italic', async () => {
    const markdown = '这里是 *斜体*';
    const larkData = await markdownToLark(markdown);
    const resultMarkdown = larkToMarkdown(larkData);
    expect(resultMarkdown).toBe(markdown);
  });

  it('should convert text with strikethrough', async () => {
    const markdown = '这里是 ~~删除线~~';
    const larkData = await markdownToLark(markdown);
    const resultMarkdown = larkToMarkdown(larkData);
    expect(resultMarkdown).toBe(markdown);
  });

  it('should convert text with multiple formats', async () => {
    const markdown = '这里是 **加粗** 这里是 *斜体* ，这里是 [链接](http://baidu.com)， 这里是 ~~删除线~~。';
    const larkData = await markdownToLark(markdown);
    const resultMarkdown = larkToMarkdown(larkData);
    expect(resultMarkdown).toBe(markdown);
  });

  it('should convert text with mixed formats on same word', async () => {
    const markdown = '这里是 **混合样式**';
    const larkData = await markdownToLark(markdown);
    const resultMarkdown = larkToMarkdown(larkData);
    expect(resultMarkdown).toBe(markdown);
  });

  it('should handle complex mixed formatting from real Lark data', async () => {
    const markdown = '这里是 **加粗** 这里是 *斜体*';
    const larkData = await markdownToLark(markdown);
    const resultMarkdown = larkToMarkdown(larkData);
    expect(resultMarkdown).toBe(markdown);
  });

  describe('nested lists', () => {
    it('should convert nested bullet lists correctly', async () => {
      const markdown = `- 项目 1
  - 子项目 1.1
  - 子项目 1.2
- 项目 2
  - 子项目 2.1
    - 子项目 2.1.1
- 项目 3`;

      const larkData = await markdownToLark(markdown);
      const resultMarkdown = larkToMarkdown(larkData);

      expect(resultMarkdown).toBe(markdown);
    });

    it('should set correct level field for nested bullet lists', async () => {
      const markdown = `- 项目 1
  - 子项目 1.1
- 项目 2`;

      const larkData = await markdownToLark(markdown);

      expect(larkData.recordIds.length).toBe(2);

      const topRecordId = larkData.recordIds[0];
      const topRecord = larkData.recordMap[topRecordId];
      expect(topRecord.snapshot.level).toBe(1);
      expect(topRecord.snapshot.children.length).toBe(1);

      const nestedRecordId = topRecord.snapshot.children[0];
      const nestedRecord = larkData.recordMap[nestedRecordId];
      expect(nestedRecord.snapshot.level).toBe(2);
    });

    it('should preserve nested list structure in Lark format', async () => {
      const markdown = `- 项目 1
  - 子项目 1.1
  - 子项目 1.2
- 项目 2`;

      const larkData = await markdownToLark(markdown);

      const topLevelItems = larkData.recordIds.map(id => ({
        id,
        record: larkData.recordMap[id]
      }));

      expect(topLevelItems.length).toBe(2);

      const firstItem = topLevelItems[0].record;
      expect(firstItem.snapshot.children.length).toBe(2);

      const secondItem = topLevelItems[1].record;
      expect(secondItem.snapshot.children.length).toBe(0);
    });
  });

  describe('Lark to Markdown with user provided data', () => {
    it('should convert Lark nested list data structure correctly', async () => {
      const larkData = {
        isCut: false,
        rootId: "CtK0dKWSdogVwaxqDbRcFUpLn3f",
        parentId: "CtK0dKWSdogVwaxqDbRcFUpLn3f",
        blockIds: [12, 11, 10, 8, 6],
        recordIds: [
          "TCpldqgjmoEKhbxMHzVcYlvfnpe",
          "SHdWdJDHcoiMHExZUAwcWNs8nIK",
          "K9rsd4vNyocMprxjGjFcrbFLnfh",
          "Ja4odvEusouO0nxrLgWcCNganVe",
          "FRZgdoS9coBIP6xV9OxcuNEznNe"
        ],
        recordMap: {
          "FRZgdoS9coBIP6xV9OxcuNEznNe": {
            id: "FRZgdoS9coBIP6xV9OxcuNEznNe",
            snapshot: {
              type: "bullet",
              children: [],
              comments: [],
              revisions: [],
              author: "7092639913849389057",
              text: {
                initialAttributedTexts: {
                  text: { "0": "项目 3" },
                  attribs: { "0": "*0+4" }
                },
                apool: {
                  numToAttrib: { "0": ["author", "7092639913849389057"] },
                  nextNum: 1
                }
              },
              level: 1,
              folded: false,
              parent_id: "CtK0dKWSdogVwaxqDbRcFUpLn3f",
              locked: false,
              hidden: false,
              align: ""
            }
          },
          "AYqrdmcBLoCQpSxlPn0cFlFcnwg": {
            id: "AYqrdmcBLoCQpSxlPn0cFlFcnwg",
            snapshot: {
              type: "bullet",
              children: [],
              comments: [],
              revisions: [],
              author: "7092639913849389057",
              text: {
                initialAttributedTexts: {
                  text: { "0": "子项目 2.2" },
                  attribs: { "0": "*0+7" }
                },
                apool: {
                  numToAttrib: { "0": ["author", "7092639913849389057"] },
                  nextNum: 1
                }
              },
              level: 2,
              folded: false,
              parent_id: "Ja4odvEusouO0nxrLgWcCNganVe",
              locked: false,
              hidden: false,
              align: ""
            }
          },
          "Ja4odvEusouO0nxrLgWcCNganVe": {
            id: "Ja4odvEusouO0nxrLgWcCNganVe",
            snapshot: {
              type: "bullet",
              children: ["AYqrdmcBLoCQpSxlPn0cFlFcnwg"],
              comments: [],
              revisions: [],
              author: "7092639913849389057",
              text: {
                initialAttributedTexts: {
                  text: { "0": "子项目 2.1" },
                  attribs: { "0": "*0+7" }
                },
                apool: {
                  numToAttrib: { "0": ["author", "7092639913849389057"] },
                  nextNum: 1
                }
              },
              level: 1,
              folded: false,
              parent_id: "CtK0dKWSdogVwaxqDbRcFUpLn3f",
              locked: false,
              hidden: false,
              align: ""
            }
          },
          "CYoAdkELhobHY4xRIpDcCspknrb": {
            id: "CYoAdkELhobHY4xRIpDcCspknrb",
            snapshot: {
              type: "bullet",
              children: [],
              comments: [],
              revisions: [],
              author: "7092639913849389057",
              text: {
                initialAttributedTexts: {
                  text: { "0": "项目 2" },
                  attribs: { "0": "*0+4" }
                },
                apool: {
                  numToAttrib: { "0": ["author", "7092639913849389057"] },
                  nextNum: 1
                }
              },
              level: 2,
              folded: false,
              parent_id: "K9rsd4vNyocMprxjGjFcrbFLnfh",
              locked: false,
              hidden: false,
              align: ""
            }
          },
          "K9rsd4vNyocMprxjGjFcrbFLnfh": {
            id: "K9rsd4vNyocMprxjGjFcrbFLnfh",
            snapshot: {
              type: "bullet",
              children: ["CYoAdkELhobHY4xRIpDcCspknrb"],
              comments: [],
              revisions: [],
              author: "7092639913849389057",
              text: {
                initialAttributedTexts: {
                  text: { "0": "项目 1" },
                  attribs: { "0": "*0+4" }
                },
                apool: {
                  numToAttrib: { "0": ["author", "7092639913849389057"] },
                  nextNum: 1
                }
              },
              level: 1,
              folded: false,
              parent_id: "CtK0dKWSdogVwaxqDbRcFUpLn3f",
              locked: false,
              hidden: false,
              align: ""
            }
          },
          "SHdWdJDHcoiMHExZUAwcWNs8nIK": {
            id: "SHdWdJDHcoiMHExZUAwcWNs8nIK",
            snapshot: {
              type: "heading3",
              children: [],
              comments: [],
              revisions: [],
              author: "7092639913849389057",
              text: {
                initialAttributedTexts: {
                  text: { "0": "5.1 无序列表" },
                  attribs: { "0": "*0+8" }
                },
                apool: {
                  numToAttrib: { "0": ["author", "7092639913849389057"] },
                  nextNum: 1
                }
              },
              folded: false,
              parent_id: "CtK0dKWSdogVwaxqDbRcFUpLn3f",
              locked: false,
              hidden: false,
              level: 3
            }
          },
          "TCpldqgjmoEKhbxMHzVcYlvfnpe": {
            id: "TCpldqgjmoEKhbxMHzVcYlvfnpe",
            snapshot: {
              type: "heading2",
              children: [],
              comments: [],
              revisions: [],
              author: "7092639913849389057",
              text: {
                initialAttributedTexts: {
                  text: { "0": "5. 列表" },
                  attribs: { "0": "*0+5" }
                },
                apool: {
                  numToAttrib: { "0": ["author", "7092639913849389057"] },
                  nextNum: 1
                }
              },
              folded: false,
              parent_id: "CtK0dKWSdogVwaxqDbRcFUpLn3f",
              locked: false,
              hidden: false,
              level: 2
            }
          },
          "CtK0dKWSdogVwaxqDbRcFUpLn3f": {
            id: "CtK0dKWSdogVwaxqDbRcFUpLn3f",
            snapshot: {
              type: "page",
              parent_id: "",
              comments: null,
              revisions: null,
              locked: false,
              hidden: false,
              author: "7092639913849389057",
              children: [
                "TCpldqgjmoEKhbxMHzVcYlvfnpe",
                "SHdWdJDHcoiMHExZUAwcWNs8nIK",
                "K9rsd4vNyocMprxjGjFcrbFLnfh",
                "Ja4odvEusouO0nxrLgWcCNganVe",
                "FRZgdoS9coBIP6xV9OxcuNEznNe"
              ],
              text: {
                apool: { nextNum: 1, numToAttrib: { "0": ["author", "7092639913849389057"] } },
                initialAttributedTexts: {
                  attribs: { "0": "*0+4" },
                  text: { "0": "测试复制" }
                }
              },
              align: "",
              doc_info: {
                editors: ["7092639913849389057"],
                options: ["editors", "edit_time"],
                deleted_editors: null,
                option_modified: null
              }
            }
          }
        },
        payloadMap: {},
        extra: {
          channel: "saas",
          pasteRandomId: "7765c636-bace-44f0-b79a-3fc21d364f9b",
          mention_page_title: {},
          external_mention_url: {},
          isEqualBlockSelection: true
        },
        isKeepQuoteContainer: false,
        selection: [],
        pasteFlag: "669faf06-540f-41b8-9730-82568f62ff5e"
      };

      const markdown = larkToMarkdown(larkData as any);

      expect(markdown).toContain('## 5. 列表');
      expect(markdown).toContain('### 5.1 无序列表');
      expect(markdown).toContain('- 项目 1');
      expect(markdown).toMatch(/  - 项目 2/);
      expect(markdown).toContain('- 子项目 2.1');
      expect(markdown).toMatch(/  - 子项目 2\.2/);
      expect(markdown).toContain('- 项目 3');
    });
  });
});
