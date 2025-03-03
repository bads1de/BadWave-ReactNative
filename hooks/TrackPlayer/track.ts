import Song from "@/types";
import { Track } from "react-native-track-player";

/**
 * 曲データをトラック形式に変換 (単一の曲のみ)
 */
export function convertSongToTrack(song: Song): Track {
  return {
    id: song.id,
    url: song.song_path,
    title: song.title,
    artist: song.author,
    artwork: song.image_path,
  };
}

/**
 * 曲データをトラック形式に変換 (複数曲)
 */
export function convertToTracks(songs: Song[]): Track[] {
  return songs.map((song) => convertSongToTrack(song));
}
