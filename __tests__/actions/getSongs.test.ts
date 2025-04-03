import getSongs from "@/actions/getSongs";
import { supabase } from "@/lib/supabase";

const mockLimit = jest.fn();
mockLimit.mockReturnThis();

const mockOrder = jest.fn().mockReturnValue({ limit: mockLimit });
const mockSelect = jest.fn().mockReturnValue({ order: mockOrder });
const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });

jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: mockFrom,
  },
}));

describe("getSongs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("正常に曲一覧を取得できる", async () => {
    const songs = [{ id: "s1" }, { id: "s2" }];
    mockLimit.mockResolvedValueOnce({ data: songs, error: null });

    const result = await getSongs();

    expect(result).toEqual(songs);
    expect(mockFrom).toHaveBeenCalledWith("songs");
  });

  it("エラーが発生したら例外を投げる", async () => {
    mockLimit.mockResolvedValueOnce({
      data: null,
      error: { message: "error" },
    });

    await expect(getSongs()).rejects.toThrow("error");
  });
});
