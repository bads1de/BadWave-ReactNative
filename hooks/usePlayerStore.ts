import { create } from "zustand";
import Song from "../types";


type PlayerState = {
  showPlayer: boolean;
  currentSong: Song | null;
  isPlaying: boolean;
  repeat: boolean;
  shuffle: boolean;
};

type PlayerActions = {
  setShowPlayer: (value: boolean) => void;
  setCurrentSong: (song: Song | null) => void;
  setIsPlaying: (value: boolean) => void;
  setRepeat: (value: boolean) => void;
  setShuffle: (value: boolean) => void;
};

export const usePlayerStore = create<PlayerState & PlayerActions>((set) => ({
  showPlayer: false,
  currentSong: null,
  isPlaying: false,
  repeat: false,
  shuffle: false,

  // Actions
  setShowPlayer: (value) => set({ showPlayer: value }),
  setCurrentSong: (song) => set({ currentSong: song }),
  setIsPlaying: (value) => set({ isPlaying: value }),
  setRepeat: (value) => set({ repeat: value }),
  setShuffle: (value) => set({ shuffle: value }),
}));
