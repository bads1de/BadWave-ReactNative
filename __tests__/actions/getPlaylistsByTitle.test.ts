// モック関数を定義
const mockOrder = jest.fn().mockReturnThis();
const mockIlike = jest.fn().mockReturnValue({ order: mockOrder });
const mockEq = jest.fn().mockReturnValue({ ilike: mockIlike });
const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });

// supabaseのモックを設定
jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: mockFrom,
  },
}));

// インポート
import getPlaylistsByTitle from "@/actions/getPlaylistsByTitle";

describe("getPlaylistsByTitle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("正常にタイトルでプレイリストを検索できる", async () => {
    const playlists = [{ id: "p1" }, { id: "p2" }];
    mockOrder.mockResolvedValueOnce({ data: playlists, error: null });

    const result = await getPlaylistsByTitle("test");

    expect(result).toEqual(playlists);
    expect(mockFrom).toHaveBeenCalledWith("playlists");
  });

  it("エラーが発生したら例外を投げる", async () => {
    mockOrder.mockResolvedValueOnce({
      data: null,
      error: { message: "error" },
    });

    await expect(getPlaylistsByTitle("test")).rejects.toThrow("error");
  });
});
