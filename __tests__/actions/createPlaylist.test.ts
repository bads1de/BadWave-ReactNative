// モック関数を定義
const mockInsert = jest.fn();
const mockFrom = jest.fn().mockReturnValue({ insert: mockInsert });
const mockGetSession = jest.fn();

// supabaseのモックを設定
jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: mockFrom,
    auth: {
      getSession: mockGetSession,
    },
  },
}));

// インポート
import createPlaylist from "@/actions/createPlaylist";

describe("createPlaylist", () => {
  const playlistName = "My Playlist";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("認証済みで正常にプレイリスト作成できる", async () => {
    mockGetSession.mockResolvedValueOnce({
      data: { session: { user: { id: "user123" } } },
    });
    mockInsert.mockResolvedValueOnce({ error: null });

    await expect(createPlaylist(playlistName)).resolves.toBeUndefined();

    expect(mockGetSession).toHaveBeenCalled();
    expect(mockFrom).toHaveBeenCalledWith("playlists");
    expect(mockInsert).toHaveBeenCalledWith({
      user_id: "user123",
      title: playlistName,
    });
  });

  it("未認証ならエラーを投げる", async () => {
    mockGetSession.mockResolvedValueOnce({ data: { session: null } });

    await expect(createPlaylist(playlistName)).rejects.toThrow(
      "User not authenticated"
    );

    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("insertでエラーが発生したら例外を投げる", async () => {
    mockGetSession.mockResolvedValueOnce({
      data: { session: { user: { id: "user123" } } },
    });
    mockInsert.mockResolvedValueOnce({ error: { message: "DB error" } });

    await expect(createPlaylist(playlistName)).rejects.toThrow("DB error");

    expect(mockInsert).toHaveBeenCalled();
  });
});
