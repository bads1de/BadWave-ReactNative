import { MMKV } from "react-native-mmkv";

/**
 * MMKVストレージのインスタンス
 * アプリ全体で共有される単一のインスタンスを提供
 */
export const storage = new MMKV({
  id: "app-storage", // ストレージのID
  // 必要に応じて暗号化キーを設定することも可能
  // encryptionKey: 'encryption-key',
});
