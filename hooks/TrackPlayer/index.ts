// hooks/TrackPlayer/index.ts
// 型定義のエクスポート
export * from "./types";

// ユーティリティ関数のエクスポート
export * from "./utils";

// カスタムフックのエクスポート
export * from "./hooks";

// TrackPlayerの直接エクスポート
export { default as TrackPlayer } from "react-native-track-player";
export {
  State,
  RepeatMode,
  usePlaybackState,
  useActiveTrack,
  useProgress,
} from "react-native-track-player";
