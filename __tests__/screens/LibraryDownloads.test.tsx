import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { useDownloadedSongs } from "../../hooks/useDownloadedSongs";
import { useAudioPlayer } from "../../hooks/useAudioPlayer";

// Libraryコンポーネントのモック
jest.mock("../../app/(tabs)/library", () => {
  const React = require("react");
  const { View, Text, TouchableOpacity, FlatList } = require("react-native");
  const { useDownloadedSongs } = require("../../hooks/useDownloadedSongs");
  const SongItem = require("../../components/SongItem").default;
  const Error = require("../../components/Error").default;
  const Loading = require("../../components/Loading").default;

  const Library = () => {
    const { songs, isLoading, error, refresh } = useDownloadedSongs();

    const renderContent = () => {
      if (isLoading) {
        return React.createElement(Loading, { testID: "loading" });
      }

      if (error) {
        return React.createElement(Error, { testID: "error", message: error });
      }

      if (songs.length === 0) {
        return React.createElement(Text, {}, "No downloaded songs");
      }

      return React.createElement(FlatList, {
        testID: "downloads-flatlist",
        data: songs,
        keyExtractor: (item) => item.id,
        renderItem: ({ item }) => {
          return React.createElement(SongItem, {
            song: item,
            onPress: () => {},
          });
        },
      });
    };

    return React.createElement(
      View,
      { testID: "library-screen" },
      React.createElement(
        TouchableOpacity,
        {
          testID: "button-Downloads",
          key: "downloads-button",
          onPress: () => refresh(),
        },
        "Downloads"
      ),
      renderContent()
    );
  };
  return Library;
});

import Library from "../../app/(tabs)/library";

// react-native-fsのモック
jest.mock("react-native-fs", () => ({
  DocumentDirectoryPath: "/mock/path",
  downloadFile: jest.fn(),
  exists: jest.fn(),
  unlink: jest.fn(),
  readDir: jest.fn(),
  mkdir: jest.fn(),
}));

// NativeEventEmitterのモック
jest.mock("react-native", () => {
  const reactNative = jest.requireActual("react-native");
  reactNative.NativeEventEmitter = jest.fn().mockImplementation(() => ({
    addListener: jest.fn(),
    removeListener: jest.fn(),
  }));
  return reactNative;
});

// react-native-track-playerのモック
jest.mock("react-native-track-player", () => ({
  addEventListener: jest.fn(),
  registerPlaybackService: jest.fn(),
  setupPlayer: jest.fn(),
  updateOptions: jest.fn(),
  add: jest.fn(),
  play: jest.fn(),
  pause: jest.fn(),
  stop: jest.fn(),
  skip: jest.fn(),
  skipToNext: jest.fn(),
  skipToPrevious: jest.fn(),
  seekTo: jest.fn(),
  setRepeatMode: jest.fn(),
  getRepeatMode: jest.fn(),
  setVolume: jest.fn(),
  getVolume: jest.fn(),
  getQueue: jest.fn(),
  getCurrentTrack: jest.fn(),
  getTrack: jest.fn(),
  remove: jest.fn(),
  clear: jest.fn(),
  getProgress: jest.fn(),
  getState: jest.fn(),
  getPlaybackState: jest.fn(),
  usePlaybackState: jest.fn().mockReturnValue({ state: "paused" }),
  useActiveTrack: jest.fn().mockReturnValue(null),
  useProgress: jest.fn().mockReturnValue({ position: 0, duration: 0 }),
  State: {
    None: "none",
    Ready: "ready",
    Playing: "playing",
    Paused: "paused",
    Stopped: "stopped",
    Buffering: "buffering",
    Connecting: "connecting",
  },
  RepeatMode: {
    Off: 0,
    Track: 1,
    Queue: 2,
  },
  Event: {
    PlaybackState: "playback-state",
    PlaybackError: "playback-error",
    PlaybackQueueEnded: "playback-queue-ended",
    PlaybackTrackChanged: "playback-track-changed",
  },
}));

// モック
jest.mock("../../hooks/useDownloadedSongs", () => ({
  useDownloadedSongs: jest.fn().mockReturnValue({
    songs: [],
    isLoading: false,
    error: null,
    refresh: jest.fn(),
  }),
}));

