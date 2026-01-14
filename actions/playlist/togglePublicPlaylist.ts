import { supabase } from "@/lib/supabase";

/**
 * プレイリストの公開設定を切り替える
 *
 * @param {string} playlistId - プレイリストID
 * @param {string} userId - ユーザーID
 * @param {boolean} isPublic - 公開設定 (true: 公開, false: 非公開)
 * @returns {Promise<void>} 処理が成功した場合は何も返さない
 * @throws {Error} データベース更新時にエラーが発生した場合
 *
 * @example
 * ```typescript
 * await togglePublicPlaylist('playlist-id-123', 'user-id-456', true);
 * ```
 */
const togglePublicPlaylist = async (
  playlistId: string,
  userId: string,
  isPublic: boolean
): Promise<void> => {
  const { error } = await supabase
    .from("playlists")
    .update({ is_public: isPublic })
    .eq("id", playlistId)
    .eq("user_id", userId);

  if (error) {
    console.error("プレイリストの更新中にエラーが発生しました:", error);
    throw new Error(error.message);
  }
};

export default togglePublicPlaylist;
