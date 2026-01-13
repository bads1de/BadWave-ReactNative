import { useQuery } from "@tanstack/react-query";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { playlists } from "@/lib/db/schema";
import { CACHE_CONFIG, CACHED_QUERIES } from "@/constants";
import { Playlist } from "@/types";

/**
 * 特定のプレイリスト情報を取得するカスタムフック（ローカルファースト）
 * SQLite から直接取得し、オフラインでも動作
 *
 * @param playlistId プレイリストID
 */
export function useGetLocalPlaylist(playlistId?: string) {
  const {
    data: playlist,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [CACHED_QUERIES.playlistById, playlistId],
    queryFn: async (): Promise<Playlist | null> => {
      if (!playlistId) {
        return null;
      }

      // SQLite から直接取得（ローカルファースト）
      const result = await db
        .select()
        .from(playlists)
        .where(eq(playlists.id, playlistId))
        .limit(1);

      if (result.length === 0) {
        return null;
      }

      const row = result[0];

      // Playlist 型に変換
      return {
        id: row.id,
        user_id: row.userId,
        title: row.title,
        image_path: row.imagePath ?? undefined,
        is_public: row.isPublic ?? false,
        created_at: row.createdAt ?? "",
      };
    },
    staleTime: CACHE_CONFIG.staleTime,
    gcTime: CACHE_CONFIG.gcTime,
    enabled: !!playlistId,
    networkMode: "always",
  });

  return {
    playlist,
    isLoading,
    error,
    refetch,
  };
}

export default useGetLocalPlaylist;

