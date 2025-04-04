// モック関数を定義
const mockSingle = jest.fn().mockReturnThis();
const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });

// supabaseのモックを設定
jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: mockFrom,
  },
}));

// インポート
import getPlaylistById from "@/actions/getPlaylistById";

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
