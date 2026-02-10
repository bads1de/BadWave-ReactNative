import { create } from "zustand";
import { storage } from "@/lib/storage/mmkv-storage";
import { SEARCH_HISTORY_STORAGE_KEY } from "@/constants";

/** 検索履歴の最大保存件数 */
export const MAX_HISTORY_SIZE = 20;

/** ストレージキーの re-export（テスト用） */
export { SEARCH_HISTORY_STORAGE_KEY };

interface SearchHistoryState {
  /** 検索履歴（新しい順） */
  history: string[];
}

interface SearchHistoryActions {
  /**
   * 検索キーワードを履歴に追加する
   * - 空文字・空白のみは無視
   * - 前後の空白はトリム
   * - 重複がある場合は先頭に移動
   * - 最大件数を超えた場合は古いものから削除
   * @param query 検索キーワード
   */
  addQuery: (query: string) => void;

  /**
   * 指定したキーワードを履歴から削除する
   * @param query 削除するキーワード
   */
  removeQuery: (query: string) => void;

  /** 履歴を全て削除する */
  clearHistory: () => void;

  /** MMKV から履歴を復元する */
  loadHistory: () => void;
}

/**
 * MMKV に履歴を永続化するヘルパー関数
 */
function persistHistory(history: string[]): void {
  storage.set(SEARCH_HISTORY_STORAGE_KEY, JSON.stringify(history));
}

/**
 * 検索履歴を管理する Zustand ストア
 *
 * - MMKV で永続化
 * - 最大 MAX_HISTORY_SIZE 件まで保存
 * - 新しいキーワードが先頭に追加される
 */
export const useSearchHistoryStore = create<
  SearchHistoryState & SearchHistoryActions
>((set) => ({
  history: [],

  addQuery: (query: string) => {
    const trimmed = query.trim();
    if (trimmed.length === 0) return;

    set((state) => {
      // 重複を除去して先頭に追加
      const filtered = state.history.filter((q) => q !== trimmed);
      const newHistory = [trimmed, ...filtered].slice(0, MAX_HISTORY_SIZE);

      // MMKV に永続化
      persistHistory(newHistory);

      return { history: newHistory };
    });
  },

  removeQuery: (query: string) => {
    set((state) => {
      const newHistory = state.history.filter((q) => q !== query);

      // MMKV に永続化
      persistHistory(newHistory);

      return { history: newHistory };
    });
  },

  clearHistory: () => {
    storage.delete(SEARCH_HISTORY_STORAGE_KEY);
    set({ history: [] });
  },

  loadHistory: () => {
    try {
      const saved = storage.getString(SEARCH_HISTORY_STORAGE_KEY);
      if (!saved) return;

      const parsed = JSON.parse(saved);

      if (Array.isArray(parsed)) {
        set({ history: parsed });
      }
    } catch {
      // 無効な JSON の場合は空配列のまま（フォールバック）
      set({ history: [] });
    }
  },
}));
