import { supabase } from "@/lib/supabase";
import { CACHED_QUERIES } from "@/constants";
import { useSyncBase } from "./useSyncBase";
import { upsertSectionCache } from "@/lib/db/sectionCacheUtils";

/**
 * おすすめ曲のIDリストをSupabaseから取得し、sectionCacheに保存する同期フック
 */
export function useSyncRecommendations(userId?: string) {
  const cacheKey = userId
    ? `home_recommendations_${userId}`
    : "home_recommendations";

  return useSyncBase({
    queryKey: [CACHED_QUERIES.getRecommendations, userId, "sync"],
    queryFn: async () => {
      if (!userId) {
        return { synced: 0 };
      }

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
      await upsertSectionCache(cacheKey, songIds);

      return { synced: songIds.length };
    },
    invalidateQueryKey: [CACHED_QUERIES.getRecommendations, userId, "local"],
  });
}

export default useSyncRecommendations;
