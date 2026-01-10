// File operations - not used in browser environment but keeping for API compatibility

export function readFile(filePath: string): Promise<string> {
  throw new Error('readFile is not available in browser environment');
}

export function writeFile(filePath: string, content: string): Promise<boolean> {
  throw new Error('writeFile is not available in browser environment');
}

export interface Converter {
  convert(markdown: string): any;
}

export async function convertMarkdownFile(filePath: string, converter: Converter): Promise<any> {
  throw new Error('convertMarkdownFile is not available in browser environment');
}
