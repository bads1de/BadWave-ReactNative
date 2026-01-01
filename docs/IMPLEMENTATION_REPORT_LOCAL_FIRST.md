# ローカルファースト・アーキテクチャ実装レポート (BadWave Mobile)

## 1. 概要

Windows 版（Desktop）の設計思想を継承し、SQLite + Drizzle ORM を基盤とした真の Local-First アーキテクチャをモバイル版に導入しました。これにより、オフライン環境でのライブラリ閲覧と超高速な UI レスポンスを実現しています。

## 2. 実装済みコンポーネント

### A. データベース基盤 (SQLite / Drizzle)

- **Schema (`lib/db/schema.ts`)**: Windows 版と完全に一致するテーブル定義。
  - `songs`, `playlists`, `playlist_songs`, `liked_songs`, `spotlights`, `section_cache`
- **Client (`lib/db/client.ts`)**: `expo-sqlite` を利用した Drizzle クライアントの初期化。
- **Migrations**: `drizzle-kit` によるマイグレーション管理と、アプリ起動時の自動実行処理 (`_layout.tsx`)。

### B. 同期ロジック (Supabase -> SQLite)

- **Sync Hooks**:
  - `useSyncSongs`: 全楽曲メタデータの差分更新 (Upsert)。
  - `useSyncLikedSongs`: 各ユーザーの「いいね」状態の完全同期。
  - `useSyncPlaylists`: プレイリスト構成および内包楽曲の同期。
- **SyncProvider (`providers/SyncProvider.tsx`)**:
  - 認証済みユーザーに対し、バックグラウンドで自動同期を開始。

### C. データ取得・操作フック (Local-First)

- **Read (高速読み込み)**:
  - `useGetLocalSongs`, `useLikeStatus`, `useGetPlaylists` 等。
  - すべて SQLite から取得するため、オフラインでも即座に表示可能。
- **Write (オンライン必須)**:
  - `useLikeMutation`, `useMutatePlaylistSong`, `useCreatePlaylist`。
  - オフライン時は操作を制限し、オンライン時に Supabase と SQLite の両方を更新することで整合性を維持。

### D. 段階的移行 (Transition Strategy)

- **二重書き込みの導入**:
  - 既存の `OfflineStorageService.ts` (MMKV) を修正し、ダウンロード/削除時に **MMKV と SQLite の両方に書き込む** 仕組みを実装。
  - 既存の再生ロジックやテストを壊さずに、徐々にデータソースを SQLite へ移行可能。

## 3. データフロー

1. **アプリ起動**: `useMigrations` が SQLite スキーマを最新化。
2. **認証**: `AuthProvider` がセッションを確立。
3. **自動同期**: `SyncProvider` が Supabase から最新データを Pull して SQLite を更新。
4. **UI 反映**: 各画面が `useGetLocal...` フックを使って SQLite からデータを表示。
5. **再生**: `TrackPlayer` が SQLite に `song_path` (ローカルパス) があればオフライン再生、なければストリーミング。

## 4. 現在のステータス

- **インフラ**: 完了 (SQLite/Drizzle/Provider)
- **フック**: 基本セット（Songs/Likes/Playlists）完了
- **既存統合**: ダウンロード・削除時の二重書き込み対応完了

---

**Next Step**: 既存の UI コンポーネント（Home 画面や Library 画面）で、従来の `getSongs` 等の非同期フェッチから、新しい `useGetLocalSongs` への切り替え。
