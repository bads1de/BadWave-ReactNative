import { create } from "zustand";

export type PlayerStore = {
  showPlayer: boolean;
  setShowPlayer: (value: boolean) => void;
};

export const usePlayerStore = create<PlayerStore>((set) => ({
  showPlayer: false,
  setShowPlayer: (value: boolean) => set({ showPlayer: value }),
}));
