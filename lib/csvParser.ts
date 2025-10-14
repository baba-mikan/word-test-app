// CSV パーサー（WordTestA4.tsx から移植）

export function splitCsvLine(line: string) {
  // RFC4180風の最小CSVパーサ（ダブルクォート対応）
  const result: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') { 
        cur += '"'; 
        i++; 
      } else { 
        inQuotes = !inQuotes; 
      }
    } else if (c === "," && !inQuotes) {
      result.push(cur); 
      cur = "";
    } else {
      cur += c;
    }
  }
  result.push(cur);
  return result.map((s) => s.trim());
}

export function parseCsv(text: string): Array<{japanese: string, english: string, chapter: string}> {
  // 改行正規化 + BOM 除去
  const normalized = String(text ?? "")
    .replace(/\uFEFF/g, "")
    .replace(/\r\n?|\n/g, "\n");
  const lines = normalized.trim().split(/\n/);
  if (lines.length === 0 || !lines[0]) return [];

  const header = splitCsvLine(lines[0]);
  const idxJ = header.findIndex((h) => /japanese/i.test(h));
  const idxE = header.findIndex((h) => /english/i.test(h));
  const idxC = header.findIndex((h) => /chapter/i.test(h));
  
  if (idxJ === -1 || idxE === -1) {
    throw new Error('CSVファイルに "japanese" と "english" 列が必要です');
  }

  const out: Array<{japanese: string, english: string, chapter: string}> = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const row = splitCsvLine(lines[i]);
    const jp = row[idxJ] ?? "";
    const en = row[idxE] ?? "";
    const ch = (row[idxC] ?? "").trim();
    
    if (jp && en) {
      out.push({ japanese: jp, english: en, chapter: ch });
    }
  }
  return out;
}