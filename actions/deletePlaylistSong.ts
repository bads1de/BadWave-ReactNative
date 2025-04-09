import { supabase } from "@/lib/supabase";

/**
 * プレイリストから曲を削除する
 *
 * @param {string} playlistId プレイリストID
 * @param {string} songId 曲ID
 * @param {string} songType 曲の種類
 * @returns {Promise<void>} 処理が成功した場合は何も返さない
 * @throws {Error} データベースクエリに失敗した場合
 *
 * @example
 * ```typescript
 * await deletePlaylistSong('playlist-id-123', 'song-id-456');
 * ```
 */
const deletePlaylistSong = async (
  playlistId: string,
  songId: string,
  songType: string = "regular"
): Promise<void> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user.id) {
    throw new Error("User not authenticated");
  }

  const { error } = await supabase
    .from("playlist_songs")
    .delete()
    .eq("playlist_id", playlistId)
    .eq("user_id", session.user.id)
    .eq("song_id", songId)
    .eq("song_type", songType);

  if (error) {
    console.error(error.message);
    throw new Error(error.message);
  }
};

export default deletePlaylistSong;
