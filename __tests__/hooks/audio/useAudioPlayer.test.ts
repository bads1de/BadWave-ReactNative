import { renderHook, waitFor, act } from "@testing-library/react-native";
import React from "react";
import { useAudioPlayer } from "@/hooks/audio/useAudioPlayer";

jest.mock("react-native-track-player", () => ({
  State: {
    Playing: "playing",
    Paused: "paused",
  },
  usePlaybackState: jest.fn(),
  RepeatMode: {
    Off: 0,
    Track: 1,
    Queue: 2,
  },
  useActiveTrack: jest.fn(),
  useProgress: jest.fn(),
  play: jest.fn(),
  pause: jest.fn(),
}));

jest.mock("@/hooks/audio/useOnPlay", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@/hooks/stores/useAudioStore", () => ({
  useAudioStore: jest.fn(),
  useAudioActions: jest.fn(),
}));

jest.mock("@/hooks/audio/TrackPlayer", () => ({
  usePlayerState: jest.fn(),
  useQueueOperations: jest.fn(),
  logError: jest.fn(),
  safeAsyncOperation: jest.fn((fn) => fn()),
}));

const TrackPlayer = require("react-native-track-player");
const useOnPlay = require("@/hooks/audio/useOnPlay").default;
const {
  useAudioStore,
  useAudioActions,
} = require("@/hooks/stores/useAudioStore");
const {
  usePlayerState,
  useQueueOperations,
} = require("@/hooks/audio/TrackPlayer");

describe("useAudioPlayer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    TrackPlayer.usePlaybackState.mockReturnValue({ state: "paused" });
    TrackPlayer.useActiveTrack.mockReturnValue(null);
    TrackPlayer.useProgress.mockReturnValue({ position: 0, duration: 180 });
    useAudioStore.mockImplementation((selector: (state: any) => unknown) =>
      selector({
        currentSong: null,
        repeatMode: 0,
        shuffle: false,
        setCurrentSong: jest.fn(),
        setRepeatMode: jest.fn(),
        setShuffle: jest.fn(),
      }),
    );
    useAudioActions.mockReturnValue({
      updateCurrentSongAndState: jest.fn(),
    });
    usePlayerState.mockReturnValue({
      songMap: {},
    });
    useQueueOperations.mockReturnValue({
      updateQueueWithContext: jest.fn(),
      toggleShuffle: jest.fn(),
      updateQueueState: jest.fn(),
    });
    useOnPlay.mockReturnValue(jest.fn().mockResolvedValue(true));
  });

  it("returns audio player state and controls", () => {
    const { result } = renderHook(() => useAudioPlayer());
    expect(result.current).toHaveProperty("isPlaying");
  });

  it("activeTrack が切り替わったら再生回数を更新する", async () => {
    const song = {
      id: "song-1",
      title: "Song 1",
      author: "Artist 1",
      count: "0",
      like_count: "0",
      song_path: "path/1",
      image_path: "img/1",
      created_at: "2024-01-01",
    };
    const mockOnPlay = jest.fn().mockResolvedValue(true);
    useOnPlay.mockReturnValue(mockOnPlay);

    let activeTrack: any = null;
    TrackPlayer.useActiveTrack.mockImplementation(() => activeTrack);
    usePlayerState.mockReturnValue({
      songMap: { [song.id]: song },
    });

    const { rerender } = renderHook(() => useAudioPlayer([song]));

    await act(async () => {
      activeTrack = { id: song.id, originalSong: song };
      rerender();
    });

    await waitFor(() => {
      expect(mockOnPlay).toHaveBeenCalledWith(song.id);
    });
  });

  it("初期 activeTrack は再生回数に加算しない", () => {
    const song = {
      id: "song-1",
      title: "Song 1",
      author: "Artist 1",
      count: "0",
      like_count: "0",
      song_path: "path/1",
      image_path: "img/1",
      created_at: "2024-01-01",
    };
    const mockOnPlay = jest.fn().mockResolvedValue(true);
    useOnPlay.mockReturnValue(mockOnPlay);

    TrackPlayer.useActiveTrack.mockReturnValue({
      id: song.id,
      originalSong: song,
    });
    usePlayerState.mockReturnValue({
      songMap: { [song.id]: song },
    });

    renderHook(() => useAudioPlayer([song]));

    expect(mockOnPlay).not.toHaveBeenCalled();
  });
});
