const ID_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';

export function generateBlockId(): string {
  let id = '';
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      id += ID_CHARS[Math.floor(Math.random() * ID_CHARS.length)];
    }
    if (i < 3) id += '_';
  }
  return `docx${id}`;
}

export function generateRecordId(): string {
  let id = '';
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      id += ID_CHARS[Math.floor(Math.random() * ID_CHARS.length)];
    }
    if (i < 3) id += '_';
  }
  return `doxcn${id}`;
}

export function generatePageId(): string {
  let id = '';
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      id += ID_CHARS[Math.floor(Math.random() * ID_CHARS.length)];
    }
    if (i < 3) id += '_';
  }
  return `Wqf${id}`;
}
