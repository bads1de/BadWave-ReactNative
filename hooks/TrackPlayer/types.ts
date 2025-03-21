// hooks/TrackPlayer/types.ts
import { Track } from "react-native-track-player";

/**
 * 再生コンテキストタイプ
 */
export type PlayContextType =
  | "home"
  | "playlist"
  | "liked"
  | "search"
  | "genre"
  | "topPlayedSongs"
  | "forYou"
  | null;

/**
 * 再生コンテキスト情報
 */
export interface PlayContext {
  type: PlayContextType;
  id?: string;
  sectionId?: string;
}

/**
 * キューの状態
 */
export interface QueueState {
  isShuffleEnabled: boolean;
  originalQueue: Track[];
  currentQueue: { id: string }[];
  lastProcessedTrackId: string | null;
  currentSongId: string | null;
  context: PlayContext;
}

/**
 * キュー操作の結果型
 */
export interface QueueOperationResult {
  success: boolean;
  errorMessage?: string;
}
