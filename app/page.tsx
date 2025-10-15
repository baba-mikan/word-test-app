import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LogoutButton from '@/components/LogoutButton'
import WordListManager from '@/components/WordListManager'

export default async function Home() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // ユーザーのプロファイル情報を取得
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // ユーザーの単語リストを取得
  const { data: wordLists } = await supabase
    .from('word_lists')
    .select('*, words(count)')
    .eq('created_by', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-neutral-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold">Word Test App</h1>
            <LogoutButton />
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4">ダッシュボード</h2>
          <div className="space-y-2">
            <p className="text-neutral-600">
              <span className="font-medium">メールアドレス:</span> {user.email}
            </p>
            <p className="text-neutral-600">
              <span className="font-medium">権限:</span> {profile?.role === 'admin' ? '管理者' : '一般ユーザー'}
            </p>
          </div>
        </div>

        <WordListManager userId={user.id} initialWordLists={wordLists || []} />
      </main>
    </div>
  )
}