import { create } from "zustand";
import Song from "@/types";

type SubPlayerState = {
  showSubPlayer: boolean;
  currentSongIndex: number;
  songs: Song[];
  previewDuration: number; // プレビュー再生時間（秒）
  autoPlay: boolean; // 自動再生フラグ
};

type SubPlayerActions = {
  setShowSubPlayer: (value: boolean) => void;
  setCurrentSongIndex: (index: number) => void;
  setSongs: (songs: Song[]) => void;
  setPreviewDuration: (duration: number) => void;
  setAutoPlay: (autoPlay: boolean) => void;
};

export const useSubPlayerStore = create<SubPlayerState & SubPlayerActions>(
  (set) => ({
    showSubPlayer: false,
    currentSongIndex: 0,
    songs: [],
    previewDuration: 15, // デフォルト15秒
    autoPlay: true, // デフォルトで自動再生有効
    setShowSubPlayer: (value) => set({ showSubPlayer: value }),
    setCurrentSongIndex: (index) => set({ currentSongIndex: index }),
    setSongs: (songs) => set({ songs }),
    setPreviewDuration: (duration) => set({ previewDuration: duration }),
    setAutoPlay: (autoPlay) => set({ autoPlay }),
  })
);
