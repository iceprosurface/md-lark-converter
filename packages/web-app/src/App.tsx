import { useState } from "react";
import { MarkdownToLarkConverter, ClipboardData, TextData, larkToMarkdown } from "@md-lark-converter/core";

async function readClipboard() {
  try {
    if (!navigator.clipboard) {
      throw new Error('浏览器不支持剪贴板 API，请使用现代浏览器（Chrome、Edge、Safari）并确保在 HTTPS 环境下运行');
    }
    const clipboardItems = await navigator.clipboard.read();
    const results: Record<string, string> = {};

    for (const item of clipboardItems) {
      for (const type of item.types) {
        const blob = await item.getType(type);
        if (type.startsWith('text/')) {
          const text = await blob.text();
          results[type] = text;
        }
      }
    }

    return results;
  } catch (error) {
    console.error('Failed to read clipboard:', error);
    throw new Error(`读取剪贴板失败: ${(error as Error).message}`);
  }
}

interface Snapshot {
  type: string;
  text?: TextData;
  language?: string;
  code?: string;
  checked?: boolean;
  done?: boolean;
  data?: {
    data?: string;
  };
}

interface LarkRecord {
  snapshot: Snapshot;
}

interface LarkRecordMap {
  [key: string]: LarkRecord;
}

function App() {
  const [mode, setMode] = useState<"md-to-lark" | "lark-to-md">("md-to-lark");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [message, setMessage] = useState("");

  const handleConvert = () => {
    try {
      if (mode === "md-to-lark") {
        const converter = new MarkdownToLarkConverter();
        const result = converter.convert(input);
        setOutput(JSON.stringify(result, null, 2));
        setMessage("");
      } else {
        const data = JSON.parse(input) as ClipboardData;
        const markdown = larkToMarkdown(data);
        setOutput(markdown);
        setMessage("");
      }
    } catch (error) {
      setMessage(`转换失败: ${(error as Error).message}`);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setMessage("已复制到剪贴板！");
      setTimeout(() => setMessage(""), 2000);
    } catch (error) {
      setMessage(`复制失败: ${(error as Error).message}`);
    }
  };

  const handlePaste = async () => {
    try {
      if (mode === "lark-to-md") {
        const clipboardData = await readClipboard();
        const larkJson = clipboardData['text/html'];

        console.log('Clipboard data:', clipboardData);
        console.log('Lark HTML:', larkJson);

        if (larkJson) {
          const match = larkJson.match(/data-lark-record-data="([^"]+)"/);
          if (match && match[1]) {
            console.log('Matched data:', match[1]);
            let decoded = decodeURIComponent(match[1]);
            console.log('Decoded after URL decode:', decoded);

            decoded = decoded.replace(/&quot;/g, '"')
                             .replace(/&amp;/g, '&')
                             .replace(/&lt;/g, '<')
                             .replace(/&gt;/g, '>')
                             .replace(/&#39;/g, "'")
                             .replace(/&#x27;/g, "'")
                             .replace(/&#x3D;/g, "=");

            console.log('Decoded after HTML entity decode:', decoded);
            try {
              const data = JSON.parse(decoded) as ClipboardData;
              console.log('Parsed Lark data:', data);
              console.log('Record IDs:', data.recordIds);
              console.log('Record Map:', data.recordMap);
              const markdown = larkToMarkdown(data);
              console.log('Generated Markdown:', markdown);
              setOutput(markdown);
              setMessage("已从飞书文档粘贴并转换！");
              setTimeout(() => setMessage(""), 3000);
            } catch (parseError) {
              console.error('JSON parse error:', parseError);
              setMessage(`飞书数据解析失败: ${(parseError as Error).message}`);
            }
          } else {
            setMessage("未找到有效的飞书数据，请确保从飞书文档复制");
          }
        } else {
          setMessage("剪贴板中没有飞书数据");
        }
      } else {
        if (!navigator.clipboard) {
          throw new Error('浏览器不支持剪贴板 API，请使用现代浏览器（Chrome、Edge、Safari）并确保在 HTTPS 环境下运行');
        }
        const text = await navigator.clipboard.readText();
        setInput(text);
        setMessage("已从剪贴板粘贴！");
        setTimeout(() => setMessage(""), 2000);
      }
    } catch (error) {
      setMessage(`粘贴失败: ${(error as Error).message}`);
    }
  };

  const handleClear = () => {
    setInput("");
    setOutput("");
    setMessage("");
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Markdown ↔ Lark Converter</h1>
          <p className="text-gray-600">简单快速的双向转换工具</p>
        </header>

        <div className="mb-6">
          <div className="flex gap-4">
            <button
              onClick={() => {
                setMode("md-to-lark");
                setInput("");
                setOutput("");
                setMessage("");
              }}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${mode === "md-to-lark"
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
            >
              Markdown → Lark
            </button>
            <button
              onClick={() => {
                setMode("lark-to-md");
                setInput("");
                setOutput("");
                setMessage("");
              }}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${mode === "lark-to-md"
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
            >
              Lark → Markdown
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {mode === "md-to-lark" && (
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Markdown 输入</label>
                <button onClick={handlePaste} className="text-sm px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 text-gray-700">
                  从剪贴板粘贴
                </button>
              </div>
              <textarea
                value={input}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
                placeholder="粘贴或输入 Markdown..."
                className="flex-1 w-full p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-900 font-mono"
                style={{ minHeight: "400px" }}
              />
            </div>
          )}

          {mode === "lark-to-md" && (
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">飞书文档</label>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 border border-gray-300 rounded-lg p-8">
                <div className="text-center mb-6">
                  <p className="text-lg font-medium text-gray-900 mb-2">从飞书文档转换为 Markdown</p>
                  <p className="text-gray-600">点击下方按钮开始转换</p>
                </div>
                <button
                  onClick={handlePaste}
                  className="px-8 py-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-lg"
                >
                  📋 从飞书文档粘贴
                </button>
                <div className="mt-6 px-4 py-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800 max-w-md">
                  <p className="font-medium mb-2">如何使用：</p>
                  <ol className="space-y-1 text-left">
                    <li>1. 在飞书文档中选中内容</li>
                    <li>2. 按 <kbd className="px-1.5 py-0.5 bg-white border border-blue-300 rounded text-xs">Cmd/Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-white border border-blue-300 rounded text-xs">C</kbd> 复制</li>
                    <li>3. 点击上方按钮自动转换</li>
                  </ol>
                  <p className="text-xs text-blue-600 mt-2">⚠️ 需要 HTTPS 环境才能使用剪贴板 API</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                {mode === "md-to-lark" ? "Lark JSON 输出" : "Markdown 输出"}
              </label>
              <button onClick={handleCopy} className="text-sm text-gray-600 hover:text-gray-900">
                复制
              </button>
            </div>
            <textarea
              value={output}
              readOnly
              placeholder="转换结果将显示在这里..."
              className="flex-1 w-full p-4 border border-gray-300 rounded-lg resize-none bg-gray-50 text-gray-900 font-mono"
              style={{ minHeight: "400px" }}
            />
          </div>
        </div>

        {mode === "md-to-lark" && (
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
        )}

        {message && (
          <div
            className={`mt-4 px-4 py-2 rounded-lg ${message.includes("失败") ? "bg-red-50 text-red-900" : "bg-green-50 text-green-900"
              }`}
          >
            {message}
          </div>
        )}

        <footer className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">Built with React + Tailwind CSS</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
