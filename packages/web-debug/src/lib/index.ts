import { MarkdownToLarkConverter } from './converter/markdownToLark.js';
export { MarkdownToLarkConverter } from './converter/markdownToLark.js';
export { generateBlockId, generateRecordId, generatePageId } from './utils/idGenerator.js';
export * from './clipboard/browserClipboard.js';
export * from './file/fileOperations.js';
export * from './parser/markdownParser.js';

export async function markdownToLark(markdown: string): Promise<any> {
  const converter = new MarkdownToLarkConverter();
  return converter.convert(markdown);
}
