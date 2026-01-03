import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { getOfflineStorageService } from "@/hooks/TrackPlayer/utils";
import { CACHED_QUERIES } from "@/constants";

/**
 * ストレージ情報の型定義
 */
interface StorageInfo {
  downloadedSize: number;
  downloadedCount: number;
  isLoading: boolean;
  error: string | null;
}

/**
 * ストレージ操作の型定義
 */
interface StorageActions {
  clearAllDownloads: () => Promise<void>;
  deleteAllDownloads: () => Promise<void>;
  clearQueryCache: () => void;
  refreshStorageInfo: () => void;
}

/**
 * バイト数を人間が読みやすい形式に変換
 * @param bytes バイト数
 * @returns フォーマットされた文字列（例: "45.2 MB"）
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

/**
 * ストレージ情報を取得・管理するフック
 * ダウンロード済みの曲のサイズと数を取得し、削除・キャッシュクリア機能を提供
 */
export function useStorageInfo(): StorageInfo & StorageActions {
  const queryClient = useQueryClient();

  // ストレージサイズを取得
  const {
    data: sizeData,
    isLoading: isSizeLoading,
    error: sizeError,
    refetch: refetchSize,
  } = useQuery({
    queryKey: ["storageSize"],
    queryFn: async () => {
      const offlineStorageService = getOfflineStorageService();
      return await offlineStorageService.getDownloadedSongsSize();
    },
    staleTime: 1000 * 30, // 30秒
  });

  // ダウンロード済み曲数を取得
  const {
    data: songsData,
    isLoading: isSongsLoading,
    error: songsError,
    refetch: refetchSongs,
  } = useQuery({
    queryKey: [CACHED_QUERIES.downloadedSongs],
    queryFn: async () => {
      const offlineStorageService = getOfflineStorageService();
      return await offlineStorageService.getDownloadedSongs();
    },
    staleTime: 1000 * 30, // 30秒
  });

  // 直接削除を実行する関数（UI側で確認後に呼び出す）
  const deleteAllDownloads = useCallback(async () => {
    try {
      const offlineStorageService = getOfflineStorageService();
      await offlineStorageService.clearAllDownloads();
      // キャッシュを無効化して再取得
      queryClient.invalidateQueries({
        queryKey: [CACHED_QUERIES.downloadedSongs],
      });
      queryClient.invalidateQueries({ queryKey: ["storageSize"] });
      // 各曲の個別ダウンロードステータスも無効化（プレフィックスマッチ）
      queryClient.invalidateQueries({
        queryKey: [CACHED_QUERIES.downloadStatus],
      });
    } catch (error) {
      console.error("Failed to delete downloads:", error);
      throw error;
    }
  }, [queryClient]);

  // 元のメソッド名も互換性のために残すが、Alertは削除する
  const clearAllDownloads = deleteAllDownloads;

  // QueryClientキャッシュをクリア
  const clearQueryCache = useCallback(() => {
    queryClient.clear();
  }, [queryClient]);

  // ストレージ情報を更新
  const refreshStorageInfo = useCallback(() => {
    refetchSize();
    refetchSongs();
  }, [refetchSize, refetchSongs]);

  // エラーメッセージを統合
  const error = useMemo(() => {
    if (sizeError) {
      return sizeError instanceof Error ? sizeError.message : String(sizeError);
    }
    if (songsError) {
      return songsError instanceof Error
        ? songsError.message
        : String(songsError);
    }
    return null;
  }, [sizeError, songsError]);

  return {
    downloadedSize: sizeData ?? 0,
    downloadedCount: songsData?.length ?? 0,
    isLoading: isSizeLoading || isSongsLoading,
    error,
    clearAllDownloads,
    deleteAllDownloads,
    clearQueryCache,
    refreshStorageInfo,
  };
}
