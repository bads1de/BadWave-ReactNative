import { supabase } from "@/lib/supabase";
import { SUPABASE_TABLES } from "@/constants";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { playlistSongs } from "@/lib/db/schema";
import { withSupabaseRetry } from "@/lib/utils/retry";
import { getErrorMessage } from "@/lib/utils/error";
import { PLAYLIST_ERRORS } from "@/constants/errorMessages";

/**
 * プレイリストから曲を削除する
 *
 * @param {string} playlistId プレイリストID
 * @param {string} songId 曲ID
 * @param {string} userId ユーザーID
 * @param {string} songType 曲の種類
 * @returns {Promise<void>} 処理が成功した場合は何も返さない
 * @throws {Error} データベースクエリに失敗した場合
 */
const deletePlaylistSong = async (
  playlistId: string,
  songId: string,
  userId: string,
  songType: string = "regular"
): Promise<void> => {
  // 1. Supabase から削除（先に実行、リトライ付き）
  const result = await withSupabaseRetry(async () => {
    return await supabase
      .from(SUPABASE_TABLES.playlistSongs)
      .delete()
      .eq("playlist_id", playlistId)
      .eq("user_id", userId)
      .eq("song_id", songId)
      .eq("song_type", songType);
  });

  if (result.error) {
    console.error(getErrorMessage(result.error));
    throw new Error(
      `${PLAYLIST_ERRORS.SUPABASE_DELETE_FAILED}: ${getErrorMessage(result.error)}`
    );
  }

  // 2. ローカルDBから削除（Supabase成功後）
  await db
    .delete(playlistSongs)
    .where(
      and(
        eq(playlistSongs.playlistId, playlistId),
        eq(playlistSongs.songId, songId)
      )
    );
};

export default deletePlaylistSong;
