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
    mockOfflineStorageService = {
      downloadSong: jest.fn(),
      deleteSong: jest.fn(),
      isSongDownloaded: jest.fn(),
      getSongLocalPath: jest.fn(),
      getDownloadedSongs: jest.fn(),
    } as unknown as jest.Mocked<OfflineStorageService>;

    // getOfflineStorageService関数をモック化
    jest
      .spyOn(utils, "getOfflineStorageService")
      .mockReturnValue(mockOfflineStorageService);
  });

  describe("convertSongToTrack", () => {
    it("should convert a song to a track with remote URL when not downloaded", async () => {
      // ダウンロードされていない場合のモック
      mockOfflineStorageService.getSongLocalPath.mockResolvedValue(null);

      // モックが正しく動作するようにする
      const originalGetOfflineStorageService = utils.getOfflineStorageService;
      jest.spyOn(utils, "getOfflineStorageService").mockImplementation(() => {
        return mockOfflineStorageService;
      });

      try {
        const track = await utils.convertSongToTrack(mockSong);

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
      } finally {
        // モックを元に戻す
        jest
          .spyOn(utils, "getOfflineStorageService")
          .mockImplementation(originalGetOfflineStorageService);
      }
    });

    it("should convert a song to a track with local path when downloaded", async () => {
      // ダウンロード済みの場合のモック
      const localPath = "/local/path/to/song.mp3";
      mockOfflineStorageService.getSongLocalPath.mockResolvedValue(localPath);

      // モックが正しく動作するようにする
      const originalGetOfflineStorageService = utils.getOfflineStorageService;
      jest.spyOn(utils, "getOfflineStorageService").mockImplementation(() => {
        return mockOfflineStorageService;
      });

      try {
        const track = await utils.convertSongToTrack(mockSong);

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
      } finally {
        // モックを元に戻す
        jest
          .spyOn(utils, "getOfflineStorageService")
          .mockImplementation(originalGetOfflineStorageService);
      }
    });
  });

  describe("convertToTracks", () => {
    it("should convert multiple songs to tracks", async () => {
      // ダウンロード状態のモックを設定
      const localPath = "/local/path/to/song.mp3";
      mockOfflineStorageService.getSongLocalPath.mockImplementation(
        async (songId) => {
          if (songId === "song-1") {
            return localPath;
          } else {
            return null;
          }
        }
      );

      // モックが正しく動作するようにする
      const originalGetOfflineStorageService = utils.getOfflineStorageService;
      jest.spyOn(utils, "getOfflineStorageService").mockImplementation(() => {
        return mockOfflineStorageService;
      });

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

      try {
        const tracks = await utils.convertToTracks(mockSongs);

        expect(tracks.length).toBe(2);
        expect(tracks[0].url).toBe(localPath);
        expect(tracks[1].url).toBe(mockSongs[1].song_path);
        expect(
          mockOfflineStorageService.getSongLocalPath
        ).toHaveBeenCalledTimes(2);
      } finally {
        // モックを元に戻す
        jest
          .spyOn(utils, "getOfflineStorageService")
          .mockImplementation(originalGetOfflineStorageService);
      }
    });

    it("should return empty array for empty input", async () => {
      const tracks = await utils.convertToTracks([]);

      expect(tracks).toEqual([]);
      expect(mockOfflineStorageService.getSongLocalPath).not.toHaveBeenCalled();
    });

    it("should return empty array for null input", async () => {
      const tracks = await utils.convertToTracks(null as unknown as Song[]);

      expect(tracks).toEqual([]);
      expect(mockOfflineStorageService.getSongLocalPath).not.toHaveBeenCalled();
    });

    it("should handle errors during conversion", async () => {
      // getSongLocalPathがエラーを投げるように設定
      mockOfflineStorageService.getSongLocalPath.mockRejectedValueOnce(
        new Error("Storage error")
      );

      // モックが正しく動作するようにする
      const originalGetOfflineStorageService = utils.getOfflineStorageService;
      jest.spyOn(utils, "getOfflineStorageService").mockImplementation(() => {
        return mockOfflineStorageService;
      });

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

      try {
        // エラーが発生しても処理が継続されることを確認
        const tracks = await utils.convertToTracks(mockSongs);

        // エラーが発生した曲はリモートURLが使用される
        expect(tracks.length).toBe(2);
        expect(tracks[0].url).toBe(mockSongs[0].song_path);
        expect(tracks[1].url).toBe(mockSongs[1].song_path);
      } finally {
        // モックを元に戻す
        jest
          .spyOn(utils, "getOfflineStorageService")
          .mockImplementation(originalGetOfflineStorageService);
      }
    });

    it("should process all songs even if some fail", async () => {
      // 最初の曲はエラー、次の曲は成功するように設定
      mockOfflineStorageService.getSongLocalPath.mockImplementation(
        async (songId) => {
          if (songId === "song-1") {
            throw new Error("Storage error");
          } else if (songId === "song-2") {
            return "/local/path/to/song2.mp3";
          }
          return null;
        }
      );

      // モックが正しく動作するようにする
      const originalGetOfflineStorageService = utils.getOfflineStorageService;
      jest.spyOn(utils, "getOfflineStorageService").mockImplementation(() => {
        return mockOfflineStorageService;
      });

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

      try {
        const tracks = await utils.convertToTracks(mockSongs);

        expect(tracks.length).toBe(2);
        expect(tracks[0].url).toBe(mockSongs[0].song_path); // エラーのためリモートURL
        expect(tracks[1].url).toBe("/local/path/to/song2.mp3"); // 成功したのでローカルパス
      } finally {
        // モックを元に戻す
        jest
          .spyOn(utils, "getOfflineStorageService")
          .mockImplementation(originalGetOfflineStorageService);
      }
    });
  });

  describe("getOfflineStorageService", () => {
    it("should return a singleton instance", () => {
      // モックを元に戻す
      jest.restoreAllMocks();

      // 最初の呼び出し
      const instance1 = utils.getOfflineStorageService();
      // 2回目の呼び出し
      const instance2 = utils.getOfflineStorageService();

      // 同じインスタンスが返されることを確認
      expect(instance1).toBe(instance2);

      // モックを元に戻したので、再度モックを設定
      jest
        .spyOn(utils, "getOfflineStorageService")
        .mockReturnValue(mockOfflineStorageService);
    });
  });
});
