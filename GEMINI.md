# GEMINI.md: badwave-mobile プロジェクトガイド

このドキュメントは、`badwave-mobile` プロジェクトの概要、アーキテクチャ、および開発プラクティスを、将来の対話のための指示コンテキストとして提供します。

## 1. プロジェクト概要

`badwave-mobile` は、React Native と Expo で構築されたモバイル音楽ストリーミングアプリケーションです。ユーザーは曲を再生したり、プレイリストを作成したり、音楽を閲覧したりできます。このアプリケーションは、データベースや認証を含むバックエンドサービスに Supabase を使用しています。

### 主要技術

- **フレームワーク**: [React Native](https://reactnative.dev/) と [Expo](https://expo.dev/)
- **言語**: [TypeScript](https://www.typescriptlang.org/) (厳格モード)
- **バックエンド**: [Supabase](https://supabase.io/) (データベース、認証)
- **ナビゲーション**: [Expo Router](https://docs.expo.dev/router/introduction/) (ファイルベースルーティング)
- **データフェッチ**: データフェッチ、キャッシュ、永続化のための [TanStack Query](https://tanstack.com/query/latest)。
- **状態管理**: グローバルな状態管理 (例: プレイヤー UI の状態) のための [Zustand](https://github.com/pmndrs/zustand)。
- **オーディオ再生**: バックグラウンドオーディオのための [React Native Track Player](https://react-native-track-player.js.org/)。
- **ローカルストレージ**: 高速なキーバリューストレージのための [React Native MMKV](https://github.com/mrousavy/react-native-mmkv) と、Supabase セッション永続化のための `AsyncStorage`。
- **テスト**: [Jest](https://jestjs.io/) と [React Testing Library](https://testing-library.com/docs/react-native-testing-library/intro/)。

### アーキテクチャ

このプロジェクトは、明確な関心事の分離を伴う機能指向のアーキテクチャに従っています。

#### ファイル階層図

```
badwave-mobile/
├── app/              # Expo Routerによる画面とルート
│   ├── (tabs)/       # タブナビゲーション用のレイアウトと画面
│   │   ├── _layout.tsx
│   │   ├── index.tsx   # ホーム画面
│   │   ├── library.tsx
│   │   ├── search.tsx
│   │   └── reels.tsx     # 新規: Reelsタブのメイン画面
│   ├── playlist/     # プレイリスト詳細画面など
│   └── _layout.tsx     # ルートレイアウト
├── actions/          # Supabaseとのデータ通信処理
│   ├── getSongs.ts
│   ├── createPlaylist.ts
│   └── ...
├── components/       # 再利用可能なUIコンポーネント
│   ├── common/
│   ├── player/
│   │   ...
│   └── reels/                # 新規: Reels関連コンポーネント
│       ├── ReelsList.tsx
│       └── ReelItem.tsx
├── hooks/            # ビジネスロジックと状態管理
│   ├── useAudioPlayer.ts
│   ├── usePlayerStore.ts
│   │   ...
│   └── useReelsPlayer.ts     # 新規: 動画再生ロジックを管理
├── lib/              # Supabaseクライアント初期化などのユーティリティ
│   └── supabase.ts
├── services/         # バックグラウンドサービス
│   └── PlayerService.ts
├── providers/        # React Context プロバイダー
│   └── AuthProvider.tsx
└── __tests__/        # Jestによるテスト (ソース構造をミラーリング)
    └── ...
```

#### 各ディレクトリの役割

- **`app/`**: Expo Router によって管理されるすべての画面とルートが含まれます。メインナビゲーションは `app/(tabs)/_layout.tsx` で定義されたタブバーです。
- **`actions/`**: Supabase バックエンドと対話する非同期関数 (例: `getSongs`、`createPlaylist`) を保持します。これらは API コールと同等です。
- **`components/`**: アプリケーション全体で使用される再利用可能な React コンポーネント。
- **`hooks/`**: ビジネスロジック、状態管理の購読 (Zustand)、オーディオプレイヤーなどのサービスとの対話をカプセル化するカスタムフック。コアオーディオロジックは `useAudioPlayer.ts` にあります。
- **`lib/`**: サードパーティサービス (例: `supabase.ts`) の初期化と共有ユーティリティ関数が含まれます。
- **`providers/`**: `AuthProvider` などの React コンテキストプロバイダー。
- **`services/`**: バックグラウンドサービスとネイティブ API との直接的な対話を管理します。特に `PlayerService.ts` は `react-native-track-player` インスタンスを設定します。
- **`__tests__/`**: ソースディレクトリの構造をミラーリングしたすべての Jest テストが含まれます。

## 2. はじめに

### 前提条件

- Node.js (LTS バージョン)
- npm または yarn
- Expo CLI
- Supabase の URL とキーを含む環境ファイル。

### ビルドと実行

1. **依存関係のインストール**:

   ```bash
   npm install
   ```

2. **アプリケーションの実行**:
   Expo 開発サーバーを起動します。

   ```bash
   npx expo start
   ```

   Expo Dev Tools から、Android エミュレーター、iOS シミュレーター、または Expo Go アプリを使用して物理デバイスでアプリを実行できます。

3. **特定のプラットフォームでの実行**:

   ```bash
   # Android で実行
   npm run android

   # iOS で実行
   npm run ios
   ```

### テスト

テストスイートを実行するには、`test` スクリプトを使用します。

```bash
npm test
```

## 3. 開発規約

- **スタイル**: プロジェクトは `StyleSheet.create()` を使用したインラインスタイルと、`constants/theme.ts` で定義されたグローバルテーマの組み合わせを使用しています。
- **Linting**: コードの品質とスタイルは ESLint を使用して強制されます。リンターを実行するには:

  ```bash
  npm run lint
  ```

- **TypeScript**: コードベースは厳密に型付けされています。すべての新しいコードには適切な型を含める必要があります。パスエイリアスは `tsconfig.json` を介して設定されており、ルートディレクトリからの絶対インポート (例: `import MyComponent from '@/components/MyComponent';`) を可能にします。
- **データフェッチ**: Supabase バックエンドとのすべての対話は `actions/` ディレクトリで定義する必要があります。UI コンポーネントは、適切なキャッシュ、再フェッチ、ロード/エラー状態管理を確実にするために、`@tanstack/react-query` のフックを使用してこれらのアクションを呼び出す必要があります。
- **状態管理**: UI の複数の離れた部分に影響するグローバルな状態 (オーディオプレイヤーの表示など) は Zustand で管理されます。新しいストアを作成するか、既存のストアを `hooks/` ディレクトリ (例: `usePlayerStore.ts`) に追加します。
- **コミット**: コミットメッセージには Conventional Commits の標準に従ってください。
