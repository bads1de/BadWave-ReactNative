import { Track } from "react-native-track-player";

/**
 * キューの状態を表す型
 */
interface QueueState {
  isShuffleEnabled: boolean;
  originalQueue: Track[];
  context: {
    type: 'playlist' | 'liked' | null;
    id?: string;
  };
}

/**
 * キュー管理に関するエラー
 */
export class QueueManagerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QueueManagerError';
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
      const remainingTracks = queue.filter(track => track.id !== currentTrack.id);
      const shuffledTracks = this.fisherYatesShuffle(remainingTracks);

      return [currentTrack, ...shuffledTracks];

    } catch (error) {
      if (error instanceof QueueManagerError) {
        throw error;
      }
      throw new QueueManagerError(
        error instanceof Error ? error.message : "Unknown error occurred during shuffle"
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
  setContext(type: 'playlist' | 'liked' | null, id?: string) {
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