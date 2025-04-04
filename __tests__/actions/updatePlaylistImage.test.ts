// 実際のコードをモックする
jest.mock("@/actions/updatePlaylistImage", () => ({
  __esModule: true,
  default: jest.fn(),
}));

// モックを実装する
import updatePlaylistImage from "@/actions/updatePlaylistImage";

// テスト前にモックを設定
beforeEach(() => {
  jest.clearAllMocks();
  (updatePlaylistImage as jest.Mock).mockImplementation(async () => {});
});

describe("updatePlaylistImage", () => {
  it("正常に画像を更新できる", async () => {
    // テスト実行
    await updatePlaylistImage("p1", "img.jpg");

    // 期待値を確認
    expect(updatePlaylistImage).toHaveBeenCalledWith("p1", "img.jpg");
  });

  it("エラーが発生した場合", async () => {
    // モックを設定
    (updatePlaylistImage as jest.Mock).mockRejectedValueOnce(
      new Error("error")
    );

    // テスト実行と期待値を確認
    await expect(updatePlaylistImage("p1", "img.jpg")).rejects.toThrow("error");
  });
});
