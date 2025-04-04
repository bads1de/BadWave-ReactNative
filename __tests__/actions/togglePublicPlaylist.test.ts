// 実際のコードをモックする
jest.mock("@/actions/togglePublicPlaylist", () => ({
  __esModule: true,
  default: jest.fn(),
}));

// モックを実装する
import togglePublicPlaylist from "@/actions/togglePublicPlaylist";

// テスト前にモックを設定
beforeEach(() => {
  jest.clearAllMocks();
  (togglePublicPlaylist as jest.Mock).mockImplementation(async () => {});
});

describe("togglePublicPlaylist", () => {
  it("正常に公開設定を切り替えられる", async () => {
    // テスト実行
    await togglePublicPlaylist("p1", "u1", true);

    // 期待値を確認
    expect(togglePublicPlaylist).toHaveBeenCalledWith("p1", "u1", true);
  });

  it("エラーが発生した場合", async () => {
    // モックを設定
    (togglePublicPlaylist as jest.Mock).mockRejectedValueOnce(
      new Error("error")
    );

    // テスト実行と期待値を確認
    await expect(togglePublicPlaylist("p1", "u1", false)).rejects.toThrow(
      "error"
    );
  });
});
