import { useQuery } from "@tanstack/react-query";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { likedSongs, songs } from "@/lib/db/schema";
import { CACHE_CONFIG, CACHED_QUERIES } from "@/constants";
import Song from "@/types";
import { mapSongRowToSong } from "@/lib/utils/songMapper";

/**
 * ユーザーがいいねした曲を取得するカスタムフック（ローカルファースト）
 * SQLite から直接取得し、オフラインでも動作
 *
 * @param userId ユーザーID
 */
export function useGetLikedSongs(userId?: string) {
  const {
    data: likedSongsList = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [CACHED_QUERIES.likedSongs, userId],
    queryFn: async (): Promise<Song[]> => {
      if (!userId) {
        return [];
      }

      // SQLite から直接取得（ローカルファースト）
      // liked_songs と songs を JOIN して取得
      const result = await db
        .select({
          likedAt: likedSongs.likedAt,
          song: songs,
        })
        .from(likedSongs)
        .innerJoin(songs, eq(likedSongs.songId, songs.id))
        .where(eq(likedSongs.userId, userId));

      return result.map((row) =>
        mapSongRowToSong(row.song, { preferOriginalPaths: true }),
      );
    },
    staleTime: CACHE_CONFIG.staleTime,
    gcTime: CACHE_CONFIG.gcTime,
    enabled: !!userId,
    networkMode: "always", // オフライン時も queryFn を実行
  });

  return {
    likedSongs: likedSongsList,
    isLoading,
    error,
    refetch,
  };
}

export default useGetLikedSongs;

