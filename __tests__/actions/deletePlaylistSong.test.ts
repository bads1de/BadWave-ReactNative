import deletePlaylistSong from "@/actions/deletePlaylistSong";
import { supabase } from "@/lib/supabase";

const mockEq = jest.fn();
mockEq.mockReturnThis();

const mockDelete = jest.fn().mockReturnValue({ eq: mockEq });
const mockFrom = jest.fn().mockReturnValue({ delete: mockDelete });
const mockGetSession = jest.fn();

jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: mockFrom,
    auth: {
      getSession: mockGetSession,
    },
  },
}));

describe("deletePlaylistSong", () => {
  const playlistId = "playlist123";
  const songId = "song456";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("認証済みで正常に曲を削除できる", async () => {
    mockGetSession.mockResolvedValueOnce({
      data: { session: { user: { id: "user789" } } },
    });
    mockDelete.mockResolvedValueOnce({ error: null });

    await expect(
      deletePlaylistSong(playlistId, songId)
    ).resolves.toBeUndefined();

    expect(mockGetSession).toHaveBeenCalled();
    expect(mockFrom).toHaveBeenCalledWith("playlist_songs");
    expect(mockDelete).toHaveBeenCalled();
  });

  it("未認証ならエラーを投げる", async () => {
    mockGetSession.mockResolvedValueOnce({
      data: { session: null },
    });

    await expect(deletePlaylistSong(playlistId, songId)).rejects.toThrow(
      "User not authenticated"
    );

    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("削除時にエラーが発生したら例外を投げる", async () => {
    mockGetSession.mockResolvedValueOnce({
      data: { session: { user: { id: "user789" } } },
    });
    mockDelete.mockResolvedValueOnce({ error: { message: "Delete error" } });

    await expect(deletePlaylistSong(playlistId, songId)).rejects.toThrow(
      "Delete error"
    );

    expect(mockFrom).toHaveBeenCalledWith("playlist_songs");
    expect(mockDelete).toHaveBeenCalled();
  });
});
