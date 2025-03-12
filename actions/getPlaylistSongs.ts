import Song from "@/types";
import { supabase } from "@/lib/supabase";
import { Playlist } from "@/types";

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

  // プレイリストの公開設定を確認
  const { data: playlistData, error: playlistError } = await supabase
    .from("playlists")
    .select("is_public")
    .eq("id", playlistId)
    .single();

  if (playlistError) {
    console.error("Failed to fetch playlist:", playlistError);
    return [];
  }

  // 非公開プレイリストの場合は認証チェック
  if (!playlistData.is_public && !session?.user.id) {
    console.error("User not authenticated for private playlist");
    return [];
  }

  let query = supabase
    .from("playlist_songs")
    .select("*, songs(*)")
    .eq("playlist_id", playlistId)
    .eq("song_type", "regular")
    .order("created_at", { ascending: false });

  // 非公開プレイリストの場合のみユーザーIDでフィルタリング
  if (!playlistData.is_public) {
    query = query.eq("user_id", session!.user.id);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to fetch playlist songs:", error);
    return [];
  }

  const playlistSongs: PlaylistSong[] = (data || []).map((item: any) => ({
    ...item.songs,
    songType: "regular",
  }));

  return playlistSongs;
};

export default getPlaylistSongs;
