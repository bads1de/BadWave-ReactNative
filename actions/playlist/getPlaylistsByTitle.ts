import { supabase } from "@/lib/supabase";
import { SUPABASE_TABLES } from "@/constants";
import { Playlist } from "@/types";
import { runQuery } from "@/lib/utils/supabaseQuery";

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
  const data = await runQuery(
    async () =>
      supabase
        .from(SUPABASE_TABLES.playlists)
        .select("*")
        .eq("is_public", true)
        .ilike("title", `%${title}%`)
        .order("created_at", { ascending: false }),
    { purpose: "read" },
  );

  return (data as Playlist[]) || [];
};

export default getPlaylistsByTitle;
