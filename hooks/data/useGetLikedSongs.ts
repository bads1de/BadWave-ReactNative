import { useQuery } from "@tanstack/react-query";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { likedSongs, songs } from "@/lib/db/schema";
import { CACHE_CONFIG, CACHED_QUERIES } from "@/constants";
import Song from "@/types";

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
        local_video_path: row.song.videoPath ?? undefined,
        video_path:
          row.song.originalVideoPath ?? row.song.videoPath ?? undefined,
      }));
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

