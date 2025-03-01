import { Track } from "react-native-track-player";

/**
 * 再生キューを管理するシングルトンクラス
 */
export class QueueManager {
  private static instance: QueueManager;
  private isShuffleEnabled: boolean = false;
  private originalQueue: Track[] = [];

  private constructor() {}

  static getInstance(): QueueManager {
    if (!QueueManager.instance) {
      QueueManager.instance = new QueueManager();
    }
    return QueueManager.instance;
  }

  getShuffleState(): boolean {
    return this.isShuffleEnabled;
  }

  setShuffleState(state: boolean): void {
    this.isShuffleEnabled = state;
  }

  getOriginalQueue(): Track[] {
    return [...this.originalQueue];
  }

  setOriginalQueue(queue: Track[]): void {
    this.originalQueue = [...queue];
  }

  clearOriginalQueue(): void {
    this.originalQueue = [];
  }

  /**
   * キューをシャッフルする（現在の曲は先頭に固定）
   */
  shuffleQueue(currentTrack: Track | null, queue: Track[]): Track[] {
    if (!currentTrack) {
      return [...queue].sort(() => Math.random() - 0.5);
    }

    const remainingTracks = queue.filter(track => track.id !== currentTrack.id);
    const shuffledTracks = remainingTracks.sort(() => Math.random() - 0.5);
    return [currentTrack, ...shuffledTracks];
  }
}

export const queueManager = QueueManager.getInstance();