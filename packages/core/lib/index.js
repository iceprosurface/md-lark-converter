import { MarkdownToLarkConverter } from './converter/markdownToLark.js';
export { MarkdownToLarkConverter } from './converter/markdownToLark.js';
export { generateBlockId, generateRecordId, generatePageId } from './utils/idGenerator.js';

export function markdownToLark(markdown) {
  const converter = new MarkdownToLarkConverter();
  return converter.convert(markdown);
}
