import Song from "@/types";
import { supabase } from "@/lib/supabase";

const getLikedSongs = async (): Promise<Song[]> => {
  // 現在のユーザーセッションを取得
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // いいねされた曲を取得
  const { data, error } = await supabase
    .from("liked_songs_regular")
    .select(`*,"songs"(*)`)
    .eq("user_id", session?.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching liked songs:", error);
    return [];
  }

  if (!data) return [];

  // 取得したデータから曲の情報のみを新しい配列にして返す
  return (data as Song[]) || [];
};

export default getLikedSongs;
