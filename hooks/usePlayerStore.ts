import { create } from "zustand";

type PlayerState = {
  showPlayer: boolean;
};

type PlayerActions = {
  setShowPlayer: (value: boolean) => void;
};

export const usePlayerStore = create<PlayerState & PlayerActions>((set) => ({
  showPlayer: false,

  setShowPlayer: (value) => set({ showPlayer: value }),
}));
