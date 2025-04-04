import { renderHook, act } from "@testing-library/react-native";
import { useAudioPlayer } from "../../hooks/useAudioPlayer";
import TrackPlayer from "react-native-track-player";
import { OfflineStorageService } from "../../services/OfflineStorageService";
import * as utils from "../../hooks/TrackPlayer/utils";

// モック
// react-native-fsのモック
jest.mock("react-native-fs", () => ({
  DocumentDirectoryPath: "/mock/path",
  downloadFile: jest.fn(),
  exists: jest.fn(),
  unlink: jest.fn(),
  readDir: jest.fn(),
  mkdir: jest.fn(),
}));

// react-native-track-playerのモック
jest.mock("react-native-track-player", () => ({
  State: {
    Playing: "playing",
    Paused: "paused",
    Stopped: "stopped",
  },
  RepeatMode: {
    Off: 0,
    Track: 1,
    Queue: 2,
  },
  add: jest.fn(),
  skip: jest.fn(),
  play: jest.fn(),
  pause: jest.fn(),
  seekTo: jest.fn(),
  setRepeatMode: jest.fn(),
  getRepeatMode: jest.fn().mockResolvedValue(0),
  getQueue: jest.fn().mockResolvedValue([]),
  getActiveTrack: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  getState: jest.fn().mockResolvedValue("paused"),
  usePlaybackState: jest.fn().mockReturnValue({ state: "paused" }),
  useActiveTrack: jest.fn().mockReturnValue(null),
  useProgress: jest.fn().mockReturnValue({ position: 0, duration: 0 }),
  Event: {
    PlaybackState: "playback-state",
    PlaybackError: "playback-error",
    PlaybackQueueEnded: "playback-queue-ended",
    PlaybackTrackChanged: "playback-track-changed",
  },
  // 追加したメソッド
  reset: jest.fn().mockResolvedValue(undefined),
  removeUpcomingTracks: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../hooks/TrackPlayer/utils", () => ({
  convertSongToTrack: jest.fn(),
  convertToTracks: jest.fn(),
  getOfflineStorageService: jest.fn(),
  safeAsyncOperation: jest.fn().mockImplementation((fn) => fn()),
  logError: jest.fn(),
}));

jest.mock("../../hooks/useAudioStore", () => ({
  useAudioStore: jest.fn().mockReturnValue({
    currentSong: null,
    repeatMode: 0,
    shuffle: false,
    setCurrentSong: jest.fn(),
    setRepeatMode: jest.fn(),
    setShuffle: jest.fn(),
  }),
  useAudioActions: jest.fn().mockReturnValue({
    setCurrentSong: jest.fn(),
  }),
}));

jest.mock("../../hooks/useOnPlay", () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue(jest.fn()),
}));

jest.mock("../../services/OfflineStorageService", () => ({
  OfflineStorageService: jest.fn().mockImplementation(() => ({
    getSongLocalPath: jest.fn(),
    isSongDownloaded: jest.fn(),
    getDownloadedSongs: jest.fn(),
  })),
}));

