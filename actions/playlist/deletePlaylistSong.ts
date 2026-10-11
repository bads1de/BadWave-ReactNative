import { supabase } from "@/lib/supabase";
import { SUPABASE_TABLES } from "@/constants";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { playlistSongs } from "@/lib/db/schema";
import { runQuery } from "@/lib/utils/supabaseQuery";
import { AUTH_ERRORS, PLAYLIST_ERRORS } from "@/constants/errorMessages";

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
  if (!userId) {
    throw new Error(AUTH_ERRORS.USER_ID_REQUIRED);
  }

  // 所有権チェック: 親プレイリストが自分のものでなければ何も消さない。
  // playlist_songs側のdeleteは対象0件でも成功扱いのため明示チェックが必要。
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

  // 1. Supabase から削除（先に実行、リトライ付き）
  await runQuery(
    async () =>
      supabase
        .from(SUPABASE_TABLES.playlistSongs)
        .delete()
        .eq("playlist_id", playlistId)
        .eq("user_id", userId)
        .eq("song_id", songId)
        .eq("song_type", songType),
    { errorPrefix: PLAYLIST_ERRORS.SUPABASE_DELETE_FAILED },
  );

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
