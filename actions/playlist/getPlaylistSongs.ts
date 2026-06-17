import Song from "@/types";
import { supabase } from "@/lib/supabase";
import { SUPABASE_TABLES } from "@/constants";
import { getErrorMessage } from "@/lib/utils/error";

type PlaylistSong = Song & { songType: "regular" };

/**
 * 指定されたプレイリストIDに含まれる「regular」な曲を取得する
 *
 * @param {string} playlistId プレイリストID
 * @param {string} userId ユーザーID（非公開プレイリストの場合に必要）
 * @returns {Promise<PlaylistSong[]>} プレイリストに含まれる曲の配列
 * @throws {Error} データベースクエリに失敗した場合
 */
const getPlaylistSongs = async (
  playlistId: string,
  userId?: string
): Promise<PlaylistSong[]> => {
  // プレイリストの公開設定を確認
  const { data: playlistData, error: playlistError } = await supabase
    .from(SUPABASE_TABLES.playlists)
    .select("is_public")
    .eq("id", playlistId)
    .single();

  if (playlistError) {
    console.error("Failed to fetch playlist:", playlistError);
    throw new Error(getErrorMessage(playlistError));
  }

  // 非公開プレイリストで未認証の場合のみ早期リターン
  if (!playlistData.is_public && !userId) {
    console.error("User not authenticated for private playlist");
    return [];
  }

  let query = supabase
    .from(SUPABASE_TABLES.playlistSongs)
    .select("*, songs(*)")
    .eq("playlist_id", playlistId)
    .eq("song_type", "regular")
    .order("created_at", { ascending: false });

  // 非公開プレイリストの場合のみユーザーIDでフィルタリング
  if (!playlistData.is_public && userId) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to fetch playlist songs:", error);
    throw new Error(getErrorMessage(error));
  }

  return (data || []).map((item: { songs: Song }) => ({
    ...item.songs,
    songType: "regular" as const,
  }));
};

export default getPlaylistSongs;
