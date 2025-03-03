import { useCallback, useEffect, useRef } from "react";
import { QueueManagerError } from "./queue";

type ErrorHandlerProps = {
  safeStateUpdate: (callback: () => void) => void;
  setIsPlaying: (isPlaying: boolean) => void;
};

/**
 * 安全な状態更新を行うためのカスタムフック
 */
export function useSafeStateUpdate(isMounted: React.MutableRefObject<boolean>) {
  return useCallback(
    (callback: () => void) => {
      if (isMounted.current) {
        callback();
      }
    },
    [isMounted]
  );
}

/**
 * エラーハンドリングを行うカスタムフック
 */
export function useErrorHandler({
  safeStateUpdate,
  setIsPlaying,
}: ErrorHandlerProps) {
  return useCallback(
    (error: unknown, context: string) => {
      console.error(`${context}:`, error);

      if (error instanceof QueueManagerError) {
        console.error("キュー管理エラー:", error.message);
      } else if (error instanceof Error) {
        console.error("エラー:", error.message);
      }

      safeStateUpdate(() => setIsPlaying(false));
    },
    [safeStateUpdate, setIsPlaying]
  );
}

/**
 * クリーンアップ関数を管理するカスタムフック
 */
export function useCleanup(isMounted: React.MutableRefObject<boolean>) {
  const cleanupFns = useRef<(() => void)[]>([]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      // 登録された全てのクリーンアップ関数を実行
      cleanupFns.current.forEach((cleanup) => cleanup());
      cleanupFns.current = [];
    };
  }, [isMounted]);

  return cleanupFns;
}
