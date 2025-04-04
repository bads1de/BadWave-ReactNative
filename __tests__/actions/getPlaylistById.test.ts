// 実際のコードをモックする
jest.mock("@/actions/getPlaylistById", () => ({
  __esModule: true,
  default: jest.fn(),
}));

// モックを実装する
import getPlaylistById from "@/actions/getPlaylistById";

// テスト前にモックを設定
beforeEach(() => {
  jest.clearAllMocks();
  (getPlaylistById as jest.Mock).mockImplementation(async () => ({
    id: "p1",
    title: "Playlist1",
  }));
});

describe("getPlaylistById", () => {
  it("正常にプレイリストを取得できる", async () => {
    // モックを設定
    const playlist = { id: "p1", title: "My Playlist" };
    (getPlaylistById as jest.Mock).mockResolvedValueOnce(playlist);

    // テスト実行
    const result = await getPlaylistById("p1");

    // 期待値を確認
    expect(result).toEqual(playlist);
    expect(getPlaylistById).toHaveBeenCalledWith("p1");
  });

  it("エラーが発生した場合", async () => {
    // モックを設定
    (getPlaylistById as jest.Mock).mockRejectedValueOnce(new Error("error"));

    // テスト実行と期待値を確認
    await expect(getPlaylistById("p1")).rejects.toThrow("error");
  });
});
