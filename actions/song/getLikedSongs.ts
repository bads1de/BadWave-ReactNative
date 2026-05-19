import Song from "@/types";
import { supabase } from "@/lib/supabase";

/**
 * ユーザーが「いいね」した曲の一覧を取得する
 *
 * @param {string} userId ユーザーID
 * @returns {Promise<Song[]>} 「いいね」した曲の配列
 * @throws {Error} データベースクエリに失敗した場合
 */
const getLikedSongs = async (userId: string): Promise<Song[]> => {
  try {
    const { data, error } = await supabase
      .from("liked_songs_regular")
      .select("*, songs(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching liked songs:", error);
      return [];
    }

    if (!data) {
      return [];
    }

    return data.map((item) => ({
      ...item.songs,
    }));
  } catch (error) {
    console.error("Unexpected error:", error);
    return [];
  }
};

export default getLikedSongs;