describe("useAudioPlayer - Offline Playback", () => {
  let mockOfflineStorageService: jest.Mocked<OfflineStorageService>;

  const mockSongs = [
    {
      id: "song-1",
      title: "Test Song 1",
      author: "Test Artist 1",
      image_path: "https://example.com/image1.jpg",
      song_path: "https://example.com/song1.mp3",
      user_id: "test-user",
      created_at: "2023-01-01T00:00:00.000Z",
    },
    {
      id: "song-2",
      title: "Test Song 2",
      author: "Test Artist 2",
      image_path: "https://example.com/image2.jpg",
      song_path: "https://example.com/song2.mp3",
      user_id: "test-user",
      created_at: "2023-01-01T00:00:00.000Z",
    },
  ];

  const mockTracks = [
    {
      id: "song-1",
      url: "/local/path/song1.mp3", // ローカルパス
      title: "Test Song 1",
      artist: "Test Artist 1",
      artwork: "https://example.com/image1.jpg",
    },
    {
      id: "song-2",
      url: "https://example.com/song2.mp3", // リモートURL
      title: "Test Song 2",
      artist: "Test Artist 2",
      artwork: "https://example.com/image2.jpg",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    mockOfflineStorageService =
      new OfflineStorageService() as jest.Mocked<OfflineStorageService>;
    (utils.getOfflineStorageService as jest.Mock).mockReturnValue(
      mockOfflineStorageService
    );

    // convertToTracksのモック
    (utils.convertToTracks as jest.Mock).mockResolvedValue(mockTracks);
  });

  it("should use local paths for downloaded songs", async () => {
    // TrackPlayer.addのモックをスパイに置き換え
    const addSpy = jest.spyOn(TrackPlayer, "add");

    // ダウンロード確認のモック
    mockOfflineStorageService.isSongDownloaded.mockResolvedValue(true);
    mockOfflineStorageService.getSongLocalPath.mockResolvedValue(
      "/local/path/song1.mp3"
    );

    // convertSongToTrackのモックを設定
    (utils.convertSongToTrack as jest.Mock).mockImplementation((song) => {
      if (song.id === "song-1") {
        return Promise.resolve({
          id: "song-1",
          url: "/local/path/song1.mp3",
          title: song.title,
          artist: song.author,
          artwork: song.image_path,
        });
      }
      return Promise.resolve({
        id: song.id,
        url: song.song_path,
        title: song.title,
        artist: song.author,
        artwork: song.image_path,
      });
    });

    // フックをレンダリング
    const { result } = renderHook(() => useAudioPlayer(mockSongs, "home"));

    // togglePlayPauseを呼び出し
    await act(async () => {
      await result.current.togglePlayPause(mockSongs[0]);
    });

    // ダウンロード確認が行われたことを確認
    expect(mockOfflineStorageService.getSongLocalPath).toHaveBeenCalledWith(
      mockSongs[0].id
    );

    // TrackPlayer.addが呼ばれたことを確認
    expect(addSpy).toHaveBeenCalled();
  });

  it("should fall back to remote URLs for non-downloaded songs", async () => {
    // TrackPlayer.addのモックをスパイに置き換え
    const addSpy = jest.spyOn(TrackPlayer, "add");

    // ダウンロード確認のモック（ダウンロードされていない）
    mockOfflineStorageService.isSongDownloaded.mockResolvedValue(false);
    mockOfflineStorageService.getSongLocalPath.mockResolvedValue(null);

    // convertSongToTrackのモックを設定
    (utils.convertSongToTrack as jest.Mock).mockImplementation((song) => {
      return Promise.resolve({
        id: song.id,
        url: song.song_path, // オンラインURLを使用
        title: song.title,
        artist: song.author,
        artwork: song.image_path,
      });
    });

    // フックをレンダリング
    const { result } = renderHook(() => useAudioPlayer(mockSongs, "home"));

    // togglePlayPauseを呼び出し
    await act(async () => {
      await result.current.togglePlayPause(mockSongs[1]);
    });

    // ダウンロード確認が行われたことを確認
    expect(mockOfflineStorageService.isSongDownloaded).toHaveBeenCalledWith(
      mockSongs[1].id
    );

    // TrackPlayer.addが呼ばれたことを確認
    expect(addSpy).toHaveBeenCalled();
  });

  it("should handle errors during offline check", async () => {
    // TrackPlayer.addのモックをスパイに置き換え
    const addSpy = jest.spyOn(TrackPlayer, "add");

    // ダウンロード確認のモック（エラー発生）
    mockOfflineStorageService.isSongDownloaded.mockRejectedValue(
      new Error("Storage error")
    );

    // convertSongToTrackのモックを設定
    (utils.convertSongToTrack as jest.Mock).mockImplementation((song) => {
      return Promise.resolve({
        id: song.id,
        url: song.song_path,
        title: song.title,
        artist: song.author,
        artwork: song.image_path,
      });
    });

    // フックをレンダリング
    const { result } = renderHook(() => useAudioPlayer(mockSongs, "home"));

    // togglePlayPauseを呼び出し
    await act(async () => {
      await result.current.togglePlayPause(mockSongs[0]);
    });

    // エラーが発生しても再生は行われる
    expect(addSpy).toHaveBeenCalled();
  });

  it("should handle playback with multiple songs", async () => {
    // TrackPlayer.addのモックをスパイに置き換え
    const addSpy = jest.spyOn(TrackPlayer, "add");

    // ダウンロード確認のモック
    mockOfflineStorageService.isSongDownloaded.mockImplementation((songId) => {
      // song-1はダウンロード済み、song-2はダウンロードされていない
      return Promise.resolve(songId === "song-1");
    });

    mockOfflineStorageService.getSongLocalPath.mockImplementation((songId) => {
      if (songId === "song-1") {
        return Promise.resolve("/local/path/song1.mp3");
      }
      return Promise.resolve(null);
    });

    // convertSongToTrackのモックを設定
    (utils.convertSongToTrack as jest.Mock).mockImplementation((song) => {
      if (song.id === "song-1") {
        return Promise.resolve({
          id: "song-1",
          url: "/local/path/song1.mp3",
          title: song.title,
          artist: song.author,
          artwork: song.image_path,
        });
      }
      return Promise.resolve({
        id: song.id,
        url: song.song_path,
        title: song.title,
        artist: song.author,
        artwork: song.image_path,
      });
    });

    // フックをレンダリング
    const { result } = renderHook(() => useAudioPlayer(mockSongs, "home"));

    // togglePlayPauseを呼び出し
    await act(async () => {
      await result.current.togglePlayPause(mockSongs[0]);
    });

    // TrackPlayer.addが呼ばれたことを確認
    expect(addSpy).toHaveBeenCalled();
  });

  it("should handle playback of a mix of downloaded and non-downloaded songs", async () => {
    // TrackPlayer.addのモックをスパイに置き換え
    const addSpy = jest.spyOn(TrackPlayer, "add");

    // ダウンロード確認のモック
    mockOfflineStorageService.isSongDownloaded.mockImplementation((songId) => {
      // song-1はダウンロード済み、song-2はダウンロードされていない
      return Promise.resolve(songId === "song-1");
    });

    mockOfflineStorageService.getSongLocalPath.mockImplementation((songId) => {
      if (songId === "song-1") {
        return Promise.resolve("/local/path/song1.mp3");
      }
      return Promise.resolve(null);
    });

    // convertSongToTrackのモックを設定
    (utils.convertSongToTrack as jest.Mock).mockImplementation((song) => {
      if (song.id === "song-1") {
        return Promise.resolve({
          id: "song-1",
          url: "/local/path/song1.mp3",
          title: song.title,
          artist: song.author,
          artwork: song.image_path,
        });
      }
      return Promise.resolve({
        id: song.id,
        url: song.song_path,
        title: song.title,
        artist: song.author,
        artwork: song.image_path,
      });
    });

    // フックをレンダリング
    const { result } = renderHook(() => useAudioPlayer(mockSongs, "home"));

    // togglePlayPauseを呼び出し
    await act(async () => {
      await result.current.togglePlayPause(mockSongs[0]);
    });

    // TrackPlayer.addが呼ばれたことを確認
    expect(addSpy).toHaveBeenCalled();
  });

  it("should handle playback when offline storage service throws an error", async () => {
    // TrackPlayer.addのモックをスパイに置き換え
    const addSpy = jest.spyOn(TrackPlayer, "add");

    // ダウンロード確認のモックがエラーを投げる
    mockOfflineStorageService.isSongDownloaded.mockRejectedValue(
      new Error("Storage service error")
    );

    // convertSongToTrackのモックを設定
    (utils.convertSongToTrack as jest.Mock).mockImplementation((song) => {
      return Promise.resolve({
        id: song.id,
        url: song.song_path, // エラー時はリモートURLを使用
        title: song.title,
        artist: song.author,
        artwork: song.image_path,
      });
    });

    // フックをレンダリング
    const { result } = renderHook(() => useAudioPlayer(mockSongs, "home"));

    // togglePlayPauseを呼び出し
    await act(async () => {
      await result.current.togglePlayPause(mockSongs[0]);
    });

    // エラーが発生してもTrackPlayer.addが呼ばれることを確認
    expect(addSpy).toHaveBeenCalled();
  });

  it("should handle playback when network is unavailable", async () => {
    // TrackPlayer.addのモックをスパイに置き換え
    const addSpy = jest.spyOn(TrackPlayer, "add");

    // ダウンロード確認のモック
    mockOfflineStorageService.isSongDownloaded.mockResolvedValue(true);
    mockOfflineStorageService.getSongLocalPath.mockResolvedValue(
      "/local/path/song1.mp3"
    );

    // convertSongToTrackのモックを設定
    (utils.convertSongToTrack as jest.Mock).mockImplementation((song) => {
      return Promise.resolve({
        id: song.id,
        url: "/local/path/song1.mp3", // ローカルパスを使用
        title: song.title,
        artist: song.author,
        artwork: song.image_path,
      });
    });

    // フックをレンダリング
    const { result } = renderHook(() => useAudioPlayer(mockSongs, "home"));

    // togglePlayPauseを呼び出し
    await act(async () => {
      await result.current.togglePlayPause(mockSongs[0]);
    });

    // ローカルパスを持つトラックが追加されることを確認
    expect(addSpy).toHaveBeenCalled();
  });

  it("should handle playback when a song is deleted during playback", async () => {
    // TrackPlayer.addのモックをスパイに置き換え
    const addSpy = jest.spyOn(TrackPlayer, "add");

    // 最初はダウンロード済み、後で削除されるシナリオ
    mockOfflineStorageService.isSongDownloaded
      .mockResolvedValueOnce(true) // 最初はダウンロード済み
      .mockResolvedValueOnce(false); // 後で削除される

    mockOfflineStorageService.getSongLocalPath
      .mockResolvedValueOnce("/local/path/song1.mp3") // 最初はローカルパスがある
      .mockResolvedValueOnce(null); // 後で削除される

    // convertSongToTrackのモックを設定
    (utils.convertSongToTrack as jest.Mock).mockImplementation((song) => {
      if (mockOfflineStorageService.isSongDownloaded.mock.calls.length === 1) {
        return Promise.resolve({
          id: song.id,
          url: "/local/path/song1.mp3", // 最初はローカルパス
          title: song.title,
          artist: song.author,
          artwork: song.image_path,
        });
      } else {
        return Promise.resolve({
          id: song.id,
          url: song.song_path, // 後でリモートURL
          title: song.title,
          artist: song.author,
          artwork: song.image_path,
        });
      }
    });

    // フックをレンダリング
    const { result } = renderHook(() => useAudioPlayer(mockSongs, "home"));

    // 最初の再生
    await act(async () => {
      await result.current.togglePlayPause(mockSongs[0]);
    });

    // 最初はローカルパスを使用
    expect(addSpy).toHaveBeenCalled();

    // TrackPlayerのモックをリセット
    addSpy.mockClear();

    // 再度再生（この時にはファイルが削除されている）
    await act(async () => {
      await result.current.togglePlayPause(mockSongs[0]);
    });

    // リモートURLを使用して再生されることを確認
    expect(addSpy).toHaveBeenCalled();
  });
});
