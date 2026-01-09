import { useMutation, useQueryClient } from "@tanstack/react-query";
import { eq, and } from "drizzle-orm";
import { supabase } from "@/lib/supabase";
import { db } from "@/lib/db/client";
import { likedSongs, songs } from "@/lib/db/schema";
import { CACHED_QUERIES } from "@/constants";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { withSupabaseRetry } from "@/lib/utils/retry";
import { AUTH_ERRORS, LIKE_ERRORS } from "@/constants/errorMessages";

/**
 * いいねカウント更新のヘルパー関数（RPC版）
 * RPCでSupabaseを更新し、ローカルDBも同期
 */
async function updateLikeCount(songId: string, increment: number) {
  // SupabaseのRPCでアトミックに更新（リトライ付き）
  const { error } = await withSupabaseRetry(async () => {
    return await supabase.rpc("increment_like_count", {
      song_id: songId,
      increment_value: increment,
    });
  });

  if (error) {
    console.warn("[Like] like_count RPC update failed:", error);
  }

  // ローカルDBも更新（現在のカウントを取得して増減）
  const localSong = await db.query.songs.findFirst({
    where: eq(songs.id, songId),
    columns: { likeCount: true },
  });

  const currentCount = localSong?.likeCount ?? 0;
  const newLikeCount = Math.max(0, currentCount + increment);

  await db
    .update(songs)
    .set({ likeCount: newLikeCount })
    .where(eq(songs.id, songId));
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
        throw new Error(AUTH_ERRORS.USER_ID_REQUIRED);
      }

      if (!isOnline) {
        throw new Error(LIKE_ERRORS.OFFLINE);
      }

      if (isCurrentlyLiked) {
        // いいねを解除
        // 1. Supabase から削除（先に実行、リトライ付き）
        const result = await withSupabaseRetry(async () => {
          return await supabase
            .from("liked_songs_regular")
            .delete()
            .eq("user_id", userId)
            .eq("song_id", songId);
        });

        if (result.error) {
          throw new Error(
            `${LIKE_ERRORS.SUPABASE_DELETE_FAILED}: ${result.error.message}`
          );
        }

        // 2. like_count を更新
        await updateLikeCount(songId, -1);

        // 3. ローカルDBから削除（Supabase成功後）
        await db
          .delete(likedSongs)
          .where(
            and(eq(likedSongs.userId, userId), eq(likedSongs.songId, songId))
          );
      } else {
        // いいねを追加
        // 1. Supabase に追加（先に実行、リトライ付き）
        const result = await withSupabaseRetry(async () => {
          return await supabase.from("liked_songs_regular").insert({
            user_id: userId,
            song_id: songId,
          });
        });

        if (result.error) {
          throw new Error(
            `${LIKE_ERRORS.SUPABASE_INSERT_FAILED}: ${result.error.message}`
          );
        }

        // 2. like_count を更新
        await updateLikeCount(songId, 1);

        // 3. ローカルDBに追加（Supabase成功後）
        await db.insert(likedSongs).values({
          userId,
          songId,
          likedAt: new Date().toISOString(),
        });
      }

      return !isCurrentlyLiked;
    },
    // 楽観的更新: mutate呼び出し時に即座にキャッシュを更新
    onMutate: async (isCurrentlyLiked: boolean) => {
      // 1. 既存のクエリをキャンセル（競合防止）
      await queryClient.cancelQueries({
        queryKey: [CACHED_QUERIES.likedSongs, "status", songId, userId],
      });

      // 2. 現在のキャッシュをスナップショット（ロールバック用）
      const previousLikeStatus = queryClient.getQueryData<boolean>([
        CACHED_QUERIES.likedSongs,
        "status",
        songId,
        userId,
      ]);

      // 3. 楽観的にキャッシュを更新（即座にUIに反映）
      queryClient.setQueryData(
        [CACHED_QUERIES.likedSongs, "status", songId, userId],
        !isCurrentlyLiked
      );

      // 4. ロールバック用のコンテキストを返す
      return { previousLikeStatus };
    },
    onSuccess: async () => {
      // いいね曲リストのみ無効化（最小限の無効化で高速化）
      await queryClient.invalidateQueries({
        queryKey: [CACHED_QUERIES.likedSongs],
      });
    },
    onError: (error, _variables, context) => {
      // エラー時はキャッシュを元に戻す（ロールバック）
      if (context?.previousLikeStatus !== undefined) {
        queryClient.setQueryData(
          [CACHED_QUERIES.likedSongs, "status", songId, userId],
          context.previousLikeStatus
        );
      }
      console.error("Like mutation error:", error);
    },
  });
}

export default useLikeMutation;
