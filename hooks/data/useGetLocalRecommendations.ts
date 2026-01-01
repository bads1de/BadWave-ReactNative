import { useQuery } from "@tanstack/react-query";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { songs, sectionCache } from "@/lib/db/schema";
import { CACHE_CONFIG, CACHED_QUERIES } from "@/constants";
import Song from "@/types";

/**
 * おすすめ曲をローカルSQLiteから取得するフック（Local-First）
 */
export function useGetLocalRecommendations(userId?: string) {
  const cacheKey = userId
    ? `home_recommendations_${userId}`
    : "home_recommendations";

  return useQuery({
    queryKey: [CACHED_QUERIES.getRecommendations, userId, "local"],
    queryFn: async (): Promise<Song[]> => {
      if (!userId) {
        return [];
      }

      // 1. sectionCache から曲IDリストを取得
      const cacheResult = await db
        .select()
        .from(sectionCache)
        .where(eq(sectionCache.key, cacheKey))
        .limit(1);

      if (cacheResult.length === 0 || !cacheResult[0].itemIds) {
        return [];
      }

      const songIds = cacheResult[0].itemIds as string[];
      if (songIds.length === 0) {
        return [];
      }

      // 2. songs テーブルから実データを取得
      const result = await db
        .select()
        .from(songs)
        .where(inArray(songs.id, songIds));

      return result.map((row) => ({
        id: row.id,
        user_id: row.userId,
        title: row.title,
        author: row.author,
        song_path: row.originalSongPath ?? row.songPath ?? "",
        image_path: row.originalImagePath ?? row.imagePath ?? "",
        genre: row.genre ?? undefined,
        count: String(row.playCount ?? 0),
        like_count: String(row.likeCount ?? 0),
        created_at: row.createdAt ?? "",
      }));
    },
    staleTime: CACHE_CONFIG.staleTime,
    gcTime: CACHE_CONFIG.gcTime,
    enabled: !!userId,
    networkMode: "always",
  });
}

export default useGetLocalRecommendations;
