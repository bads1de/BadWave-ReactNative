import { useMutation, useQueryClient } from "@tanstack/react-query";
import { eq, and } from "drizzle-orm";
import { supabase } from "@/lib/supabase";
import { db } from "@/lib/db/client";
import { likedSongs, songs } from "@/lib/db/schema";
import { CACHED_QUERIES } from "@/constants";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

/**
 * いいねカウント更新のヘルパー関数（Supabase用）
 */
async function updateLikeCount(songId: string, increment: number) {
  try {
    const { data, error: fetchError } = await supabase
      .from("songs")
      .select("like_count")
      .eq("id", songId)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    const currentCount = parseInt(String(data?.like_count ?? 0), 10) || 0;
    const newLikeCount = Math.max(0, currentCount + increment);

    await supabase
      .from("songs")
      .update({ like_count: newLikeCount })
      .eq("id", songId);

    // ローカルDBも更新
    await db
      .update(songs)
      .set({ likeCount: newLikeCount })
      .where(eq(songs.id, songId));
  } catch (error) {
    console.error("Error updating like count:", error);
  }
}

/**
 * 曲のいいね操作を行うカスタムフック
 * オンライン時のみ操作可能。Supabase と SQLite の両方に書き込む。
 *
 * @param songId 曲のID
 * @param userId ユーザーID
 */
export function useLikeMutation(songId: string, userId?: string) {
  const queryClient = useQueryClient();
  const { isOnline } = useNetworkStatus();

  return useMutation({
    mutationFn: async (isCurrentlyLiked: boolean) => {
      if (!userId) {
        throw new Error("ユーザーIDが必要です");
      }

      if (!isOnline) {
        throw new Error("オフライン時はいいね操作ができません");
      }

      if (isCurrentlyLiked) {
        // いいねを解除
        // 1. SQLite から削除
        await db
          .delete(likedSongs)
          .where(
            and(eq(likedSongs.userId, userId), eq(likedSongs.songId, songId))
          );

        // 2. Supabase から削除
        const { error } = await supabase
          .from("liked_songs_regular")
          .delete()
          .eq("user_id", userId)
          .eq("song_id", songId);

        if (error) {
          console.warn("[Like] Supabase delete failed:", error);
        } else {
          await updateLikeCount(songId, -1);
        }
      } else {
        // いいねを追加
        // 1. SQLite に追加
        await db.insert(likedSongs).values({
          userId,
          songId,
          likedAt: new Date().toISOString(),
        });

        // 2. Supabase に追加
        const { error } = await supabase.from("liked_songs_regular").insert({
          user_id: userId,
          song_id: songId,
        });

        if (error) {
          console.warn("[Like] Supabase insert failed:", error);
        } else {
          await updateLikeCount(songId, 1);
        }
      }

      return !isCurrentlyLiked;
    },
    onSuccess: (newLikeStatus) => {
      // キャッシュを更新
      queryClient.setQueryData(
        [CACHED_QUERIES.likedSongs, "status", songId, userId],
        newLikeStatus
      );

      // 関連クエリを無効化
      queryClient.invalidateQueries({ queryKey: [CACHED_QUERIES.likedSongs] });
      queryClient.invalidateQueries({ queryKey: [CACHED_QUERIES.trendsSongs] });
    },
    onError: (error) => {
      console.error("Like mutation error:", error);
    },
  });
}

export default useLikeMutation;
