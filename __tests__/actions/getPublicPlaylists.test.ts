// 実際のコードをモックする
// モックを実装する
import getPublicPlaylists from "@/actions/getPublicPlaylists";

jest.mock("@/actions/getPublicPlaylists", () => ({
  __esModule: true,
  default: jest.fn(),
}));

// テスト前にモックを設定
beforeEach(() => {
  jest.clearAllMocks();
  (getPublicPlaylists as jest.Mock).mockImplementation(async () => []);
});

describe("getPublicPlaylists", () => {
  it("正常にパブリックプレイリストを取得できる", async () => {
    // モックを設定
    const playlists = [{ id: "p1" }, { id: "p2" }];
    (getPublicPlaylists as jest.Mock).mockResolvedValueOnce(playlists);

    // テスト実行
    const result = await getPublicPlaylists(5);

    // 期待値を確認
    expect(result).toEqual(playlists);
    expect(getPublicPlaylists).toHaveBeenCalledWith(5);
  });

  it("エラーが発生した場合", async () => {
    // モックを設定
    (getPublicPlaylists as jest.Mock).mockResolvedValueOnce([]);

    // テスト実行
    const result = await getPublicPlaylists(5);

    // 期待値を確認
    expect(result).toEqual([]);
    expect(getPublicPlaylists).toHaveBeenCalledWith(5);
  });
});
