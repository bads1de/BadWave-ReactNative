# BadWave Mobile

**BadWave Mobile** は、**React Native (Expo)** で構築された、**「Local-First (ローカルファースト)」** アーキテクチャを採用した音楽ストリーミングアプリです。
地下鉄や機内モードなどのオフライン環境下でも、ネットワーク遅延を感じさせない「ゼロレイテンシ」な操作感を実現しています。

## 📱 プロジェクトのハイライト

### 1. Local-First Architecture & Sync Engine

本アプリの最大の特徴は、UI が常にローカルの **SQLite** データベースのみを参照することです。

- **Drizzle ORM + SQLite**: スキーマ定義 (`lib/db/schema.ts`) に基づき、楽曲、プレイリスト、いいね情報などをローカルで完全管理。
- **堅牢な同期エンジン**: `SyncProvider` と複数の `useSync...` フックがバックグラウンドで稼働。Supabase からデータの差分を取得し、ローカル DB を静かに最新化します (Upsert)。
- **オフライン再生**: 楽曲ファイル (`songPath`) もローカルにダウンロード・管理され、ネットワーク切断時でもシームレスに再生を継続します。

### 2. Expo Ecosystem のフル活用

開発効率とメンテナンス性を最大化するため、最新の Expo ツールチェーンを採用しています。

- **Expo Router**: ファイルベースルーティングにより、Web (Next.js) ライクな直感的なナビゲーション構造を実現。
- **Config Plugins**: ネイティブモジュール設定を `app.json` 等で管理し、EAS Build での再現性を担保。

### 3. パフォーマンス・チューニング

- **React Native Track Player**: バックグラウンド再生やロック画面操作に対応した、ネイティブレベルのオーディオ制御。
- **FlashList**: 大量の楽曲リストも高速にレンダリング。
- **MMKV**: 頻繁にアクセスされる設定値やキャッシュキーには、AsyncStorage よりも高速な MMKV を採用。

## 🛠 技術スタック

| Category      | Technology                         | Usage                          |
| :------------ | :--------------------------------- | :----------------------------- |
| **Framework** | **React Native** / **Expo SDK 52** | クロスプラットフォーム開発基盤 |
| **Routing**   | **Expo Router**                    | ファイルベースナビゲーション   |
| **Local DB**  | **SQLite** (expo-sqlite)           | アプリ内データベース           |
| **ORM**       | **Drizzle ORM**                    | 型安全な DB 操作、スキーマ管理 |
| **Backend**   | **Supabase**                       | クラウドデータベース、認証     |
| **State**     | **Zustand**                        | プレイヤー状態、UI状態管理     |
| **Data/Sync** | **TanStack Query v5**              | サーバー状態管理と同期トリガー |
| **Storage**   | **MMKV**                           | 高速 KVS (設定値など)          |

## 📂 ディレクトリ構造の解説

```bash
badwave-mobile/
├── app/                # Expo Router 画面 (タブ、スタック)
│   ├── (tabs)/         # メインタブ構成
│   └── ...
├── components/         # UIコンポーネント
├── hooks/
│   ├── data/           # ローカルDBからの読み込み (useGetLocalSongs...)
│   ├── sync/           # 同期ロジック (useSyncSongs, useSyncLiked...)
│   └── mutations/      # データ書き込み (Optimistic Update -> DB & API)
├── lib/
│   ├── db/             # Drizzle スキーマ定義 (schema.ts)
│   └── services/       # バックグラウンドサービス (PlaybackService等)
└── providers/          # SyncProvider 等のアプリ全体設定
```

## 🚀 開発の始め方

### 前提条件

- Node.js (LTS)
- Expo Go (実機確認用) または Android Emulator / iOS Simulator

### インストール手順

1. **リポジトリのクローン:**

   ```bash
   git clone https://github.com/yourusername/badwave-mobile.git
   cd badwave-mobile
   ```

2. **依存関係のインストール:**

   ```bash
   npm install
   ```

3. **環境変数の設定:**
   `.env` ファイルを作成し、Supabase の認証情報を設定してください。

   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key
   ```

### アプリの実行

- **開発サーバー起動:**

  ```bash
  npm start
  ```

  表示された QR コードを Expo Go アプリでスキャンしてください。

- **エミュレータ実行:**

  ```bash
  npm run android
  # または
  npm run ios
  ```

- **プロジェクトのリセット:**
  キャッシュやDBを一掃して再構築する場合：

  ```bash
  npm run reset-project
  ```

## 🧪 テスト

Jest と React Testing Library for Native を使用したテストが含まれています。

```bash
npm test
```
