import { supabase } from "@/lib/supabase";
import { Playlist } from "@/types";

/**
 * 現在のユーザーのプレイリスト一覧を取得する
 *
 * @returns {Promise<Playlist[]>} プレイリストの配列。エラーが発生した場合は空の配列を返す。
 *
 * @example
 * ```typescript
 * const playlists = await getPlaylists();
 * console.log(playlists);
 * ```
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
    return [];
  }

  return (data as Playlist[]) || [];
};

export default getPlaylists;
