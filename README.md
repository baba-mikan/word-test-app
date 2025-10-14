# Word Test App

英単語テストシート作成アプリケーション（v1.0.0）

CSVファイルから英単語リストをインポートし、印刷用のテストシートを自動生成します。ユーザー認証とデータベース連携により、単語リストを保存・管理できます。

## 機能

### 🔐 ユーザー認証
- メールアドレス・パスワードによるログイン/サインアップ
- ユーザーごとのデータ管理
- 管理者・一般ユーザーの権限管理

### 📊 データ管理
- CSVファイルから単語リストをインポート
- 単語リスト（chapter, japanese, english）の保存
- リストの作成・削除・閲覧
- ユーザーごとのアクセス制御

### 📄 プリント作成
- A4サイズ・12問/ページの自動レイアウト
- チャプター別の自動ページ分割
- 英語4線フォーマット
- シャッフル機能（ランダム出題）
- 解答表示機能
- HTMLファイルダウンロード → PDF変換

## 技術スタック

- **Frontend**: Next.js 15.5.4, React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Authentication)
- **Deployment**: Vercel (推奨)

## セットアップ

### 前提条件

- Node.js 20以上
- Supabaseアカウント

### インストール

1. リポジトリをクローン
```bash
git clone <repository-url>
cd word-test-app
```

2. 依存関係をインストール
```bash
npm install
```

3. 環境変数を設定

`.env.local` ファイルを作成し、以下を記入：

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Supabaseデータベースをセットアップ

Supabaseダッシュボードの SQL Editor で以下のテーブルを作成：
- `profiles` (ユーザープロファイル)
- `word_lists` (単語リスト)
- `words` (単語データ)
- `word_list_access` (アクセス権限)

詳細なSQL文は開発ドキュメントを参照してください。

5. 開発サーバーを起動

```bash
npm run dev
```

http://localhost:3000 でアプリケーションが起動します。

## 使い方

### 1. アカウント登録
- `/signup` でメールアドレスとパスワードを登録

### 2. 単語リストを作成
- ダッシュボードでリスト名を入力
- CSVファイルをアップロード
  - 形式: `chapter,japanese,english`（ヘッダー必須）
  - 例: `Chapter1,犬,dog`

### 3. プリントを作成
- リスト一覧から「詳細」をクリック
- 設定を調整（タイトル、シャッフルなど）
- 「HTMLファイルをダウンロード」をクリック
- ダウンロードしたHTMLをブラウザで開く
- Ctrl+P (Mac: Cmd+P) でPDF保存

## CSVファイル形式

```csv
chapter,japanese,english
Chapter1,犬,dog
Chapter1,猫,cat
Chapter2,赤,red
Chapter2,青,blue
```

- **chapter**: チャプター名（空欄可）
- **japanese**: 日本語（問題文）
- **english**: 英語（解答）

## ライセンス

MIT License

## 変更履歴

詳細は [CHANGELOG.md](./CHANGELOG.md) を参照してください。

## 開発者

開発に関する質問や提案は Issue または Pull Request でお願いします。
