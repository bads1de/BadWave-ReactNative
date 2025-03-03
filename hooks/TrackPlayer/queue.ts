import { useCallback, MutableRefObject, useRef } from "react";
import TrackPlayer, { Track } from "react-native-track-player";
import type Song from "@/types";
import { convertToTracks } from "./track";
import { useSafeStateUpdate, useErrorHandler } from "./utils";
import useOnPlay from "../useOnPlay";

/**
 * キューの状態を表す型
 */
interface QueueState {
  isShuffleEnabled: boolean;
  originalQueue: Track[];
  context: {
    type: "playlist" | "liked" | null;
    id?: string;
  };
}

/**
 * キュー管理に関するエラー
 */
export class QueueManagerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QueueManagerError";
  }
}

/**
 * キュー管理を担当するシングルトンクラス
 */
export class QueueManager {
  private static instance: QueueManager;
  private state: QueueState;

  private constructor() {
    this.state = {
      isShuffleEnabled: false,
      originalQueue: [],
      context: {
        type: null,
      },
    };
  }

  /**
   * シングルトンインスタンスを取得
   */
  static getInstance(): QueueManager {
    if (!QueueManager.instance) {
      QueueManager.instance = new QueueManager();
    }
    return QueueManager.instance;
  }

  /**
   * 現在のシャッフル状態を取得
   */
  getShuffleState(): boolean {
    return this.state.isShuffleEnabled;
  }

  /**
   * シャッフル状態を設定
   * @param state 新しいシャッフル状態
   */
  setShuffleState(state: boolean): void {
    this.state = {
      ...this.state,
      isShuffleEnabled: state,
    };
  }

  /**
   * 元のキューを取得
   */
  getOriginalQueue(): Track[] {
    return [...this.state.originalQueue];
  }

  /**
   * 元のキューを設定
   * @param queue 新しいキュー
   * @throws {QueueManagerError} キューが無効な場合
   */
  setOriginalQueue(queue: Track[]): void {
    if (!Array.isArray(queue)) {
      throw new QueueManagerError("Invalid queue format");
    }

    this.state = {
      ...this.state,
      originalQueue: [...queue],
    };
  }

  /**
   * キューをクリア
   */
  clearOriginalQueue(): void {
    this.state = {
      ...this.state,
      originalQueue: [],
    };
  }

  /**
   * キューをシャッフル
   * @param currentTrack 現在再生中のトラック（先頭に固定）
   * @param queue シャッフルするキュー
   * @returns シャッフルされたトラックの配列
   * @throws {QueueManagerError} シャッフル処理に失敗した場合
   */
  shuffleQueue(currentTrack: Track | null, queue: Track[]): Track[] {
    try {
      if (!Array.isArray(queue)) {
        throw new QueueManagerError("Invalid queue format");
      }

      if (queue.length === 0) {
        return [];
      }

      if (!currentTrack) {
        // 現在のトラックがない場合は全体をシャッフル
        return this.fisherYatesShuffle([...queue]);
      }

      // 現在のトラックを除外してシャッフル
      const remainingTracks = queue.filter(
        (track) => track.id !== currentTrack.id
      );
      const shuffledTracks = this.fisherYatesShuffle(remainingTracks);

      return [currentTrack, ...shuffledTracks];
    } catch (error) {
      if (error instanceof QueueManagerError) {
        throw error;
      }
      throw new QueueManagerError(
        error instanceof Error
          ? error.message
          : "Unknown error occurred during shuffle"
      );
    }
  }

  /**
   * Fisher-Yatesアルゴリズムによる配列のシャッフル
   * @param array シャッフルする配列
   * @returns シャッフルされた新しい配列
   */
  private fisherYatesShuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * 現在の状態をリセット
   */
  /**
   * 現在の再生コンテキストを取得
   */
  getContext() {
    return { ...this.state.context };
  }

  /**
   * 再生コンテキストを設定
   */
  setContext(type: "playlist" | "liked" | null, id?: string) {
    this.state = {
      ...this.state,
      context: { type, id },
    };
  }

