import fs from 'fs';
import path from 'path';

export function readFile(filePath) {
  try {
    const absolutePath = path.resolve(filePath);
    const content = fs.readFileSync(absolutePath, 'utf-8');
    return content;
  } catch (error) {
    throw new Error(`读取文件失败: ${error.message}`);
  }
}

export function writeFile(filePath, content) {
  try {
    const absolutePath = path.resolve(filePath);
    const dir = path.dirname(absolutePath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(absolutePath, content, 'utf-8');
    return true;
  } catch (error) {
    throw new Error(`写入文件失败: ${error.message}`);
  }
}

export async function convertMarkdownFile(filePath, converter) {
  const markdown = readFile(filePath);
  return converter.convert(markdown);
}
