import getTrendSongs from "@/actions/useGetTrendSongs";
import { supabase } from "@/lib/supabase";

const mockLimit = jest.fn();
mockLimit.mockReturnThis();

const mockOrder = jest.fn().mockReturnValue({ limit: mockLimit });
const mockFilter = jest.fn().mockReturnValue({ order: mockOrder });
const mockSelect = jest
  .fn()
  .mockReturnValue({ filter: mockFilter, order: mockOrder });
const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });

jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: mockFrom,
  },
}));

describe("getTrendSongs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("正常にトレンド曲を取得できる", async () => {
    const songs = [{ id: "s1" }, { id: "s2" }];
    mockLimit.mockResolvedValueOnce({ data: songs, error: null });

    const result = await getTrendSongs();

    expect(result).toEqual(songs);
    expect(mockFrom).toHaveBeenCalledWith("songs");
  });

  it("エラーが発生したら例外を投げる", async () => {
    mockLimit.mockResolvedValueOnce({
      data: null,
      error: { message: "error" },
    });

    await expect(getTrendSongs()).rejects.toThrow("error");
  });
});
