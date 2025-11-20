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
