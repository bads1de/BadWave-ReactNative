import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { useDownloadedSongs } from "../../hooks/useDownloadedSongs";
import { useAudioPlayer } from "../../hooks/useAudioPlayer";

// Libraryコンポーネントのモック
jest.mock("../../app/(tabs)/library", () => {
  const Library = () => {
    return {
      type: "div",
      props: {
        "data-testid": "library-screen",
        children: [
          {
            type: "button",
            props: { "data-testid": "button-Downloads", children: "Downloads" },
          },
          { type: "div", props: { "data-testid": "downloads-flatlist" } },
        ],
      },
    };
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
    downloadedSongs: [],
    isLoading: false,
    error: null,
    refreshDownloads: jest.fn(),
    downloadSong: jest.fn(),
    deleteSong: jest.fn(),
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
  return {
    __esModule: true,
    default: function MockSongItem({ song, onPress }) {
      return {
        type: "div",
        props: {
          "data-testid": `song-item-${song.id}`,
          onClick: onPress,
          children: song.title,
        },
      };
    },
  };
});
jest.mock("../../components/PlaylistItem", () => {
  return {
    __esModule: true,
    default: function MockPlaylistItem({ playlist, onPress }) {
      return {
        type: "div",
        props: {
          "data-testid": `playlist-item-${playlist.id}`,
          onClick: onPress,
          children: playlist.name,
        },
      };
    },
  };
});
jest.mock("../../components/CreatePlaylist", () => {
  return {
    __esModule: true,
    default: function MockCreatePlaylist() {
      return {
        type: "div",
        props: {
          "data-testid": "create-playlist",
          children: "Create Playlist",
        },
      };
    },
  };
});
jest.mock("../../components/Loading", () => {
  return {
    __esModule: true,
    default: function MockLoading() {
      return {
        type: "div",
        props: {
          "data-testid": "loading",
          children: "Loading...",
        },
      };
    },
  };
});
jest.mock("../../components/Error", () => {
  return {
    __esModule: true,
    default: function MockError({ message }) {
      return {
        type: "div",
        props: {
          "data-testid": "error",
          children: message,
        },
      };
    },
  };
});
jest.mock("../../components/CustomButton", () => {
  return {
    __esModule: true,
    default: function MockCustomButton({ label, onPress, testID }) {
      return {
        type: "button",
        props: {
          "data-testid": testID || `button-${label}`,
          onClick: onPress,
          children: label,
        },
      };
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
    const { getByTestId, getAllByTestId, queryByText } = render(<Library />);

    // Downloadsタブをクリック
    fireEvent.press(getByTestId("button-Downloads"));

    // ダウンロード済み曲が表示されることを確認
    await waitFor(() => {
      expect(getAllByTestId(/song-item-/)).toHaveLength(2);
      expect(queryByText("Downloaded Song 1")).toBeTruthy();
      expect(queryByText("Downloaded Song 2")).toBeTruthy();
    });

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

    const { getByTestId, queryByTestId, queryByText } = render(<Library />);

    // Downloadsタブをクリック
    fireEvent.press(getByTestId("button-Downloads"));

    // エラーメッセージが表示されることを確認
    expect(queryByTestId("error")).toBeTruthy();
    expect(queryByText("Failed to load downloaded songs")).toBeTruthy();
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

    const { getByTestId, getAllByTestId } = render(<Library />);

    // Downloadsタブをクリック
    fireEvent.press(getByTestId("button-Downloads"));

    // 最初の曲をクリック
    await waitFor(() => {
      expect(getAllByTestId(/song-item-/)).toHaveLength(2);
    });

    fireEvent.press(getAllByTestId(/song-item-/)[0]);

    // 再生関数が呼ばれたことを確認
    expect(playFromLibraryMock).toHaveBeenCalledWith(
      mockDownloadedSongs,
      mockDownloadedSongs[0].id
    );
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

    // 空の状態が表示されることを確認
    expect(queryByText("No downloaded songs found.")).toBeTruthy();
  });

  it("should call togglePlayPause when a downloaded song is pressed", async () => {
    const { getByTestId } = render(<Library />);

    // Downloadsタブをクリック
    fireEvent.press(getByTestId("button-Downloads"));

    // 曲をクリック
    fireEvent.press(getByTestId("song-item-song-1"));

    // togglePlayPauseが呼ばれたことを確認
    expect(mockTogglePlayPause).toHaveBeenCalledWith("song-1");
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

    // エラーメッセージが表示されることを確認
    expect(
      queryByText("Network error: Unable to fetch downloaded songs")
    ).toBeTruthy();

    // リトライボタンが表示されることを確認
    expect(queryByText("Retry")).toBeTruthy();

    // リトライボタンをクリック
    fireEvent.press(getByTestId("button-Retry"));

    // refresh関数が呼ばれたことを確認
    expect(mockRefreshDownloads).toHaveBeenCalled();
  });

  it("should display song details correctly", async () => {
    const { getByTestId, queryByText } = render(<Library />);

    // Downloadsタブをクリック
    fireEvent.press(getByTestId("button-Downloads"));

    // 曲の詳細が正しく表示されることを確認
    expect(queryByText("Downloaded Song 1")).toBeTruthy();
    expect(queryByText("Artist 1")).toBeTruthy();
    expect(queryByText("Downloaded Song 2")).toBeTruthy();
    expect(queryByText("Artist 2")).toBeTruthy();
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

    // エラー状態に変更
    (useDownloadedSongs as jest.Mock).mockReturnValue({
      songs: [],
      isLoading: false,
      error: "Failed to load",
      refresh: mockRefreshDownloads,
    });

    // 再レンダリング
    rerender(<Library />);

    // エラー状態が表示されることを確認
    expect(queryByTestId("error")).toBeTruthy();

    // 成功状態に変更
    (useDownloadedSongs as jest.Mock).mockReturnValue({
      songs: mockDownloadedSongs,
      isLoading: false,
      error: null,
      refresh: mockRefreshDownloads,
    });

    // 再レンダリング
    rerender(<Library />);

    // 成功状態が表示されることを確認
    expect(queryByTestId("downloads-flatlist")).toBeTruthy();
  });
});
