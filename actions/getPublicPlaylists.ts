import { supabase } from "@/lib/supabase";
import { Playlist } from "@/types";

/**
 * 公開されているプレイリストを取得する
 *
 * @param {number} limit 取得する件数 (デフォルト20)
 * @returns {Promise<Playlist[]>} 公開プレイリストの配列
 * @throws {Error} データベースクエリに失敗した場合
 *
 * @example
 * ```typescript
 * const playlists = await getPublicPlaylists(10);
 * console.log(playlists);
 * ```
 */
const getPublicPlaylists = async (limit: number = 20): Promise<Playlist[]> => {
  const { data, error } = await supabase
    .from("playlists")
    .select("*")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error(error.message);
    return [];
  }

  return (data as Playlist[]) || [];
};

export default getPublicPlaylists;
