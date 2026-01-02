import { renderHook } from "@testing-library/react";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";

jest.mock("react-native-track-player", () => ({
  State: {
    Playing: "playing",
    Paused: "paused"
  },
  usePlaybackState: jest.fn(),
  RepeatMode: {
    Off: 0,
    Track: 1,
    Queue: 2
  },
  useActiveTrack: jest.fn(),
  useProgress: jest.fn(),
  play: jest.fn(),
  pause: jest.fn()
}));

jest.mock("@/hooks/useOnPlay", () => ({
  __esModule: true,
  default: jest.fn()
}));

jest.mock("@/hooks/stores/useAudioStore", () => ({
  useAudioStore: jest.fn(),
  useAudioActions: jest.fn()
}));

jest.mock("@/hooks/TrackPlayer", () => ({
  usePlayerState: jest.fn(),
  useQueueOperations: jest.fn(),
  logError: jest.fn(),
  safeAsyncOperation: jest.fn()
}));

const TrackPlayer = require("react-native-track-player");
const { useAudioStore, useAudioActions } = require("@/hooks/stores/useAudioStore");
const { usePlayerState, useQueueOperations } = require("@/hooks/TrackPlayer");

describe("useAudioPlayer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    TrackPlayer.usePlaybackState.mockReturnValue({ state: "paused" });
    TrackPlayer.useActiveTrack.mockReturnValue(null);
    TrackPlayer.useProgress.mockReturnValue({ position: 0, duration: 180 });
    useAudioStore.mockReturnValue({
      currentSong: null,
      repeatMode: 0,
      shuffle: false,
      setCurrentSong: jest.fn(),
      setRepeatMode: jest.fn(),
      setShuffle: jest.fn()
    });
    useAudioActions.mockReturnValue({
      updateCurrentSongAndState: jest.fn()
    });
    usePlayerState.mockReturnValue({
      songMap: {}
    });
    useQueueOperations.mockReturnValue({});
  });

  it("returns audio player state and controls", () => {
    const { result } = renderHook(() => useAudioPlayer());
    expect(result.current).toHaveProperty("isPlaying");
    expect(result.current).toHaveProperty("progressPosition");
    expect(result.current).toHaveProperty("progressDuration");
  });
});
