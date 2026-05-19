import { supabase } from "@/lib/supabase";

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
  const { data, error } = await supabase
    .from("playlist_songs")
    .select("playlist_id")
    .eq("song_id", songId)
    .eq("user_id", userId)
    .eq("song_type", "regular");

  if (error) {
    console.error("Error fetching song playlist status:", error.message);
    return [];
  }

  return (data || []).map((item: { playlist_id: string }) => item.playlist_id);
};

export default getSongPlaylistStatus;
