'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { parseCsv } from '@/lib/csvParser'

interface WordList {
  id: string
  name: string
  description: string | null
  created_at: string
  words: { count: number }[]
}

interface Props {
  userId: string
  initialWordLists: WordList[]
}

export default function WordListManager({ userId, initialWordLists }: Props) {
  const [wordLists, setWordLists] = useState<WordList[]>(initialWordLists)
  const [listName, setListName] = useState('')
  const [description, setDescription] = useState('')
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!listName.trim()) {
      setMessage({ type: 'error', text: 'リスト名を入力してください' })
      return
    }

    setUploading(true)
    setMessage(null)

    try {
      // CSVファイルを読み込む
      const text = await file.text()
      const items = parseCsv(text)

      if (items.length === 0) {
        throw new Error('CSVファイルに有効なデータが含まれていません')
      }

      // 単語リストを作成
      const { data: newList, error: listError } = await supabase
        .from('word_lists')
        .insert({
          name: listName.trim(),
          description: description.trim() || null,
          created_by: userId,
        })
        .select()
        .single()

      if (listError) throw listError

      // 単語データを準備
      const wordsToInsert = items.map(item => ({
        list_id: newList.id,
        chapter: item.chapter || '',
        japanese: item.japanese,
        english: item.english,
      }))

      // 単語データを一括挿入
      const { error: wordsError } = await supabase
        .from('words')
        .insert(wordsToInsert)

      if (wordsError) throw wordsError

      // 成功メッセージ
      setMessage({ 
        type: 'success', 
        text: `「${listName}」を作成しました（${items.length}語）` 
      })

      // フォームをリセット
      setListName('')
      setDescription('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // リストを再読み込み
      router.refresh()

    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: err instanceof Error ? err.message : 'アップロードに失敗しました' 
      })
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (listId: string, listName: string) => {
    if (!confirm(`「${listName}」を削除してもよろしいですか？`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('word_lists')
        .delete()
        .eq('id', listId)

      if (error) throw error

      setMessage({ type: 'success', text: `「${listName}」を削除しました` })
      router.refresh()
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: err instanceof Error ? err.message : '削除に失敗しました' 
      })
    }
  }

  return (
    <div className="space-y-8">
      {/* CSVアップロードセクション */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h3 className="text-xl font-bold mb-6">新しい単語リストを作成</h3>

        {message && (
          <div className={`mb-4 px-4 py-3 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-700' 
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="listName" className="block text-sm font-medium text-neutral-700 mb-2">
              リスト名 <span className="text-red-500">*</span>
            </label>
            <input
              id="listName"
              type="text"
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              placeholder="例: mikan 1000 Chapter 1-5"
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-neutral-700 mb-2">
              説明（任意）
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="例: 中学1年生向けの基本単語"
              rows={3}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              CSVファイル <span className="text-red-500">*</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={uploading}
              className="w-full text-sm text-neutral-600
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100
                disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <p className="mt-2 text-sm text-neutral-500">
              CSV形式: chapter, japanese, english（ヘッダー必須）
            </p>
          </div>

          {uploading && (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-sm text-neutral-600">アップロード中...</p>
            </div>
          )}
        </div>
      </div>

      {/* 単語リスト一覧 */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h3 className="text-xl font-bold mb-6">保存済みの単語リスト</h3>

        {wordLists.length === 0 ? (
          <p className="text-neutral-500 text-center py-8">
            まだ単語リストがありません。上のフォームからCSVをアップロードしてください。
          </p>
        ) : (
          <div className="space-y-4">
            {wordLists.map((list) => (
              <div
                key={list.id}
                className="border border-neutral-200 rounded-lg p-4 hover:shadow-md transition"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg">{list.name}</h4>
                    {list.description && (
                      <p className="text-sm text-neutral-600 mt-1">{list.description}</p>
                    )}
                    <div className="flex gap-4 mt-2 text-sm text-neutral-500">
                      <span>単語数: {list.words[0]?.count || 0}語</span>
                      <span>作成日: {new Date(list.created_at).toLocaleDateString('ja-JP')}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/word-lists/${list.id}`)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      詳細
                    </button>
                    <button
                      onClick={() => handleDelete(list.id, list.name)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                    >
                      削除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}