import AsyncStorage from "@react-native-async-storage/async-storage";
import { QueryClient } from "@tanstack/react-query";
import { CACHE_CONFIG, CACHE_PREFIX } from "@/constants";

/**
 * クエリキャッシュの永続化を管理するクラス
 * React QueryのキャッシュとAsyncStorage間の同期を担当
 */
export class QueryPersistenceManager {
  constructor(private queryClient: QueryClient) {}

  /**
   * 指定されたクエリキーのキャッシュを非同期ストレージから読み込み
   * React Queryのキャッシュに反映します
   * @param queryKey - 読み込むクエリのキー
   */
  async loadCache(queryKey: string) {
    try {
      const cacheKey = `${CACHE_PREFIX}:${queryKey}`;
      const cache = await AsyncStorage.getItem(cacheKey);

      if (cache) {
        const { data, timestamp } = JSON.parse(cache);

        // キャッシュの有効期限をチェック（gcTime以内かどうか）
        if (Date.now() - timestamp < CACHE_CONFIG.gcTime) {
          this.queryClient.setQueryData([queryKey], data);
        } else {
          // 期限切れのキャッシュを非同期ストレージから削除
          await AsyncStorage.removeItem(cacheKey);
        }
      }
    } catch (error) {
      console.error(`Failed to load cache for ${queryKey}:`, error);
    }
  }

  /**
   * クエリデータを非同期ストレージに保存
   * @param queryKey - 保存するクエリのキー
   * @param data - 保存するデータ
   */
  async saveCache(queryKey: string, data: unknown) {
    try {
      const cacheKey = `${CACHE_PREFIX}:${queryKey}`;
      const cacheData = {
        data,
        timestamp: Date.now(),
      };

      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error(`Failed to save cache for ${queryKey}:`, error);
    }
  }

  /**
   * 複数のクエリキャッシュを一括で初期化
   * @param queryKeys - 初期化するクエリキーの配列
   */
  async initializeCache(queryKeys: string[]) {
    try {
      await Promise.all(queryKeys.map((queryKey) => this.loadCache(queryKey)));
    } catch (error) {
      console.error("Failed to initialize cache:", error);
    }
  }
}
