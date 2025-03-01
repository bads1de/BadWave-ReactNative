import { create } from "zustand";
import { RepeatMode } from "react-native-track-player";
import Song from "../types";

type PlayerState = {
  showPlayer: boolean;
  currentSong: Song | null;
  isPlaying: boolean;
  repeatMode: RepeatMode;
  shuffle: boolean;
};

type PlayerActions = {
  setShowPlayer: (value: boolean) => void;
  setCurrentSong: (song: Song | null) => void;
  setIsPlaying: (value: boolean) => void;
  setRepeatMode: (mode: RepeatMode) => void;
  setShuffle: (value: boolean) => void;
};

export const usePlayerStore = create<PlayerState & PlayerActions>((set) => ({
  showPlayer: false,
  currentSong: null,
  isPlaying: false,
  repeatMode: RepeatMode.Off,
  shuffle: false,

  // Actions
  setShowPlayer: (value) => set({ showPlayer: value }),
  setCurrentSong: (song) => set({ currentSong: song }),
  setIsPlaying: (value) => set({ isPlaying: value }),
  setRepeatMode: (mode) => set({ repeatMode: mode }),
  setShuffle: (value) => set({ shuffle: value }),
}));
