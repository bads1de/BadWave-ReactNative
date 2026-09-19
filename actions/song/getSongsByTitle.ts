import { supabase } from "@/lib/supabase";
import { SUPABASE_TABLES } from "@/constants";
import Song from "@/types";
import { runQuery } from "@/lib/utils/supabaseQuery";

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
  const data = await runQuery(async () =>
    supabase
      .from(SUPABASE_TABLES.songs)
      .select("*")
      .ilike("title", `%${title}%`)
      .order("created_at", { ascending: false }),
  );

  return (data as Song[]) || [];
};

export default getSongsByTitle;
