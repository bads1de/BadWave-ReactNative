import { supabase } from "@/lib/supabase";
import { CACHED_QUERIES, SUPABASE_TABLES } from "@/constants";
import { useSyncBase } from "./useSyncBase";
import { upsertSectionCache } from "@/lib/db/sectionCacheUtils";
import { getTrendDateFilter } from "@/lib/utils/trendFilter";
import { runQuery } from "@/lib/utils/supabaseQuery";

/**
 * トレンド曲のIDリストをSupabaseから取得し、sectionCacheに保存する同期フック
 */
export function useSyncTrendSongs(
  period: "all" | "month" | "week" | "day" = "all",
) {
  const cacheKey = `trend_${period}`;

  return useSyncBase({
    queryKey: [CACHED_QUERIES.trendsSongs, period, "sync"],
    queryFn: async () => {
      let query = supabase.from(SUPABASE_TABLES.songs).select("id");

      const dateFilter = getTrendDateFilter(period);
      if (dateFilter) {
        query = query.gte("created_at", dateFilter);
      }

      const trendData = await runQuery(
        async () => query.order("count", { ascending: false }).limit(10),
        { purpose: "read" },
      );

      if (!trendData || trendData.length === 0) {
        return { synced: 0 };
      }

      const songIds = trendData.map((s) => s.id);
      await upsertSectionCache(cacheKey, songIds);

      return { synced: songIds.length };
    },
    invalidateQueryKey: [CACHED_QUERIES.trendsSongs, period, "local"],
  });
}

export default useSyncTrendSongs;
