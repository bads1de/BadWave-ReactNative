import { supabase } from "@/lib/supabase";
import { Playlist } from "@/types";

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
    .from("playlists")
    .select("*")
    .eq("is_public", true)
    .ilike("title", `%${title}%`)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error.message);
    throw new Error(error.message);
  }

  return (data as Playlist[]) || [];
};

export default getPlaylistsByTitle;
