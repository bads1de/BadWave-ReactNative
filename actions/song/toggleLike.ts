import { and, eq } from "drizzle-orm";
import { supabase } from "@/lib/supabase";
import { db } from "@/lib/db/client";
import { likedSongs, songs } from "@/lib/db/schema";
import { SUPABASE_TABLES } from "@/constants";
import { withSupabaseRetry } from "@/lib/utils/retry";
import { getErrorMessage } from "@/lib/utils/error";
import { LIKE_ERRORS } from "@/constants/errorMessages";

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
 * 曲のいいねの追加/解除を Supabase と SQLite の両方に反映する
 *
 * @param {string} songId 曲のID
 * @param {string} userId ユーザーID
 * @param {boolean} isCurrentlyLiked 現在いいねしているか（trueなら解除、falseなら追加）
 * @returns {Promise<boolean>} 操作後のいいね状態
 * @throws {Error} Supabaseの操作に失敗した場合
 */
const toggleLike = async (
  songId: string,
  userId: string,
  isCurrentlyLiked: boolean
): Promise<boolean> => {
  if (isCurrentlyLiked) {
    // いいねを解除
    // 1. Supabase から削除（先に実行、リトライ付き）
    const result = await withSupabaseRetry(async () => {
      return await supabase
        .from(SUPABASE_TABLES.likedSongsRegular)
        .delete()
        .eq("user_id", userId)
        .eq("song_id", songId);
    });

    if (result.error) {
      throw new Error(
        `${LIKE_ERRORS.SUPABASE_DELETE_FAILED}: ${getErrorMessage(result.error)}`
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
      return await supabase.from(SUPABASE_TABLES.likedSongsRegular).insert({
        user_id: userId,
        song_id: songId,
      });
    });

    if (result.error) {
      throw new Error(
        `${LIKE_ERRORS.SUPABASE_INSERT_FAILED}: ${getErrorMessage(result.error)}`
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
};

export default toggleLike;
