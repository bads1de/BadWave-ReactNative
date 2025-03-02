import { useEffect, useRef } from "react";
import TrackPlayer from "react-native-track-player";

/**
 * プレイヤーの初期化を管理するカスタムフック
 */
export function usePlayerInitialization() {
  const isPlayerInitialized = useRef(false);
  const isQueueInitialized = useRef(false);

  // プレイヤーの初期化
  useEffect(() => {
    const initializePlayer = async () => {
      try {
        const setupNeeded = (await TrackPlayer.getState()) === null;
        if (setupNeeded && !isPlayerInitialized.current) {
          await TrackPlayer.setupPlayer();
          isPlayerInitialized.current = true;
        }
      } catch (error) {
        // 初期化エラーは無視
      }
    };

    initializePlayer();
  }, []);

  // キューの初期化（プレイヤーの初期化後に実行）
  useEffect(() => {
    // 自動的なキューの初期化は行わない
    isQueueInitialized.current = true;
  }, []);

  return {
    isPlayerInitialized,
    isQueueInitialized,
  };
}
