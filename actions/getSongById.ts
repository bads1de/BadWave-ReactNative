import { supabase } from "../lib/supabase";
import Song from "../types";

/**
 * 指定したIDの曲を取得する
 *
 * @param {string} songId 曲のID
 * @returns {Promise<Song | null>} 曲データ。存在しない場合はnull
 * @throws {Error} データベースクエリに失敗した場合
 *
 * @example
 * ```typescript
 * const song = await getSongById('song-id-123');
 * console.log(song);
 * ```
 */
const getSongById = async (songId: string): Promise<Song | null> => {
  const { data, error } = await supabase
    .from("songs")
    .select("*")
    .eq("id", songId)
    .single();

  if (error) {
    console.error(error.message);
    throw new Error(error.message);
  }

  return (data as Song) || null;
};

export default getSongById;