  /**
   * 現在の状態をリセット
   */
  reset(): void {
    this.state = {
      isShuffleEnabled: false,
      originalQueue: [],
      context: {
        type: null,
      },
    };
  }
}

// シングルトンインスタンスをエクスポート
export const queueManager = QueueManager.getInstance();

// 型定義をエクスポート
export type { QueueState };

interface UseQueueOperationsProps {
  songs: Song[];
  trackMap: Record<string, any>;
  setCurrentSong: (song: Song | null) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  shuffle: boolean;
  isMounted: MutableRefObject<boolean>;
  queueManager: QueueManager;
}

export function useQueueOperations({
  songs,
  trackMap,
  setCurrentSong,
  setIsPlaying,
  shuffle,
  isMounted,
  queueManager,
}: UseQueueOperationsProps) {
  // キュー操作中フラグ
  const isQueueOperationInProgress = useRef(false);

  // 最適化: 前回のトラックIDを追跡して、重複更新を防止
  const lastProcessedTrackId = useRef<string | null>(null);

  // ユーティリティ関数の初期化
  const safeStateUpdate = useSafeStateUpdate(isMounted);
  const handleError = useErrorHandler({ safeStateUpdate, setIsPlaying });

  // 再生回数更新関数を初期化
  const onPlay = useOnPlay();

  /**
   * 指定された曲を再生する (最適化版)
   */
  const playSong = useCallback(
    async (song: Song, playlistId?: string) => {
      if (!song || isQueueOperationInProgress.current) return;

      isQueueOperationInProgress.current = true;

      try {
        // 最適化: 即座に UI 状態を更新して体感速度を改善
        safeStateUpdate(() => {
          setCurrentSong(song);
          setIsPlaying(true);
        });

        // 最適化: 最後に処理されたトラックIDを更新
        lastProcessedTrackId.current = song.id;

        // 再生回数を更新
        await onPlay(song.id);

        // コンテキスト設定
        queueManager.setContext(playlistId ? "playlist" : "liked", playlistId);

        // 現在のキュー情報を確認
        const currentQueue = await TrackPlayer.getQueue();
        const selectedTrackIndex = currentQueue.findIndex(
          (track) => track.id === song.id
        );

        if (selectedTrackIndex !== -1) {
          // キューにすでに存在する場合は直接スキップ
          await TrackPlayer.skip(selectedTrackIndex);
          await TrackPlayer.play();
          isQueueOperationInProgress.current = false;
          return;
        }

        // キューに存在しない場合
        const track = trackMap[song.id];
        if (!track) {
          throw new Error("曲が見つかりません");
        }

        // キューをリセットして現在の曲を追加（UI応答性向上のため）
        await TrackPlayer.reset();
        await TrackPlayer.add([track]);

        // 再生開始
        const playPromise = TrackPlayer.play();

        // 非同期で残りの曲を追加（UIブロックを防止）
        setTimeout(() => {
          const remainingSongs = songs.filter((s) => s.id !== song.id);
          let remainingTracks;

          if (shuffle) {
            remainingTracks = queueManager.shuffleQueue(
              null,
              convertToTracks(remainingSongs)
            );
          } else {
            remainingTracks = convertToTracks(remainingSongs);
          }

          TrackPlayer.add(remainingTracks)
            .catch((e) => console.error("残りの曲の追加エラー:", e))
            .finally(() => {
              isQueueOperationInProgress.current = false;
            });
        }, 300);

        // 再生開始を待つ
        await playPromise;
      } catch (error) {
        handleError(error, "再生エラー");
        isQueueOperationInProgress.current = false;
      }
    },
    [
      songs,
      trackMap,
      setCurrentSong,
      setIsPlaying,
      shuffle,
      handleError,
      safeStateUpdate,
      onPlay,
      queueManager,
    ]
  );

  return {
    playSong,
    isQueueOperationInProgress,
    lastProcessedTrackId,
  };
}
