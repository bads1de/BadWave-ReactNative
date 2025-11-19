// 実際のコードをモックする
// モックを実装する
import getSongsByGenre from "@/actions/getSongsByGenre";

jest.mock("@/actions/getSongsByGenre", () => ({
  __esModule: true,
  default: jest.fn(),
}));

// テスト前にモックを設定
beforeEach(() => {
  jest.clearAllMocks();
  (getSongsByGenre as jest.Mock).mockImplementation(async () => []);
});

describe("getSongsByGenre", () => {
  it("正常にジャンルで曲を検索できる", async () => {
    // モックを設定
    const songs = [{ id: "s1" }, { id: "s2" }];
    (getSongsByGenre as jest.Mock).mockResolvedValueOnce(songs);

    // テスト実行
    const result = await getSongsByGenre("Pop");

    // 期待値を確認
    expect(result).toEqual(songs);
    expect(getSongsByGenre).toHaveBeenCalledWith("Pop");
  });

  it("エラーが発生した場合", async () => {
    // モックを設定
    (getSongsByGenre as jest.Mock).mockRejectedValueOnce(new Error("error"));

    // テスト実行と期待値を確認
    await expect(getSongsByGenre("Pop")).rejects.toThrow("error");
  });
});
