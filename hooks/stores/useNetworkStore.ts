import { create } from "zustand";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";

interface NetworkStore {
  isOnline: boolean;
  _initialized: boolean;
  _init: () => () => void;
}

/**
 * ネットワーク状態をグローバルに管理するZustandストア
 * アプリ全体で1つのNetInfoリスナーのみを登録し、
 * 10個以上の各コンポーネントが個別にリスナーを持つ問題を解消します。
 */
export const useNetworkStore = create<NetworkStore>((set, get) => ({
  isOnline: true,
  _initialized: false,

  _init: () => {
    if (get()._initialized) return () => {};
    set({ _initialized: true });

    // 初期状態を取得
    NetInfo.fetch().then((state: NetInfoState) => {
      set({ isOnline: state.isConnected ?? true });
    });

    // 変更を監視 (全アプリで1つだけ)
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      set({ isOnline: state.isConnected ?? true });
    });

    return unsubscribe;
  },
}));
