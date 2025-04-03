import getPlaylistById from "@/actions/getPlaylistById";
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

describe("getPlaylistById", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("正常にプレイリストを取得できる", async () => {
    const playlist = { id: "p1", title: "My Playlist" };
    mockSingle.mockResolvedValueOnce({ data: playlist, error: null });

    const result = await getPlaylistById("p1");

    expect(mockFrom).toHaveBeenCalledWith("playlists");
    expect(result).toEqual(playlist);
  });

  it("エラーが発生したら例外を投げる", async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "error" },
    });

    await expect(getPlaylistById("p1")).rejects.toThrow("error");
  });
});
