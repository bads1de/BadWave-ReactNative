import { supabase } from "../lib/supabase";
import Song from "../types";

/**
 * IDを指定して曲情報を取得する
 * @param {string} songId 曲ID
 * @returns {Promise<Song>} 曲情報
 */

const getSongById = async (songId: string): Promise<Song> => {
  const { data: songData, error: songError } = await supabase
    .from("songs")
    .select("*")
    .eq("id", songId)
    .single();

  if (songError) {
    console.error(songError.message);
    throw new Error(songError.message);
  }

  if (!songData) {
    console.error("Song not found");
    throw new Error("Song not found");
  }

  return songData as Song;
};

export default getSongById;
