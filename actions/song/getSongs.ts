import { supabase } from "@/lib/supabase";
import Song from "@/types";
import { getErrorMessage } from "@/lib/utils/error";

/**
 * 全ての曲を取得する
 *
 * @param {number} limit 取得する曲数 (デフォルト100)
 * @returns {Promise<Song[]>} 曲の配列
 * @throws {Error} データベースクエリに失敗した場合
 *
 * @example
 * ```typescript
 * const songs = await getSongs();
 * console.log(songs);
 * ```
 */
const getSongs = async (): Promise<Song[]> => {
  const { data, error } = await supabase
    .from("songs")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(getErrorMessage(error));
    throw new Error(getErrorMessage(error));
  }

  return (data as Song[]) || [];
};

export default getSongs;
