import { useQuery } from "@tanstack/react-query";
import { eq, inArray, desc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { songs, sectionCache } from "@/lib/db/schema";
import { CACHE_CONFIG, CACHED_QUERIES } from "@/constants";
import Song from "@/types";

/**
 * トレンド曲をローカルSQLiteから取得するフック（Local-First）
 * sectionCache テーブルからIDリストを取得し、songs テーブルから実データを取得
 */
export function useGetLocalTrendSongs(
  period: "all" | "month" | "week" | "day" = "all"
) {
  const cacheKey = `trend_${period}`;

  return useQuery({
    queryKey: [CACHED_QUERIES.trendsSongs, period, "local"],
    queryFn: async (): Promise<Song[]> => {
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
        .where(inArray(songs.id, songIds))
        .orderBy(desc(songs.playCount));

      // Song 型に変換
      return result.map((row) => ({
        id: row.id,
        user_id: row.userId,
        title: row.title,
        author: row.author,
        song_path: row.originalSongPath ?? row.songPath ?? "",
        image_path: row.originalImagePath ?? row.imagePath ?? "",
        genre: row.genre ?? undefined,
        lyrics: row.lyrics ?? undefined,
        count: String(row.playCount ?? 0),
        like_count: String(row.likeCount ?? 0),
        created_at: row.createdAt ?? "",
        local_song_path: row.songPath ?? undefined,
        local_image_path: row.imagePath ?? undefined,
        local_video_path: row.videoPath ?? undefined,
        video_path: row.originalVideoPath ?? row.videoPath ?? undefined,
      }));
    },
    staleTime: CACHE_CONFIG.staleTime,
    gcTime: CACHE_CONFIG.gcTime,
    networkMode: "always",
  });
}

export default useGetLocalTrendSongs;

