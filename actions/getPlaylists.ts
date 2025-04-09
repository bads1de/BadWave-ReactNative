import { supabase } from "../lib/supabase";
import { Playlist } from "../types";

/**
 * 指定ユーザーのプレイリスト一覧を取得する
 *
 * @param {string} userId ユーザーID
 * @returns {Promise<Playlist[]>} プレイリストの配列
 * @throws {Error} データベースクエリに失敗した場合
 *
 * @example
 * ```typescript
 * const playlists = await getPlaylists('user-id-123');
 * console.log(playlists);
 * ```
 */
const getPlaylists = async (userId: string): Promise<Playlist[]> => {
  const { data, error } = await supabase
    .from("playlists")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error.message);
    throw new Error(error.message);
  }

  return (data as Playlist[]) || [];
};

export default getPlaylists;
