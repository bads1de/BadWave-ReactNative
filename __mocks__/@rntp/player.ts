// @rntp/player (v5) のモック
// v5 のプレイヤーメソッドはすべて同期的（Promise を返さない）
const mockTrackPlayer = {
  // セットアップ・設定
  setupPlayer: jest.fn(),
  setCommands: jest.fn(),
  // 再生制御
  play: jest.fn(),
  pause: jest.fn(),
  stop: jest.fn(),
  seekTo: jest.fn(),
  setVolume: jest.fn(),
  setRate: jest.fn(),
  setRepeatMode: jest.fn(),
  getRepeatMode: jest.fn().mockReturnValue("off"),
  isPlaying: jest.fn().mockReturnValue(false),
  // キュー操作
  addMediaItems: jest.fn(),
  insertMediaItems: jest.fn(),
  removeMediaItems: jest.fn(),
  clear: jest.fn(),
  skipToNext: jest.fn(),
  skipToPrevious: jest.fn(),
  skipToIndex: jest.fn(),
  getQueue: jest.fn().mockReturnValue([]),
  getActiveMediaItem: jest.fn().mockReturnValue(null),
  getActiveMediaItemIndex: jest.fn().mockReturnValue(null),
  // 状態・進捗
  getPlaybackState: jest.fn().mockReturnValue("ready"),
  getProgress: jest
    .fn()
    .mockReturnValue({ position: 0, duration: 0, buffered: 0 }),
  // イベント
  addEventListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
};

export default mockTrackPlayer;

// フック（v5）
export const useActiveMediaItem = jest.fn().mockReturnValue(null);
export const useIsPlaying = jest.fn().mockReturnValue(false);
export const useProgress = jest.fn().mockReturnValue({
  position: 0,
  duration: 0,
  buffered: 0,
});
export const usePlaybackState = jest.fn().mockReturnValue("ready");

// 列挙型（v5 は文字列 enum）
export const RepeatMode = {
  Off: "off",
  One: "one",
  All: "all",
} as const;

export const PlaybackState = {
  Idle: "idle",
  Ready: "ready",
  Buffering: "buffering",
  Ended: "ended",
  Error: "error",
} as const;

export const Event = {
  PlaybackState: "playback-state",
  PlaybackError: "playback-error",
  PlaybackQueueEnded: "playback-queue-ended",
  MediaItemTransition: "media-item-transition",
  PlaybackProgressUpdated: "playback-progress-updated",
} as const;

export const PlayerCommand = {
  Play: "play",
  Pause: "pause",
  PlayPause: "playPause",
  Next: "next",
  Previous: "previous",
  Seek: "seek",
  Stop: "stop",
  SkipForward: "skipForward",
  SkipBackward: "skipBackward",
} as const;