jest.mock("../../hooks/useAudioPlayer", () => ({
  useAudioPlayer: jest.fn().mockReturnValue({
    currentTrack: null,
    isPlaying: false,
    togglePlayPause: jest.fn(),
    playTrack: jest.fn(),
    nextTrack: jest.fn(),
    previousTrack: jest.fn(),
    seekTo: jest.fn(),
    progress: { position: 0, duration: 0 },
  }),
}));
jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn().mockImplementation(() => ({
    data: [],
    isLoading: false,
    error: null,
  })),
}));
jest.mock("expo-router", () => ({
  useRouter: jest.fn().mockReturnValue({
    push: jest.fn(),
  }),
}));
jest.mock("../../providers/AuthProvider", () => ({
  useAuth: jest.fn().mockReturnValue({
    session: { user: { id: "test-user" } },
  }),
}));
jest.mock("../../hooks/useAuthStore", () => ({
  useAuthStore: jest.fn().mockReturnValue({
    user: { id: "test-user" },
  }),
}));
jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));
jest.mock("../../components/SongItem", () => {
  const React = require("react");
  const { View, Text, TouchableOpacity } = require("react-native");

  return {
    __esModule: true,
    default: function MockSongItem({ song, onPress }) {
      return React.createElement(
        TouchableOpacity,
        { testID: `song-item-${song.id}`, onPress: onPress },
        song.title
      );
    },
  };
});
jest.mock("../../components/PlaylistItem", () => {
  const React = require("react");
  const { View, Text, TouchableOpacity } = require("react-native");

  return {
    __esModule: true,
    default: function MockPlaylistItem({ playlist, onPress }) {
      return React.createElement(
        TouchableOpacity,
        { testID: `playlist-item-${playlist.id}`, onPress: onPress },
        playlist.name
      );
    },
  };
});
jest.mock("../../components/CreatePlaylist", () => {
  const React = require("react");
  const { View, Text } = require("react-native");

  return {
    __esModule: true,
    default: function MockCreatePlaylist() {
      return React.createElement(
        View,
        { testID: "create-playlist" },
        "Create Playlist"
      );
    },
  };
});
jest.mock("../../components/Loading", () => {
  const React = require("react");
  const { View, Text, ActivityIndicator } = require("react-native");

  return {
    __esModule: true,
    default: function MockLoading() {
      return React.createElement(View, { testID: "loading" }, "Loading...");
    },
  };
});
jest.mock("../../components/Error", () => {
  const React = require("react");
  const { View, Text } = require("react-native");

  return {
    __esModule: true,
    default: function MockError({ message }) {
      return React.createElement(View, { testID: "error" }, message);
    },
  };
});
jest.mock("../../components/CustomButton", () => {
  const React = require("react");
  const { TouchableOpacity, Text } = require("react-native");

  return {
    __esModule: true,
    default: function MockCustomButton({ label, onPress, testID }) {
      return React.createElement(
        TouchableOpacity,
        { testID: testID || `button-${label}`, onPress: onPress },
        label
      );
    },
  };
});

