import { exec } from 'child_process';
import { promisify } from 'util';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

/**
 * 将 HTML 写入系统剪贴板（支持富文本）
 * 支持 macOS, Windows 和 Linux (需要 xclip)
 */
export async function writeHtmlToClipboard(html: string): Promise<void> {
  const platform = os.platform();

  if (platform === 'darwin') {
    // macOS: 使用临时文件和 osascript
    const tmpFile = path.join(os.tmpdir(), `lark-${Date.now()}.html`);
    try {
      await fs.promises.writeFile(tmpFile, html, 'utf-8');
      const script = `osascript -e 'set the clipboard to (read (POSIX file "${tmpFile}") as «class HTML»)'`;
      await execAsync(script);
      await fs.promises.unlink(tmpFile);
    } catch (error) {
      try {
        await fs.promises.unlink(tmpFile);
      } catch {}
      throw error;
    }
  } else if (platform === 'win32') {
    // Windows: 使用 PowerShell 写入 HTML
    const tmpFile = path.join(os.tmpdir(), `lark-${Date.now()}.html`);
    try {
      await fs.promises.writeFile(tmpFile, html, 'utf-8');
      const psScript = `
Add-Type -AssemblyName System.Windows.Forms
$html = Get-Content -Path '${tmpFile.replace(/\\/g, '\\\\')}' -Raw
$dataObject = New-Object System.Windows.Forms.DataObject
$dataObject.SetData([System.Windows.Forms.DataFormats]::Html, $html)
[System.Windows.Forms.Clipboard]::SetDataObject($dataObject, $true)
`;
      await execAsync(`powershell -Command "${psScript.replace(/\n/g, '; ')}"`);
      await fs.promises.unlink(tmpFile);
    } catch (error) {
      try {
        await fs.promises.unlink(tmpFile);
      } catch {}
      throw error;
    }
  } else if (platform === 'linux') {
    // Linux: 尝试使用 xclip
    const tmpFile = path.join(os.tmpdir(), `lark-${Date.now()}.html`);
    try {
      await fs.promises.writeFile(tmpFile, html, 'utf-8');
      await execAsync(`xclip -selection clipboard -t text/html -i "${tmpFile}"`);
      await fs.promises.unlink(tmpFile);
    } catch (error) {
      try {
        await fs.promises.unlink(tmpFile);
      } catch {}
      throw new Error('Linux 平台需要安装 xclip 才能支持富文本剪贴板。请运行: sudo apt-get install xclip');
    }
  } else {
    throw new Error('不支持的操作系统平台');
  }
}
