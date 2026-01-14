import getSongs from "@/actions/song/getSongs";
import { mockFunctions } from "@/__mocks__/supabase";

// supabaseのモックを設定
jest.mock("@/lib/supabase", () => require("@/__mocks__/supabase"));

// モックのエイリアス
const { mockFrom, mockSelect, mockOrder, mockLimit } = mockFunctions;

describe("getSongs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("正常に曲一覧を取得できる", async () => {
    // モックの設定
    const songs = [{ id: "s1" }, { id: "s2" }];
    mockOrder.mockResolvedValueOnce({ data: songs, error: null });
    mockSelect.mockReturnValue({ order: mockOrder });
    mockFrom.mockReturnValue({ select: mockSelect });

    // テスト実行
    const result = await getSongs();

    // 期待値を確認
    expect(result).toEqual(songs);
    expect(mockFrom).toHaveBeenCalledWith("songs");
    expect(mockSelect).toHaveBeenCalledWith("*");
    expect(mockOrder).toHaveBeenCalledWith("created_at", { ascending: false });
  });

  it("エラーが発生したら例外を投げる", async () => {
    // モックの設定
    mockOrder.mockResolvedValueOnce({
      data: null,
      error: { message: "error" },
    });
    mockSelect.mockReturnValue({ order: mockOrder });
    mockFrom.mockReturnValue({ select: mockSelect });

    // テスト実行と期待値を確認
    await expect(getSongs()).rejects.toThrow("error");
  });
});

