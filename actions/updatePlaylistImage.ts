import { supabase } from "../lib/supabase";

/**
 * プレイリストの画像パスを更新する関数。
 * プレイリストの画像パスが空の場合のみ、指定された曲の画像パスで更新する。
 * これにより、プレイリストに最初に追加された曲の画像がプレイリストのサムネイルとして使用される。
 *
 * @param {string} playlistId プレイリストID - 更新対象のプレイリストを特定するためのID
 * @param {string} songImagePath 曲の画像パス - プレイリストのサムネイルとして設定する画像のパス
 * @returns {Promise<void>} 処理が成功した場合は何も返さない。エラーが発生した場合は例外をスローする。
 */

const updatePlaylistImage = async (
  playlistId: string,
  songImagePath: string
): Promise<void> => {
  try {
    // ステップ1: プレイリストの現在の画像パス情報を取得する
    // Supabaseから指定されたIDのプレイリストのimage_path列のみを取得
    const { data: playlistData, error: playlistError } = await supabase
      .from("playlists")
      .select("image_path") // 必要な情報のみを取得してパフォーマンスを最適化
      .eq("id", playlistId) // プレイリストIDで絞り込み
      .single(); // 単一レコードを取得

    // ステップ2: プレイリスト取得時のエラーハンドリング
    // データベースクエリ実行中にエラーが発生した場合の処理
    if (playlistError) {
      console.error(
        "プレイリストの取得中にエラーが発生しました:",
        playlistError
      );
      throw new Error(playlistError.message); // エラーを上位の呼び出し元に伝播
    }

    // ステップ3: プレイリストの画像パスが空の場合のみ更新処理を実行
    // プレイリストが存在し、かつ画像パスが設定されていない場合のみ更新
    if (playlistData && !playlistData.image_path) {
      // ステップ4: プレイリストの画像パスを更新
      // 指定された曲の画像パスでプレイリストの画像パスを更新
      const { error: updateError } = await supabase
        .from("playlists")
        .update({ image_path: songImagePath })
        .eq("id", playlistId);

      // ステップ5: 更新時のエラーハンドリング
      if (updateError) {
        console.error(
          "プレイリスト画像の更新中にエラーが発生しました:",
          updateError
        );
        throw new Error(updateError.message); // エラーを上位の呼び出し元に伝播
      }
      // 注: 更新が成功した場合は特に何もしない
    }
    // 注: 既に画像パスが設定されている場合は何もしない（最初に追加された曲の画像を維持）
  } catch (error) {
    // ステップ6: 全体的な例外処理
    // 予期せぬエラーが発生した場合のフォールバック処理
    console.error("プレイリスト画像の更新中にエラーが発生しました:", error);
    throw error; // エラーを上位の呼び出し元に伝播
  }
};

export default updatePlaylistImage;
