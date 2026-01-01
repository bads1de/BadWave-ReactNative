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
  - `useSyncTrendSongs`: トレンドセクション（TrendBoard）の ID リスト同期。
  - `useSyncRecommendations`: おすすめセクション（ForYou）の同期。
  - `useSyncSpotlights`: スポットライト情報の同期。
- **SyncProvider (`providers/SyncProvider.tsx`)**:
  - 認証済みユーザーに対し、バックグラウンドで自動同期を開始。
  - 同期完了時にローカルクエリのキャッシュを無効化。

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

## 4. テスト実装

- **TDD 原則**: 各フックに対して Jest によるユニットテストを実装済み。
- **テストカバレッジ**:
  - `__tests__/hooks/like/useLike.test.tsx`: いいね状態取得・更新。
  - `__tests__/hooks/playlist/usePlaylist.test.tsx`: プレイリスト取得・作成・曲管理。
  - `__tests__/hooks/data/useGetLocalSongs.test.tsx`: 全楽曲取得。
  - `__tests__/hooks/home/useHomeSections.test.tsx`: トレンド・おすすめ・スポットライト取得。

## 5. 現在のステータス

- **インフラ**: 完了 (SQLite/Drizzle/Provider)
- **フック**: ほぼ全機能（Songs/Likes/Playlists/Home Sections）完了
- **テスト**: 主要フックのテスト完了 (15 テスト)
- **既存統合**: ダウンロード・削除時の二重書き込み対応完了
- **UI コンポーネント**: ホーム画面・ライブラリ画面のローカルファースト化完了
  - `TrendBoard`: `useGetLocalTrendSongs` に切り替え済み
  - `ForYouBoard`: `useGetLocalRecommendations` に切り替え済み
  - `HeroBoard`: ジャンルカード表示のため変更不要
  - `library.tsx`: `useGetLikedSongs` / `useGetPlaylists` に切り替え済み
- **オーディオ再生**: `getSongLocalPath` で SQLite を優先参照するように変更済み
- **再生履歴**: オフライン時は Supabase への送信をスキップするように変更済み

---

**Next Step**: オフライン時の UI/UX 改善（同期中インジケーター、オフライン時の操作制限 UI など）
