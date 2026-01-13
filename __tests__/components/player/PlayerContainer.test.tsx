import React from "react";
import { render } from "@testing-library/react-native";
import PlayerContainer from "@/components/player/PlayerContainer";

jest.mock("@/components/player/MiniPlayer", () => {
  const React = require("react");
  const { View, Text } = require("react-native");
  return {
    __esModule: true,
    default: () =>
      React.createElement(
        View,
        { testID: "mini-player" },
        React.createElement(Text, null, "MiniPlayer")
      ),
  };
});

jest.mock("@/components/player/Player", () => {
  const React = require("react");
  const { View, Text } = require("react-native");
  return {
    __esModule: true,
    default: () =>
      React.createElement(
        View,
        { testID: "full-player" },
        React.createElement(Text, null, "Player")
      ),
  };
});

jest.mock("@/components/onRepeat/player/OnRepeatPlayer", () => {
  const React = require("react");
  const { View, Text } = require("react-native");
  return {
    __esModule: true,
    default: () =>
      React.createElement(
        View,
        { testID: "on-repeat-player" },
        React.createElement(Text, null, "OnRepeatPlayer")
      ),
  };
});

jest.mock("@/hooks/audio/useAudioPlayer", () => ({
  useAudioPlayer: jest.fn(),
}));

jest.mock("@/hooks/stores/useAudioStore", () => ({
  useAudioStore: jest.fn(),
}));

jest.mock("@/hooks/stores/usePlayerStore", () => ({
  usePlayerStore: jest.fn(),
}));

jest.mock("@/hooks/stores/useOnRepeatStore", () => ({
  useOnRepeatStore: jest.fn(),
}));

const { useAudioPlayer } = require("@/hooks/audio/useAudioPlayer");
const { useAudioStore } = require("@/hooks/stores/useAudioStore");
const { usePlayerStore } = require("@/hooks/stores/usePlayerStore");
const { useOnRepeatStore } = require("@/hooks/stores/useOnRepeatStore");

describe("PlayerContainer", () => {
  const mockSong = {
    id: "song1",
    title: "Test Song",
    author: "Test Artist",
    image_path: "https://example.com/image.jpg",
    song_path: "https://example.com/song.mp3",
    video_path: null,
    lyrics: null,
    genre: "pop",
    created_at: "2024-01-01",
    like_count: 0,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    useAudioPlayer.mockReturnValue({
      isPlaying: false,
      togglePlayPause: jest.fn(),
      playNextSong: jest.fn(),
      playPrevSong: jest.fn(),
      seekTo: jest.fn(),
      setRepeat: jest.fn(),
      setShuffle: jest.fn(),
      progressPosition: 0,
      progressDuration: 180000,
    });

    useAudioStore.mockImplementation((selector) =>
      selector({
        currentSong: mockSong,
        repeatMode: 0,
        shuffle: false,
      })
    );

    usePlayerStore.mockImplementation((selector) =>
      selector({
        showPlayer: false,
        setShowPlayer: jest.fn(),
        isMiniPlayerVisible: true,
      })
    );

    useOnRepeatStore.mockImplementation((selector) =>
      selector({
        isVisible: false,
      })
    );
  });

  it("renders MiniPlayer when showPlayer is false", () => {
    const { getByTestId, queryByTestId } = render(<PlayerContainer />);

    expect(getByTestId("mini-player")).toBeTruthy();
    expect(queryByTestId("full-player")).toBeNull();
  });

  it("renders full Player when showPlayer is true", () => {
    usePlayerStore.mockImplementation((selector) =>
      selector({
        showPlayer: true,
        setShowPlayer: jest.fn(),
      })
    );

    const { getByTestId, queryByTestId } = render(<PlayerContainer />);

    expect(getByTestId("full-player")).toBeTruthy();
    expect(queryByTestId("mini-player")).toBeNull();
  });

  it("renders OnRepeatPlayer when isVisible is true", () => {
    useOnRepeatStore.mockImplementation((selector) =>
      selector({
        isVisible: true,
      })
    );

    const { getByTestId } = render(<PlayerContainer />);

    expect(getByTestId("on-repeat-player")).toBeTruthy();
  });

  it("does not render any player when currentSong is null", () => {
    useAudioStore.mockImplementation((selector) =>
      selector({
        currentSong: null,
        repeatMode: 0,
        shuffle: false,
      })
    );

    const { queryByTestId } = render(<PlayerContainer />);

    expect(queryByTestId("mini-player")).toBeNull();
    expect(queryByTestId("full-player")).toBeNull();
  });
});

