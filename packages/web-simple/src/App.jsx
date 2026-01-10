import React, { useState } from 'react';
import { MarkdownToLarkConverter } from '@md-lark-converter/core';

function larkToMarkdown(data) {
  if (!data || !data.recordMap) {
    return '';
  }

  let markdown = '';

  for (const recordId of data.recordIds) {
    const record = data.recordMap[recordId];
    if (!record || !record.snapshot) continue;

    const snapshot = record.snapshot;

    switch (snapshot.type) {
      case 'heading1':
      case 'heading2':
      case 'heading3':
      case 'heading4':
      case 'heading5':
      case 'heading6':
        const level = parseInt(snapshot.type.replace('heading', ''));
        const headingText = getTextContent(snapshot.text);
        markdown += `${'#'.repeat(level)} ${headingText}\n\n`;
        break;

      case 'text':
        const textContent = getTextContent(snapshot.text);
        if (textContent.trim()) {
          markdown += `${textContent}\n\n`;
        }
        break;

      case 'bullet':
        const bulletText = getTextContent(snapshot.text);
        markdown += `- ${bulletText}\n`;
        break;

      case 'ordered':
        const orderedText = getTextContent(snapshot.text);
        markdown += `1. ${orderedText}\n`;
        break;

      case 'todo':
        const todoText = getTextContent(snapshot.text);
        const isChecked = snapshot.checked || false;
        markdown += `- [${isChecked ? 'x' : ' '}] ${todoText}\n`;
        break;

      case 'quote':
        const quoteText = getTextContent(snapshot.text);
        markdown += `> ${quoteText}\n\n`;
        break;

      case 'code':
        markdown += `\`\`\`${snapshot.language || ''}\n${snapshot.code || ''}\n\`\`\`\n\n`;
        break;

      case 'divider':
        markdown += `---\n\n`;
        break;

      case 'isv':
        const mermaidCode = snapshot.data?.data || '';
        markdown += `\`\`\`mermaid\n${mermaidCode}\n\`\`\`\n\n`;
        break;
    }
  }

  return markdown.trim();
}

function getTextContent(textData) {
  if (!textData || !textData.initialAttributedTexts) {
    return '';
  }
  const texts = textData.initialAttributedTexts.text;
  if (!texts) return '';
  return Object.values(texts).join('');
}

function App() {
  const [mode, setMode] = useState('md-to-lark');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [message, setMessage] = useState('');

  const handleConvert = () => {
    try {
      if (mode === 'md-to-lark') {
        const converter = new MarkdownToLarkConverter();
        const result = converter.convert(input);
        setOutput(JSON.stringify(result, null, 2));
        setMessage('');
      } else {
        const data = JSON.parse(input);
        const markdown = larkToMarkdown(data);
        setOutput(markdown);
        setMessage('');
      }
    } catch (error) {
      setMessage(`转换失败: ${error.message}`);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setMessage('已复制到剪贴板！');
      setTimeout(() => setMessage(''), 2000);
    } catch (error) {
      setMessage(`复制失败: ${error.message}`);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
      setMessage('已从剪贴板粘贴！');
      setTimeout(() => setMessage(''), 2000);
    } catch (error) {
      setMessage(`粘贴失败: ${error.message}`);
    }
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setMessage('');
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Markdown ↔ Lark Converter
          </h1>
          <p className="text-gray-600">
            简单快速的双向转换工具
          </p>
        </header>

        <div className="mb-6">
          <div className="flex gap-4">
            <button
              onClick={() => {
                setMode('md-to-lark');
                setInput('');
                setOutput('');
                setMessage('');
              }}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                mode === 'md-to-lark'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Markdown → Lark
            </button>
            <button
              onClick={() => {
                setMode('lark-to-md');
                setInput('');
                setOutput('');
                setMessage('');
              }}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                mode === 'lark-to-md'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Lark → Markdown
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                {mode === 'md-to-lark' ? 'Markdown 输入' : 'Lark JSON 输入'}
              </label>
              <button
                onClick={handlePaste}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                粘贴
              </button>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                mode === 'md-to-lark'
                  ? '粘贴或输入 Markdown...'
                  : '粘贴或输入 Lark JSON...'
              }
              className="flex-1 w-full p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-900 font-mono"
              style={{ minHeight: '400px' }}
            />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                {mode === 'md-to-lark' ? 'Lark JSON 输出' : 'Markdown 输出'}
              </label>
              <button
                onClick={handleCopy}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                复制
              </button>
            </div>
            <textarea
              value={output}
              readOnly
              placeholder="转换结果将显示在这里..."
              className="flex-1 w-full p-4 border border-gray-300 rounded-lg resize-none bg-gray-50 text-gray-900 font-mono"
              style={{ minHeight: '400px' }}
            />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={handleConvert}
            className="px-8 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            转换
          </button>
          <button
            onClick={handleClear}
            className="px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors"
          >
            清空
          </button>
        </div>

        {message && (
          <div className={`mt-4 px-4 py-2 rounded-lg ${
            message.includes('失败')
              ? 'bg-red-50 text-red-900'
              : 'bg-green-50 text-green-900'
          }`}>
            {message}
          </div>
        )}

        <footer className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Built with React + Tailwind CSS
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
