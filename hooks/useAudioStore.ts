import { create } from "zustand";
import Song from "../types";
import { RepeatMode } from "react-native-track-player";

interface AudioState {
  currentSong: Song | null;
  isPlaying: boolean;
  repeatMode: RepeatMode;
  shuffle: boolean;

  // アクション
  setCurrentSong: (song: Song | null) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setRepeatMode: (mode: RepeatMode) => void;
  setShuffle: (enabled: boolean) => void;
}

/**
 * オーディオプレーヤーの状態をグローバルに管理するZustandストア
 *
 * 注意: position と duration は含まれていません。
 * これらは TrackPlayer から直接取得することで、不要な再レンダリングを防ぎます。
 */
export const useAudioStore = create<AudioState>((set) => ({
  // 初期状態
  currentSong: null,
  isPlaying: false,
  repeatMode: RepeatMode.Off,
  shuffle: false,

  // アクション
  setCurrentSong: (song) => set({ currentSong: song }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setRepeatMode: (mode) => set({ repeatMode: mode }),
  setShuffle: (enabled) => set({ shuffle: enabled }),
}));

// 追加のアクションを持つ拡張ストア
// これらのアクションは複数の状態を一度に更新するためのものです
export const useAudioActions = () => {
  const { setCurrentSong, setIsPlaying } = useAudioStore();

  return {
    // 曲を変更して再生状態を更新する
    updateCurrentSongAndState: (song: Song | null, playing: boolean) => {
      setCurrentSong(song);
      setIsPlaying(playing);
    },
  };
};
