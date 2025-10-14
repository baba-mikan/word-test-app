import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import WordTestPrint from '@/components/WordTestPrint'

export default async function WordListDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params
  const supabase = await createClient()

  // ユーザー認証チェック
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // 単語リストを取得
  const { data: wordList, error: listError } = await supabase
    .from('word_lists')
    .select('*')
    .eq('id', id)
    .eq('created_by', user.id)
    .single()

  if (listError || !wordList) {
    redirect('/dashboard')
  }

  // 単語データを取得
  const { data: words, error: wordsError } = await supabase
    .from('words')
    .select('*')
    .eq('list_id', id)
    .order('chapter', { ascending: true })

  if (wordsError) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link 
                href="/dashboard"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                ← ダッシュボードに戻る
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h1 className="text-3xl font-bold mb-4">{wordList.name}</h1>
          {wordList.description && (
            <p className="text-neutral-600 mb-4">{wordList.description}</p>
          )}
          <div className="flex gap-4 text-sm text-neutral-500">
            <span>単語数: {words?.length || 0}語</span>
            <span>作成日: {new Date(wordList.created_at).toLocaleDateString('ja-JP')}</span>
          </div>
        </div>

        <WordTestPrint 
          wordListId={id}
          wordListName={wordList.name}
          words={words || []}
        />
      </main>
    </div>
  )
}