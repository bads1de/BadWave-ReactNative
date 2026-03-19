import { useQuery } from "@tanstack/react-query";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { playlistSongs, songs } from "@/lib/db/schema";
import { CACHE_CONFIG, CACHED_QUERIES } from "@/constants";
import Song from "@/types";
import { mapSongRowToSong } from "@/lib/utils/songMapper";

/**
 * プレイリスト内の曲一覧を取得するカスタムフック（ローカルファースト）
 * SQLite から直接取得し、オフラインでも動作
 *
 * @param playlistId プレイリストID
 */
export function useGetPlaylistSongs(playlistId?: string) {
  const {
    data: songList = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [CACHED_QUERIES.playlistSongs, playlistId],
    queryFn: async (): Promise<Song[]> => {
      if (!playlistId) {
        return [];
      }

      // SQLite から直接取得（ローカルファースト）
      // playlist_songs と songs を JOIN
      const result = await db
        .select({
          addedAt: playlistSongs.addedAt,
          song: songs,
        })
        .from(playlistSongs)
        .innerJoin(songs, eq(playlistSongs.songId, songs.id))
        .where(eq(playlistSongs.playlistId, playlistId));

      return result.map((row) =>
        mapSongRowToSong(row.song, { preferOriginalPaths: true }),
      );
    },
    staleTime: CACHE_CONFIG.staleTime,
    gcTime: CACHE_CONFIG.gcTime,
    enabled: !!playlistId,
    networkMode: "always",
  });

  return {
    songs: songList,
    isLoading,
    error,
    refetch,
  };
}

export default useGetPlaylistSongs;

