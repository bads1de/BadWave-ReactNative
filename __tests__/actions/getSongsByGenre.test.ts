// モック関数を定義
const mockOrder = jest.fn().mockReturnThis();
const mockOr = jest.fn().mockReturnValue({ order: mockOrder });
const mockSelect = jest.fn().mockReturnValue({ or: mockOr });
const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });

// supabaseのモックを設定
jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: mockFrom,
  },
}));

// インポート
import getSongsByGenre from "@/actions/getSongsByGenre";

describe("getSongsByGenre", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("正常にジャンルで曲を検索できる", async () => {
    const songs = [{ id: "s1" }, { id: "s2" }];
    mockOrder.mockResolvedValueOnce({ data: songs, error: null });

    const result = await getSongsByGenre("Pop");

    expect(result).toEqual(songs);
    expect(mockFrom).toHaveBeenCalledWith("songs");
  });

  it("エラーが発生したら例外を投げる", async () => {
    mockOrder.mockResolvedValueOnce({
      data: null,
      error: { message: "error" },
    });

    await expect(getSongsByGenre("Pop")).rejects.toThrow("error");
  });
});
