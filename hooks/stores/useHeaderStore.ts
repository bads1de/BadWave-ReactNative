import { create } from "zustand";

type HeaderState = {
  showHeader: boolean;
  setShowHeader: (show: boolean) => void;
};

export const useHeaderStore = create<HeaderState>((set) => ({
  showHeader: true,
  setShowHeader: (show: boolean) => set({ showHeader: show }),
}));

