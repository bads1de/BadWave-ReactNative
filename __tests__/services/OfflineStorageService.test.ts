import { OfflineStorageService } from "@/services/OfflineStorageService";
import * as FileSystem from "expo-file-system";
import Song from "@/types";
import { db } from "@/lib/db/client";

// モックの設定
jest.mock("expo-file-system", () => ({
  documentDirectory: "/mock/document/directory/",
  getInfoAsync: jest.fn(),
  makeDirectoryAsync: jest.fn(),
  downloadAsync: jest.fn(),
  deleteAsync: jest.fn(),
  getFreeDiskStorageAsync: jest.fn(),
}));

// db クライアントをモック
jest.mock("@/lib/db/client", () => {
  const mockDbObj = {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    // Promise として振る舞うための setup
    then: jest.fn((callback) => Promise.resolve([]).then(callback)),
  };
  return { db: mockDbObj };
});

// drizzle-orm をモック
jest.mock("drizzle-orm", () => ({
  eq: jest.fn(),
  isNotNull: jest.fn(),
}));

describe("OfflineStorageService", () => {
  let service: OfflineStorageService;
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
    jest.clearAllMocks();
    service = new OfflineStorageService();

    // デフォルトのモック動作
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: false });
    (FileSystem.makeDirectoryAsync as jest.Mock).mockResolvedValue(undefined);
    (FileSystem.downloadAsync as jest.Mock).mockResolvedValue({ status: 200 });
    (FileSystem.deleteAsync as jest.Mock).mockResolvedValue(undefined);
    (FileSystem.getFreeDiskStorageAsync as jest.Mock).mockResolvedValue(
      100 * 1024 * 1024,
    ); // 100MB

    // DBモックのリセット (デフォルトは空配列を返す)
    // 注意: mockReturnThis() はリセットされると消えるので、再度設定が必要かもしれないが、
    // jest.clearAllMocks() は mock.calls と mock.instances をクリアするだけで実装は保持されるはず。
    //念のため実装を確認
    (db.then as jest.Mock).mockImplementation((callback) => {
      return Promise.resolve([]).then(callback);
    });
  });

  describe("ensureDownloadDirectory", () => {
    it("should create download directory if it doesn't exist", async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: false,
      });

      await (service as any).ensureDownloadDirectory();

      expect(FileSystem.getInfoAsync).toHaveBeenCalledWith(
        "/mock/document/directory/downloads/",
      );
      expect(FileSystem.makeDirectoryAsync).toHaveBeenCalledWith(
        "/mock/document/directory/downloads/",
        { intermediates: true },
      );
    });

    it("should not create download directory if it already exists", async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: true,
      });
      // clearAllMocks from constructor call
      jest.clearAllMocks();

      await (service as any).ensureDownloadDirectory();

      expect(FileSystem.makeDirectoryAsync).not.toHaveBeenCalled();
    });
  });

  describe("downloadSong", () => {
    it("should download a song and update DB", async () => {
      const result = await service.downloadSong(mockSong);

      expect(result).toEqual({ success: true });

      // ダウンロード確認
      expect(FileSystem.downloadAsync).toHaveBeenCalledWith(
        mockSong.song_path,
        "/mock/document/directory/downloads/Test_Song.mp3",
      );

      // DB更新確認
      expect(db.update).toHaveBeenCalled();
      expect(db.set).toHaveBeenCalledWith(
        expect.objectContaining({
          songPath: "/mock/document/directory/downloads/Test_Song.mp3",
          imagePath:
            "/mock/document/directory/downloads/images/test-song-id_artwork.jpg",
        }),
      );
    });

    it("should not download if file already exists", async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: true,
      });

      const result = await service.downloadSong(mockSong);

      expect(result).toEqual({ success: true });
      expect(FileSystem.downloadAsync).not.toHaveBeenCalled();

      // DB更新は走る
      expect(db.update).toHaveBeenCalled();
    });

    it("should handle download failure", async () => {
      (FileSystem.downloadAsync as jest.Mock).mockResolvedValue({
        status: 404,
      });

      const result = await service.downloadSong(mockSong);

      expect(result.success).toBe(false);
    });

    it("should fail download if free space is insufficient", async () => {
      // 50MB未満の空き容量をモック
      (FileSystem.getFreeDiskStorageAsync as jest.Mock).mockResolvedValue(
        10 * 1024 * 1024,
      );

      const result = await service.downloadSong(mockSong);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Not enough free storage space.");
      expect(FileSystem.downloadAsync).not.toHaveBeenCalled();
    });
  });

  describe("deleteSong", () => {
    it("should delete song file and clear DB path", async () => {
      // 1. getSongLocalPath -> [{ songPath: ... }]
      // 2. getImageLocalPath -> [{ imagePath: ... }]
      // 3. update -> []
      (db.then as jest.Mock)
        .mockImplementationOnce((cb) =>
          Promise.resolve([
            { songPath: "/path/to/song.mp3", imagePath: "/path/to/image.jpg" },
          ]).then(cb),
        )
        .mockImplementationOnce((cb) =>
          Promise.resolve([{ imagePath: "/path/to/image.jpg" }]).then(cb),
        )
        .mockImplementationOnce((cb) => Promise.resolve([]).then(cb));

      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: true,
      });

      const result = await service.deleteSong(mockSong.id);

      expect(result.success).toBe(true);
      expect(FileSystem.deleteAsync).toHaveBeenCalledWith("/path/to/song.mp3");

      // DB更新確認 (songPath: null)
      expect(db.update).toHaveBeenCalled();
      expect(db.set).toHaveBeenCalledWith(
        expect.objectContaining({
          songPath: null,
          imagePath: null,
        }),
      );
    });

    it("should handle case when song path not found in DB", async () => {
      // getSongLocalPath -> []
      (db.then as jest.Mock).mockImplementation((cb) =>
        Promise.resolve([]).then(cb),
      );

      const result = await service.deleteSong(mockSong.id);

      expect(result.success).toBe(true);
      expect(FileSystem.deleteAsync).not.toHaveBeenCalled();

      // updateは走る
      expect(db.update).toHaveBeenCalled();
    });
  });

  describe("getDownloadedSongs", () => {
    it("should return songs from SQLite", async () => {
      const mockRows = [
        {
          id: "1",
          title: "Song 1",
          songPath: "/path/1.mp3",
          imagePath: "/path/1.jpg",
          userId: "user1",
        },
      ];

      (db.then as jest.Mock).mockImplementation((cb) =>
        Promise.resolve(mockRows).then(cb),
      );
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: true,
      });

      const songs = await service.getDownloadedSongs();

      expect(songs).toHaveLength(1);
      expect(songs[0].id).toBe("1");
      expect(db.select).toHaveBeenCalled();
    });
  });

  describe("getSongLocalPath", () => {
    it("should return path from SQLite", async () => {
      (db.then as jest.Mock).mockImplementation((cb) =>
        Promise.resolve([{ songPath: "/path/song.mp3" }]).then(cb),
      );
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: true,
      });

      const path = await service.getSongLocalPath("1");
      expect(path).toBe("/path/song.mp3");
    });

    it("should return null if not in SQLite", async () => {
      (db.then as jest.Mock).mockImplementation((cb) =>
        Promise.resolve([]).then(cb),
      );

      const path = await service.getSongLocalPath("1");
      expect(path).toBeNull();
    });
  });

  describe("getDownloadedSongsSize", () => {
    it("should return total size of downloaded songs and images", async () => {
      const mockRows = [
        {
          id: "1",
          title: "Song 1",
          songPath: "/path/1.mp3",
          imagePath: "/path/1.jpg",
          userId: "user1",
        },
        {
          id: "2",
          title: "Song 2",
          songPath: "/path/2.mp3",
          imagePath: "/path/2.jpg",
          userId: "user1",
        },
      ];

      (db.then as jest.Mock).mockImplementation((cb) =>
        Promise.resolve(mockRows).then(cb),
      );

      // ファイルサイズのモック
      (FileSystem.getInfoAsync as jest.Mock)
        .mockResolvedValueOnce({ exists: true, size: 1000000 }) // song 1
        .mockResolvedValueOnce({ exists: true, size: 50000 }) // image 1
        .mockResolvedValueOnce({ exists: true, size: 2000000 }) // song 2
        .mockResolvedValueOnce({ exists: true, size: 60000 }); // image 2

      const size = await service.getDownloadedSongsSize();
      expect(size).toBe(3110000); // 1000000 + 50000 + 2000000 + 60000
    });

    it("should return 0 when no songs are downloaded", async () => {
      (db.then as jest.Mock).mockImplementation((cb) =>
        Promise.resolve([]).then(cb),
      );

      const size = await service.getDownloadedSongsSize();
      expect(size).toBe(0);
    });

    it("should skip files that don't exist", async () => {
      const mockRows = [
        {
          id: "1",
          title: "Song 1",
          songPath: "/path/1.mp3",
          imagePath: "/path/1.jpg",
          userId: "user1",
        },
      ];

      (db.then as jest.Mock).mockImplementation((cb) =>
        Promise.resolve(mockRows).then(cb),
      );

      (FileSystem.getInfoAsync as jest.Mock)
        .mockResolvedValueOnce({ exists: false }) // song doesn't exist
        .mockResolvedValueOnce({ exists: true, size: 50000 }); // image exists

      const size = await service.getDownloadedSongsSize();
      expect(size).toBe(50000);
    });
  });
});
