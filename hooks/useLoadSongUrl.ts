import { useState, useEffect, useMemo } from "react";
import Song from "@/types";
import { supabase } from "@/lib/supabase";

/**
 * 曲のURLを読み込むカスタムフック
 *
 * @param {Song } song - 曲データ
 * @returns {string} 読み込まれた曲のURL
 */
const useLoadSongUrl = (song: Song) => {
  const [songUrl, setSongUrl] = useState<string>("");

  useEffect(() => {
    if (!song) {
      setSongUrl("");
      return;
    }

    const loadSong = async () => {
      try {
        const { data: songData } = await supabase.storage
          .from("songs")
          .getPublicUrl(song.song_path);

        setSongUrl(songData?.publicUrl);
      } catch (error) {
        console.error("曲の読み込み中にエラーが発生しました:", error);
        setSongUrl("");
      }
    };

    loadSong();
  }, [song, supabase]);

  return useMemo(() => songUrl, [songUrl]);
};

export default useLoadSongUrl;
