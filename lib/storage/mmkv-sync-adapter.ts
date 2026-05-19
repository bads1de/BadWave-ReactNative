import { storage } from "@/lib/storage/mmkv-storage";

/**
 * MMKV の同期 API を Zustand persist 向けに変換するアダプター
 *
 * useThemeStore と mmkv-persister で重複していた
 * 同期インターフェース実装を共通化。
 */
export const mmkvSyncAdapter = {
  getItem: (name: string) => storage.getString(name) ?? null,
  setItem: (name: string, value: string) => storage.set(name, value),
  removeItem: (name: string) => storage.delete(name),
};
