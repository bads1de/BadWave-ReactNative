import { useCallback, useEffect, useRef } from "react";

// エラーハンドラーの引数の型定義
type ErrorHandlerProps = {
  safeStateUpdate: (callback: () => void) => void;
  setIsPlaying: (isPlaying: boolean) => void;
};

/**
 * 安全な状態更新を行うためのカスタムフック
 * @param isMounted - コンポーネントがマウントされているかを示すref
 * @returns 安全に状態を更新する関数
 */
export function useSafeStateUpdate(isMounted: React.MutableRefObject<boolean>) {
  return useCallback(
    (callback: () => void) => {
      // コンポーネントがマウントされている場合のみ更新を実行
      if (isMounted.current) {
        callback();
      }
    },
    [isMounted]
  );
}

/**
 * エラーハンドリングを行うカスタムフック
 * @param safeStateUpdate - 安全に状態を更新する関数
 * @param setIsPlaying - 再生状態を設定する関数
 * @returns エラーハンドリングを実行する関数
 */
export function useErrorHandler({
  safeStateUpdate,
  setIsPlaying,
}: ErrorHandlerProps) {
  return useCallback(
    (error: unknown, context: string) => {
      console.error(`${context}:`, error);

      // エラーの種類に応じて適切なログを出力
      if (error && typeof error === "object" && "message" in error) {
        console.error("キュー管理エラー:", error.message);
      } else if (error instanceof Error) {
        console.error("エラー:", error.message);
      }

      // エラー発生時に再生を停止
      safeStateUpdate(() => setIsPlaying(false));
    },
    [safeStateUpdate, setIsPlaying]
  );
}

/**
 * クリーンアップ関数を管理するカスタムフック
 * @param isMounted - コンポーネントがマウントされているかを示すref
 * @returns クリーンアップ関数を格納する配列への参照
 */
export function useCleanup(isMounted: React.MutableRefObject<boolean>) {
  // クリーンアップ関数を格納する配列
  const cleanupFns = useRef<(() => void)[]>([]);

  useEffect(() => {
    // コンポーネントのマウント時の処理
    isMounted.current = true;

    // コンポーネントのアンマウント時の処理
    return () => {
      isMounted.current = false;
      // 登録された全てのクリーンアップ関数を実行
      cleanupFns.current.forEach((cleanup) => cleanup());
      // クリーンアップ関数の配列をリセット
      cleanupFns.current = [];
    };
  }, [isMounted]);

  return cleanupFns;
}
