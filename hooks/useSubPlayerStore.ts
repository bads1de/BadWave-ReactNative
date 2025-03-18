import { create } from "zustand";
import Song from "@/types";

type SubPlayerState = {
  showSubPlayer: boolean;
  currentSongIndex: number;
  songs: Song[];
};

type SubPlayerActions = {
  setShowSubPlayer: (value: boolean) => void;
  setCurrentSongIndex: (index: number) => void;
  setSongs: (songs: Song[]) => void;
};

export const useSubPlayerStore = create<SubPlayerState & SubPlayerActions>(
  (set) => ({
    showSubPlayer: false,
    currentSongIndex: 0,
    songs: [],
    setShowSubPlayer: (value) => set({ showSubPlayer: value }),
    setCurrentSongIndex: (index) => set({ currentSongIndex: index }),
    setSongs: (songs) => set({ songs }),
  })
);
