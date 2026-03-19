import { useQuery } from "@tanstack/react-query";
import { db } from "@/lib/db/client";
import { songs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { CACHED_QUERIES } from "@/constants";
import { mapSongRowToSong } from "@/lib/utils/songMapper";
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

      return mapSongRowToSong(result[0]);
    },
    enabled: !!songId,
    staleTime: Infinity, // ローカルDBなので常に新鮮とみなす
  });
}
