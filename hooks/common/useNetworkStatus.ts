import { useState, useEffect } from "react";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";

/**
 * ネットワーク接続状態を監視するフック
 * @returns isOnline: ネットワーク接続状態
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // 初期状態を取得
    NetInfo.fetch().then((state: NetInfoState) => {
      setIsOnline(state.isConnected ?? true);
    });

    // 変更を監視
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setIsOnline(state.isConnected ?? true);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return { isOnline };
}

export default useNetworkStatus;

