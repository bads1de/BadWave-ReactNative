import { supabase } from "../lib/supabase";

/**
 * プレイリストの名前を変更する
 * @param {string} playlistId プレイリストID
 * @param {string} newTitle 新しいプレイリスト名
 * @param {string} userId ユーザーID
 * @returns {Promise<void>}
 */
const renamePlaylist = async (
  playlistId: string,
  newTitle: string,
  userId: string
): Promise<void> => {
  if (!newTitle.trim()) {
    throw new Error("プレイリスト名を入力してください");
  }

  const { error } = await supabase
    .from("playlists")
    .update({ title: newTitle.trim() })
    .match({ id: playlistId, user_id: userId });

  if (error) {
    console.error("プレイリストの更新中にエラーが発生しました:", error);
    throw new Error(error.message);
  }
};

export default renamePlaylist;
