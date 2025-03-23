import { QueryClient } from "@tanstack/react-query";
import { CACHE_CONFIG, CACHE_PREFIX } from "@/constants";
import { storage } from "./mmkv-storage";

/**
 * クエリキャッシュの永続化を管理するクラス
 * React QueryのキャッシュとMMKV間の同期を担当
 */
export class QueryPersistenceManager {
  constructor(private queryClient: QueryClient) {}

  /**
   * 指定されたクエリキーのキャッシュをMMKVから読み込み
   * React Queryのキャッシュに反映します
   * @param queryKey - 読み込むクエリのキー
   */
  loadCache(queryKey: string) {
    try {
      const cacheKey = `${CACHE_PREFIX}:${queryKey}`;
      const cache = storage.getString(cacheKey);

      if (cache) {
        const { data, timestamp } = JSON.parse(cache);

        // キャッシュの有効期限をチェック（gcTime以内かどうか）
        if (Date.now() - timestamp < CACHE_CONFIG.gcTime) {
          this.queryClient.setQueryData([queryKey], data);
        } else {
          // 期限切れのキャッシュをMMKVから削除
          storage.delete(cacheKey);
        }
      }
    } catch (error) {
      console.error(`Failed to load cache for ${queryKey}:`, error);
    }
  }

  /**
   * クエリデータをMMKVに保存
   * @param queryKey - 保存するクエリのキー
   * @param data - 保存するデータ
   */
  saveCache(queryKey: string, data: unknown) {
    try {
      const cacheKey = `${CACHE_PREFIX}:${queryKey}`;
      const cacheData = {
        data,
        timestamp: Date.now(),
      };

      storage.set(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error(`Failed to save cache for ${queryKey}:`, error);
    }
  }

  /**
   * 複数のクエリキャッシュを一括で初期化
   * @param queryKeys - 初期化するクエリキーの配列
   */
  initializeCache(queryKeys: string[]) {
    try {
      queryKeys.forEach((queryKey) => this.loadCache(queryKey));
    } catch (error) {
      console.error("Failed to initialize cache:", error);
    }
  }

  /**
   * 特定のキャッシュを削除
   * @param queryKey - 削除するクエリのキー
   */
  removeCache(queryKey: string) {
    try {
      const cacheKey = `${CACHE_PREFIX}:${queryKey}`;
      storage.delete(cacheKey);
    } catch (error) {
      console.error(`Failed to remove cache for ${queryKey}:`, error);
    }
  }

  /**
   * すべてのキャッシュを削除
   */
  clearAllCache() {
    try {
      // MMKVのすべてのキーを取得
      const allKeys = storage.getAllKeys();

      // CACHE_PREFIXで始まるキーのみを削除
      allKeys.forEach((key) => {
        if (key.startsWith(CACHE_PREFIX)) {
          storage.delete(key);
        }
      });
    } catch (error) {
      console.error("Failed to clear all cache:", error);
    }
  }
}
