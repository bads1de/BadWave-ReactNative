import Song from "../types";
import { supabase } from "../lib/supabase";

/**
 * ユーザーの最もよく再生された曲を取得する
 * このインターフェースは基本的な曲の情報に再生回数を追加します
 */
interface TopPlayedSong extends Song {
  play_count: number;
}

/**
 * 指定されたユーザーの最も再生回数の多い曲を取得する
 *
 * @param {string} userId ユーザーID
 * @returns {Promise<TopPlayedSong[]>} 再生回数順にソートされた曲の配列
 * @throws {Error} データベースクエリに失敗した場合
 *
 * @example
 * ```typescript
 * const songs = await getTopPlayedSongs('user-id-123');
 * console.log(songs);
 * ```
 */
const getTopPlayedSongs = async (userId?: string): Promise<TopPlayedSong[]> => {
  if (!userId) {
    return [];
  }

  const { data, error } = await supabase.rpc("get_top_songs", {
    p_user_id: userId,
    p_period: "day",
  });

  if (error) {
    console.error(error.message);
    throw new Error(error.message);
  }

  return (data || []) as TopPlayedSong[];
};

export default getTopPlayedSongs;
