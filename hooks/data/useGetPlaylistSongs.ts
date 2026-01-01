import { useQuery } from "@tanstack/react-query";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { playlistSongs, songs } from "@/lib/db/schema";
import { CACHE_CONFIG, CACHED_QUERIES } from "@/constants";
import Song from "@/types";

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

      // Song 型に変換
      return result.map((row) => ({
        id: row.song.id,
        user_id: row.song.userId,
        title: row.song.title,
        author: row.song.author,
        song_path: row.song.originalSongPath ?? row.song.songPath ?? "",
        image_path: row.song.originalImagePath ?? row.song.imagePath ?? "",
        genre: row.song.genre ?? undefined,
        lyrics: row.song.lyrics ?? undefined,
        count: String(row.song.playCount ?? 0),
        like_count: String(row.song.likeCount ?? 0),
        created_at: row.song.createdAt ?? "",
        local_song_path: row.song.songPath ?? undefined,
        local_image_path: row.song.imagePath ?? undefined,
      }));
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
