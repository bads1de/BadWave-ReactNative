import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { db } from "@/lib/db/client";
import { sectionCache } from "@/lib/db/schema";
import { CACHED_QUERIES } from "@/constants";
import { subMonths, subWeeks, subDays } from "date-fns";

/**
 * トレンド曲のIDリストをSupabaseから取得し、sectionCacheに保存する同期フック
 */
export function useSyncTrendSongs(
  period: "all" | "month" | "week" | "day" = "all",
) {
  const queryClient = useQueryClient();
  const cacheKey = `trend_${period}`;

  const { data, isFetching, error, refetch } = useQuery({
    queryKey: [CACHED_QUERIES.trendsSongs, period, "sync"],
    queryFn: async () => {
      // Supabase からトレンド曲を取得
      let query = supabase.from("songs").select("id");

      switch (period) {
        case "month":
          query = query.gte(
            "created_at",
            subMonths(new Date(), 1).toISOString(),
          );
          break;
        case "week":
          query = query.gte(
            "created_at",
            subWeeks(new Date(), 1).toISOString(),
          );
          break;
        case "day":
          query = query.gte("created_at", subDays(new Date(), 1).toISOString());
          break;
      }

      const { data: trendData, error } = await query
        .order("count", { ascending: false })
        .limit(10);

      if (error) {
        throw new Error(error.message);
      }

      if (!trendData || trendData.length === 0) {
        return { synced: 0 };
      }

      const songIds = trendData.map((s) => s.id);

      // sectionCache に保存（Upsert）
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

  // 同期完了後、ローカルクエリを無効化
  useEffect(() => {
    if (data && data.synced > 0) {
      queryClient.invalidateQueries({
        queryKey: [CACHED_QUERIES.trendsSongs, period, "local"],
      });
    }
  }, [data, queryClient, period]);

  return {
    syncedCount: data?.synced ?? 0,
    isSyncing: isFetching,
    syncError: error,
    triggerSync: refetch,
  };
}

export default useSyncTrendSongs;
