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
  // 曲のIDをキーとする曲データマップとトラックマップを作成
  const { songMap, trackMap } = useMemo(() => {
    const songMap: Record<string, Song> = {};
    const trackMap: Record<string, Track> = {};

    songs.forEach((song) => {
      songMap[song.id] = song;
      trackMap[song.id] = convertSongToTrack(song);
    });

    return { songMap, trackMap };
  }, [songs]);

  return {
    songMap,
    trackMap,
  };
}
