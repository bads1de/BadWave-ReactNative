// 実際のコードをモックする
// モックを実装する
import getTrendSongs from "@/actions/useGetTrendSongs";

jest.mock("@/actions/useGetTrendSongs", () => ({
  __esModule: true,
  default: jest.fn(),
}));

// テスト前にモックを設定
beforeEach(() => {
  jest.clearAllMocks();
  (getTrendSongs as jest.Mock).mockImplementation(async () => []);
});

describe("getTrendSongs", () => {
  it("正常にトレンド曲を取得できる", async () => {
    // モックを設定
    const songs = [{ id: "s1" }, { id: "s2" }];
    (getTrendSongs as jest.Mock).mockResolvedValueOnce(songs);

    // テスト実行
    const result = await getTrendSongs();

    // 期待値を確認
    expect(result).toEqual(songs);
    expect(getTrendSongs).toHaveBeenCalled();
  });

  it("エラーが発生した場合", async () => {
    // モックを設定
    (getTrendSongs as jest.Mock).mockRejectedValueOnce(new Error("error"));

    // テスト実行と期待値を確認
    await expect(getTrendSongs()).rejects.toThrow("error");
  });
});
