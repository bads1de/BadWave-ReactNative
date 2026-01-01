import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { eq } from "drizzle-orm";
import { supabase } from "@/lib/supabase";
import { db } from "@/lib/db/client";
import { likedSongs } from "@/lib/db/schema";
import { CACHED_QUERIES } from "@/constants";

/**
 * Supabase からいいねデータを取得し、ローカル SQLite に同期するフック
 *
 * @param userId ユーザーID
 */
export function useSyncLikedSongs(userId?: string) {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [CACHED_QUERIES.likedSongs, "sync", userId],
    queryFn: async () => {
      if (!userId) {
        return { synced: 0 };
      }

      // Supabase からいいねデータを取得
      const { data: remoteLikes, error } = await supabase
        .from("liked_songs_regular")
        .select("song_id, created_at")
        .eq("user_id", userId);

      if (error) {
        throw new Error(error.message);
      }

      if (!remoteLikes || remoteLikes.length === 0) {
        return { synced: 0 };
      }

      // 現在のローカルいいねを削除（完全同期）
      await db.delete(likedSongs).where(eq(likedSongs.userId, userId));

      // リモートデータを SQLite に挿入
      for (const like of remoteLikes) {
        await db.insert(likedSongs).values({
          userId,
          songId: like.song_id,
          likedAt: like.created_at ?? new Date().toISOString(),
        });
      }

      return { synced: remoteLikes.length };
    },
    staleTime: 1000 * 60 * 5, // 5分
    refetchOnWindowFocus: false,
    enabled: !!userId,
  });

  // 同期完了後、ローカルクエリを無効化
  useEffect(() => {
    if (data && data.synced > 0) {
      queryClient.invalidateQueries({
        queryKey: [CACHED_QUERIES.likedSongs, userId],
      });
    }
  }, [data, queryClient, userId]);

  return {
    syncedCount: data?.synced ?? 0,
    isSyncing: isLoading,
    syncError: error,
    triggerSync: refetch,
  };
}

export default useSyncLikedSongs;
