import { supabase } from "@/lib/supabase";
import { SUPABASE_TABLES } from "@/constants";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { playlists, playlistSongs } from "@/lib/db/schema";
import { runQuery } from "@/lib/utils/supabaseQuery";
import { AUTH_ERRORS, PLAYLIST_ERRORS } from "@/constants/errorMessages";

/**
 * プレイリストを削除する
 *
 * @param {string} playlistId プレイリストID
 * @param {string} userId ユーザーID
 * @returns {Promise<void>} 処理が成功した場合は何も返さない
 * @throws {Error} データベースクエリに失敗した場合
 *
 * @example
 * ```typescript
 * await deletePlaylist('playlist-id-123', 'user-id-456');
 * ```
 */
const deletePlaylist = async (
  playlistId: string,
  userId: string
): Promise<void> => {
  if (!userId) {
    throw new Error(AUTH_ERRORS.USER_ID_REQUIRED);
  }

  // 所有権チェック: 自分のプレイリストでなければローカルも含め何も消さない。
  // Supabaseのdeleteは対象0件でも成功扱いのため、明示チェックが必要。
  // 注意: 改変ビルドからの直叩きは防げないため、RLS (auth.uid() = user_id) も必須。
  await runQuery(
    async () =>
      supabase
        .from(SUPABASE_TABLES.playlists)
        .select("id")
        .eq("id", playlistId)
        .eq("user_id", userId)
        .single(),
    { purpose: "read", errorPrefix: PLAYLIST_ERRORS.FORBIDDEN }
  );

  // playlist_songs からデータを削除
  await runQuery(async () =>
    supabase
      .from(SUPABASE_TABLES.playlistSongs)
      .delete()
      .eq("playlist_id", playlistId)
      .eq("user_id", userId),
  );

  // playlists からデータを削除
  await runQuery(async () =>
    supabase
      .from(SUPABASE_TABLES.playlists)
      .delete()
      .eq("id", playlistId)
      .eq("user_id", userId),
  );

  await db.delete(playlistSongs).where(eq(playlistSongs.playlistId, playlistId));
  // 所有権検証済みのためローカルも削除する。playlists側はuserIdでも絞る。
  await db
    .delete(playlists)
    .where(and(eq(playlists.id, playlistId), eq(playlists.userId, userId)));
};

export default deletePlaylist;
