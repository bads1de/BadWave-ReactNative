// モック関数を定義
const mockOrder = jest.fn().mockReturnThis();
const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });
const mockGetSession = jest.fn();

// supabaseのモックを設定
jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: mockFrom,
    auth: {
      getSession: mockGetSession,
    },
  },
}));

// インポート
import getPlaylists from "@/actions/getPlaylists";

describe("getPlaylists", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("認証済みで正常にプレイリスト一覧を取得できる", async () => {
    mockGetSession.mockResolvedValueOnce({
      data: { session: { user: { id: "user123" } } },
    });
    const playlists = [{ id: "p1" }, { id: "p2" }];
    mockOrder.mockResolvedValueOnce({ data: playlists, error: null });

    const result = await getPlaylists();

    expect(result).toEqual(playlists);
    expect(mockFrom).toHaveBeenCalledWith("playlists");
  });

  it("エラーが発生したら例外を投げる", async () => {
    mockGetSession.mockResolvedValueOnce({
      data: { session: { user: { id: "user123" } } },
    });
    mockOrder.mockResolvedValueOnce({
      data: null,
      error: { message: "error" },
    });

    await expect(getPlaylists()).rejects.toThrow("error");
  });
});
