import { useEffect, useRef } from "react";
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

  // 呼び出し側は配列リテラル (毎レンダー新しい参照) を渡すため、
  // effect の依存配列に直接入れると再レンダー毎に無駄な invalidate が走る。
  // ref 経由で最新のキーを保持し、effect は data 変化時のみ実行する。
  const invalidateKeyRef = useRef(invalidateQueryKey);
  useEffect(() => {
    invalidateKeyRef.current = invalidateQueryKey;
  }, [invalidateQueryKey]);

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
        queryKey: invalidateKeyRef.current,
      });
    }
  }, [data, queryClient]);

  return {
    syncedCount: data?.synced ?? 0,
    isSyncing: isFetching,
    syncError: error,
    triggerSync: refetch,
  };
}
