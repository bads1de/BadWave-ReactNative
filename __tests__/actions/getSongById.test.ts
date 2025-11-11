import getSongById from "../../actions/getSongById";
import { mockFunctions } from "../../__mocks__/supabase";

// supabaseのモックを設定
jest.mock("../../lib/supabase", () => require("../../__mocks__/supabase"));

// モックのエイリアス
const { mockFrom, mockSelect, mockEq, mockSingle } = mockFunctions;

// テスト前にモックを設定
beforeEach(() => {
  jest.clearAllMocks();
});

describe("getSongById", () => {
  it("正常に曲を取得できる", async () => {
    // モックの設定
    const mockSong = { id: "s1", title: "Song1" };
    mockSingle.mockResolvedValueOnce({ data: mockSong, error: null });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ single: mockSingle });
    mockFrom.mockReturnValue({ select: mockSelect });

    // テスト実行
    const result = await getSongById("s1");

    // 期待値を確認
    expect(result).toEqual(mockSong);
    expect(mockFrom).toHaveBeenCalledWith("songs");
    expect(mockSelect).toHaveBeenCalledWith("*");
    expect(mockEq).toHaveBeenCalledWith("id", "s1");
  });

  it("エラーが発生した場合", async () => {
    // モックの設定
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "error" },
    });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ single: mockSingle });
    mockFrom.mockReturnValue({ select: mockSelect });

    // テスト実行と期待値を確認
    await expect(getSongById("s1")).rejects.toThrow("error");
  });

  it("データがない場合はnullを返す", async () => {
    // モックの設定
    mockSingle.mockResolvedValueOnce({ data: null, error: null });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ single: mockSingle });
    mockFrom.mockReturnValue({ select: mockSelect });

    // テスト実行と期待値を確認
    const result = await getSongById("s1");
    expect(result).toBeNull();
  });
});
