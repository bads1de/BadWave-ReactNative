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

/**
 * 非同期操作を安全に実行するヘルパー関数
 * @param operation 実行する非同期操作
 * @param errorContext エラー時のコンテキスト情報
 * @returns 操作の結果またはundefined（エラー時）
 */
export async function safeAsyncOperation<T>(
  operation: () => Promise<T>,
  errorContext: string,
  onError?: (error: unknown) => void
): Promise<T | undefined> {
  try {
    return await operation();
  } catch (error) {
    logError(error, errorContext);

    if (onError) {
      onError(error);
    }

    return undefined;
  }
}
