import { supabase } from "../lib/supabase";
import Song from "../types";

/**
 * スポットライト曲を取得する
 *
 * @param {number} limit 取得する曲数 (デフォルト10)
 * @returns {Promise<Song[]>} スポットライト曲の配列
 * @throws {Error} データベースクエリに失敗した場合
 *
 * @example
 * ```typescript
 * const songs = await getSpotlights(5);
 * console.log(songs);
 * ```
 */
const getSpotlights = async (limit = 10): Promise<Song[]> => {
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

export default getSpotlights;
