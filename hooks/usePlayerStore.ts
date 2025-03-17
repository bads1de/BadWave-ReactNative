import { create } from "zustand";

type PlayerState = {
  showPlayer: boolean;
  showSwipeablePlayer: boolean;
  activeSongIndex: number | null;
};

type PlayerActions = {
  setShowPlayer: (value: boolean) => void;
  setShowSwipeablePlayer: (value: boolean) => void;
  setActiveSongIndex: (index: number | null) => void;
};

export const usePlayerStore = create<PlayerState & PlayerActions>((set) => ({
  showPlayer: false,
  showSwipeablePlayer: false,
  activeSongIndex: null,

  setShowPlayer: (value) => set({ showPlayer: value }),
  setShowSwipeablePlayer: (value) => set({ showSwipeablePlayer: value }),
  setActiveSongIndex: (index) => set({ activeSongIndex: index }),
}));
