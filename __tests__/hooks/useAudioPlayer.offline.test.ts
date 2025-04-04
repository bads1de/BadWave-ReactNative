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

    // フックをレンダリング
    const { result } = renderHook(() => useAudioPlayer(mockSongs, "home"));

    // togglePlayPauseを呼び出し
    await act(async () => {
      await result.current.togglePlayPause("song-1");
    });

    // TrackPlayer.addが正しいトラックで呼ばれたことを確認
    expect(utils.convertToTracks).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ id: "song-1" })])
    );

    // ローカルパスを持つトラックが追加されたことを確認
    expect(addSpy).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: "song-1",
          url: "/local/path/song1.mp3",
        }),
      ])
    );
  });

  it("should fall back to remote URLs for non-downloaded songs", async () => {
    // TrackPlayer.addのモックをスパイに置き換え
    const addSpy = jest.spyOn(TrackPlayer, "add");

    // フックをレンダリング
    const { result } = renderHook(() => useAudioPlayer(mockSongs, "home"));

    // togglePlayPauseを呼び出し
    await act(async () => {
      await result.current.togglePlayPause("song-2");
    });

    // TrackPlayer.addが正しいトラックで呼ばれたことを確認
    expect(utils.convertToTracks).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ id: "song-2" })])
    );

    // リモートURLを持つトラックが追加されたことを確認
    expect(addSpy).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: "song-2",
          url: "https://example.com/song2.mp3",
        }),
      ])
    );
  });

  it("should handle playback of a mix of downloaded and non-downloaded songs", async () => {
    // TrackPlayer.addのモックをスパイに置き換え
    const addSpy = jest.spyOn(TrackPlayer, "add");

    // フックをレンダリング
    const { result } = renderHook(() => useAudioPlayer(mockSongs, "home"));

    // togglePlayPauseを呼び出し（最初の曲）
    await act(async () => {
      await result.current.togglePlayPause("song-1");
    });

    // 最初の曲がローカルパスで追加されたことを確認
    expect(addSpy).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: "song-1",
          url: "/local/path/song1.mp3",
        }),
      ])
    );

    // TrackPlayer.addをリセット
    addSpy.mockClear();

    // 次の曲を再生
    await act(async () => {
      await result.current.playNextSong();
    });

    // 次の曲がリモートURLで追加されたことを確認
    expect(TrackPlayer.skip).toHaveBeenCalledWith("song-2");
  });
});
