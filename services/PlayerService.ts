/**
 * @fileoverview 音楽プレーヤーのコアサービス
 * このモジュールは、アプリケーション全体の音楽再生機能を管理します。
 * react-native-track-playerを使用して、以下の機能を提供します：
 * - プレーヤーの初期化と設定
 * - 再生制御
 * - キュー管理
 * - バックグラウンド再生
 * - メディアコントロール
 */

import TrackPlayer, {
  Event,
  Capability,
  AppKilledPlaybackBehavior,
  State,
} from "react-native-track-player";

/**
 * プレーヤーの初期設定を行う
 * @description
 * プレーヤーのセットアップと基本的な設定を行います。
 * 以下の処理を実行します：
 * 1. プレーヤーサービスの実行状態確認
 * 2. 新規セットアップ（未実行の場合）
 * 3. 基本設定の適用（自動割り込み処理、キャパビリティなど）
 *
 * @returns {Promise<boolean>} 初期設定が成功したかどうか
 * @throws {Error} セットアップに失敗した場合
 *
 * @example
 * ```typescript
 * try {
 *   const isSetup = await setupPlayer();
 *   if (isSetup) {
 *     console.log('プレーヤーの準備完了');
 *   }
 * } catch (error) {
 *   console.error('プレーヤーのセットアップに失敗:', error);
 * }
 * ```
 */
export async function setupPlayer(): Promise<boolean> {
  try {
    // サービスがすでに実行されているかチェック
    const isSetup = await isPlayerServiceRunning();

    if (isSetup) {
      return true;
    }

    // 新規セットアップ
    await TrackPlayer.setupPlayer({
      autoHandleInterruptions: true,
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
        Capability.SeekTo,
        Capability.SkipToPrevious,
      ],
    });

    return true;
  } catch (error) {
    console.error("プレイヤーのセットアップに失敗しました:", error);
    throw new Error("プレイヤーのセットアップに失敗しました");
  }
}

/**
 * プレイヤーのサービスが実行中かどうかをチェックする
 * @returns {Promise<boolean>} サービスが実行中かどうか
 */
async function isPlayerServiceRunning(): Promise<boolean> {
  try {
    const playbackState = await TrackPlayer.getPlaybackState();
    return playbackState.state !== State.None;
  } catch {
    // プレイヤーが初期化されていない場合、エラーが発生するのは正常な動作
    // エラーログを出力せず、falseを返す
    return false;
  }
}

/**
 * プレーヤーサービスのイベントハンドラー
 * @description
 * バックグラウンド実行時も含めた以下のイベントを処理します：
 * - リモート再生制御（再生、一時停止、次へ、前へ）
 * - 再生状態の変更
 * - エラー発生時の処理
 *
 * @example
 * ```typescript
 * // アプリケーションのエントリーポイントで登録
 * TrackPlayer.registerPlaybackService(() => playbackService);
 * ```
 */
export function playbackService() {
  return async () => {
    try {
      await TrackPlayer.addEventListener(Event.RemotePlay, () =>
        TrackPlayer.play()
      );
      await TrackPlayer.addEventListener(Event.RemotePause, () =>
        TrackPlayer.pause()
      );
      await TrackPlayer.addEventListener(Event.RemoteStop, () =>
        TrackPlayer.stop()
      );
      await TrackPlayer.addEventListener(Event.RemoteNext, () =>
        TrackPlayer.skipToNext()
      );
      await TrackPlayer.addEventListener(Event.RemotePrevious, () =>
        TrackPlayer.skipToPrevious()
      );
      await TrackPlayer.addEventListener(Event.RemoteSeek, (event) => {
        TrackPlayer.seekTo(event.position);
      });
      await TrackPlayer.addEventListener(Event.PlaybackError, (error) => {
        console.error("再生エラーが発生しました:", error);
      });
    } catch (error) {
      console.error(
        "プレイバックサービスの設定中にエラーが発生しました:",
        error
      );
      throw error;
    }
  };
}

// 型定義のエクスポート
export type { Capability };
