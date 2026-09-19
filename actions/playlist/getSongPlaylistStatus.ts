import { supabase } from "@/lib/supabase";
import { SUPABASE_TABLES } from "@/constants";
import { runQuery } from "@/lib/utils/supabaseQuery";

/**
 * 指定された曲がどのプレイリストに含まれているかを取得する
 *
 * @param {string} songId 曲のID
 * @param {string} userId ユーザーID
 * @returns {Promise<string[]>} 曲が含まれるプレイリストIDの配列
 */
const getSongPlaylistStatus = async (
  songId: string,
  userId: string
): Promise<string[]> => {
  // 状態チェック用途のため、取得失敗時は「どのプレイリストにも未追加」を意味する
  // 空配列へフォールバックする（throw しない）。
  const data = await runQuery(
    async () =>
      supabase
        .from(SUPABASE_TABLES.playlistSongs)
        .select("playlist_id")
        .eq("song_id", songId)
        .eq("user_id", userId)
        .eq("song_type", "regular"),
    { fallback: [] },
  );

  return (data || []).map((item: { playlist_id: string }) => item.playlist_id);
};

export default getSongPlaylistStatus;
