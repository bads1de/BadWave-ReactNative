import getSpotlights from "../../actions/getSpotlights";
import { mockFunctions } from "../../__mocks__/supabase";

// supabaseのモックを設定
jest.mock("../../lib/supabase", () => require("../../__mocks__/supabase"));

// モックのエイリアス
const { mockFrom, mockSelect, mockOrder } = mockFunctions;

// テスト前にモックを設定

describe("getSpotlights", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("正常にスポットライトを取得できる", async () => {
    // モックの設定
    const spotlights = [{ id: "s1" }, { id: "s2" }];
    mockOrder.mockResolvedValueOnce({ data: spotlights, error: null });
    mockSelect.mockReturnValue({ order: mockOrder });
    mockFrom.mockReturnValue({ select: mockSelect });

    // テスト実行
    const result = await getSpotlights();

    // 期待値を確認
    expect(result).toEqual(spotlights);
    expect(mockFrom).toHaveBeenCalledWith("spotlights");
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
    await expect(getSpotlights()).rejects.toThrow("error");
  });
});

