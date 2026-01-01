# BadWave Mobile: アーキテクチャ統一・オフライン実装計画

## 1. 設計思想：Standard Local-First

Windows 版（Desktop）の成功した設計をモバイルに移植しつつ、業界標準（Spotify/Apple Music）の堅実なオフライン戦略に従います。

### 基本ポリシー

- **Read (読み込み)**: **Local-First / SWR**
  - メタデータはすべて SQLite に永続化。UI は常にローカル DB から読み込み、レイテンシゼロの表示を目指す。
- **Playback (再生)**: **Robust Offline Playback**
  - ダウンロード済み楽曲は、ファイルシステムと DB の紐付けにより、オフラインでも確実に再生。
- **Write (書き込み)**: **Online Required**
  - 「いいね」やプレイリスト編集はオンライン時のみ許可。オフライン時は UI で制限し、同期の不整合（コンフリクト）を防止する。

---

## 2. 実装フェーズ

### フェーズ 1: SQLite & Drizzle ORM のセットアップ

JSON ベースでのキャッシュ管理を、クエリが高速で堅牢な SQLite に移行します。

- **`lib/db/schema.ts`**: Windows 版と共通のテーブル定義（songs, playlists, liked_songs 等）。
- **データ移行**: 既存の MMKV に保存されているダウンロードメタデータを SQLite へインポート。

### フェーズ 2: 差分 Pull 同期（API -> SQLite）

サーバー上の最新情報をローカルへ同期する仕組みを構築。

- **`useSyncService`**: アプリ起動時や特定タイミングで、最新の `updated_at` 以降のデータを Supabase から取得し、SQLite を Upsert。
- **SWR の実現**: UI は SQLite を表示しつつ、バックグラウンドでの同期完了時に React Query を通じて UI を更新。

### フェーズ 3: アセット管理とプレイヤーの統合

実ファイルの保存と DB の結合を強化します。

- **`OfflineStorageService` の役割分担**:
  - ファイル保存は `expo-file-system`。
  - メタデータ保存は SQLite。
- **`TrackPlayer`**: 楽曲再生時に、SQLite に `local_path` があればそれを最優先で再生するよう変更。

---

## 3. なぜ「書き込みのオフライン対応」をやめるのか

- **業界の知見**: Spotify 等の大規模サービスでも、オフライン編集の同期は不整合（コンフリクト）のリスクが高いため、保守的な制限を採用している。
- **整合性の維持**: デバイス A と B で異なる編集をした場合のマージロジックは極めて複雑であり、開発コストに見合わない。
- **Windows 版との統一**: Windows 版もオンライン必須としており、モバイルでも同様の挙動にすることで、ユーザーの混乱を防ぐ。

---

## 4. 次の具体的ステップ

1. `expo-sqlite` および `drizzle-orm` のセットアップ。
2. Windows 版からのスキーマ移植。
3. `NetInfo` を利用した「オンライン/オフライン」の UI ステート制御の組み込み。
