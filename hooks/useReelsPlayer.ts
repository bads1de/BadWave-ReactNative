import { useVideoPlayer, VideoSource } from "expo-video";
import { useEffect } from "react";

/**
 * リール専用のビデオプレイヤーを管理するためのカスタムフック。
 * リールの表示状態に基づいてビデオの再生を制御し、ビデオが終了したときのコールバックを提供します。
 *
 * @param source 再生するビデオソース。
 * @param isVisible リールが現在表示されているかどうかを示すブーリアン値。
 * @param onFinish ビデオの再生が終了したときに実行されるオプションのコールバック関数。
 * @returns useVideoPlayer からのビデオプレイヤーインスタンス。
 */
export const useReelsPlayer = (
  source: VideoSource,
  isVisible: boolean,
  onFinish?: () => void
) => {
  const player = useVideoPlayer(source);

  useEffect(() => {
    // リールの表示状態に基づいてビデオを再生または一時停止します。
    if (isVisible) {
      player.play();
    } else {
      player.pause();
    }
  }, [isVisible, player]);

  useEffect(() => {
    // ビデオが終了したときにonFinishコールバックをトリガーするために、「playToEnd」イベントを購読します。
    const subscription = player.addListener("playToEnd", () => {
      if (onFinish) {
        onFinish();
      }
    });

    // コンポーネントがアンマウントされるか、依存関係が変更されたときにイベントリスナーをクリーンアップします。
    return () => {
      subscription.remove();
    };
  }, [player, onFinish]);

  return player;
};
