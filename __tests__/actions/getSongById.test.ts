import getSongById from "@/actions/getSongById";
import { supabase } from "@/lib/supabase";

const mockSingle = jest.fn();
mockSingle.mockReturnThis();

const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });

jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: mockFrom,
  },
}));

describe("getSongById", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("正常に曲を取得できる", async () => {
    const song = { id: "s1", title: "Song1" };
    mockSingle.mockResolvedValueOnce({ data: song, error: null });

    const result = await getSongById("s1");

    expect(result).toEqual(song);
    expect(mockFrom).toHaveBeenCalledWith("songs");
  });

  it("エラーが発生したら例外を投げる", async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "error" },
    });

    await expect(getSongById("s1")).rejects.toThrow("error");
  });

  it("データがなければ例外を投げる", async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: null });

    await expect(getSongById("s1")).rejects.toThrow("Song not found");
  });
});
