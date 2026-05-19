import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { mmkvSyncAdapter } from "@/lib/storage/mmkv-sync-adapter";

/**
 * TanStack Queryの永続化に使用するためのパーシスター
 */
export const mmkvPersister = createSyncStoragePersister({
  storage: mmkvSyncAdapter,
  key: "TANSTACK_QUERY_CACHE",
  // 1秒間のスロットリング（頻繁な書き込みを防止）
  throttleTime: 1000,
  // 圧縮を無効化（パフォーマンス向上のため）
  serialize: (data) => JSON.stringify(data),
  deserialize: (data) => JSON.parse(data),
});
