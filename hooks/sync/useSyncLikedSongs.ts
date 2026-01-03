import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { eq, and, notInArray } from "drizzle-orm";
import { supabase } from "@/lib/supabase";
import { db } from "@/lib/db/client";
import { likedSongs } from "@/lib/db/schema";
import { CACHED_QUERIES } from "@/constants";

/**
 * Supabase からいいねデータを取得し、ローカル SQLite に同期するフック
 *
 * 安全な同期ロジック:
 * 1. トランザクション内でUpsert（挿入または更新）
 * 2. リモートにないデータを削除
 * 3. 失敗時は自動ロールバック
 *
 * @param userId ユーザーID
 */
export function useSyncLikedSongs(userId?: string) {
  const queryClient = useQueryClient();

  const { data, isFetching, error, refetch } = useQuery({
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
        // リモートが空の場合、ローカルも空にする（トランザクション内で）
        await db.transaction(async (tx) => {
          await tx.delete(likedSongs).where(eq(likedSongs.userId, userId));
        });
        return { synced: 0 };
      }

      // トランザクション内で安全に同期
      await db.transaction(async (tx) => {
        // 1. リモートデータをUpsert（挿入または更新）
        for (const like of remoteLikes) {
          await tx
            .insert(likedSongs)
            .values({
              userId,
              songId: like.song_id,
              likedAt: like.created_at ?? new Date().toISOString(),
            })
            .onConflictDoUpdate({
              target: [likedSongs.userId, likedSongs.songId],
              set: {
                likedAt: like.created_at ?? new Date().toISOString(),
              },
            });
        }

        // 2. リモートにないデータを削除（Upsert完了後）
        const remoteSongIds = remoteLikes.map((like) => like.song_id);
        await tx
          .delete(likedSongs)
          .where(
            and(
              eq(likedSongs.userId, userId),
              notInArray(likedSongs.songId, remoteSongIds)
            )
          );
      });

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
    isSyncing: isFetching,
    syncError: error,
    triggerSync: refetch,
  };
}

export default useSyncLikedSongs;
