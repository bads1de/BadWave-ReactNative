import { supabase } from "../lib/supabase";

/**
 * プレイリストの名前を変更する
 *
 * @param {string} playlistId プレイリストID
 * @param {string} newTitle 新しいプレイリスト名
 * @param {string} userId ユーザーID
 * @returns {Promise<void>} 処理が成功した場合は何も返さない
 * @throws {Error} プレイリスト名が空の場合、または更新時にエラーが発生した場合
 *
 * @example
 * ```typescript
 * await renamePlaylist('playlist-id-123', '新しいタイトル', 'user-id-456');
 * ```
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
