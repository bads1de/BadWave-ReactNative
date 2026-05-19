import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface SyncResult {
  synced: number;
}

interface UseSyncBaseOptions {
  /** 同期用のクエリキー */
  queryKey: readonly unknown[];
  /** 同期処理の関数 */
  queryFn: () => Promise<SyncResult>;
  /** 同期完了後に無効化するクエリキー */
  invalidateQueryKey: readonly unknown[];
  /** クエリを有効にする条件（デフォルト: false） */
  enabled?: boolean;
}

/**
 * 同期Hook共通ベース
 *
 * useSyncSongs, useSyncLikedSongs, useSyncPlaylists, useSyncSpotlights,
 * useSyncTrendSongs, useSyncRecommendations で重複していた
 * useQuery設定、戻り値、無効化エフェクトを共通化。
 */
export function useSyncBase({
  queryKey,
  queryFn,
  invalidateQueryKey,
  enabled = false,
}: UseSyncBaseOptions) {
  const queryClient = useQueryClient();

  const { data, isFetching, error, refetch } = useQuery({
    queryKey,
    queryFn,
    staleTime: 1000 * 60 * 5, // 5分
    refetchOnWindowFocus: false,
    enabled,
  });

  // 同期完了後、ローカルクエリを無効化
  useEffect(() => {
    if (data && data.synced > 0) {
      queryClient.invalidateQueries({
        queryKey: invalidateQueryKey,
      });
    }
  }, [data, queryClient, invalidateQueryKey]);

  return {
    syncedCount: data?.synced ?? 0,
    isSyncing: isFetching,
    syncError: error,
    triggerSync: refetch,
  };
}
