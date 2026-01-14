// hooks/TrackPlayer/utils.ts
import { Track } from "react-native-track-player";
import Song from "@/types";
import { OfflineStorageService } from "@/services/OfflineStorageService";

// グローバルインスタンス
let offlineStorageService: OfflineStorageService;

/**
 * OfflineStorageServiceのインスタンスを取得
 * テストではモックされる
 */
export function getOfflineStorageService(): OfflineStorageService {
  if (!offlineStorageService) {
    offlineStorageService = new OfflineStorageService();
  }
  return offlineStorageService;
}

/**
 * 曲データをTrackPlayerのトラック形式に変換
 * ローカルにダウンロードされている場合はローカルパスを使用
 */
export async function convertSongToTrack(song: Song): Promise<Track> {
  try {
    const storage = getOfflineStorageService();
    const localPath = await storage.getSongLocalPath(song.id);

    const track = {
      id: song.id,
      url: localPath || song.song_path, // ローカルパスがあればそれを使用、なければリモートURL
      title: song.title,
      artist: song.author,
      artwork: song.image_path,
      originalSong: song, // 元のSongオブジェクトを保持
    };
    return track;
  } catch (error) {
    console.error(`Error converting song to track: ${error}`);
    // エラー時はリモートURLを使用
    return {
      id: song.id,
      url: song.song_path,
      title: song.title,
      artist: song.author,
      artwork: song.image_path,
      originalSong: song, // 元のSongオブジェクトを保持
    };
  }
}

/**
 * 複数の曲をトラック形式に変換
 */
export async function convertToTracks(songs: Song[]): Promise<Track[]> {
  if (!songs || songs.length === 0) {
    return [];
  }

  // Promise.allを使用して並列処理
  const tracks = await Promise.all(
    songs.map((song) => convertSongToTrack(song))
  );
  return tracks;
}

/**
 * エラーをログに記録する単純なユーティリティ
 */
export function logError(error: unknown, context: string): void {
  console.error(`${context}:`, error);

  if (error && typeof error === "object" && "message" in error) {
    console.error("エラー詳細:", error.message);
  } else if (error instanceof Error) {
    console.error("エラー:", error.message);
  }
}

/**
 * 非同期操作を安全に実行するヘルパー関数
 * @param operation 実行する非同期操作
 * @param errorContext エラー時のコンテキスト情報
 * @returns 操作の結果またはundefined（エラー時）
 */
export async function safeAsyncOperation<T>(
  operation: () => Promise<T>,
  errorContext: string,
  onError?: (error: unknown) => void
): Promise<T | undefined> {
  try {
    return await operation();
  } catch (error) {
    logError(error, errorContext);

    if (onError) {
      onError(error);
    }

    return undefined;
  }
}
/**
 * Fisher-Yatesアルゴリズムを使用して配列をシャッフルする
 * 元の配列は変更せず、新しい配列を返す
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

