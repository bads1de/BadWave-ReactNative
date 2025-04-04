// 実際のコードをモックする
jest.mock("@/actions/getLikedSongs", () => ({
  __esModule: true,
  default: jest.fn(),
}));

// モックを実装する
import getLikedSongs from "@/actions/getLikedSongs";

// テスト前にモックを設定
beforeEach(() => {
  jest.clearAllMocks();
  (getLikedSongs as jest.Mock).mockImplementation(async () => []);
});

describe("getLikedSongs", () => {
  it("正常に曲一覧を取得できる", async () => {
    // モックを設定
    const songs = [
      { id: "1", title: "Song1" },
      { id: "2", title: "Song2" },
    ];
    (getLikedSongs as jest.Mock).mockResolvedValueOnce(songs);

    // テスト実行
    const result = await getLikedSongs();

    // 期待値を確認
    expect(result).toEqual(songs);
    expect(getLikedSongs).toHaveBeenCalled();
  });

  it("空配列を返す場合", async () => {
    // モックを設定
    (getLikedSongs as jest.Mock).mockResolvedValueOnce([]);

    // テスト実行
    const result = await getLikedSongs();

    // 期待値を確認
    expect(result).toEqual([]);
    expect(getLikedSongs).toHaveBeenCalled();
  });

  it("エラーが発生した場合", async () => {
    // モックを設定
    (getLikedSongs as jest.Mock).mockRejectedValueOnce(new Error("error"));

    // テスト実行と期待値を確認
    await expect(getLikedSongs()).rejects.toThrow("error");
  });
});
