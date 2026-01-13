import { create } from "zustand";

/**
 * @typedef {object} PlayerState
 * @property {boolean} showPlayer - プレイヤーUIを表示するかどうか
 */
type PlayerState = {
  showPlayer: boolean;
  isMiniPlayerVisible: boolean;
};

/**
 * @typedef {object} PlayerActions
 * @property {(value: boolean) => void} setShowPlayer - プレイヤーUIの表示状態を設定する
 * @property {(value: boolean) => void} setIsMiniPlayerVisible - ミニプレイヤーの表示状態を設定する
 */
type PlayerActions = {
  setShowPlayer: (value: boolean) => void;
  setIsMiniPlayerVisible: (value: boolean) => void;
};

/**
 * プレイヤーUIの表示状態を管理するZustandストア
 * @returns {PlayerState & PlayerActions}
 */
export const usePlayerStore = create<PlayerState & PlayerActions>((set) => ({
  showPlayer: false,
  setShowPlayer: (value) => set({ showPlayer: value }),
  isMiniPlayerVisible: true,
  setIsMiniPlayerVisible: (value) => set({ isMiniPlayerVisible: value }),
}));

