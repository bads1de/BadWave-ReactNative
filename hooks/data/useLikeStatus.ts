import { useQuery } from "@tanstack/react-query";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { likedSongs } from "@/lib/db/schema";
import { CACHE_CONFIG, CACHED_QUERIES } from "@/constants";

/**
 * 曲のいいね状態を取得するカスタムフック（ローカルファースト）
 * SQLite から直接取得し、ゼロレイテンシを実現
 *
 * @param songId 曲のID
 * @param userId ユーザーID
 * @returns いいね状態とローディング状態
 */
export function useLikeStatus(songId: string, userId?: string) {
  const {
    data: isLiked = false,
    isLoading,
    error,
  } = useQuery({
    queryKey: [CACHED_QUERIES.likedSongs, "status", songId, userId],
    queryFn: async () => {
      if (!userId) {
        return false;
      }

      // SQLite から直接取得（ローカルファースト）
      const result = await db
        .select()
        .from(likedSongs)
        .where(
          and(eq(likedSongs.userId, userId), eq(likedSongs.songId, songId))
        )
        .limit(1);

      return result.length > 0;
    },
    staleTime: CACHE_CONFIG.staleTime,
    gcTime: CACHE_CONFIG.gcTime,
    enabled: !!userId && !!songId,
  });

  return {
    isLiked,
    isLoading,
    error,
  };
}

export default useLikeStatus;

