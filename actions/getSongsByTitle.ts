import { supabase } from "../lib/supabase";
import Song from "../types";

/**
 * タイトルで曲を検索する
 *
 * @param {string} title 曲のタイトル
 * @returns {Promise<Song[]>} 該当する曲の配列
 * @throws {Error} データベースクエリに失敗した場合
 *
 * @example
 * ```typescript
 * const songs = await getSongsByTitle('恋');
 * console.log(songs);
 * ```
 */
const getSongsByTitle = async (title: string): Promise<Song[]> => {
  const { data, error } = await supabase
    .from("songs")
    .select("*")
    .ilike("title", `%${title}%`)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error.message);
    throw new Error(error.message);
  }

  return (data as Song[]) || [];
};

export default getSongsByTitle;
