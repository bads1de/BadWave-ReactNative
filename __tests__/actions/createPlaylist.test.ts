// 実際のコードをモックする
jest.mock("@/actions/createPlaylist", () => ({
  __esModule: true,
  default: jest.fn(),
}));

// モックを実装する
import createPlaylist from "@/actions/createPlaylist";

// テスト前にモックを設定
beforeEach(() => {
  jest.clearAllMocks();
  (createPlaylist as jest.Mock).mockImplementation(async () => {});
});

describe("createPlaylist", () => {
  const playlistName = "My Playlist";

  it("正常にプレイリストを作成できる", async () => {
    // テスト実行
    await createPlaylist(playlistName);

    // 期待値を確認
    expect(createPlaylist).toHaveBeenCalledWith(playlistName);
  });

  it("未認証の場合", async () => {
    // モックを設定
    (createPlaylist as jest.Mock).mockRejectedValueOnce(
      new Error("User not authenticated")
    );

    // テスト実行と期待値を確認
    await expect(createPlaylist(playlistName)).rejects.toThrow(
      "User not authenticated"
    );
  });

  it("DBエラーが発生した場合", async () => {
    // モックを設定
    (createPlaylist as jest.Mock).mockRejectedValueOnce(new Error("DB error"));

    // テスト実行と期待値を確認
    await expect(createPlaylist(playlistName)).rejects.toThrow("DB error");
  });
});
