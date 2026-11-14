const intent = /\b(?:(?:muon|uoc|dinh|co y dinh|y dinh|sap|se|dang|vua|da|nghi den|nghi toi)\s+(?:(?:minh|se|dang)\s+)?(?:tu lam hai|tu hai|tu tu|tu sat|ket lieu (?:ban than|cuoc doi|mang song)|ket thuc (?:cuoc doi|mang song))|uoc minh bien mat(?=\s*(?:[.!?…]|$)))\b/g;

export function needsReadingSupport(question: string): boolean {
  let text = question.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").replaceAll("đ", "d");
  text = text.replace(/“[^”]*”|‘[^’]*’|"[^"]*"|'[^']*'/g, (quote, offset: number) => {
    const before = text.slice(0, offset).split(/[.!?…\n]/).at(-1);
    const after = text.slice(offset + quote.length).split(/[.!?…\n]/)[0];
    return /\b(?:hu cau|tieu thuyet|kich ban|nhan vat)\b/.test(`${before} ${after}`) ? " " : quote;
  });
  if (/\bkhong (?:con muon|muon) song (?:nua|tiep)\b/.test(text)) return true;

  // shortcut: chỉ nhận diện mẫu tiếng Việt đã kiểm thử, mở rộng bằng ca có gán nhãn trước khi dùng để sàng lọc rộng hơn.
  return Array.from(text.matchAll(intent)).some(({ index }) =>
    !/\b(?:khong|chang|chua)(?:\s+(?:he|bao gio|con))?\s+$/.test(text.slice(0, index)),
  );
}
