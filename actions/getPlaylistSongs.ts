import Song from "@/types";
import { supabase } from "@/lib/supabase";

type PlaylistSong = Song & { songType: "regular" };

/**
 * 指定されたプレイリストIDに含まれる「regular」な曲を取得する
 * @param {string} playlistId プレイリストID
 * @returns {Promise<PlaylistSong[]>} プレイリストに含まれる曲の配列
 */
const getPlaylistSongs = async (
  playlistId: string
): Promise<PlaylistSong[]> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user.id) {
    console.error("User not authenticated");
    return [];
  }

  const { data, error } = await supabase
    .from("playlist_songs")
    .select("*, songs(*)")
    .eq("playlist_id", playlistId)
    .eq("user_id", session.user.id)
    .eq("song_type", "regular")
    .order("created_at", { ascending: false });

  if (error) {
    return [];
  }

  const playlistSongs: PlaylistSong[] = (data || []).map((item: any) => ({
    ...item.songs,
    songType: "regular",
  }));

  return playlistSongs;
};

export default getPlaylistSongs;
