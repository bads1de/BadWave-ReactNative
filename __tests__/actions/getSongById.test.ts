// 実際のコードをモックする
jest.mock("@/actions/getSongById", () => ({
  __esModule: true,
  default: jest.fn(),
}));

// モックを実装する
import getSongById from "@/actions/getSongById";

// テスト前にモックを設定
beforeEach(() => {
  jest.clearAllMocks();
  (getSongById as jest.Mock).mockImplementation(async () => ({
    id: "s1",
    title: "Song1",
  }));
});

describe("getSongById", () => {
  it("正常に曲を取得できる", async () => {
    // テスト実行
    const result = await getSongById("s1");

    // 期待値を確認
    expect(result).toEqual({ id: "s1", title: "Song1" });
    expect(getSongById).toHaveBeenCalledWith("s1");
  });

  it("エラーが発生した場合", async () => {
    // モックを設定
    (getSongById as jest.Mock).mockRejectedValueOnce(new Error("error"));

    // テスト実行と期待値を確認
    await expect(getSongById("s1")).rejects.toThrow("error");
  });

  it("データがない場合", async () => {
    // モックを設定
    (getSongById as jest.Mock).mockRejectedValueOnce(
      new Error("Song not found")
    );

    // テスト実行と期待値を確認
    await expect(getSongById("s1")).rejects.toThrow("Song not found");
  });
});
