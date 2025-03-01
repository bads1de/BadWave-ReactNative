import { EmitterSubscription } from 'react-native';
import TrackPlayer, {
  Event,
  Capability,
  AppKilledPlaybackBehavior,
} from "react-native-track-player";

/**
 * プレイヤーの初期設定を行う
 * プレイヤーのセットアップと基本的な設定を行います
 * @returns {Promise<boolean>} 初期設定が成功したかどうか
 * @throws {Error} セットアップに失敗した場合
 */
export async function setupPlayer(): Promise<boolean> {
  try {
    // すでにセットアップされているかチェック
    const isSetup = await TrackPlayer.getActiveTrackIndex()
      .then(() => true)
      .catch(() => false);

    if (isSetup) {
      return true;
    }

    // 新規セットアップ
    await TrackPlayer.setupPlayer({
      autoHandleInterruptions: true, // 電話などの割り込みを自動処理
    });

    await TrackPlayer.updateOptions({
      android: {
        appKilledPlaybackBehavior: AppKilledPlaybackBehavior.PausePlayback,
      },
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.Stop,
        Capability.SeekTo,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
      ],
      compactCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
      ],
      progressUpdateEventInterval: 2,
    });

    return true;
  } catch (error) {
    console.error("プレイヤーのセットアップに失敗しました:", error);
    throw new Error("プレイヤーのセットアップに失敗しました");
  }
}

/**
 * プレイバックサービスのイベントリスナーを設定
 * TrackPlayerのリモート制御イベントに対するハンドラーを登録します
 * @returns {Promise<void>}
 */
export function playbackService() {
  return async () => {
    try {
      await TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
      await TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
      await TrackPlayer.addEventListener(Event.RemoteStop, () => TrackPlayer.stop());
      await TrackPlayer.addEventListener(Event.RemoteNext, () => TrackPlayer.skipToNext());
      await TrackPlayer.addEventListener(Event.RemotePrevious, () => TrackPlayer.skipToPrevious());
      await TrackPlayer.addEventListener(Event.PlaybackError, (error) => {
        console.error("再生エラーが発生しました:", error);
      });
    } catch (error) {
      console.error("プレイバックサービスの設定中にエラーが発生しました:", error);
      throw error;
    }
  };
}

// 型定義のエクスポート
export type { Capability };