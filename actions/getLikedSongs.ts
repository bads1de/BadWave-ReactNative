import Song from "@/types";
import { supabase } from "@/lib/supabase";

const getLikedSongs = async (): Promise<Song[]> => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      console.error("ログインしていません。sessionが取得されていません。");
      return [];
    }

    // デバッグ用：セッション情報の出力
    console.log("Current session:", session);

    const { data, error } = await supabase
      .from("liked_songs_regular")
      .select(
        `
        *,
        songs:songs(*)
      `
      )
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching liked songs:", error);
      return [];
    }

    if (!data) return [];

    // データ構造を変換
    return data.map((item) => ({
      ...item.songs,
      id: item.songs?.id || item.song_id,
      created_at: item.created_at,
    }));
  } catch (error) {
    console.error("Unexpected error:", error);
    return [];
  }
};

export default getLikedSongs;
