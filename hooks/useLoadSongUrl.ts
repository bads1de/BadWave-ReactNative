import Song from "@/types";
import { supabase } from "@/lib/supabase";

/**
 * 曲のURLを読み込むカスタムフック
 *
 * @param {Song } song - 曲データ
 * @returns {string} 読み込まれた曲のURL
 */
const useLoadSongUrl = async (song: Song): Promise<string> => {
  if (!song) {
    return "";
  }

  try {
    const { data: songData } = await supabase.storage
      .from("songs")
      .getPublicUrl(song.song_path);

    return songData?.publicUrl || "";
  } catch (error) {
    console.error("曲の読み込み中にエラーが発生しました:", error);
    return "";
  }
};

export default useLoadSongUrl;
