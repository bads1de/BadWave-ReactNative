import getSpotlights from "@/actions/getSpotlights";
import { supabase } from "@/lib/supabase";

const mockOrder = jest.fn();
mockOrder.mockReturnThis();

const mockSelect = jest.fn().mockReturnValue({ order: mockOrder });
const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });

jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: mockFrom,
  },
}));

describe("getSpotlights", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("正常にスポットライトを取得できる", async () => {
    const spotlights = [{ id: "s1" }, { id: "s2" }];
    mockOrder.mockResolvedValueOnce({ data: spotlights, error: null });

    const result = await getSpotlights();

    expect(result).toEqual(spotlights);
    expect(mockFrom).toHaveBeenCalledWith("spotlights");
  });

  it("エラーが発生したら例外を投げる", async () => {
    mockOrder.mockResolvedValueOnce({
      data: null,
      error: { message: "error" },
    });

    await expect(getSpotlights()).rejects.toThrow("error");
  });
});
