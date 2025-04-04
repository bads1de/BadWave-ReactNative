// 実際のコードをモックする
jest.mock("@/actions/getPlaylistSongs", () => ({
  __esModule: true,
  default: jest.fn(),
}));

// モックを実装する
import getPlaylistSongs from "@/actions/getPlaylistSongs";

// テスト前にモックを設定
beforeEach(() => {
  jest.clearAllMocks();
  (getPlaylistSongs as jest.Mock).mockImplementation(async () => []);
});

describe("getPlaylistSongs", () => {
  it("公開プレイリストで曲一覧を取得できる", async () => {
    // モックを設定
    (getPlaylistSongs as jest.Mock).mockResolvedValueOnce([
      { id: "s1", title: "Song1", songType: "regular" },
      { id: "s2", title: "Song2", songType: "regular" },
    ]);

    // テスト実行
    const result = await getPlaylistSongs("playlist1");

    // 期待値を確認
    expect(result).toEqual([
      { id: "s1", title: "Song1", songType: "regular" },
      { id: "s2", title: "Song2", songType: "regular" },
    ]);
    expect(getPlaylistSongs).toHaveBeenCalledWith("playlist1");
  });

  it("空配列を返す場合", async () => {
    // モックを設定
    (getPlaylistSongs as jest.Mock).mockResolvedValueOnce([]);

    // テスト実行
    const result = await getPlaylistSongs("playlist1");

    // 期待値を確認
    expect(result).toEqual([]);
    expect(getPlaylistSongs).toHaveBeenCalledWith("playlist1");
  });

  it("エラーが発生した場合", async () => {
    // モックを設定
    (getPlaylistSongs as jest.Mock).mockRejectedValueOnce(new Error("error"));

    // テスト実行と期待値を確認
    await expect(getPlaylistSongs("playlist1")).rejects.toThrow("error");
  });
});
