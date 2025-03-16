// hooks/TrackPlayer/types.ts
import { Track } from "react-native-track-player";
import Song from "../../types";

/**
 * 再生コンテキストタイプ
 */
export type PlayContextType =
  | "home"
  | "playlist"
  | "liked"
  | "search"
  | "genre"
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
 * プレイヤーの状態
 */
export interface PlayerState {
  songMap: Record<string, Song>;
  trackMap: Record<string, Track>;
}

/**
 * エラーハンドラーのプロパティ
 */
export interface ErrorHandlerProps {
  safeStateUpdate: (callback: () => void) => void;
  setIsPlaying: (isPlaying: boolean) => void;
}
