/**
 * @fileoverview 音楽プレーヤーのコアサービス
 * このモジュールは、アプリケーション全体の音楽再生機能を管理します。
 * @rntp/playerを使用して、以下の機能を提供します：
 * - プレーヤーの初期化と設定
 * - 再生制御
 * - キュー管理
 * - バックグラウンド再生
 * - メディアコントロール
 */

import TrackPlayer, { Event, PlayerCommand } from "@rntp/player";

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
// モジュールレベルのセットアップ状態フラグ（v5 の setupPlayer は二重呼び出しで例外を投げる）
let isPlayerSetup = false;

export async function setupPlayer(): Promise<boolean> {
  if (isPlayerSetup) {
    return true;
  }

  try {
    // 新規セットアップ
    TrackPlayer.setupPlayer({
      contentType: "music",
      handleAudioBecomingNoisy: true,
      android: {
        wakeMode: "network",
        taskRemovedBehavior: "stop",
      },
    });

    // リモートコントロール（ロック画面・通知・カーオーディオ等）はネイティブ処理
    TrackPlayer.setCommands({
      capabilities: [
        PlayerCommand.PlayPause,
        PlayerCommand.Next,
        PlayerCommand.Previous,
        PlayerCommand.Seek,
        PlayerCommand.Stop,
      ],
      handling: "native",
    });

    isPlayerSetup = true;
    return true;
  } catch (error) {
    // すでにセットアップ済み（getPlaybackState が例外を投げない）なら成功扱い
    if (isPlayerServiceRunning()) {
      isPlayerSetup = true;
      return true;
    }
    console.error("プレイヤーのセットアップに失敗しました:", error);
    throw new Error("プレイヤーのセットアップに失敗しました");
  }
}

/**
 * プレイヤーのサービスが実行中かどうかをチェックする
 * @returns {boolean} サービスが実行中かどうか
 */
function isPlayerServiceRunning(): boolean {
  try {
    // 未初期化の場合は例外が投げられる
    TrackPlayer.getPlaybackState();
    return true;
  } catch {
    // プレイヤーが初期化されていない場合、エラーが発生するのは正常な動作
    // エラーログを出力せず、falseを返す
    return false;
  }
}

/**
 * プレーヤーサービスのイベントハンドラー
 * @description
 * リモートコントロール（再生・一時停止・次へ・前へ・シーク）は
 * setCommands の `handling: "native"` によりネイティブ側で処理されるため、
 * ここでは再生エラーの監視のみを行います。
 *
 * @example
 * ```typescript
 * // アプリケーションのエントリーポイントで一度だけ呼び出す
 * void playbackService()();
 * ```
 */
// グローバルフラグ：イベントリスナーの二重登録を防ぐ
let isServiceRegistered = false;

export function playbackService() {
  return async () => {
    if (isServiceRegistered) {
      return;
    }
    isServiceRegistered = true;

    try {
      TrackPlayer.addEventListener(Event.PlaybackError, (error) => {
        console.error("再生エラーが発生しました:", error);
      });
    } catch (error) {
      console.error(
        "プレイバックサービスの設定中にエラーが発生しました:",
        error,
      );
      isServiceRegistered = false; // エラー時はリセット
    }
  };
}

// テスト用のリセット関数 (内部状態クリア)
export function __resetPlaybackService() {
  isServiceRegistered = false;
  isPlayerSetup = false;
}

// 列挙型のエクスポート
export { PlayerCommand };
