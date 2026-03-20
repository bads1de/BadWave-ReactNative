import { supabase } from "@/lib/supabase";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { playlists, playlistSongs } from "@/lib/db/schema";

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
  // playlist_songs からデータを削除
  const { error: playlistSongsError } = await supabase
    .from("playlist_songs")
    .delete()
    .eq("playlist_id", playlistId)
    .eq("user_id", userId);

  if (playlistSongsError) {
    throw new Error(playlistSongsError.message);
  }

  // playlists からデータを削除
  const { error: playlistsError } = await supabase
    .from("playlists")
    .delete()
    .eq("id", playlistId)
    .eq("user_id", userId);

  if (playlistsError) {
    console.error(
      "プレイリストの削除中にエラーが発生しました:",
      playlistsError
    );
    throw new Error(playlistsError.message);
  }

  await db.delete(playlistSongs).where(eq(playlistSongs.playlistId, playlistId));
  await db.delete(playlists).where(eq(playlists.id, playlistId));
};

export default deletePlaylist;
