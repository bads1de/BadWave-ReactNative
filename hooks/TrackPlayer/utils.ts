// hooks/TrackPlayer/utils.ts
import { Track } from "react-native-track-player";
import Song from "../../types";

/**
 * 曲データをTrackPlayerのトラック形式に変換
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
 * 複数の曲をトラック形式に変換
 */
export function convertToTracks(songs: Song[]): Track[] {
  return songs.map(convertSongToTrack);
}

/**
 * エラーをログに記録する単純なユーティリティ
 */
export function logError(error: unknown, context: string): void {
  console.error(`${context}:`, error);

  if (error && typeof error === "object" && "message" in error) {
    console.error("エラー詳細:", error.message);
  } else if (error instanceof Error) {
    console.error("エラー:", error.message);
  }
}
