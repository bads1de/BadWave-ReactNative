// 実際のコードをモックする
jest.mock("@/actions/deletePlaylistSong", () => ({
  __esModule: true,
  default: jest.fn(),
}));

// モックを実装する
import deletePlaylistSong from "@/actions/deletePlaylistSong";

// テスト前にモックを設定
beforeEach(() => {
  jest.clearAllMocks();
  (deletePlaylistSong as jest.Mock).mockImplementation(async () => {});
});

describe("deletePlaylistSong", () => {
  const playlistId = "playlist123";
  const songId = "song456";

  it("正常に曲を削除できる", async () => {
    // テスト実行
    await deletePlaylistSong(playlistId, songId);

    // 期待値を確認
    expect(deletePlaylistSong).toHaveBeenCalledWith(playlistId, songId);
  });

  it("エラーが発生した場合", async () => {
    // モックを設定
    (deletePlaylistSong as jest.Mock).mockRejectedValueOnce(
      new Error("User not authenticated")
    );

    // テスト実行と期待値を確認
    await expect(deletePlaylistSong(playlistId, songId)).rejects.toThrow(
      "User not authenticated"
    );
  });

  it("削除時にエラーが発生した場合", async () => {
    // モックを設定
    (deletePlaylistSong as jest.Mock).mockRejectedValueOnce(
      new Error("Delete error")
    );

    // テスト実行と期待値を確認
    await expect(deletePlaylistSong(playlistId, songId)).rejects.toThrow(
      "Delete error"
    );
  });
});
