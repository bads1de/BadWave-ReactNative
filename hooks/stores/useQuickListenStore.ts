import { create } from "zustand";
import Song from "@/types";

/**
 * Quick Listen 機能の状態管理ストア
 *
 * 重要: open アクションは songs, currentIndex, isVisible を
 * 一度にアトミックに更新することで、レースコンディションを防止します。
 */

type QuickListenState = {
  /** Quick Listen 画面が表示されているかどうか */
  isVisible: boolean;
  /** プレビュー対象の曲リスト */
  songs: Song[];
  /** 現在表示/再生中の曲のインデックス */
  currentIndex: number;
  /** プレビュー再生時間（秒） */
  previewDuration: number;
};

type QuickListenActions = {
  /**
   * Quick Listen を開く（アトミック更新）
   * @param songs プレビュー対象の曲リスト
   * @param startIndex 開始時の曲インデックス
   */
  open: (songs: Song[], startIndex: number) => void;
  /** Quick Listen を閉じてリセット */
  close: () => void;
  /** 現在のインデックスを更新（スワイプ時） */
  setCurrentIndex: (index: number) => void;
  /** プレビュー時間を設定 */
  setPreviewDuration: (duration: number) => void;
};

const initialState: QuickListenState = {
  isVisible: false,
  songs: [],
  currentIndex: 0,
  previewDuration: 15,
};

export const useQuickListenStore = create<
  QuickListenState & QuickListenActions
>((set) => ({
  ...initialState,

  open: (songs, startIndex) =>
    set({
      songs,
      currentIndex: startIndex,
      isVisible: true,
    }),

  close: () =>
    set({
      isVisible: false,
      songs: [],
      currentIndex: 0,
    }),

  setCurrentIndex: (index) => set({ currentIndex: index }),

  setPreviewDuration: (duration) => set({ previewDuration: duration }),
}));
