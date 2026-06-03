import { supabase } from "@/lib/supabase";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { playlistSongs } from "@/lib/db/schema";
import { getErrorMessage } from "@/lib/utils/error";

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
  const { error } = await supabase
    .from("playlist_songs")
    .delete()
    .eq("playlist_id", playlistId)
    .eq("user_id", userId)
    .eq("song_id", songId)
    .eq("song_type", songType);

  if (error) {
    console.error(getErrorMessage(error));
    throw new Error(getErrorMessage(error));
  }

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
