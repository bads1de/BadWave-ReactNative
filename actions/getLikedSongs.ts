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
    .select(`*, songs(*)`)
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching liked songs:", error);
    throw new Error(error.message);
  }

  if (!data) return [];

  return data.map((item: any) => item.songs);
};

export default getLikedSongs;
