import Song from "@/types";
import useLoadMedia from "./useLoadMedia";

/**
 * 曲のURLを読み込むカスタムフック
 *
 * @param {Song } song - 曲データ
 * @returns {string} 読み込まれた曲のURL
 */
const useLoadSongUrl = (song: Song | null) => useLoadMedia(song, "song");

export default useLoadSongUrl;
