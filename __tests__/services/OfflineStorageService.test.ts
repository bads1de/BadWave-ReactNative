import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { MMKV } from "react-native-mmkv";
import RNFS from "react-native-fs";
import { OfflineStorageService } from "../../services/OfflineStorageService";
import Song from "../../types";

// モックの設定
jest.mock("react-native-mmkv", () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    set: jest.fn(),
    getString: jest.fn(),
    delete: jest.fn(),
    getAllKeys: jest.fn(),
    contains: jest.fn(),
    clearAll: jest.fn(),
  })),
}));

jest.mock("react-native-fs", () => ({
  DocumentDirectoryPath: "/mock/path",
  downloadFile: jest.fn(),
  exists: jest.fn(),
  unlink: jest.fn(),
  readDir: jest.fn(),
  mkdir: jest.fn(),
}));

describe("OfflineStorageService", () => {
  let offlineStorageService: OfflineStorageService;
  let mockMMKV: jest.Mocked<MMKV>;

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
    // MMKVのインスタンスを取得
    mockMMKV = new MMKV() as jest.Mocked<MMKV>;

    // OfflineStorageServiceのインスタンスを作成する前にMMKVのモックを設定
    jest
      .spyOn(require("react-native-mmkv"), "MMKV")
      .mockImplementation(() => mockMMKV);

    offlineStorageService = new OfflineStorageService();
  });

  describe("downloadSong", () => {
    it("should download a song and save its metadata", async () => {
      // モックの設定
      (RNFS.exists as jest.Mock).mockResolvedValue(false);
      (RNFS.downloadFile as jest.Mock).mockImplementation(() => ({
        promise: Promise.resolve({ statusCode: 200 }),
      }));

      const result = await offlineStorageService.downloadSong(mockSong);

      // 期待される結果
      expect(result.success).toBe(true);
      expect(RNFS.downloadFile).toHaveBeenCalledWith(
        expect.objectContaining({
          fromUrl: mockSong.song_path,
        })
      );
      expect(mockMMKV.set).toHaveBeenCalledWith(
        expect.stringContaining("song-metadata"),
        expect.any(String)
      );
    });

    it("should return error when download fails", async () => {
      // ダウンロード失敗のモック
      (RNFS.exists as jest.Mock).mockResolvedValue(false);
      (RNFS.downloadFile as jest.Mock).mockImplementation(() => ({
        promise: Promise.resolve({ statusCode: 404 }),
      }));

      const result = await offlineStorageService.downloadSong(mockSong);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should not download if song already exists", async () => {
      // 既に存在するケース
      (RNFS.exists as jest.Mock).mockResolvedValue(true);

      const result = await offlineStorageService.downloadSong(mockSong);

      expect(result.success).toBe(true);
      expect(RNFS.downloadFile).not.toHaveBeenCalled();
    });
  });

  describe("deleteSong", () => {
    it("should delete a downloaded song and its metadata", async () => {
      // メタデータが存在するケース
      const mockMetadata = JSON.stringify({
        id: mockSong.id,
        localPath: `/mock/path/${mockSong.title}.mp3`,
      });
      (mockMMKV.getString as jest.Mock).mockReturnValue(mockMetadata);
      (RNFS.exists as jest.Mock).mockResolvedValue(true);
      (RNFS.unlink as jest.Mock).mockResolvedValue(undefined);

      const result = await offlineStorageService.deleteSong(mockSong.id);

      expect(result.success).toBe(true);
      expect(RNFS.unlink).toHaveBeenCalled();
      expect(mockMMKV.delete).toHaveBeenCalledWith(
        expect.stringContaining(mockSong.id)
      );
    });

    it("should return error when deletion fails", async () => {
      // 削除失敗のケース
      const mockMetadata = JSON.stringify({
        id: mockSong.id,
        localPath: `/mock/path/${mockSong.title}.mp3`,
      });
      (mockMMKV.getString as jest.Mock).mockReturnValue(mockMetadata);
      (RNFS.exists as jest.Mock).mockResolvedValue(true);
      (RNFS.unlink as jest.Mock).mockRejectedValue(new Error("Delete failed"));

      const result = await offlineStorageService.deleteSong(mockSong.id);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should return success if song does not exist", async () => {
      // 曲が存在しないケース
      (RNFS.exists as jest.Mock).mockResolvedValue(false);

      const result = await offlineStorageService.deleteSong(mockSong.id);

      expect(result.success).toBe(true);
      expect(RNFS.unlink).not.toHaveBeenCalled();
    });
  });

  describe("getDownloadedSongs", () => {
    it("should return all downloaded songs", async () => {
      // メタデータが保存されているケース
      const mockMetadata = JSON.stringify({
        id: mockSong.id,
        title: mockSong.title,
        author: mockSong.author,
        image_path: mockSong.image_path,
        user_id: mockSong.user_id,
        created_at: mockSong.created_at,
        localPath: `/mock/path/${mockSong.title}.mp3`,
      });

      (mockMMKV.getAllKeys as jest.Mock).mockReturnValue([
        "song-metadata:song-1",
      ]);
      (mockMMKV.getString as jest.Mock).mockReturnValue(mockMetadata);
      (RNFS.exists as jest.Mock).mockResolvedValue(true);

      const songs = await offlineStorageService.getDownloadedSongs();

      expect(songs.length).toBe(1);
      expect(songs[0].id).toBe(mockSong.id);
      expect(songs[0].title).toBe(mockSong.title);
    });

    it("should return empty array when no songs are downloaded", async () => {
      (mockMMKV.getAllKeys as jest.Mock).mockReturnValue([]);

      const songs = await offlineStorageService.getDownloadedSongs();

      expect(songs.length).toBe(0);
    });
  });

  describe("isSongDownloaded", () => {
    it("should return true if song is downloaded", async () => {
      (RNFS.exists as jest.Mock).mockResolvedValue(true);
      (mockMMKV.contains as jest.Mock).mockReturnValue(true);

      const isDownloaded = await offlineStorageService.isSongDownloaded(
        mockSong.id
      );

      expect(isDownloaded).toBe(true);
    });

    it("should return false if song is not downloaded", async () => {
      (RNFS.exists as jest.Mock).mockResolvedValue(false);
      (mockMMKV.contains as jest.Mock).mockReturnValue(false);

      const isDownloaded = await offlineStorageService.isSongDownloaded(
        mockSong.id
      );

      expect(isDownloaded).toBe(false);
    });
  });

  describe("getSongLocalPath", () => {
    it("should return local path if song is downloaded", async () => {
      const mockMetadata = JSON.stringify({
        id: mockSong.id,
        localPath: `/mock/path/${mockSong.title}.mp3`,
      });

      (mockMMKV.getString as jest.Mock).mockReturnValue(mockMetadata);
      (RNFS.exists as jest.Mock).mockResolvedValue(true);

      const localPath = await offlineStorageService.getSongLocalPath(
        mockSong.id
      );

      expect(localPath).toBe(`/mock/path/${mockSong.title}.mp3`);
    });

    it("should return null if song is not downloaded", async () => {
      (mockMMKV.getString as jest.Mock).mockReturnValue(null);

      const localPath = await offlineStorageService.getSongLocalPath(
        mockSong.id
      );

      expect(localPath).toBeNull();
    });
  });
});
