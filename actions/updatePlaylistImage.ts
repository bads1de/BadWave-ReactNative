import { supabase } from "@/lib/supabase";

/**
 * プレイリストの画像パスを更新する関数。
 * プレイリストの画像パスが空の場合、指定された曲の画像パスで更新する。
 *
 * @param {string} playlistId プレイリストID
 * @param {string} songImagePath 曲の画像パス
 * @returns {Promise<void>}
 */

const updatePlaylistImage = async (
  playlistId: string,
  songImagePath: string
): Promise<void> => {
  try {
    // プレイリストの画像パスを取得
    const { data: playlistData, error: playlistError } = await supabase
      .from("playlists")
      .select("image_path")
      .eq("id", playlistId)
      .single();

    if (playlistError) {
      throw new Error(playlistError.message);
    }

    if (playlistData && !playlistData.image_path) {
      const { error: updateError } = await supabase
        .from("playlists")
        .update({ image_path: songImagePath })
        .eq("id", playlistId);

      if (updateError) {
        throw new Error(updateError.message);
      }
    }
  } catch (error) {
    console.error("プレイリスト画像の更新中にエラーが発生しました:", error);
    throw error;
  }
};

export default updatePlaylistImage;
