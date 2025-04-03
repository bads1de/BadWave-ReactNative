import Song from "@/types";
import { supabase } from "@/lib/supabase";

/**
 * @fileoverview お気に入り曲取得モジュール
 * このモジュールは、認証済みユーザーが「いいね」した曲の一覧を取得する機能を提供します。
 */

/**
 * ユーザーが「いいね」した曲の一覧を取得する
 * @description
 * 認証済みユーザーが「いいね」した曲を、作成日時の降順で取得します。
 * エラーが発生した場合やデータがない場合は空配列を返します。
 *
 * @returns {Promise<Song[]>} 「いいね」した曲の配列
 * @throws {Error} データベースクエリに失敗した場合
 *
 * @example
 * ```typescript
 * // お気に入り曲を取得
 * const likedSongs = await getLikedSongs();
 * console.log(likedSongs); // [{id: "1", title: "Song 1", ...}, ...]
 * ```
 */
const getLikedSongs = async (): Promise<Song[]> => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const { data, error } = await supabase
      .from("liked_songs_regular")
      .select("*, songs(*)")
      .eq("user_id", session?.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching liked songs:", error);
      return [];
    }

    if (!data) {
      return [];
    }

    // データ構造を変換
    return data.map((item) => ({
      ...item.songs,
    }));
  } catch (error) {
    console.error("Unexpected error:", error);
    return [];
  }
};

export default getLikedSongs;
