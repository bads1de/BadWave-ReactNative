import { create } from "zustand";

interface SpotlightState {
  visibleIndex: number | null;
  setVisibleIndex: (index: number | null) => void;
}

export const useSpotlightStore = create<SpotlightState>((set) => ({
  visibleIndex: 0, // default to 0
  setVisibleIndex: (index) => set({ visibleIndex: index }),
}));
