// モック関数を定義
const mockOrder = jest.fn().mockReturnThis();
const mockIlike = jest.fn().mockReturnValue({ order: mockOrder });
const mockSelect = jest.fn().mockReturnValue({ ilike: mockIlike });
const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });

// supabaseのモックを設定
jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: mockFrom,
  },
}));

// インポート
import getSongsByTitle from "@/actions/getSongsByTitle";

describe("getSongsByTitle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("正常にタイトルで曲を検索できる", async () => {
    const songs = [{ id: "s1" }, { id: "s2" }];
    mockOrder.mockResolvedValueOnce({ data: songs, error: null });

    const result = await getSongsByTitle("test");

    expect(result).toEqual(songs);
    expect(mockFrom).toHaveBeenCalledWith("songs");
  });

  it("エラーが発生したら例外を投げる", async () => {
    mockOrder.mockResolvedValueOnce({
      data: null,
      error: { message: "error" },
    });

    await expect(getSongsByTitle("test")).rejects.toThrow("error");
  });
});
