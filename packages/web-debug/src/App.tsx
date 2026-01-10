
import { useState } from 'react';
import { MarkdownToLarkConverter, ClipboardData, larkToMarkdown, TEST_CASES } from '@md-lark-converter/core';
import { readClipboard, writeToClipboard } from './lib/clipboard/browserClipboard';
import DebugComparison from './components/DebugComparison';

// Load test cases from markdown file - for simplicity, we're defining inline TEST_CASES

function extractLarkDataFromHtml(html: string): any {
  const match = html.match(/data-lark-record-data="([^"]+)"/);
  if (!match) return {};

  try {
    const encodedData = match[1];

    const decodedData = encodedData
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&#039;/g, "'");

    return JSON.parse(decodedData);
  } catch (error) {
    console.error('Failed to extract lark data from HTML:', error);
    return {};
  }
}

function App() {
  const [markdown, setMarkdown] = useState('# 标题\n\n这是示例文本。\n\n- 列表项 1\n- 列表项 2');
  const [convertedData, setConvertedData] = useState<ClipboardData | null>(null);
  const [clipboardData, setClipboardData] = useState<Record<string, string> | null>(null);
  const [generatedHtml, setGeneratedHtml] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showDebug, setShowDebug] = useState(false);
  const [presetInput, setPresetInput] = useState('');
  const [activeTab, setActiveTab] = useState<'input' | 'debug'>('input');
  const [selectedPreset, setSelectedPreset] = useState('');

  const handleConvert = () => {
    setIsLoading(true);
    setMessage('');

    try {
      const converter = new MarkdownToLarkConverter();
      const data = converter.convert(markdown);

      if (!data || !data.recordIds) {
        throw new Error('转换失败：无效的数据结构');
      }

      setConvertedData(data);

      const html = generateHtml(data);
      setGeneratedHtml(html);

      setMessage('转换成功！');
    } catch (error) {
      setMessage(`转换失败: ${(error as Error).message}`);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToClipboard = async () => {
    if (!convertedData) {
      setMessage('请先转换 Markdown');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      await writeToClipboard(generatedHtml, convertedData);
      setMessage('已复制到剪贴板，可直接粘贴到飞书文档！');
    } catch (error) {
      setMessage(`复制失败: ${(error as Error).message}`);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReadClipboard = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      const data = await readClipboard();
      setClipboardData(data);
      setMessage('已读取剪贴板数据！');
    } catch (error) {
      setMessage(`读取失败: ${(error as Error).message}`);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePresetChange = (presetName: string) => {
    if (presetName && TEST_CASES[presetName as keyof typeof TEST_CASES]) {
      setMarkdown(TEST_CASES[presetName as keyof typeof TEST_CASES]);
      setSelectedPreset(presetName);
      setConvertedData(null);
      setGeneratedHtml('');
      setMessage('');
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-white/10">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-1">
            Markdown to 飞书文档转换器
          </h1>
          <p className="text-white/60 text-sm">
            将 Markdown 转换为飞书剪贴板格式，粘贴即可使用
          </p>
        </div>
      </div>

      {message && (
        <div className={`px-4 py-2 border-b text-sm font-medium ${
          message.includes('成功') ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30'
        }`}>
          <div className="max-w-7xl mx-auto">{message}</div>
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        <div className="max-w-7xl mx-auto h-full flex">
          <div className="w-64 bg-black/20 border-r border-white/10 flex flex-col">
            <div className="p-4 space-y-2">
              <button
                onClick={() => setActiveTab('input')}
                className={`w-full text-left px-4 py-2 rounded-lg transition-all ${
                  activeTab === 'input' ? 'bg-blue-500 text-white' : 'text-white/70 hover:bg-white/10'
                }`}
              >
                输入 / 预览
              </button>
              <button
                onClick={() => setActiveTab('debug')}
                className={`w-full text-left px-4 py-2 rounded-lg transition-all ${
                  activeTab === 'debug' ? 'bg-blue-500 text-white' : 'text-white/70 hover:bg-white/10'
                }`}
              >
                调试信息
              </button>
              <button
                onClick={() => setShowDebug(!showDebug)}
                className={`w-full text-left px-4 py-2 rounded-lg transition-all ${
                  showDebug ? 'bg-purple-500 text-white' : 'text-white/70 hover:bg-white/10'
                }`}
              >
                {showDebug ? '隐藏' : '显示'}调试面板
              </button>
              <div className="mt-2">
                <input
                  type="text"
                  value={presetInput}
                  onChange={(e) => setPresetInput(e.target.value)}
                  placeholder="输入自定义 Markdown..."
                  className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white/90 text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
                <button
                  onClick={() => {
                    if (presetInput.trim()) {
                      setMarkdown(presetInput);
                    }
                  }}
                  className="w-full mt-2 px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
                >
                  加载自定义
                </button>
              </div>
            </div>

            <div className="flex-1"></div>

            <div className="p-4 space-y-2">
              <button
                onClick={handleConvert}
                disabled={isLoading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? '转换中...' : '转换'}
              </button>
              <button
                onClick={handleCopyToClipboard}
                disabled={isLoading || !convertedData}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? '复制中...' : '复制到剪贴板'}
              </button>
              <button
                onClick={handleReadClipboard}
                disabled={isLoading}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? '读取中...' : '读取剪贴板'}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            {activeTab === 'input' ? (
              <div className="h-full grid grid-cols-2 divide-x divide-white/10">
                <div className="p-4 overflow-hidden flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      Markdown 输入
                    </h2>
                    <select
                      value={selectedPreset}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handlePresetChange(e.target.value)}
                      className="text-xs px-2 py-1 bg-black/30 border border-white/10 rounded text-white/80 hover:border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                      <option value="">快速预设示例</option>
                      <option value="heading">标题</option>
                      <option value="paragraph">段落</option>
                      <option value="list">列表</option>
                      <option value="ordered">有序</option>
                      <option value="todo">任务</option>
                      <option value="quote">引用</option>
                      <option value="code">代码</option>
                      <option value="divider">分隔</option>
                      <option value="mermaid">Mermaid</option>
                      <option value="link">链接</option>
                      <option value="image">图片</option>
                      <option value="nested">嵌套</option>
                      <option value="mixed">组合</option>
                      <option value="complex">完整</option>
                    </select>
                  </div>
                  <textarea
                    value={markdown}
                    onChange={(e) => setMarkdown(e.target.value)}
                    className="flex-1 w-full p-4 bg-black/30 border border-white/10 rounded-xl text-white/90 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 placeholder-white/30"
                    placeholder="在此输入 Markdown 内容..."
                  />
                </div>

                <div className="p-4 overflow-hidden flex flex-col">
                  <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    转换结果预览
                  </h2>
                  <div className="flex-1 overflow-auto bg-black/30 border border-white/10 rounded-xl p-4">
                    {convertedData ? (
                      <pre className="text-xs text-white/80 whitespace-pre-wrap break-all">
                        {JSON.stringify(convertedData, null, 2)}
                      </pre>
                    ) : (
                      <div className="flex items-center justify-center h-full text-white/40 text-sm">
                        转换后的数据将显示在这里
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full p-4 overflow-auto">
                <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  调试面板
                </h2>
                <div className="space-y-4">
                  {clipboardData && (
                    <DebugComparison ourData={convertedData} larkData={extractLarkDataFromHtml(clipboardData['text/html'] || '')} />
                  )}
                  <div className="bg-black/30 border border-white/10 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-white mb-2">当前状态</h3>
                    <div className="space-y-1 text-xs text-white/70">
                      <div>已转换: {convertedData ? '✅' : '❌'}</div>
                      <div>生成的 HTML: {generatedHtml ? '✅' : '❌'}</div>
                      <div>剪贴板数据: {clipboardData ? '✅' : '❌'}</div>
                    </div>
                  </div>

                  <div className="bg-black/30 border border-white/10 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-white mb-2">剪贴板读取结果</h3>
                    <div className="overflow-auto max-h-60">
                      {clipboardData ? (
                        <pre className="text-xs text-white/80 whitespace-pre-wrap break-all">
                          {JSON.stringify(clipboardData, null, 2)}
                        </pre>
                      ) : (
                        <div className="text-xs text-white/40">
                          点击"读取剪贴板"按钮查看数据
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-black/30 border border-white/10 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-white mb-2">HTML 预览</h3>
                    <div className="overflow-auto max-h-60">
                      {generatedHtml ? (
                        <pre className="text-xs text-green-400 whitespace-pre-wrap break-all">
                          {generatedHtml}
                        </pre>
                      ) : (
                        <div className="text-xs text-white/40">
                          先转换 Markdown 才能看到 HTML
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showDebug && (
        <div className="fixed inset-0 bg-black/90 z-50 p-8 overflow-auto">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">调试面板</h2>
              <button
                onClick={() => setShowDebug(false)}
                className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
              >
                关闭
              </button>
            </div>

              <div className="space-y-4">
               <div className="bg-black/50 border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-3">完整的剪贴板 HTML</h3>
                <div className="overflow-auto max-h-96">
                  <pre className="text-xs text-green-400 whitespace-pre-wrap break-all">
                    {generatedHtml || '尚未转换'}
                  </pre>
                </div>
              </div>

              <div className="bg-black/50 border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-3">转换后的 JSON 数据</h3>
                <div className="overflow-auto max-h-96">
                  <pre className="text-xs text-blue-400 whitespace-pre-wrap break-all">
                    {convertedData ? JSON.stringify(convertedData, null, 2) : '尚未转换'}
                  </pre>
                </div>
              </div>

              <div className="bg-black/50 border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-3">剪贴板读取的数据</h3>
                <div className="overflow-auto max-h-96">
                  <pre className="text-xs text-yellow-400 whitespace-pre-wrap break-all">
                    {clipboardData ? JSON.stringify(clipboardData, null, 2) : '尚未读取'}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function generateHtml(data: ClipboardData): string {
  if (!data || !data.recordIds || !data.recordMap) {
    console.error('Invalid data structure:', data);
    return '';
  }

  const jsonStr = JSON.stringify(data);
  // Use HTML entity encoding for attributes, not URL encoding
  const encodedJson = jsonStr
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  let html = `<meta charset="utf-8"><div data-page-id="${data.rootId}" data-lark-html-role="root" data-docx-has-block-data="true">`;

  for (const recordId of data.recordIds) {
    const record = data.recordMap[recordId];
    if (!record) continue;

    const snapshot = record.snapshot;
    const blockHtml = generateBlockHtml(snapshot, recordId);
    html += blockHtml;
  }

  html += `</div><span data-lark-record-data="${encodedJson}" data-lark-record-format="docx/record" class="lark-record-clipboard"></span>`;
  return html;
}

function generateBlockHtml(snapshot: any, recordId: string): string {
  const { type, text, code, language, level, data, checked, children } = snapshot;

  switch (type) {
    case 'page':
      return '';

    case 'isv':
      const mermaidCode = data && data.data ? data.data : '';
      return `<div class="ace-line old-record-id-${recordId}">
<span class="block-paste-placeholder">${mermaidCode || '暂时无法在飞书文档外展示此内容'}</span>
</div>`;

    case 'heading1':
      const text1 = getTextContent(text);
      return `<h1 class="heading-1 ace-line old-record-id-${recordId}">${escapeHtml(text1)}</h1>`;

    case 'heading2':
      const text2 = getTextContent(text);
      return `<h2 class="heading-2 ace-line old-record-id-${recordId}">${escapeHtml(text2)}</h2>`;

    case 'heading3':
      const text3 = getTextContent(text);
      return `<h3 class="heading-3 ace-line old-record-id-${recordId}">${escapeHtml(text3)}</h3>`;

    case 'heading4':
      const text4 = getTextContent(text);
      return `<h4 class="heading-4 ace-line old-record-id-${recordId}">${escapeHtml(text4)}</h4>`;

    case 'heading5':
      const text5 = getTextContent(text);
      return `<h5 class="heading-5 ace-line old-record-id-${recordId}">${escapeHtml(text5)}</h5>`;

    case 'heading6':
      const text6 = getTextContent(text);
      return `<h6 class="heading-6 ace-line old-record-id-${recordId}">${escapeHtml(text6)}</h6>`;

    case 'text':
      const textContent = getTextContent(text);
      return `<div class="ace-line old-record-id-${recordId}">${escapeHtml(textContent)}</div>`;

    case 'quote':
      const quoteText = getTextContent(text);
      return `<blockquote class="ace-line old-record-id-${recordId}">${escapeHtml(quoteText)}</blockquote>`;

    case 'code':
      const codeContent = code || getTextContent(text) || '';
      const escapedCode = escapeHtml(codeContent);
      return `<pre style="white-space:pre;" class="ace-line old-record-id-${recordId}"><code class="language-${language || 'plaintext'}" data-lark-language="${language || 'plaintext'}" data-wrap="false"><div>${escapedCode}</div></code></pre>`;

    case 'divider':
      return `<div data-type="divider" class="old-record-id-${recordId}"><hr></div>`;

    case 'bullet':
      const bulletText = getTextContent(text);
      return `<ul class="list-bullet1"><li class="ace-line old-record-id-${recordId}" data-list="bullet"><div>${escapeHtml(bulletText)}</div></li></ul>`;

    case 'ordered':
      const orderedText = getTextContent(text);
      return `<ol class="list-number1"><li class="ace-line old-record-id-${recordId}" data-list="number"><div>${escapeHtml(orderedText)}</div></li></ol>`;

    case 'todo':
      const todoText = getTextContent(text);
      const isChecked = snapshot.done || false;
      const listClass = isChecked ? 'list-done1' : 'list-check';
      return `<ul class="${listClass}"><li class="ace-line old-record-id-${recordId}" data-list="${isChecked ? 'done' : 'check'}"><div>${escapeHtml(todoText)}</div></li></ul>`;

    default:
      return '';
  }
}

function getTextContent(textData: any): string {
  if (!textData || !textData.initialAttributedTexts) {
    return '';
  }
  const texts = textData.initialAttributedTexts.text;
  if (!texts) return '';
  return Object.values(texts).join('');
}

function escapeHtml(text: string): string {
  if (typeof text !== 'string' || !text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default App;
