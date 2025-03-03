import { create } from "zustand";

type PlayerState = {
  showPlayer: boolean;
};

type PlayerActions = {
  setShowPlayer: (value: boolean) => void;
};

export const usePlayerStore = create<PlayerState & PlayerActions>((set) => ({
  showPlayer: false,
  currentSong: null,

  // Actions
  setShowPlayer: (value) => set({ showPlayer: value }),
}));
