'use client'

import { useState, useMemo } from 'react'

interface Word {
  id: string
  chapter: string
  japanese: string
  english: string
}

interface Props {
  wordListId: string
  wordListName: string
  words: Word[]
}

function buildPages(
  items: Word[], 
  defaultChapter: string, 
  shuffle: boolean
): Array<{ chapter: string; items: Word[] }> {
  if (!items || items.length === 0) return []
  
  const groups = new Map<string, Word[]>()
  for (const it of items) {
    const key = (it.chapter || defaultChapter || "").trim() || "(チャプター未設定)"
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(it)
  }
  
  const out: Array<{ chapter: string; items: Word[] }> = []
  for (const [ch, arr] of groups.entries()) {
    const source = shuffle ? shuffleArray(arr) : arr
    for (let i = 0; i < source.length; i += 12) {
      out.push({ chapter: ch, items: source.slice(i, i + 12) })
    }
  }
  return out
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export default function WordTestPrint({ wordListId, wordListName, words }: Props) {
  const [title, setTitle] = useState(wordListName)
  const [defaultChapter, setDefaultChapter] = useState("")
  const [showAnswerKey, setShowAnswerKey] = useState(false)
  const [shuffle, setShuffle] = useState(false)

  const pages = useMemo(
    () => buildPages(words, defaultChapter, shuffle), 
    [words, defaultChapter, shuffle]
  )

  const handleDownloadHTML = () => {
    if (!pages.length) {
      alert('出力するページがありません')
      return
    }

    // 元のWordTestA4.tsxと全く同じHTML生成ロジック
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
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    color-adjust: exact;
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  body {
    font-family: 'Hiragino Sans', 'Yu Gothic', sans-serif;
  }
  .page {
    width: 210mm;
    min-height: 297mm;
    padding: 1rem;
    margin: 0 auto;
    background: white;
    page-break-after: always;
  }
  .page:last-child {
    page-break-after: auto;
  }
  .header {
    padding: 1rem;
  }
  .header-grid {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 0.5rem;
    align-items: stretch;
  }
  .name-section {
    grid-column: span 8;
    border: 1px solid black;
    border-radius: 0.75rem;
    padding: 0.75rem;
  }
  .name-text {
    font-size: 1.125rem;
    font-weight: 600;
  }
  .date-eval-wrapper {
    grid-column: span 4;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }
  .date-box {
    border: 1px solid black;
    border-radius: 0.75rem;
    padding: 0.5rem;
    font-size: 0.875rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .eval-box {
    border: 1px solid black;
    border-radius: 0.75rem;
    padding: 0.5rem;
    font-size: 0.875rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .section-label {
    font-weight: 600;
  }
  .unit-row {
    margin-top: 0.5rem;
    font-size: 0.875rem;
  }
  .unit-name {
    font-weight: 600;
  }
  .body {
    padding: 0 1rem 0.5rem;
  }
  .questions-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.25rem 1.5rem;
  }
  .question-row {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
  }
  .question-label {
    width: 7rem;
  }
  .question-number-text {
    font-size: 0.875rem;
    font-weight: 600;
  }
  .answer-key {
    font-size: 0.625rem;
    color: rgb(115, 115, 115);
    margin-top: 0.125rem;
  }
  .fourline-wrapper {
    flex: 1;
    border: 1px solid black;
    border-radius: 0.75rem;
    position: relative;
    height: 18mm;
  }
  .fourline-wrapper::before {
    content: "";
    position: absolute;
    inset: 0;
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
  .footer {
    padding: 0.5rem 1rem;
    font-size: 0.625rem;
    color: rgb(115, 115, 115);
  }
</style>
</head>
<body>
${pages.map(page => {
  const items = [...page.items];
  while (items.length < 12) items.push({ id: '', chapter: '', japanese: '', english: '' });
  
  return `<div class="page">
  <div class="header">
    <div class="header-grid">
      <div class="name-section">
        <div class="name-text">${title}（　）年（　）組　氏名（　　　　　　　　　）</div>
      </div>
      <div class="date-eval-wrapper">
        <div class="date-box">
          <div class="section-label">学習日</div>
          <div>　　月　　日（　）</div>
        </div>
        <div class="eval-box">
          <div class="section-label">検印</div>
          <div class="section-label">評価</div>
        </div>
      </div>
    </div>
    <div class="unit-row">単元：<span class="unit-name">${page.chapter || '(未設定)'}</span>／英単語の書き取りをしましょう。（各1点）</div>
  </div>
  <div class="body">
    <div class="questions-grid">
      ${items.map((item, idx) => `<div class="question-row">
        <div class="question-label">
          <div class="question-number-text">（${idx + 1}）${item.japanese}</div>
          ${showAnswerKey && item.english ? `<div class="answer-key">Answer: ${item.english}</div>` : ''}
        </div>
        <div class="fourline-wrapper"></div>
      </div>`).join('')}
    </div>
  </div>
  <div class="footer">※ 4線は小文字のアセンダー・ディセンダー位置の目安です。提出前につづり・大文字小文字を確認しましょう。</div>
</div>
`}).join('')}
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${title.replace(/[\/\\?%*:|"<>]/g, '-')}.html`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    alert('HTMLファイルをダウンロードしました。ファイルを開いて印刷してください。')
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <h2 className="text-2xl font-bold mb-6">プリント作成</h2>

      {/* 設定 */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            タイトル
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-neutral-300 rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            （任意）チャプター未設定時のデフォルト名
          </label>
          <input
            value={defaultChapter}
            onChange={(e) => setDefaultChapter(e.target.value)}
            className="w-full border border-neutral-300 rounded-lg px-3 py-2"
          />
        </div>

        <div className="flex items-end">
          <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={showAnswerKey}
              onChange={(e) => setShowAnswerKey(e.target.checked)}
              className="rounded"
            />
            解答（英語）を小さく表示
          </label>
        </div>
      </div>

      {/* ボタン */}
      <div className="flex gap-3">
        <button
          onClick={() => setShuffle(!shuffle)}
          className="px-6 py-3 rounded-xl shadow border bg-white hover:bg-neutral-50 font-medium transition"
        >
          {shuffle ? '元の順番に戻す' : 'ランダム出題'}
        </button>

        <button
          onClick={handleDownloadHTML}
          className="px-6 py-3 rounded-xl shadow border bg-blue-500 text-white hover:bg-blue-600 font-medium transition"
        >
          HTMLファイルをダウンロード
        </button>
      </div>

      <p className="text-xs text-neutral-500 mt-2">
        ※ HTMLファイルをダウンロード → ブラウザで開く → Ctrl+P（Mac: Cmd+P）→ PDFとして保存
      </p>

      {/* プレビュー情報 */}
      <div className="mt-6 p-4 bg-neutral-50 rounded-lg">
        <p className="text-sm text-neutral-600">
          <strong>単語数:</strong> {words.length}語 / 
          <strong className="ml-2">ページ数:</strong> {pages.length}ページ
        </p>
      </div>
    </div>
  )
}