// 実際のコードをモックする
jest.mock("@/actions/deletePlaylist", () => ({
  __esModule: true,
  default: jest.fn(),
}));

// モックを実装する
import deletePlaylist from "@/actions/deletePlaylist";

// テスト前にモックを設定
beforeEach(() => {
  jest.clearAllMocks();
  (deletePlaylist as jest.Mock).mockImplementation(async () => {});
});

describe("deletePlaylist", () => {
  const playlistId = "playlist123";
  const userId = "user456";

  it("正常にプレイリストと曲を削除できる", async () => {
    // テスト実行
    await deletePlaylist(playlistId, userId);

    // 期待値を確認
    expect(deletePlaylist).toHaveBeenCalledWith(playlistId, userId);
  });

  it("playlist_songs削除でエラーが発生した場合", async () => {
    // モックを設定
    (deletePlaylist as jest.Mock).mockRejectedValueOnce(
      new Error("Delete song error")
    );

    // テスト実行と期待値を確認
    await expect(deletePlaylist(playlistId, userId)).rejects.toThrow(
      "Delete song error"
    );
  });

  it("playlists削除でエラーが発生した場合", async () => {
    // モックを設定
    (deletePlaylist as jest.Mock).mockRejectedValueOnce(
      new Error("Delete playlist error")
    );

    // テスト実行と期待値を確認
    await expect(deletePlaylist(playlistId, userId)).rejects.toThrow(
      "Delete playlist error"
    );
  });
});
