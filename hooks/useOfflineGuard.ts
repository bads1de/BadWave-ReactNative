import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { Alert } from "react-native";
import { useCallback } from "react";

/**
 * オフライン時の操作を制御するカスタムフック
 * オンライン時のみ操作を実行し、オフライン時はアラートを表示
 */
export function useOfflineGuard() {
  const { isOnline } = useNetworkStatus();

  /**
   * オンライン時のみ操作を実行するラッパー関数
   * @param action 実行したい操作
   * @param offlineMessage オフライン時に表示するメッセージ（省略可）
   */
  const guardAction = useCallback(
    <T extends unknown[]>(
      action: (...args: T) => void | Promise<void>,
      offlineMessage?: string
    ) => {
      return async (...args: T) => {
        if (!isOnline) {
          Alert.alert(
            "オフラインです",
            offlineMessage || "この操作にはインターネット接続が必要です",
            [{ text: "OK" }]
          );
          return;
        }
        await action(...args);
      };
    },
    [isOnline]
  );

  /**
   * 現在オンラインかどうかを確認する関数
   * @param showAlert trueならオフライン時にアラートを表示
   */
  const checkOnline = useCallback(
    (showAlert = true): boolean => {
      if (!isOnline && showAlert) {
        Alert.alert(
          "オフラインです",
          "この操作にはインターネット接続が必要です",
          [{ text: "OK" }]
        );
      }
      return isOnline;
    },
    [isOnline]
  );

  return {
    isOnline,
    guardAction,
    checkOnline,
  };
}

export default useOfflineGuard;
