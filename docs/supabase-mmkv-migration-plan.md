# Supabase ストレージ移行計画書 (AsyncStorage → MMKV)

## 1. 目的

現在 `AsyncStorage` を使用している Supabase クライアントのセッションストレージを、より高速な `react-native-mmkv` に移行する。これにより、アプリの起動速度と全体的なパフォーマンスの向上を図る。

## 2. 背景

`codebase_investigator` の調査により、以下の点が明らかになっている。

- **`AsyncStorage` の限定的な使用:** プロジェクト全体で `AsyncStorage` は `lib/supabase.ts` のセッション永続化のためだけに使用されている。
- **`MMKV` の既存利用:** `MMKV` は既にプロジェクトに導入され、共有インスタンス (`lib/mmkv-storage.ts`) が存在する。主に React Query のキャッシュ永続化などで利用されている。
- **不足しているアダプター:** Supabase Auth Client が要求する非同期インターフェース (`getItem`, `setItem`, `removeItem`) を満たす `MMKV` のラッパー（アダプター）が存在しない。

この計画書は、このアダプターを作成し、`supabase.ts` を安全に移行するための手順を定義する。

## 3. 移行手順

### Step 1: `AsyncStorage` 互換の MMKV アダプターを作成する

`MMKV` の同期的な API (`getString`, `set`, `delete`) をラップし、`AsyncStorage` のような非同期インターフェースを提供するアダプターを新規に作成する。

- **新規作成ファイル:** `lib/mmkv-adapter.ts`
- **実装内容:**
  - `lib/mmkv-storage.ts` から共有 `storage` インスタンスをインポートする。
  - `getItem(key)`: `storage.getString(key)` を呼び出し、結果を `Promise.resolve()` で返す。
  - `setItem(key, value)`: `storage.set(key, value)` を呼び出し、`Promise.resolve()` で完了を通知する。
  - `removeItem(key)`: `storage.delete(key)` を呼び出し、`Promise.resolve()` で完了を通知する。

```typescript
// lib/mmkv-adapter.ts

import { storage } from "./mmkv-storage";

/**
 * MMKV の同期 API を AsyncStorage のような非同期インターフェースに変換するアダプター。
 * Supabase client など、AsyncStorage 互換のストレージを要求するライブラリで使用する。
 */
export const mmkvAdapter = {
  getItem: (key: string): Promise<string | null> => {
    const value = storage.getString(key);
    return Promise.resolve(value ?? null);
  },
  setItem: (key: string, value: string): Promise<void> => {
    storage.set(key, value);
    return Promise.resolve();
  },
  removeItem: (key: string): Promise<void> => {
    storage.delete(key);
    return Promise.resolve();
  },
};
```

### Step 2: Supabase クライアントのストレージ設定を更新する

`lib/supabase.ts` を修正し、`AsyncStorage` の代わりに Step 1 で作成した `mmkvAdapter` を使用するように変更する。

- **修正対象ファイル:** `lib/supabase.ts`
- **変更内容:**
  1.  `@react-native-async-storage/async-storage` のインポートを削除する。
  2.  `./mmkv-adapter` から `mmkvAdapter` をインポートする。
  3.  `createClient` の `auth.storage` オプションに `mmkvAdapter` を渡す。

```typescript
// lib/supabase.ts (変更後)

import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import { mmkvAdapter } from "./mmkv-adapter"; // 変更

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// TODO: AsyncStorageをMMKVに置き換える
export const supabase = createClient(supabaseUrl!, supabaseAnonKey!, {
  auth: {
    storage: mmkvAdapter, // 変更
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

## 4. テスト計画

- **手動テスト:**
  1.  アプリを起動し、正常にログインできることを確認する。
  2.  アプリを完全に終了（キル）してから再起動する。
  3.  セッションが維持されており、自動的にログイン状態になっていることを確認する。
  4.  ログアウト機能が正常に動作することを確認する。
- **自動テスト (推奨):**
  - `__tests__/lib/supabase.test.ts` において、`mmkvAdapter` をモック化し、Supabase クライアントが正しく初期化されることを確認するテストを追加または修正する。

## 5. リスクと対策

- **リスク:** 移行に失敗した場合、既存ユーザーのセッションがすべて無効になる可能性がある。
  - **対策:** `AsyncStorage` から `MMKV` へのデータ移行処理は実装しない。これは、セッショントークンがサーバー側で検証され、必要に応じてリフレッシュされるため、ユーザーは再度ログインするだけで済むため。大きな混乱は予想されない。
- **リスク:** アダプターの実装に誤りがあり、セッションの保存・復元に失敗する。
  - **対策:** 上記「4. テスト計画」で定義された手動テストをリリース前に必ず実施し、認証フローに問題がないことを徹底的に確認する。
