import { useQuery } from "@tanstack/react-query";
import { db } from "@/lib/db/client";
import { songs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { CACHED_QUERIES } from "@/constants";
import Song from "@/types";

/**
 * ローカル SQLite から特定の楽曲を取得するフック
 * @param songId 取得する楽曲ID
 */
export function useGetLocalSongById(songId?: string) {
  return useQuery({
    queryKey: [CACHED_QUERIES.song, "local", songId],
    queryFn: async (): Promise<Song | null> => {
      if (!songId) return null;

      const result = await db
        .select()
        .from(songs)
        .where(eq(songs.id, songId))
        .limit(1);

      if (result.length === 0) return null;

      const row = result[0];
      return {
        id: row.id,
        user_id: row.userId,
        title: row.title,
        author: row.author,
        song_path: row.originalSongPath ?? row.songPath ?? "",
        image_path: row.originalImagePath ?? row.imagePath ?? "",
        // duration: row.duration ?? undefined,
        genre: row.genre ?? undefined,
        lyrics: row.lyrics ?? undefined,
        count: String(row.playCount ?? 0),
        like_count: String(row.likeCount ?? 0),
        created_at: row.createdAt ?? "",
        local_song_path: row.songPath ?? undefined,
        local_image_path: row.imagePath ?? undefined,
      };
    },
    enabled: !!songId,
    staleTime: Infinity, // ローカルDBなので常に新鮮とみなす
  });
}
