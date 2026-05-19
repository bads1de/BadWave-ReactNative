import { useQuery } from "@tanstack/react-query";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { playlists } from "@/lib/db/schema";
import { CACHE_CONFIG, CACHED_QUERIES } from "@/constants";
import { Playlist } from "@/types";
import { mapPlaylistRowToPlaylist } from "@/lib/db/playlistMapper";

/**
 * ユーザーのプレイリスト一覧を取得するカスタムフック（ローカルファースト）
 * SQLite から直接取得し、オフラインでも動作
 *
 * @param userId ユーザーID
 */
export function useGetPlaylists(userId?: string) {
  const {
    data: playlistList = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [CACHED_QUERIES.playlists, "user", userId],
    queryFn: async (): Promise<Playlist[]> => {
      if (!userId) {
        return [];
      }

      // SQLite から直接取得（ローカルファースト）
      const result = await db
        .select()
        .from(playlists)
        .where(eq(playlists.userId, userId));

      return result.map(mapPlaylistRowToPlaylist);
    },
    staleTime: CACHE_CONFIG.staleTime,
    gcTime: CACHE_CONFIG.gcTime,
    enabled: !!userId,
    networkMode: "always",
  });

  return {
    playlists: playlistList,
    isLoading,
    error,
    refetch,
  };
}

export default useGetPlaylists;