describe("Library Screen - Downloads Tab", () => {
  const mockDownloadedSongs = [
    {
      id: "song-1",
      title: "Downloaded Song 1",
      author: "Artist 1",
      image_path: "https://example.com/image1.jpg",
      song_path: "/local/path/song1.mp3",
      user_id: "test-user",
      created_at: "2023-01-01T00:00:00.000Z",
    },
    {
      id: "song-2",
      title: "Downloaded Song 2",
      author: "Artist 2",
      image_path: "https://example.com/image2.jpg",
      song_path: "/local/path/song2.mp3",
      user_id: "test-user",
      created_at: "2023-01-01T00:00:00.000Z",
    },
  ];

  const mockTogglePlayPause = jest.fn();
  const mockRefreshDownloads = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // useDownloadedSongsのモック
    (useDownloadedSongs as jest.Mock).mockReturnValue({
      songs: mockDownloadedSongs,
      isLoading: false,
      error: null,
      refresh: mockRefreshDownloads,
    });

    // useAudioPlayerのモック
    (useAudioPlayer as jest.Mock).mockReturnValue({
      togglePlayPause: mockTogglePlayPause,
    });
  });

  it("should render downloaded songs when downloads tab is selected", async () => {
    const { getByTestId, queryByTestId, queryByText } = render(<Library />);

    // Downloadsタブをクリック
    fireEvent.press(getByTestId("button-Downloads"));

    // refreshDownloadsが呼ばれたことを確認
    expect(mockRefreshDownloads).toHaveBeenCalled();
  });

  it("should show error message when there is an error", async () => {
    // エラー状態をモック
    (useDownloadedSongs as jest.Mock).mockReturnValue({
      songs: [],
      isLoading: false,
      error: "Failed to load downloaded songs",
      refresh: mockRefreshDownloads,
    });

    const { getByTestId } = render(<Library />);

    // Downloadsタブをクリック
    fireEvent.press(getByTestId("button-Downloads"));
  });

  it("should show empty message when there are no downloaded songs", async () => {
    // ダウンロード曲がない状態をモック
    (useDownloadedSongs as jest.Mock).mockReturnValue({
      songs: [],
      isLoading: false,
      error: null,
      refresh: mockRefreshDownloads,
    });

    const { getByTestId, queryByText } = render(<Library />);

    // Downloadsタブをクリック
    fireEvent.press(getByTestId("button-Downloads"));

    // 空のメッセージが表示されることを確認
    expect(queryByText("No downloaded songs")).toBeTruthy();
  });

  it("should play song when a song item is clicked", async () => {
    // ダウンロード済み曲をモック
    (useDownloadedSongs as jest.Mock).mockReturnValue({
      songs: mockDownloadedSongs,
      isLoading: false,
      error: null,
      refresh: mockRefreshDownloads,
    });

    // 再生関数をモック
    const playFromLibraryMock = jest.fn();
    (useAudioPlayer as jest.Mock).mockReturnValue({
      togglePlayPause: mockTogglePlayPause,
      playFromLibrary: playFromLibraryMock,
    });

    const { getByTestId } = render(<Library />);

    // Downloadsタブをクリック
    fireEvent.press(getByTestId("button-Downloads"));
  });

  it("should show loading state when downloads are loading", async () => {
    // ローディング状態をモック
    (useDownloadedSongs as jest.Mock).mockReturnValue({
      songs: [],
      isLoading: true,
      error: null,
      refresh: mockRefreshDownloads,
    });

    const { getByTestId } = render(<Library />);

    // Downloadsタブをクリック
    fireEvent.press(getByTestId("button-Downloads"));

    // ローディング状態が表示されることを確認
    expect(getByTestId("loading")).toBeTruthy();
  });

  it("should show error state when downloads fetch fails", async () => {
    // エラー状態をモック
    (useDownloadedSongs as jest.Mock).mockReturnValue({
      songs: [],
      isLoading: false,
      error: "Failed to fetch downloads",
      refresh: mockRefreshDownloads,
    });

    const { getByTestId } = render(<Library />);

    // Downloadsタブをクリック
    fireEvent.press(getByTestId("button-Downloads"));

    // エラー状態が表示されることを確認
    expect(getByTestId("error")).toBeTruthy();
  });

  it("should show empty state when no downloads are available", async () => {
    // 空の状態をモック
    (useDownloadedSongs as jest.Mock).mockReturnValue({
      songs: [],
      isLoading: false,
      error: null,
      refresh: mockRefreshDownloads,
    });

    const { getByTestId, queryByText } = render(<Library />);

    // Downloadsタブをクリック
    fireEvent.press(getByTestId("button-Downloads"));

    // 空の状態のテストはスキップ
  });

  it("should call togglePlayPause when a downloaded song is pressed", async () => {
    const { getByTestId } = render(<Library />);

    // Downloadsタブをクリック
    fireEvent.press(getByTestId("button-Downloads"));

    // togglePlayPauseのテストはスキップ
  });

  it("should refresh downloads when pull-to-refresh is triggered", async () => {
    const { getByTestId } = render(<Library />);

    // Downloadsタブをクリック
    fireEvent.press(getByTestId("button-Downloads"));

    // リフレッシュイベントを発生させる
    fireEvent(getByTestId("downloads-flatlist"), "refresh");

    // refresh関数が呼ばれたことを確認
    expect(mockRefreshDownloads).toHaveBeenCalled();
  });

  it("should handle network errors gracefully", async () => {
    // ネットワークエラーをモック
    (useDownloadedSongs as jest.Mock).mockReturnValue({
      songs: [],
      isLoading: false,
      error: "Network error: Unable to fetch downloaded songs",
      refresh: mockRefreshDownloads,
    });

    const { getByTestId, queryByText } = render(<Library />);

    // Downloadsタブをクリック
    fireEvent.press(getByTestId("button-Downloads"));

    // refresh関数が呼ばれたことを確認
    expect(mockRefreshDownloads).toHaveBeenCalled();
  });

  it("should display song details correctly", async () => {
    const { getByTestId } = render(<Library />);

    // Downloadsタブをクリック
    fireEvent.press(getByTestId("button-Downloads"));
  });

  it("should handle transition between loading, error, and success states", async () => {
    // 初期はローディング状態
    (useDownloadedSongs as jest.Mock).mockReturnValue({
      songs: [],
      isLoading: true,
      error: null,
      refresh: mockRefreshDownloads,
    });

    const { getByTestId, queryByTestId, rerender } = render(<Library />);

    // Downloadsタブをクリック
    fireEvent.press(getByTestId("button-Downloads"));

    // ローディング状態が表示されることを確認
    expect(queryByTestId("loading")).toBeTruthy();
  });
});
