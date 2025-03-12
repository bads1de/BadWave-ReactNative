import { supabase } from "@/lib/supabase";
import { Playlist } from "@/types";

/**
 * パブリックプレイリスト一覧を取得する
 * @param {number} limit - 取得する最大件数
 * @returns {Promise<Playlist[]>} プレイリストの配列
 */
const getPublicPlaylists = async (limit: number = 6): Promise<Playlist[]> => {
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
