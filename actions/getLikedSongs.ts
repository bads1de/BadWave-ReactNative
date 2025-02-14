import Song from "@/types";
import { supabase } from "@/lib/supabase";

const getLikedSongs = async (): Promise<Song[]> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    console.error("ログインしていません。sessionが取得されていません。");
    return [];
  }

  const { data, error } = await supabase
    .from("liked_songs_regular")
    .select("*, songs(*)")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  // デバッグ用
  console.log("Raw data:", data);
  console.log("Error:", error);

  if (error) {
    console.error("Error fetching liked songs:", error);
    return [];
  }

  if (!data) return [];

  // データ構造を変換
  const songs = data
    .map((item) => {
      // デバッグ用
      console.log("Processing item:", item);
      return {
        ...item.songs,
        id: item.songs?.id || item.song_id,
        created_at: item.created_at,
      };
    })
    .filter((song) => song.id); // nullやundefinedを除外

  // デバッグ用
  console.log("Processed songs:", songs);

  return songs;
};

export default getLikedSongs;
