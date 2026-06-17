import { supabase } from "@/lib/supabase";
import { SUPABASE_TABLES } from "@/constants";
import { Playlist } from "@/types";
import { getErrorMessage } from "@/lib/utils/error";

/**
 * タイトルでパブリックプレイリストを検索する
 * @param {string} title - 検索するタイトル
 * @returns {Promise<Playlist[]>} プレイリストの配列
 * @throws {Error} データベースクエリに失敗した場合
 *
 * @example
 * ```typescript
 * const playlists = await getPlaylistsByTitle('お気に入り');
 * console.log(playlists);
 * ```
 */
const getPlaylistsByTitle = async (title: string): Promise<Playlist[]> => {
  const { data, error } = await supabase
    .from(SUPABASE_TABLES.playlists)
    .select("*")
    .eq("is_public", true)
    .ilike("title", `%${title}%`)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(getErrorMessage(error));
    throw new Error(getErrorMessage(error));
  }

  return (data as Playlist[]) || [];
};

export default getPlaylistsByTitle;
