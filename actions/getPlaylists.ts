import { supabase } from "@/lib/supabase";
import { Playlist } from "@/types";

/**
 * ユーザーのプレイリスト一覧を取得する
 * @returns {Promise<Playlist[]>} プレイリストの配列
 */
const getPlaylists = async (): Promise<Playlist[]> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { data, error } = await supabase
    .from("playlists")
    .select("*")
    .eq("user_id", session?.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error.message);
    throw new Error(error.message);
  }

  return (data as Playlist[]) || [];
};

export default getPlaylists;
