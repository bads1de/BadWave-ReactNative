import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { storage } from "./mmkv-storage";

/**
 * MMKVをTanStack Queryの永続化に使用するためのアダプター
 * Storage互換のインターフェースを提供
 */
const clientStorage = {
  setItem: (key: string, value: string) => {
    storage.set(key, value);
  },
  getItem: (key: string) => {
    const value = storage.getString(key);
    return value === undefined ? null : value;
  },
  removeItem: (key: string) => {
    storage.delete(key);
  },
};

/**
 * TanStack Queryの永続化に使用するためのパーシスター
 */
export const mmkvPersister = createSyncStoragePersister({
  storage: clientStorage,
  key: "TANSTACK_QUERY_CACHE",
  // 1秒間のスロットリング（頻繁な書き込みを防止）
  throttleTime: 1000,
  // 圧縮を無効化（パフォーマンス向上のため）
  serialize: (data) => JSON.stringify(data),
  deserialize: (data) => JSON.parse(data),
});
