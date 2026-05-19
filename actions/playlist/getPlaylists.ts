import { supabase } from "@/lib/supabase";
import { Playlist } from "@/types";

/**
 * 指定したユーザーのプレイリスト一覧を取得する
 *
 * @param {string} userId ユーザーID
 * @returns {Promise<Playlist[]>} プレイリストの配列。エラーが発生した場合は空の配列を返す。
 */
const getPlaylists = async (userId: string): Promise<Playlist[]> => {
  const { data, error } = await supabase
    .from("playlists")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error.message);
    return [];
  }

  return (data as Playlist[]) || [];
};

export default getPlaylists;
