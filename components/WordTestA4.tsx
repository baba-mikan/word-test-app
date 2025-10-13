"use client";
import React, { useMemo, useState, useRef } from "react";

/**
 * Printable English Word Test Sheet
 * - A4 / chapter-wise pagination / 12 items per page / four-line ruling
 * - 日→英（日本語が問題、英単語を書かせる）
 * - ブラウザの印刷機能を使用してPDF化
 *
 * CSV 仕様（ヘッダー必須）
 *   chapter,japanese,english
 */

// ------------------------------
// 小ユーティリティ
// ------------------------------
export function splitCsvLine(line: string) {
  // RFC4180風の最小CSVパーサ（ダブルクォート対応）
  const result: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (c === "," && !inQuotes) {
      result.push(cur); cur = "";
    } else {
      cur += c;
    }
  }
  result.push(cur);
  return result.map((s) => s.trim());
}

export function parseCsv(text: string) {
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
  const out: Array<{japanese: string, english: string, chapter: string}> = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const row = splitCsvLine(lines[i]);
    const jp = row[idxJ] ?? "";
    const en = row[idxE] ?? "";
    const ch = (row[idxC] ?? "").trim();
    out.push({ japanese: jp, english: en, chapter: ch });
  }
  return out;
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function buildPages(items: Array<{japanese: string, english: string, chapter: string}>, defaultChapter: string, shuffle: boolean) {
  if (!items || items.length === 0) return [];
  const groups = new Map<string, Array<{japanese: string, english: string, chapter: string}>>();
  for (const it of items) {
    const key = (it.chapter || defaultChapter || "").trim() || "(チャプター未設定)";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(it);
  }
  const out: Array<{chapter: string, items: Array<{japanese: string, english: string, chapter: string}>}> = [];
  for (const [ch, arr] of groups.entries()) {
    const source = shuffle ? shuffleArray(arr) : arr;
    for (let i = 0; i < source.length; i += 12) {
      out.push({ chapter: ch, items: source.slice(i, i + 12) });
    }
  }
  return out;
}

