import createPlaylist from "@/actions/createPlaylist";
import { supabase } from "@/lib/supabase";

const mockInsert = jest.fn();
const mockFrom = jest.fn().mockReturnValue({ insert: mockInsert });
const mockGetSession = jest.fn();

jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: mockFrom,
    auth: {
      getSession: mockGetSession,
    },
  },
}));

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
