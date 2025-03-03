import { useMemo } from "react";
import type { Track } from "react-native-track-player";
import type Song from "@/types";
import { convertSongToTrack } from "./track";

type UsePlayerStateProps = {
  songs: Song[];
};

type PlayerState = {
  songMap: Record<string, Song>;
  trackMap: Record<string, Track>;
};

/**
 * プレイヤーの状態管理を行うカスタムフック
 */
export function usePlayerState({ songs }: UsePlayerStateProps): PlayerState {
  // 曲のIDをキーとする曲データマップを作成
  const songMap = useMemo(() => {
    return songs.reduce((acc, song) => {
      acc[song.id] = song;
      return acc;
    }, {} as Record<string, Song>);
  }, [songs]);

  // キャッシュされたトラックマップ
  const trackMap = useMemo(() => {
    return songs.reduce((acc, song) => {
      acc[song.id] = convertSongToTrack(song);
      return acc;
    }, {} as Record<string, Track>);
  }, [songs]);

  return {
    songMap,
    trackMap,
  };
}

/**
 * プレイヤーの進行状態を計算するユーティリティ関数
 */
export function calculateProgress(rawPosition: number, rawDuration: number) {
  return {
    progressPosition: rawPosition * 1000,
    progressDuration: rawDuration * 1000,
  };
}
