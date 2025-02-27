import { create } from "zustand";
import Song from "../types";

type PlayerState = {
  showPlayer: boolean;
  currentSong: Song | null;
  isPlaying: boolean;
  repeat: boolean;
  shuffle: boolean;
  sound: any;
};

type PlayerActions = {
  setShowPlayer: (value: boolean) => void;
  setCurrentSong: (song: Song | null) => void;
  setIsPlaying: (value: boolean) => void;
  setRepeat: (value: boolean) => void;
  setShuffle: (value: boolean) => void;
  setSound: (sound: any) => void;
};

export const usePlayerStore = create<PlayerState & PlayerActions>((set) => ({
  showPlayer: false,
  currentSong: null,
  isPlaying: false,
  repeat: false,
  shuffle: false,
  sound: null,

  // Actions
  setShowPlayer: (value) => set({ showPlayer: value }),
  setCurrentSong: (song) => set({ currentSong: song }),
  setIsPlaying: (value) => set({ isPlaying: value }),
  setRepeat: (value) => set({ repeat: value }),
  setShuffle: (value) => set({ shuffle: value }),
  setSound: (sound) => set({ sound }),
}));
