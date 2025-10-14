# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2025-10-14

### Added
- **ユーザー認証機能**
  - メールアドレス・パスワードによるログイン/サインアップ
  - Supabase認証の統合
  - ユーザープロファイル管理（一般ユーザー・管理者権限）

- **データベース統合**
  - PostgreSQL（Supabase）によるデータ永続化
  - 単語リスト管理（作成・削除）
  - 単語データの保存（chapter, japanese, english）
  - ユーザーごとのアクセス制御（Row Level Security）

- **CSVアップロード機能**
  - CSVファイルから単語リストをインポート
  - リスト名・説明の設定
  - 自動的にデータベースへ保存

- **プリント作成機能**
  - データベースから単語リストを取得してプリント生成
  - A4サイズ・12問/ページ・4線フォーマット
  - チャプター別自動ページ分割
  - シャッフル機能
  - 解答表示機能
  - HTMLファイルダウンロード → PDF化

- **ダッシュボード**
  - 保存済み単語リストの一覧表示
  - 単語数・作成日の表示
  - リスト詳細ページへのナビゲーション

### Changed
- MVP版から正式版へのアップグレード
- CSVアップロードのみからデータベース連携へ移行

### Technical Details
- **Frontend**: Next.js 15.5.4, React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth)
- **Authentication**: Supabase Auth (Email/Password)
- **Database Tables**: profiles, word_lists, words, word_list_access

---

## [0.1.0] - Initial MVP

### Added
- 基本的なCSVアップロード機能
- 英単語テストシート作成（オフライン）
- 4線フォーマット
- HTMLダウンロード機能