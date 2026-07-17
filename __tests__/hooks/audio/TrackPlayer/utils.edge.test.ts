import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import * as utils from "@/hooks/audio/TrackPlayer/utils";
import {
  convertSongToTrack,
  convertToTracks,
} from "@/hooks/audio/TrackPlayer/utils";
import Song from "@/types";
import { OfflineStorageService } from "@/services/OfflineStorageService";
import * as FileSystem from "expo-file-system/legacy";

// expo-file-system のモック（自己修復時のファイル存在チェック用）
jest.mock("expo-file-system/legacy", () => ({
  getInfoAsync: jest.fn(),
}));

// OfflineStorageServiceのモック
jest.mock("@/services/OfflineStorageService", () => {
  // convertToTracks 内部の getOfflineStorageService で生成される singleton と、
  // beforeEach で設定する mock を同一インスタンスにするため単一インスタンスを返す
  const instance = {
    getSongLocalPath: jest.fn(),
    isSongDownloaded: jest.fn(),
    getSongPathsBatch: jest.fn(),
    deleteSong: jest.fn(),
  };
  return {
    OfflineStorageService: jest.fn(() => instance),
  };
});

describe("TrackPlayer utils - Edge Cases", () => {
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

    // バッチ取得・削除のデフォルトモック
    mockOfflineStorageService.getSongPathsBatch.mockResolvedValue(new Map());
    mockOfflineStorageService.deleteSong.mockResolvedValue({ success: true });
  });

  describe("convertSongToTrack - Edge Cases", () => {
    it("should handle song with missing properties", async () => {
      const incompleteSong = {
        id: "incomplete-song",
        title: "Incomplete Song",
        // author missing
        image_path: "https://example.com/image.jpg",
        song_path: "https://example.com/song.mp3",
        user_id: "test-user",
        created_at: "2023-01-01T00:00:00.000Z",
      } as Song;

      const track = await convertSongToTrack(incompleteSong);

      expect(track).toEqual({
        mediaId: incompleteSong.id,
        url: incompleteSong.song_path,
        title: incompleteSong.title,
        artist: undefined, // authorがないのでundefined
        artworkUrl: incompleteSong.image_path,
        extras: { originalSong: incompleteSong },
      });
    });

    it("should handle errors during local path retrieval", async () => {
      mockOfflineStorageService.getSongLocalPath.mockRejectedValue(
        new Error("Storage error")
      );

      const track = await convertSongToTrack(mockSong);

      // エラーが発生してもリモートURLにフォールバックする
      expect(track).toEqual({
        mediaId: mockSong.id,
        url: mockSong.song_path,
        title: mockSong.title,
        artist: mockSong.author,
        artworkUrl: mockSong.image_path,
        extras: { originalSong: mockSong },
      });
    });

    it("should handle song with empty image_path", async () => {
      const songWithoutImage = {
        ...mockSong,
        image_path: "",
      };

      const track = await convertSongToTrack(songWithoutImage);

      expect(track).toEqual({
        mediaId: songWithoutImage.id,
        url: songWithoutImage.song_path,
        title: songWithoutImage.title,
        artist: songWithoutImage.author,
        artworkUrl: "", // 空の文字列
        extras: { originalSong: songWithoutImage },
      });
    });
  });

  describe("convertToTracks - Edge Cases", () => {
    it("should handle undefined input", async () => {
      const tracks = await convertToTracks(undefined as unknown as Song[]);

      expect(tracks).toEqual([]);
      expect(mockOfflineStorageService.getSongLocalPath).not.toHaveBeenCalled();
    });

    it("should handle songs with invalid IDs", async () => {
      const songsWithInvalidIds = [
        { ...mockSong, id: "" },
        { ...mockSong, id: null as unknown as string },
      ];

      const tracks = await convertToTracks(songsWithInvalidIds);

      expect(tracks.length).toBe(2);
      expect(tracks[0].mediaId).toBe("");
      expect(tracks[1].mediaId).toBe(null as unknown as string);
    });

    it("should handle mixed valid and invalid songs", async () => {
      const mixedSongs = [
        mockSong,
        {} as Song, // 無効な曲
        { ...mockSong, id: "song-3", song_path: "" } as Song, // song_pathが空
      ];

      const tracks = await convertToTracks(mixedSongs);

      expect(tracks.length).toBe(3);
      expect(tracks[0].url).toBeDefined();
      expect(tracks[1].url).toBeUndefined();
      expect(tracks[2].url).toBe("");
    });

    it("should handle errors during conversion of individual songs", async () => {
      // 最初の曲の変換中にエラーが発生するようにモック
      jest
        .spyOn(utils, "convertSongToTrack")
        .mockImplementationOnce(() =>
          Promise.reject(new Error("Conversion error"))
        )
        .mockImplementationOnce((song) =>
          Promise.resolve({
            mediaId: song.id,
            url: song.song_path,
            title: song.title,
            artist: song.author,
            artworkUrl: song.image_path,
            extras: { originalSong: song },
          })
        );

      const songs = [mockSong, { ...mockSong, id: "song-2" }];

      // エラーが発生するはずだが、Promise.allが失敗するため、try-catchで囲む
      try {
        await convertToTracks(songs);
        // ここには到達しないはず
        fail("Expected an error but none was thrown");
      } catch (error) {
        expect(error).toBeDefined();
        expect(error).toBeInstanceOf(Error);
        expect(error).toHaveProperty("message");
      }
    });
  });

  describe("convertToTracks - バッチパス取得によるN+1回避", () => {
    // @jest/globals の jest.Mock は戻り値が unknown 扱いのため、
    // mockResolvedValue を使えるように戻り値型を付してキャストする
    const mockGetInfoAsync = FileSystem.getInfoAsync as unknown as jest.Mock<
      (path: string) => Promise<{ exists: boolean }>
    >;

    it("should fetch all paths once via getSongPathsBatch (no per-song query)", async () => {
      const songs = [mockSong, { ...mockSong, id: "song-2" }];
      mockOfflineStorageService.getSongPathsBatch.mockResolvedValue(
        new Map([
          ["song-1", { localPath: null, originalPath: "https://remote/1.mp3" }],
          ["song-2", { localPath: null, originalPath: "https://remote/2.mp3" }],
        ]),
      );

      const tracks = await convertToTracks(songs);

      expect(
        mockOfflineStorageService.getSongPathsBatch,
      ).toHaveBeenCalledTimes(1);
      expect(mockOfflineStorageService.getSongPathsBatch).toHaveBeenCalledWith([
        "song-1",
        "song-2",
      ]);
      // バッチ取得済みなので個別クエリ(getSongLocalPath)は走らない
      expect(
        mockOfflineStorageService.getSongLocalPath,
      ).not.toHaveBeenCalled();
      expect(tracks[0].url).toBe("https://remote/1.mp3");
      expect(tracks[1].url).toBe("https://remote/2.mp3");
    });

    it("should use the local path when the downloaded file exists", async () => {
      mockOfflineStorageService.getSongPathsBatch.mockResolvedValue(
        new Map([
          [
            "song-1",
            {
              localPath: "/local/song-1.mp3",
              originalPath: "https://remote/1.mp3",
            },
          ],
        ]),
      );
      mockGetInfoAsync.mockResolvedValue({ exists: true });

      const tracks = await convertToTracks([mockSong]);

      expect(tracks[0].url).toBe("/local/song-1.mp3");
      expect(mockOfflineStorageService.deleteSong).not.toHaveBeenCalled();
    });

    it("should fall back to the remote URL and self-heal when the local file is missing", async () => {
      mockOfflineStorageService.getSongPathsBatch.mockResolvedValue(
        new Map([
          [
            "song-1",
            {
              localPath: "/local/song-1.mp3",
              originalPath: "https://remote/1.mp3",
            },
          ],
        ]),
      );
      // 実ファイルが存在しない
      mockGetInfoAsync.mockResolvedValue({ exists: false });

      const tracks = await convertToTracks([mockSong]);

      // ローカルパスではなくDBのリモートURLへフォールバックする
      expect(tracks[0].url).toBe("https://remote/1.mp3");
      // DBの記録を自己修復（削除）する
      expect(mockOfflineStorageService.deleteSong).toHaveBeenCalledWith(
        "song-1",
      );
    });
  });

  describe("getOfflineStorageService", () => {
    it("should create a new instance only once", () => {
      // モックをクリア
      jest.restoreAllMocks();

      // 実際の関数を呼び出す
      const instance1 = utils.getOfflineStorageService();
      const instance2 = utils.getOfflineStorageService();

      // 同じインスタンスが返されることを確認
      expect(instance1).toBe(instance2);

      // OfflineStorageServiceのコンストラクタが1回だけ呼ばれることを確認
      expect(OfflineStorageService).toHaveBeenCalledTimes(1);
    });
  });
});

