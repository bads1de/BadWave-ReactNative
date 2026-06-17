import { supabase } from "@/lib/supabase";
import { SUPABASE_TABLES } from "@/constants";
import Song from "@/types";
import { getErrorMessage } from "@/lib/utils/error";

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
    .from(SUPABASE_TABLES.songs)
    .select("*")
    .ilike("title", `%${title}%`)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(getErrorMessage(error));
    throw new Error(getErrorMessage(error));
  }

  return (data as Song[]) || [];
};

export default getSongsByTitle;
