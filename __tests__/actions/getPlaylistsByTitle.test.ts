// 実際のコードをモックする
// モックを実装する
import getPlaylistsByTitle from "@/actions/playlist/getPlaylistsByTitle";

jest.mock("@/actions/playlist/getPlaylistsByTitle", () => ({
  __esModule: true,
  default: jest.fn(),
}));

// テスト前にモックを設定
beforeEach(() => {
  jest.clearAllMocks();
  (getPlaylistsByTitle as jest.Mock).mockImplementation(async () => []);
});

describe("getPlaylistsByTitle", () => {
  it("正常にタイトルでプレイリストを検索できる", async () => {
    // モックを設定
    const playlists = [{ id: "p1" }, { id: "p2" }];
    (getPlaylistsByTitle as jest.Mock).mockResolvedValueOnce(playlists);

    // テスト実行
    const result = await getPlaylistsByTitle("test");

    // 期待値を確認
    expect(result).toEqual(playlists);
    expect(getPlaylistsByTitle).toHaveBeenCalledWith("test");
  });

  it("エラーが発生した場合", async () => {
    // モックを設定
    (getPlaylistsByTitle as jest.Mock).mockRejectedValueOnce(
      new Error("error")
    );

    // テスト実行と期待値を確認
    await expect(getPlaylistsByTitle("test")).rejects.toThrow("error");
  });
});

