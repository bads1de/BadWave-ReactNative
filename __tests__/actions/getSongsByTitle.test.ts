import getSongsByTitle from "@/actions/song/getSongsByTitle";
import { mockFunctions } from "@/__mocks__/supabase";

// supabaseのモックを設定
jest.mock("@/lib/supabase", () => require("@/__mocks__/supabase"));

// モックのエイリアス
const { mockFrom, mockSelect, mockIlike, mockOrder } = mockFunctions;

// テスト前にモックを設定
beforeEach(() => {
  jest.clearAllMocks();
});

describe("getSongsByTitle", () => {
  it("正常にタイトルで曲を検索できる", async () => {
    // モックの設定
    const songs = [{ id: "s1" }, { id: "s2" }];
    mockOrder.mockResolvedValueOnce({ data: songs, error: null });
    mockIlike.mockReturnValue({ order: mockOrder });
    mockSelect.mockReturnValue({ ilike: mockIlike });
    mockFrom.mockReturnValue({ select: mockSelect });

    // テスト実行
    const result = await getSongsByTitle("test");

    // 期待値を確認
    expect(result).toEqual(songs);
    expect(mockFrom).toHaveBeenCalledWith("songs");
    expect(mockSelect).toHaveBeenCalledWith("*");
    expect(mockIlike).toHaveBeenCalledWith("title", "%test%");
    expect(mockOrder).toHaveBeenCalledWith("created_at", { ascending: false });
  });

  it("エラーが発生した場合", async () => {
    // モックの設定
    mockOrder.mockResolvedValueOnce({
      data: null,
      error: { message: "error" },
    });
    mockIlike.mockReturnValue({ order: mockOrder });
    mockSelect.mockReturnValue({ ilike: mockIlike });
    mockFrom.mockReturnValue({ select: mockSelect });

    // テスト実行と期待値を確認
    await expect(getSongsByTitle("test")).rejects.toThrow("error");
  });
});

