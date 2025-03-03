import { useEffect, useRef, useState } from "react";
import TrackPlayer from "react-native-track-player";
import { getPlaybackState } from "react-native-track-player/lib/src/trackPlayer";

/**
 * プレイヤーの初期化を管理するカスタムフック
 *
 * `usePlayerInitialization` は、プレイヤーの初期化を管理するカスタムフックです。
 * このフックは、プレイヤーの初期化が完了したかどうかを示す `isInitialized` を返します。
 *
 * @returns プレイヤーの初期化状態を含むオブジェクト
 */
export function usePlayerInitialization() {
  // プレイヤーの初期化状態を追跡するstate
  const [isInitialized, setIsInitialized] = useState(false);
  const initializationAttempted = useRef(false);

  useEffect(() => {
    // プレイヤーを初期化する非同期関数
    const initializePlayer = async () => {
      if (initializationAttempted.current) return;

      try {
        initializationAttempted.current = true;
        await TrackPlayer.setupPlayer();
        setIsInitialized(true);
        console.log("プレイヤーのセットアップが完了しました");
      } catch (error) {
        console.error(
          "プレイヤーのセットアップ中にエラーが発生しました:",
          error
        );
        setIsInitialized(false);
        initializationAttempted.current = false;
      }
    };

    // コンポーネントのマウント時にプレイヤーを初期化
    initializePlayer();
  }, []);

  return {
    isInitialized,
  };
}

// プレイヤーの初期化状態を確認するユーティリティ関数
export async function ensurePlayerInitialized() {
  try {
    const state = (await getPlaybackState()).state;
    return true;
  } catch (error: any) {
    if (error.message?.includes("player is not initialized")) {
      await TrackPlayer.setupPlayer();
    }
    return false;
  }
}
