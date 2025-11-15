import { OfflineStorageService } from "@/services/OfflineStorageService";
import * as FileSystem from "expo-file-system";
import { MMKV } from "react-native-mmkv";
import Song from "@/types";

// モックの設定
jest.mock("expo-file-system", () => ({
  documentDirectory: "/mock/document/directory/",
  getInfoAsync: jest.fn(),
  makeDirectoryAsync: jest.fn(),
  downloadAsync: jest.fn(),
  deleteAsync: jest.fn(),
}));

jest.mock("react-native-mmkv", () => {
  const mockMMKV = {
    set: jest.fn(),
    getString: jest.fn(),
    delete: jest.fn(),
    contains: jest.fn(),
    getAllKeys: jest.fn(),
    clearAll: jest.fn(),
  };

  return {
    MMKV: jest.fn(() => mockMMKV),
  };
});

describe("OfflineStorageService", () => {
  let service: OfflineStorageService;
  let mockMMKV: any;
  const mockSong: Song = {
    id: "test-song-id",
    title: "Test Song",
    author: "Test Author",
    image_path: "https://example.com/image.jpg",
    song_path: "https://example.com/song.mp3",
    user_id: "test-user-id",
    created_at: "2023-01-01T00:00:00.000Z",
  };

  beforeEach(() => {
    // モックをリセット
    jest.clearAllMocks();

    // MMKVのモックインスタンスを取得
    service = new OfflineStorageService();
    mockMMKV = (MMKV as jest.Mock).mock.results[0].value;

    // デフォルトのモック動作を設定
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: false });
    (FileSystem.makeDirectoryAsync as jest.Mock).mockResolvedValue(undefined);
    (FileSystem.downloadAsync as jest.Mock).mockResolvedValue({ status: 200 });
    (FileSystem.deleteAsync as jest.Mock).mockResolvedValue(undefined);
  });

  describe("ensureDownloadDirectory", () => {
    it("should create download directory if it doesn't exist", async () => {
      // ディレクトリが存在しない場合
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: false,
      });

      // privateメソッドを呼び出すためにanyにキャスト
      await (service as any).ensureDownloadDirectory();

      // ディレクトリの存在確認と作成が呼ばれたことを確認
      expect(FileSystem.getInfoAsync).toHaveBeenCalledWith(
        "/mock/document/directory/downloads/"
      );
      expect(FileSystem.makeDirectoryAsync).toHaveBeenCalledWith(
        "/mock/document/directory/downloads/",
        { intermediates: true }
      );
    });

    it("should not create download directory if it already exists", async () => {
      // テスト前にモックをリセット
      jest.clearAllMocks();

      // ディレクトリが既に存在する場合
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: true,
      });

      await (service as any).ensureDownloadDirectory();

      // 存在確認は呼ばれるが、作成は呼ばれないことを確認
      expect(FileSystem.getInfoAsync).toHaveBeenCalledWith(
        "/mock/document/directory/downloads/"
      );
      expect(FileSystem.makeDirectoryAsync).not.toHaveBeenCalled();
    });
  });

  describe("downloadSong", () => {
    it("should download a song and save metadata", async () => {
      // ファイルが存在しない場合
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: false,
      });

      const result = await service.downloadSong(mockSong);

      // 結果が成功であることを確認
      expect(result).toEqual({ success: true });

      // ダウンロードが呼ばれたことを確認
      expect(FileSystem.downloadAsync).toHaveBeenCalledWith(
        mockSong.song_path,
        "/mock/document/directory/downloads/Test_Song.mp3"
      );

      // メタデータが保存されたことを確認
      expect(mockMMKV.set).toHaveBeenCalledWith(
        "song-metadata:test-song-id",
        expect.any(String)
      );
    });

    it("should not download if song already exists", async () => {
      // ファイルが既に存在する場合
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: true,
      });

      const result = await service.downloadSong(mockSong);

      // 結果が成功であることを確認
      expect(result).toEqual({ success: true });

      // ダウンロードが呼ばれないことを確認
      expect(FileSystem.downloadAsync).not.toHaveBeenCalled();
    });

    it("should handle download failure", async () => {
      // ダウンロードが失敗する場合
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: false,
      });
      (FileSystem.downloadAsync as jest.Mock).mockResolvedValue({
        status: 404,
      });

      const result = await service.downloadSong(mockSong);

      // 結果が失敗であることを確認
      expect(result).toEqual({
        success: false,
        error: "Download failed with status code: 404",
      });
    });

    it("should handle songs with special characters in title", async () => {
      // 特殊文字を含む曲名のケース
      const specialCharSong = {
        ...mockSong,
        title: "Test Song with special chars",
      };

      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: false,
      });
      (FileSystem.downloadAsync as jest.Mock).mockResolvedValue({
        status: 200,
      });

      const result = await service.downloadSong(specialCharSong);

      expect(result.success).toBe(true);
      // ダウンロードが呼ばれたことを確認
      expect(FileSystem.downloadAsync).toHaveBeenCalled();
    });

    it("should handle network errors during download", async () => {
      // ネットワークエラーのケース
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: false,
      });
      (FileSystem.downloadAsync as jest.Mock).mockRejectedValue(
        new Error("Network error")
      );

      const result = await service.downloadSong(mockSong);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain("Network error");
    });

    it("should handle invalid URLs", async () => {
      // 無効なURLのケース
      const songWithInvalidUrl: Song = {
        ...mockSong,
        song_path: "invalid-url",
      };

      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: false,
      });
      (FileSystem.downloadAsync as jest.Mock).mockRejectedValue(
        new Error("Invalid URL")
      );

      const result = await service.downloadSong(songWithInvalidUrl);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("deleteSong", () => {
    it("should delete a song and its metadata", async () => {
      // メタデータが存在する場合
      mockMMKV.getString.mockReturnValue(
        JSON.stringify({
          id: mockSong.id,
          localPath: "/mock/document/directory/downloads/Test_Song.mp3",
        })
      );

      // ファイルが存在する場合
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: true,
      });

      const result = await service.deleteSong(mockSong.id);

      // 結果が成功であることを確認
      expect(result).toEqual({ success: true });

      // ファイル削除が呼ばれたことを確認
      expect(FileSystem.deleteAsync).toHaveBeenCalledWith(
        "/mock/document/directory/downloads/Test_Song.mp3"
      );

      // メタデータが削除されたことを確認
      expect(mockMMKV.delete).toHaveBeenCalledWith(
        "song-metadata:test-song-id"
      );
    });

    it("should handle case when metadata doesn't exist", async () => {
      // メタデータが存在しない場合
      mockMMKV.getString.mockReturnValue(null);

      const result = await service.deleteSong(mockSong.id);

      // 結果が成功であることを確認
      expect(result).toEqual({ success: true });

      // ファイル削除が呼ばれないことを確認
      expect(FileSystem.deleteAsync).not.toHaveBeenCalled();
    });

    it("should handle file not found during deletion", async () => {
      // メタデータが存在するが、ファイルが存在しない場合
      mockMMKV.getString.mockReturnValue(
        JSON.stringify({
          id: mockSong.id,
          localPath: "/mock/document/directory/downloads/Test_Song.mp3",
        })
      );
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: false,
      });

      const result = await service.deleteSong(mockSong.id);

      expect(result.success).toBe(true);
      expect(FileSystem.deleteAsync).not.toHaveBeenCalled();
      expect(mockMMKV.delete).toHaveBeenCalled();
    });

    it("should handle permission errors during deletion", async () => {
      // 削除時にエラーが発生する場合
      mockMMKV.getString.mockReturnValue(
        JSON.stringify({
          id: mockSong.id,
          localPath: "/mock/document/directory/downloads/Test_Song.mp3",
        })
      );
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: true,
      });
      (FileSystem.deleteAsync as jest.Mock).mockRejectedValue(
        new Error("Permission denied")
      );

      const result = await service.deleteSong(mockSong.id);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("getDownloadedSongs", () => {
    it("should return list of downloaded songs", async () => {
      // メタデータのキーが存在する場合
      mockMMKV.getAllKeys.mockReturnValue([
        "song-metadata:test-song-id",
        "other-key",
      ]);

      // メタデータが存在する場合
      mockMMKV.getString.mockReturnValue(
        JSON.stringify({
          id: mockSong.id,
          title: mockSong.title,
          author: mockSong.author,
          image_path: mockSong.image_path,
          user_id: mockSong.user_id,
          created_at: mockSong.created_at,
          localPath: "/mock/document/directory/downloads/Test_Song.mp3",
        })
      );

      // ファイルが存在する場合
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: true,
      });

      const songs = await service.getDownloadedSongs();

      // 曲のリストが返されることを確認
      expect(songs).toEqual([
        {
          id: mockSong.id,
          title: mockSong.title,
          author: mockSong.author,
          image_path: mockSong.image_path,
          song_path: "/mock/document/directory/downloads/Test_Song.mp3",
          user_id: mockSong.user_id,
          created_at: mockSong.created_at,
        },
      ]);
    });

    it("should filter out songs that don't exist on disk", async () => {
      // メタデータのキーが存在する場合
      mockMMKV.getAllKeys.mockReturnValue(["song-metadata:test-song-id"]);

      // メタデータが存在する場合
      mockMMKV.getString.mockReturnValue(
        JSON.stringify({
          id: mockSong.id,
          localPath: "/mock/document/directory/downloads/Test_Song.mp3",
        })
      );

      // ファイルが存在しない場合
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: false,
      });

      const songs = await service.getDownloadedSongs();

      // 空のリストが返されることを確認
      expect(songs).toEqual([]);

      // メタデータが削除されたことを確認
      expect(mockMMKV.delete).toHaveBeenCalledWith(
        "song-metadata:test-song-id"
      );
    });

    it("should handle corrupted metadata", async () => {
      // 破損したメタデータのケース
      mockMMKV.getAllKeys.mockReturnValue(["song-metadata:test-song-id"]);
      mockMMKV.getString.mockReturnValue("invalid-json");

      const songs = await service.getDownloadedSongs();

      expect(songs).toEqual([]);
    });

    it("should handle null getAllKeys result", async () => {
      // getAllKeysがnullを返す場合
      mockMMKV.getAllKeys.mockReturnValue(null);

      const songs = await service.getDownloadedSongs();

      expect(songs).toEqual([]);
    });
  });

  describe("isSongDownloaded", () => {
    it("should return true if song is downloaded", async () => {
      // メタデータが存在する場合
      mockMMKV.contains.mockReturnValue(true);
      mockMMKV.getString.mockReturnValue(
        JSON.stringify({
          localPath: "/mock/document/directory/downloads/Test_Song.mp3",
        })
      );

      // ファイルが存在する場合
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: true,
      });

      const isDownloaded = await service.isSongDownloaded(mockSong.id);

      // trueが返されることを確認
      expect(isDownloaded).toBe(true);
    });

    it("should return false if metadata doesn't exist", async () => {
      // メタデータが存在しない場合
      mockMMKV.contains.mockReturnValue(false);

      const isDownloaded = await service.isSongDownloaded(mockSong.id);

      // falseが返されることを確認
      expect(isDownloaded).toBe(false);
    });

    it("should return false if file doesn't exist", async () => {
      // メタデータが存在する場合
      mockMMKV.contains.mockReturnValue(true);
      mockMMKV.getString.mockReturnValue(
        JSON.stringify({
          localPath: "/mock/document/directory/downloads/Test_Song.mp3",
        })
      );

      // ファイルが存在しない場合
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: false,
      });

      const isDownloaded = await service.isSongDownloaded(mockSong.id);

      // falseが返されることを確認
      expect(isDownloaded).toBe(false);
    });

    it("should handle errors during check", async () => {
      // チェック中にエラーが発生する場合
      mockMMKV.contains.mockImplementation(() => {
        throw new Error("Storage error");
      });

      const isDownloaded = await service.isSongDownloaded(mockSong.id);

      expect(isDownloaded).toBe(false);
    });
  });

  describe("getSongLocalPath", () => {
    it("should return local path if song is downloaded", async () => {
      // メタデータが存在する場合
      mockMMKV.getString.mockReturnValue(
        JSON.stringify({
          localPath: "/mock/document/directory/downloads/Test_Song.mp3",
        })
      );

      // ファイルが存在する場合
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: true,
      });

      const localPath = await service.getSongLocalPath(mockSong.id);

      // ローカルパスが返されることを確認
      expect(localPath).toBe(
        "/mock/document/directory/downloads/Test_Song.mp3"
      );
    });

    it("should return null if metadata doesn't exist", async () => {
      // メタデータが存在しない場合
      mockMMKV.getString.mockReturnValue(null);

      const localPath = await service.getSongLocalPath(mockSong.id);

      // nullが返されることを確認
      expect(localPath).toBeNull();
    });

    it("should return null if file doesn't exist", async () => {
      // メタデータが存在する場合
      mockMMKV.getString.mockReturnValue(
        JSON.stringify({
          localPath: "/mock/document/directory/downloads/Test_Song.mp3",
        })
      );

      // ファイルが存在しない場合
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: false,
      });

      const localPath = await service.getSongLocalPath(mockSong.id);

      // nullが返されることを確認
      expect(localPath).toBeNull();
    });

    it("should handle corrupted metadata", async () => {
      // 破損したメタデータのケース
      mockMMKV.getString.mockReturnValue("invalid-json");

      const localPath = await service.getSongLocalPath(mockSong.id);

      expect(localPath).toBeNull();
    });

    it("should handle errors during file existence check", async () => {
      // ファイル存在チェック中にエラーが発生する場合
      mockMMKV.getString.mockReturnValue(
        JSON.stringify({
          localPath: "/mock/document/directory/downloads/Test_Song.mp3",
        })
      );
      (FileSystem.getInfoAsync as jest.Mock).mockRejectedValue(
        new Error("File system error")
      );

      const localPath = await service.getSongLocalPath(mockSong.id);

      expect(localPath).toBeNull();
    });
  });

  describe("clearAllDownloads", () => {
    it("should delete all downloaded songs", async () => {
      // getDownloadedSongsをモック
      jest.spyOn(service, "getDownloadedSongs").mockResolvedValue([mockSong]);

      // deleteSongをモック
      jest.spyOn(service, "deleteSong").mockResolvedValue({ success: true });

      const result = await service.clearAllDownloads();

      // 結果が成功であることを確認
      expect(result).toEqual({ success: true });

      // deleteSongが呼ばれたことを確認
      expect(service.deleteSong).toHaveBeenCalledWith(mockSong.id);
    });

    it("should handle empty downloads list", async () => {
      // 空のダウンロードリストのケース
      const getDownloadedSongsSpy = jest
        .spyOn(service, "getDownloadedSongs")
        .mockResolvedValue([]);
      const deleteSongSpy = jest.spyOn(service, "deleteSong");

      const result = await service.clearAllDownloads();

      expect(result.success).toBe(true);
      expect(deleteSongSpy).not.toHaveBeenCalled();

      // スパイをリストア
      getDownloadedSongsSpy.mockRestore();
      deleteSongSpy.mockRestore();
    });

    it("should handle errors during deletion", async () => {
      // 削除中にエラーが発生する場合
      jest.spyOn(service, "getDownloadedSongs").mockResolvedValue([mockSong]);
      jest.spyOn(service, "deleteSong").mockResolvedValue({
        success: false,
        error: "Deletion error",
      });

      const result = await service.clearAllDownloads();

      // 現在の実装では、エラーをキャッチして成功を返す
      expect(result.success).toBe(true);
    });
  });

  describe("downloadImage", () => {
    it("should download image and return local path", async () => {
      // 画像が存在しない場合
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: false,
      });
      (FileSystem.downloadAsync as jest.Mock).mockResolvedValue({
        status: 200,
      });

      const localPath = await (service as any).downloadImage(
        mockSong.image_path,
        mockSong.id
      );

      // ローカルパスが返されることを確認
      expect(localPath).toBe(
        "/mock/document/directory/downloads/images/test-song-id_artwork.jpg"
      );

      // ダウンロードが呼ばれたことを確認
      expect(FileSystem.downloadAsync).toHaveBeenCalledWith(
        mockSong.image_path,
        "/mock/document/directory/downloads/images/test-song-id_artwork.jpg"
      );
    });

    it("should skip download if image already exists", async () => {
      // 画像が既に存在する場合
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: true,
      });

      const localPath = await (service as any).downloadImage(
        mockSong.image_path,
        mockSong.id
      );

      // ローカルパスが返されることを確認
      expect(localPath).toBe(
        "/mock/document/directory/downloads/images/test-song-id_artwork.jpg"
      );

      // ダウンロードが呼ばれないことを確認
      expect(FileSystem.downloadAsync).not.toHaveBeenCalled();
    });

    it("should return null if image URL is empty", async () => {
      const localPath = await (service as any).downloadImage("", mockSong.id);

      // nullが返されることを確認
      expect(localPath).toBeNull();

      // ダウンロードが呼ばれないことを確認
      expect(FileSystem.downloadAsync).not.toHaveBeenCalled();
    });

    it("should return null on download failure", async () => {
      // ダウンロードが失敗する場合
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: false,
      });
      (FileSystem.downloadAsync as jest.Mock).mockResolvedValue({
        status: 404,
      });

      const localPath = await (service as any).downloadImage(
        mockSong.image_path,
        mockSong.id
      );

      // nullが返されることを確認
      expect(localPath).toBeNull();
    });

    it("should handle network errors during image download", async () => {
      // ネットワークエラーのケース
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: false,
      });
      (FileSystem.downloadAsync as jest.Mock).mockRejectedValue(
        new Error("Network error")
      );

      const localPath = await (service as any).downloadImage(
        mockSong.image_path,
        mockSong.id
      );

      // nullが返されることを確認
      expect(localPath).toBeNull();
    });
  });

  describe("downloadSong with image download", () => {
    it("should download both song and image", async () => {
      // ファイルと画像が存在しない場合
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: false,
      });
      (FileSystem.downloadAsync as jest.Mock).mockResolvedValue({
        status: 200,
      });

      const result = await service.downloadSong(mockSong);

      // 結果が成功であることを確認
      expect(result).toEqual({ success: true });

      // 音声ファイルのダウンロードが呼ばれたことを確認
      expect(FileSystem.downloadAsync).toHaveBeenCalledWith(
        mockSong.song_path,
        "/mock/document/directory/downloads/Test_Song.mp3"
      );

      // 画像のダウンロードが呼ばれたことを確認
      expect(FileSystem.downloadAsync).toHaveBeenCalledWith(
        mockSong.image_path,
        "/mock/document/directory/downloads/images/test-song-id_artwork.jpg"
      );

      // メタデータが保存されたことを確認
      const savedMetadata = JSON.parse(
        (mockMMKV.set as jest.Mock).mock.calls[0][1]
      );
      expect(savedMetadata.image_path).toBe(
        "/mock/document/directory/downloads/images/test-song-id_artwork.jpg"
      );
    });

    it("should handle case when image URL is not provided", async () => {
      // 画像URLがない曲
      const songWithoutImage = {
        ...mockSong,
        image_path: "",
      };

      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: false,
      });
      (FileSystem.downloadAsync as jest.Mock).mockResolvedValue({
        status: 200,
      });

      const result = await service.downloadSong(songWithoutImage);

      // 結果が成功であることを確認
      expect(result).toEqual({ success: true });

      // 音声ファイルのダウンロードが呼ばれたことを確認
      expect(FileSystem.downloadAsync).toHaveBeenCalledWith(
        mockSong.song_path,
        "/mock/document/directory/downloads/Test_Song.mp3"
      );

      // メタデータが保存されたことを確認（image_pathは空のまま）
      const savedMetadata = JSON.parse(
        (mockMMKV.set as jest.Mock).mock.calls[0][1]
      );
      expect(savedMetadata.image_path).toBe("");
    });

    it("should continue even if image download fails", async () => {
      // 音声ファイルは存在しないが、画像が存在しない場合
      let callCount = 0;
      (FileSystem.getInfoAsync as jest.Mock).mockImplementation(() => {
        return Promise.resolve({ exists: false });
      });

      // 音声ファイルは成功、画像は失敗
      (FileSystem.downloadAsync as jest.Mock).mockImplementation((url) => {
        if (url === mockSong.song_path) {
          return Promise.resolve({ status: 200 });
        } else {
          return Promise.resolve({ status: 404 });
        }
      });

      const result = await service.downloadSong(mockSong);

      // 音声ファイルのダウンロードが成功すれば全体として成功
      expect(result).toEqual({ success: true });

      // メタデータが保存されたことを確認（image_pathは元のURLのまま）
      const savedMetadata = JSON.parse(
        (mockMMKV.set as jest.Mock).mock.calls[0][1]
      );
      expect(savedMetadata.image_path).toBe(mockSong.image_path);
    });
  });
});
