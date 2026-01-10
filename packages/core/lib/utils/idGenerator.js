const ID_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';

export function generateBlockId() {
  let id = '';
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      id += ID_CHARS[Math.floor(Math.random() * ID_CHARS.length)];
    }
    if (i < 3) id += '_';
  }
  return `docx${id}`;
}

export function generateRecordId() {
  let id = '';
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      id += ID_CHARS[Math.floor(Math.random() * ID_CHARS.length)];
    }
    if (i < 3) id += '_';
  }
  return `doxcn${id}`;
}

export function generatePageId() {
  let id = '';
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      id += ID_CHARS[Math.floor(Math.random() * ID_CHARS.length)];
    }
    if (i < 3) id += '_';
  }
  return `Wqf${id}`;
}
