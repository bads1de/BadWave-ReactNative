import { supabase } from "@/lib/supabase";
import { SUPABASE_TABLES } from "@/constants";
import { Spotlight } from "@/types";
import { getErrorMessage } from "@/lib/utils/error";

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
    .from(SUPABASE_TABLES.spotlights)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(getErrorMessage(error));
    throw new Error(getErrorMessage(error));
  }

  return (data as Spotlight[]) || [];
};

export default getSpotlights;
