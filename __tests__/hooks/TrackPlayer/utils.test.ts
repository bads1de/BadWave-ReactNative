import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import * as utils from "../../../hooks/TrackPlayer/utils";
import {
  convertSongToTrack,
  convertToTracks,
} from "../../../hooks/TrackPlayer/utils";
import Song from "../../../types";
import { OfflineStorageService } from "../../../services/OfflineStorageService";

// OfflineStorageServiceのモック
jest.mock("../../../services/OfflineStorageService", () => {
  return {
    OfflineStorageService: jest.fn().mockImplementation(() => ({
      getSongLocalPath: jest.fn(),
      isSongDownloaded: jest.fn(),
    })),
  };
});

describe("TrackPlayer utils", () => {
  let mockOfflineStorageService: jest.Mocked<OfflineStorageService>;

  const mockSong: Song = {
    id: "song-1",
    title: "Test Song",
    author: "Test Artist",
    image_path: "https://example.com/image.jpg",
    song_path: "https://example.com/song.mp3",
    user_id: "test-user",
    created_at: "2023-01-01T00:00:00.000Z",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockOfflineStorageService =
      new OfflineStorageService() as jest.Mocked<OfflineStorageService>;

    // getOfflineStorageService関数をモック化
    jest
      .spyOn(utils, "getOfflineStorageService")
      .mockReturnValue(mockOfflineStorageService);

    // 各テストで必要なモックを設定
    mockOfflineStorageService.getSongLocalPath.mockImplementation(
      async (songId) => {
        if (
          songId === "song-1" &&
          mockOfflineStorageService.getSongLocalPath.mock.calls.length === 1
        ) {
          return null;
        } else if (
          songId === "song-1" &&
          mockOfflineStorageService.getSongLocalPath.mock.calls.length === 2
        ) {
          return "/local/path/to/song.mp3";
        } else if (
          songId === "song-1" &&
          mockOfflineStorageService.getSongLocalPath.mock.calls.length > 2
        ) {
          return "/local/path/to/song.mp3";
        } else if (songId === "song-2") {
          return null;
        }
        return null;
      }
    );
  });

  describe("convertSongToTrack", () => {
    it("should convert a song to a track with remote URL when not downloaded", async () => {
      // モックは既にbeforeEachで設定済み

      const track = await convertSongToTrack(mockSong);

      expect(track).toEqual({
        id: mockSong.id,
        url: mockSong.song_path,
        title: mockSong.title,
        artist: mockSong.author,
        artwork: mockSong.image_path,
      });
      expect(mockOfflineStorageService.getSongLocalPath).toHaveBeenCalledWith(
        mockSong.id
      );
    });

    it("should convert a song to a track with local path when downloaded", async () => {
      // モックは既にbeforeEachで設定済み
      const localPath = "/local/path/to/song.mp3";

      const track = await convertSongToTrack(mockSong);

      expect(track).toEqual({
        id: mockSong.id,
        url: localPath,
        title: mockSong.title,
        artist: mockSong.author,
        artwork: mockSong.image_path,
      });
      expect(mockOfflineStorageService.getSongLocalPath).toHaveBeenCalledWith(
        mockSong.id
      );
    });
  });

  describe("convertToTracks", () => {
    it("should convert multiple songs to tracks", async () => {
      // モックは既にbeforeEachで設定済み
      const localPath = "/local/path/to/song.mp3";

      const mockSongs = [
        mockSong,
        {
          ...mockSong,
          id: "song-2",
          title: "Test Song 2",
          user_id: "test-user",
          created_at: "2023-01-01T00:00:00.000Z",
        },
      ];

      const tracks = await convertToTracks(mockSongs);

      expect(tracks.length).toBe(2);
      expect(tracks[0].url).toBe(localPath);
      expect(tracks[1].url).toBe(mockSongs[1].song_path);
      expect(mockOfflineStorageService.getSongLocalPath).toHaveBeenCalledTimes(
        2
      );
    });

    it("should return empty array for empty input", async () => {
      const tracks = await convertToTracks([]);

      expect(tracks).toEqual([]);
      expect(mockOfflineStorageService.getSongLocalPath).not.toHaveBeenCalled();
    });

    it("should return empty array for null input", async () => {
      const tracks = await convertToTracks(null as unknown as Song[]);

      expect(tracks).toEqual([]);
      expect(mockOfflineStorageService.getSongLocalPath).not.toHaveBeenCalled();
    });
  });
});
