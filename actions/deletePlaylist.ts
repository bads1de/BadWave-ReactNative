import { supabase } from "@/lib/supabase";

/**
 * 指定されたプレイリストを削除する
 * @param {string} playlistId プレイリストID
 * @param {string} userId ユーザーID
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
};

export default deletePlaylist;
