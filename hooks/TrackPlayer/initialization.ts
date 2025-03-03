import { useEffect, useRef } from "react";
import TrackPlayer from "react-native-track-player";

/**
 * プレイヤーの初期化を管理するカスタムフック
 *
 * `usePlayerInitialization` は、プレイヤーの初期化を管理するカスタムフックです。
 * このフックは、プレイヤーの初期化が完了したかどうかを示す `isPlayerInitialized` を返します。
 *
 * @returns プレイヤーの初期化が完了したかどうかを示す `isPlayerInitialized`
 */
export function usePlayerInitialization() {
  // プレイヤーの初期化状態を追跡するref
  const isPlayerInitialized = useRef(false);

  useEffect(() => {
    // プレイヤーを初期化する非同期関数
    const initializePlayer = async () => {
      try {
        if (!isPlayerInitialized.current) {
          // プレイヤーのセットアップ
          await TrackPlayer.setupPlayer();
          isPlayerInitialized.current = true;
          console.log("プレイヤーのセットアップが完了しました");
        }
      } catch (error) {
        // エラーハンドリング
        console.error(
          "プレイヤーのセットアップ中にエラーが発生しました:",
          error
        );
        isPlayerInitialized.current = false;
      }
    };

    // コンポーネントのマウント時にプレイヤーを初期化
    initializePlayer();
  }, []);

  // 現在のプレイヤー初期化状態を返す
  return {
    isPlayerInitialized: isPlayerInitialized.current,
  };
}
