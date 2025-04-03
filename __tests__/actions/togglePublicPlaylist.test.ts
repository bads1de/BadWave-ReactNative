import togglePublicPlaylist from "@/actions/togglePublicPlaylist";
import { supabase } from "@/lib/supabase";

const mockEq = jest.fn();
mockEq.mockReturnThis();

const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
const mockFrom = jest.fn().mockReturnValue({ update: mockUpdate });

jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: mockFrom,
  },
}));

describe("togglePublicPlaylist", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("正常に公開設定を切り替えられる", async () => {
    mockUpdate.mockResolvedValueOnce({ error: null });

    await expect(
      togglePublicPlaylist("p1", "u1", true)
    ).resolves.toBeUndefined();

    expect(mockFrom).toHaveBeenCalledWith("playlists");
    expect(mockUpdate).toHaveBeenCalled();
  });

  it("updateでエラーが発生したら例外を投げる", async () => {
    mockUpdate.mockResolvedValueOnce({ error: { message: "error" } });

    await expect(togglePublicPlaylist("p1", "u1", false)).rejects.toThrow(
      "error"
    );
  });
});
