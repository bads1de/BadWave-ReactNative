import { supabase } from "../lib/supabase";

/**
 * プレイリストの画像パスを更新する関数。
 *
 * プレイリストの画像パスが空の場合のみ、指定された曲の画像パスで更新します。
 * これにより、プレイリストに最初に追加された曲の画像がプレイリストのサムネイルとして使用されます。
 *
 * @param {string} playlistId - 更新対象のプレイリストID
 * @param {string} songImagePath - プレイリストのサムネイルとして設定する曲の画像パス
 * @returns {Promise<void>} 処理が成功した場合は何も返さない
 * @throws {Error} データベースクエリや更新処理でエラーが発生した場合
 *
 * @example
 * ```typescript
 * await updatePlaylistImage('playlist-id-123', 'path/to/song-image.jpg');
 * ```
 */
const updatePlaylistImage = async (
  playlistId: string,
  songImagePath: string
): Promise<void> => {
  try {
    // ステップ1: プレイリストの現在の画像パス情報を取得する
    const { data: playlistData, error: playlistError } = await supabase
      .from("playlists")
      .select("image_path")
      .eq("id", playlistId)
      .single();

    if (playlistError) {
      console.error("プレイリストの取得中にエラーが発生しました:", playlistError);
      throw new Error(playlistError.message);
    }

    // 画像パスが未設定の場合のみ更新
    if (playlistData && !playlistData.image_path) {
      const { error: updateError } = await supabase
        .from("playlists")
        .update({ image_path: songImagePath })
        .eq("id", playlistId);

      if (updateError) {
        console.error("プレイリスト画像の更新中にエラーが発生しました:", updateError);
        throw new Error(updateError.message);
      }
    }
  } catch (error) {
    console.error("プレイリスト画像の更新中にエラーが発生しました:", error);
    throw error;
  }
};

export default updatePlaylistImage;
