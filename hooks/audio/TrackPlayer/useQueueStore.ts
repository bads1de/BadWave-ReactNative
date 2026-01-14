import { create } from "zustand";
import { QueueState } from "@/hooks/audio/TrackPlayer/types";

/**
 * キューの状態を管理するZustandストア
 */
interface QueueStore extends QueueState {
  setQueueState: (updater: (state: QueueState) => Partial<QueueState>) => void;
  resetQueueState: () => void;
}

const initialQueueState: QueueState = {
  isShuffleEnabled: false,
  originalQueue: [],
  currentQueue: [],
  lastProcessedTrackId: null,
  currentSongId: null,
  context: {
    type: null,
  },
};

export const useQueueStore = create<QueueStore>((set) => ({
  ...initialQueueState,

  /**
   * 状態を更新する
   */
  setQueueState: (updater) =>
    set((state) => {
      const partialState = updater(state);

      // 同じ値なら更新しない(簡易的な最適化)
      if (
        "currentSongId" in partialState &&
        partialState.currentSongId === state.currentSongId &&
        Object.keys(partialState).length === 1
      ) {
        return state;
      }

      return { ...state, ...partialState };
    }),

  /**
   * 状態をリセットする
   */
  resetQueueState: () => set(initialQueueState),
}));

