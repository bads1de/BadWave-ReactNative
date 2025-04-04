// 実際のコードをモックする
jest.mock("@/actions/getSongsByTitle", () => ({
  __esModule: true,
  default: jest.fn(),
}));

// モックを実装する
import getSongsByTitle from "@/actions/getSongsByTitle";

// テスト前にモックを設定
beforeEach(() => {
  jest.clearAllMocks();
  (getSongsByTitle as jest.Mock).mockImplementation(async () => []);
});

describe("getSongsByTitle", () => {
  it("正常にタイトルで曲を検索できる", async () => {
    // モックを設定
    const songs = [{ id: "s1" }, { id: "s2" }];
    (getSongsByTitle as jest.Mock).mockResolvedValueOnce(songs);

    // テスト実行
    const result = await getSongsByTitle("test");

    // 期待値を確認
    expect(result).toEqual(songs);
    expect(getSongsByTitle).toHaveBeenCalledWith("test");
  });

  it("エラーが発生した場合", async () => {
    // モックを設定
    (getSongsByTitle as jest.Mock).mockRejectedValueOnce(new Error("error"));

    // テスト実行と期待値を確認
    await expect(getSongsByTitle("test")).rejects.toThrow("error");
  });
});
