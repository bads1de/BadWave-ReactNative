import { supabase } from "../lib/supabase";
import Song from "../types";

/**
 * 全ての曲を取得する
 *
 * @param {number} limit 取得する曲数 (デフォルト100)
 * @returns {Promise<Song[]>} 曲の配列
 * @throws {Error} データベースクエリに失敗した場合
 *
 * @example
 * ```typescript
 * const songs = await getSongs(50);
 * console.log(songs);
 * ```
 */
const getSongs = async (limit = 100): Promise<Song[]> => {
  const { data, error } = await supabase
    .from("songs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error(error.message);
    throw new Error(error.message);
  }

  return (data as Song[]) || [];
};

export default getSongs;
