import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { db } from "@/lib/db/client";
import { sectionCache } from "@/lib/db/schema";
import { CACHED_QUERIES } from "@/constants";

/**
 * おすすめ曲のIDリストをSupabaseから取得し、sectionCacheに保存する同期フック
 */
export function useSyncRecommendations(userId?: string) {
  const queryClient = useQueryClient();
  const cacheKey = userId
    ? `home_recommendations_${userId}`
    : "home_recommendations";

  const { data, isFetching, error, refetch } = useQuery({
    queryKey: [CACHED_QUERIES.getRecommendations, userId, "sync"],
    queryFn: async () => {
      if (!userId) {
        return { synced: 0 };
      }

      // Supabase RPC でおすすめを取得
      const { data: recData, error } = await supabase.rpc(
        "get_recommendations",
        {
          p_user_id: userId,
          p_limit: 10,
        },
      );

      if (error) {
        throw new Error(error.message);
      }

      if (!recData || recData.length === 0) {
        return { synced: 0 };
      }

      const songIds = recData.map((s: { id: string }) => s.id);

      // sectionCache に保存
      await db
        .insert(sectionCache)
        .values({
          key: cacheKey,
          itemIds: songIds,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: sectionCache.key,
          set: {
            itemIds: songIds,
            updatedAt: new Date(),
          },
        });

      return { synced: songIds.length };
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    enabled: false,
  });

  useEffect(() => {
    if (data && data.synced > 0) {
      queryClient.invalidateQueries({
        queryKey: [CACHED_QUERIES.getRecommendations, userId, "local"],
      });
    }
  }, [data, queryClient, userId]);

  return {
    syncedCount: data?.synced ?? 0,
    isSyncing: isFetching,
    syncError: error,
    triggerSync: refetch,
  };
}

export default useSyncRecommendations;