// ------------------------------
// コンポーネント本体
// ------------------------------
export default function WordTestA4() {
  const [items, setItems] = useState<Array<{japanese: string, english: string, chapter: string}>>([]);
  const [title, setTitle] = useState("mikan テスト");
  const [defaultChapter, setDefaultChapter] = useState("");
  const [showAnswerKey, setShowAnswerKey] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [testResults, setTestResults] = useState<Array<{name: string, pass: boolean, message?: string}> | null>(null);
  const [statusMsg, setStatusMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pages = useMemo(() => buildPages(items, defaultChapter, shuffle), [items, defaultChapter, shuffle]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text === "string") {
        setItems(parseCsv(text));
      }
    };
    reader.readAsText(file, "utf-8");
  };

  // ----------- HTMLファイルとしてダウンロード -----------
  const handleDownloadHTML = () => {
    if (!pages.length) { 
      setStatusMsg('出力するページがありません。CSVを読み込んでください。'); 
      return; 
    }
    
    // SVGで4線を描画（印刷で確実に表示されるように）
    const fourLineSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 100 20" preserveAspectRatio="none">
      <line x1="0" y1="0" x2="100" y2="0" stroke="#B0B0B0" stroke-width="0.5"/>
      <line x1="0" y1="5" x2="100" y2="5" stroke="#B0B0B0" stroke-width="0.5"/>
      <line x1="0" y1="10" x2="100" y2="10" stroke="#000000" stroke-width="0.8"/>
      <line x1="0" y1="15" x2="100" y2="15" stroke="#B0B0B0" stroke-width="0.5"/>
    </svg>`;
    
    // Base64エンコード
    const svgBase64 = btoa(fourLineSVG);
    
    // HTMLコンテンツを生成
    const htmlContent = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>
  @page { size: A4; margin: 8mm; }
  @media print { 
    body { 
      -webkit-print-color-adjust: exact; 
      print-color-adjust: exact; 
      color-adjust: exact;
    }
    .no-print { display: none !important; }
  }
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }
  body { 
    font-family: sans-serif; 
    margin: 0; 
    padding: 0;
    background: white;
  }
  .page { 
    width: 210mm; 
    min-height: 297mm; 
    padding: 8mm;
    margin: 0 auto;
    background: white;
    page-break-after: always;
  }
  .page:last-child { page-break-after: auto; }
  
  /* Header */
  .header { margin-bottom: 10mm; }
  .header-row { display: flex; gap: 8mm; margin-bottom: 5mm; }
  .title-box { 
    flex: 0 0 60%; 
    border: 1px solid #333; 
    border-radius: 8px;
    padding: 8mm;
    font-size: 14pt;
    font-weight: bold;
  }
  .info-boxes { flex: 1; display: flex; gap: 5mm; }
  .info-box { 
    flex: 1; 
    border: 1px solid #333; 
    border-radius: 8px;
    padding: 5mm;
    font-size: 10pt;
  }
  .chapter-info { font-size: 10pt; }
  
  /* Body */
  .questions { 
    display: grid; 
    grid-template-columns: 1fr 1fr; 
    gap: 5mm 10mm;
  }
  .question-row { 
    display: flex; 
    gap: 8mm;
    align-items: flex-start;
  }
  .question-label { 
    width: 28mm; 
    font-size: 10pt;
    font-weight: bold;
  }
  .answer-text {
    font-size: 8pt;
    color: #777;
    margin-top: 2mm;
  }
  .fourline-box { 
    flex: 1; 
    height: 18mm;
    position: relative;
    border: 1px solid #ddd;
    border-radius: 6px;
    background-image: url('data:image/svg+xml;base64,${svgBase64}');
    background-size: 100% 20mm;
    background-repeat: no-repeat;
    background-position: center;
  }
  
  .footer-note { 
    margin-top: 5mm;
    font-size: 8pt;
    color: #666;
  }
  
  .no-print {
    padding: 20px;
    background: #f0f0f0;
    margin-bottom: 20px;
    text-align: center;
  }
</style>
</head>
<body>
<div class="no-print">
  <h2>英単語テストプリント</h2>
  <p>このHTMLファイルを開いて、ブラウザの印刷機能（Ctrl+P または Cmd+P）でPDFとして保存してください。</p>
  <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer;">印刷画面を開く</button>
</div>
${pages.map(page => `
<div class="page">
  <div class="header">
    <div class="header-row">
      <div class="title-box">${title}（　）年（　）組 氏名（　　　　　　　　　）</div>
      <div class="info-boxes">
        <div class="info-box">
          <div style="font-weight: bold;">学習日</div>
          <div>　　月　　日（　）</div>
        </div>
        <div class="info-box">
          <div style="font-weight: bold;">検印</div>
          <div style="font-weight: bold;">評価</div>
        </div>
      </div>
    </div>
    <div class="chapter-info">単元：<strong>${page.chapter || '(未設定)'}</strong> ／ 英単語の書き取りをしましょう。（各1点）</div>
  </div>
  
  <div class="questions">
    ${Array.from({length: 12}, (_, i) => {
      const item = page.items[i] || { japanese: '', english: '' };
      return `
    <div class="question-row">
      <div class="question-label">
        （${i + 1}）${item.japanese || ''}
        ${showAnswerKey && item.english ? `<div class="answer-text">Answer: ${item.english}</div>` : ''}
      </div>
      <div class="fourline-box"></div>
    </div>`;
    }).join('')}
  </div>
  
  <div class="footer-note">※ 4線は小文字のアセンダー・ディセンダー位置の目安です。提出前につづり・大文字小文字を確認しましょう。</div>
</div>
`).join('')}
</body>
</html>`;

    // Blobを作成してダウンロード
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(title || 'word-test').replace(/[\/\\?%*:|"<>]/g, '-')}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setStatusMsg('HTMLファイルをダウンロードしました。ファイルを開いて印刷してください。');
    setTimeout(() => setStatusMsg(''), 5000);
  };

  return (
    <div className="w-full min-h-screen bg-neutral-100 p-4 print:p-0">
      {/* Controls (非印刷) */}
      <div className="max-w-5xl mx-auto mb-4 print:hidden">
        <h1 className="text-2xl font-semibold mb-2">英単語プリント（CSVアップロード／チャプター自動分页／12問・4線）</h1>
        <div className="grid md:grid-cols-3 gap-3 mb-3">
          <label className="block">
            <div className="text-sm text-neutral-600 mb-1">タイトル</div>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
          </label>
          <label className="block">
            <div className="text-sm text-neutral-600 mb-1">（任意）チャプター未設定時のデフォルト名</div>
            <input value={defaultChapter} onChange={(e) => setDefaultChapter(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
          </label>
          <label className="block self-end">
            <span className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={showAnswerKey} onChange={(e) => setShowAnswerKey(e.target.checked)} />
              解答（英語）を小さく表示
            </span>
          </label>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 rounded-xl shadow border bg-white hover:bg-neutral-50"
          >CSVファイルを選択</button>
          <button 
            onClick={() => setShuffle(!shuffle)} 
            className="px-4 py-2 rounded-xl shadow border bg-white hover:bg-neutral-50">
            {shuffle ? "元の順番に戻す" : "ランダム出題"}
          </button>
          <button 
            onClick={handleDownloadHTML} 
            className="px-4 py-2 rounded-xl shadow border bg-blue-500 text-white hover:bg-blue-600">
            HTMLファイルをダウンロード
          </button>
          <button 
            onClick={() => setTestResults(runDevTests())} 
            className="px-4 py-2 rounded-xl shadow border bg-white hover:bg-neutral-50">
            テスト実行
          </button>
        </div>
        <p className="text-xs text-neutral-500 mt-2">
          ※ HTMLファイルをダウンロード → ブラウザで開く → Ctrl+P（Mac: Cmd+P）→ PDFとして保存
        </p>
        {statusMsg && (
          <div className="mt-2 text-sm text-neutral-700">{statusMsg}</div>
        )}
        {testResults && (
          <div className="mt-3 text-sm">
            <div className="font-semibold mb-1">テスト結果</div>
            <ul className="list-disc pl-6 space-y-1">
              {testResults.map((r, i) => (
                <li key={i} className={r.pass ? "text-green-700" : "text-red-700"}>
                  {r.name}: {r.pass ? "PASS" : `FAIL → ${r.message}`}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* A4 Sheets（画面プレビュー用） */}
      <div className="mx-auto bg-white">
        <SheetStyles />
        {pages.length === 0 ? (
          <div className="bg-white shadow p-6 text-sm text-neutral-600" style={{ width: "210mm", minHeight: "297mm" }}>
            CSVファイルをアップロードすると、チャプターごとに12問単位で自動分页します。
          </div>
        ) : (
          pages.map((p, idx) => (
            <div key={idx} className="page bg-white print:shadow-none mb-6" style={{ width: "210mm", minHeight: "297mm" }}>
              <Header title={title} chapter={p.chapter} />
              <Body items={p.items} showAnswerKey={showAnswerKey} />
              <FooterNote />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function SheetStyles() {
  return (
    <style>{`
      @page { size: A4; margin: 8mm; }
      @media print { 
        body { 
          -webkit-print-color-adjust: exact; 
          print-color-adjust: exact; 
        }
        /* 印刷時は操作パネルを非表示 */
        .print\\:hidden {
          display: none !important;
        }
        /* 影を削除 */
        .print\\:shadow-none {
          box-shadow: none !important;
        }
      }
      .page { page-break-after: always; }
      .page:last-child { page-break-after: auto; }
      .fourline {
        position: relative;
        height: 18mm;
      }
      .fourline::before {
        content: "";
        position: absolute; inset: 0;
        background-image: 
          linear-gradient(to bottom, 
            rgba(180,180,180,0.8) 0, rgba(180,180,180,0.8) 1px, transparent 1px, transparent 5mm),
          linear-gradient(to bottom, 
            transparent 5mm, rgba(180,180,180,0.8) 5mm, rgba(180,180,180,0.8) calc(5mm + 1px), transparent calc(5mm + 1px), transparent 10mm),
          linear-gradient(to bottom,
            transparent 10mm, rgba(0,0,0,0.8) 10mm, rgba(0,0,0,0.8) calc(10mm + 1px), transparent calc(10mm + 1px), transparent 15mm),
          linear-gradient(to bottom,
            transparent 15mm, rgba(180,180,180,0.8) 15mm, rgba(180,180,180,0.8) calc(15mm + 1px), transparent calc(15mm + 1px));
        background-size: 100% 20mm;
        background-repeat: no-repeat;
        border-radius: 6px;
      }
    `}</style>
  );
}

interface HeaderProps {
  title: string;
  chapter: string;
}

function Header({ title, chapter }: HeaderProps) {
  return (
    <div className="p-4">
      <div className="grid grid-cols-12 gap-2 items-stretch">
        <div className="col-span-8 border rounded-xl p-3">
          <div className="text-lg font-semibold">{title}（ ）年（ ）組 氏名（　　　　　　　　　）</div>
        </div>
        <div className="col-span-4 grid grid-cols-2 gap-2">
          <div className="border rounded-xl p-2 text-sm flex flex-col justify-between">
            <div className="font-semibold">学習日</div>
            <div>　　月　　日（　）</div>
          </div>
          <div className="border rounded-xl p-2 text-sm flex flex-col gap-1">
            <div className="font-semibold">検印</div>
            <div className="font-semibold">評価</div>
          </div>
        </div>
      </div>
      <div className="mt-2 text-sm">単元：<span className="font-semibold">{chapter || "(未設定)"}</span>／ 英単語の書き取りをしましょう。（各1点）</div>
    </div>
  );
}

interface BodyProps {
  items: Array<{japanese: string, english: string, chapter: string}>;
  showAnswerKey: boolean;
}

function Body({ items, showAnswerKey }: BodyProps) {
  const padded = [...items];
  while (padded.length < 12) padded.push({ japanese: "", english: "", chapter: "" });

  return (
    <div className="px-4 pb-2">
      <div className="grid grid-cols-2 gap-x-6 gap-y-1">
        {padded.map((it, idx) => (
          <QuestionRow key={idx} index={idx + 1} jp={it.japanese} en={it.english} showAnswerKey={showAnswerKey} />
        ))}
      </div>
    </div>
  );
}

interface QuestionRowProps {
  index: number;
  jp: string;
  en: string;
  showAnswerKey: boolean;
}

function QuestionRow({ index, jp, en, showAnswerKey }: QuestionRowProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-28">
        <div className="text-sm font-semibold">（{index}）{jp}</div>
        {showAnswerKey && en && (
          <div className="text-[10px] text-neutral-500 mt-0.5">Answer: {en}</div>
        )}
      </div>
      <div className="flex-1 fourline border rounded-xl" />
    </div>
  );
}

function FooterNote() {
  return (
    <div className="px-4 py-2 text-[10px] text-neutral-500">
      ※ 4線は小文字のアセンダ・ディセンダ位置の目安です。提出前につづり・大文字小文字を確認しましょう。
    </div>
  );
}

// ------------------------------
// 簡易テスト（ブラウザ内）
// ------------------------------
function runDevTests() {
  const results: Array<{name: string, pass: boolean, message?: string}> = [];
  const T = (name: string, fn: () => void) => {
    try { fn(); results.push({ name, pass: true }); }
    catch (e) { results.push({ name, pass: false, message: String((e as Error).message || e) }); }
  };

  // 1) 改行（LF/CRLF）
  T("parseCsv: LF/CRLF 改行読み取り", () => {
    const csv1 = `chapter,japanese,english\nC1,犬,Dog\nC1,猫,Cat`;
    const csv2 = `chapter,japanese,english\r\nC1,犬,Dog\r\nC1,猫,Cat`;
    const rows1 = parseCsv(csv1);
    const rows2 = parseCsv(csv2);
    if (rows1.length !== 2 || rows2.length !== 2) throw new Error(`len1=${rows1.length}, len2=${rows2.length}`);
    if (rows1[0].japanese !== "犬" || rows2[1].english !== "Cat") throw new Error("値不一致");
  });

  // 2) クォート・カンマ・二重引用
  T("splitCsvLine: 句読点と二重引用を復元", () => {
    const row = splitCsvLine('\"ベルギー,王国\",\"He said \"\"Hello\"\"\"');
    if (row[0] !== "ベルギー,王国") throw new Error(`row0=${row[0]}`);
    if (row[1] !== 'He said "Hello"') throw new Error(`row1=${row[1]}`);
  });

  // 3) ページ分割（27語→12,12,3）
  T("buildPages: 27語→3ページ (12,12,3)", () => {
    const items = Array.from({ length: 27 }, (_, i) => ({ chapter: "C1", japanese: `和${i+1}`, english: `en${i+1}` }));
    const pages = buildPages(items, "", false);
    if (pages.length !== 3) throw new Error(`pages=${pages.length}`);
    if (pages[0].items.length !== 12 || pages[1].items.length !== 12 || pages[2].items.length !== 3) throw new Error("ページサイズ不正");
  });

  return results;
}