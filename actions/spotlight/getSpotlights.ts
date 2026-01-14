import { supabase } from "@/lib/supabase";
import { Spotlight } from "@/types";

/**
 * スポットライト曲を取得する
 *
 * @param {number} limit 取得する曲数 (デフォルト10)
 * @returns {Promise<Song[]>} スポットライト曲の配列
 * @throws {Error} データベースクエリに失敗した場合
 *
 * @example
 * ```typescript
 * const songs = await getSpotlights();
 * console.log(songs);
 * ```
 */
const getSpotlights = async (): Promise<Spotlight[]> => {
  const { data, error } = await supabase
    .from("spotlights")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error.message);
    throw new Error(error.message);
  }

  return (data as Spotlight[]) || [];
};

export default getSpotlights;
