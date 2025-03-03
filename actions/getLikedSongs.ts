import Song from "@/types";
import { supabase } from "@/lib/supabase";

const getLikedSongs = async (): Promise<Song[]> => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const { data, error } = await supabase
      .from("liked_songs_regular")
      .select("*, songs(*)")
      .eq("user_id", session?.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching liked songs:", error);
      return [];
    }

    if (!data) {
      return [];
    }

    // データ構造を変換
    return data.map((item) => ({
      ...item.songs,
    }));
  } catch (error) {
    console.error("Unexpected error:", error);
    return [];
  }
};

export default getLikedSongs;
