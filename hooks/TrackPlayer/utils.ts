import { useCallback, useEffect, useRef } from "react";
import TrackPlayer, { Track } from "react-native-track-player";
import Song from "../../types";
import { ErrorHandlerProps } from "./types";

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
 * 安全な状態更新を行うためのカスタムフック
 */
export function useSafeStateUpdate(isMounted: React.MutableRefObject<boolean>) {
  return useCallback(
    (callback: () => void) => {
      if (isMounted.current) {
        callback();
      }
    },
    [isMounted]
  );
}

/**
 * エラーハンドリングを行うカスタムフック
 */
export function useErrorHandler({
  safeStateUpdate,
  setIsPlaying,
}: ErrorHandlerProps) {
  return useCallback(
    (error: unknown, context: string) => {
      console.error(`${context}:`, error);

      if (error && typeof error === "object" && "message" in error) {
        console.error("キュー管理エラー:", error.message);
      } else if (error instanceof Error) {
        console.error("エラー:", error.message);
      }

      safeStateUpdate(() => setIsPlaying(false));
    },
    [safeStateUpdate, setIsPlaying]
  );
}

/**
 * クリーンアップ関数を管理するカスタムフック
 */
export function useCleanup(isMounted: React.MutableRefObject<boolean>) {
  const cleanupFns = useRef<(() => void)[]>([]);

  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
      cleanupFns.current.forEach((cleanup) => cleanup());
      cleanupFns.current = [];
    };
  }, [isMounted]);

  return cleanupFns;
}
