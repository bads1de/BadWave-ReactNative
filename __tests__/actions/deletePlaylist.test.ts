import deletePlaylist from "@/actions/deletePlaylist";
import { supabase } from "@/lib/supabase";

const mockEq = jest.fn();
mockEq.mockReturnThis();

const mockDelete = jest.fn().mockReturnValue({ eq: mockEq });
const mockFrom = jest.fn().mockReturnValue({ delete: mockDelete });

jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: mockFrom,
  },
}));

describe("deletePlaylist", () => {
  const playlistId = "playlist123";
  const userId = "user456";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("正常にプレイリストと曲を削除できる", async () => {
    // playlist_songs削除成功
    mockDelete
      .mockResolvedValueOnce({ error: null }) // playlist_songs
      .mockResolvedValueOnce({ error: null }); // playlists

    await expect(deletePlaylist(playlistId, userId)).resolves.toBeUndefined();

    expect(mockFrom).toHaveBeenCalledWith("playlist_songs");
    expect(mockFrom).toHaveBeenCalledWith("playlists");
    expect(mockDelete).toHaveBeenCalledTimes(2);
    expect(mockEq).toHaveBeenCalled();
  });

  it("playlist_songs削除でエラーなら例外を投げる", async () => {
    mockDelete.mockResolvedValueOnce({
      error: { message: "Delete song error" },
    });

    await expect(deletePlaylist(playlistId, userId)).rejects.toThrow(
      "Delete song error"
    );

    expect(mockFrom).toHaveBeenCalledWith("playlist_songs");
    expect(mockDelete).toHaveBeenCalledTimes(1);
  });

  it("playlists削除でエラーなら例外を投げる", async () => {
    mockDelete
      .mockResolvedValueOnce({ error: null }) // playlist_songs成功
      .mockResolvedValueOnce({ error: { message: "Delete playlist error" } }); // playlists失敗

    await expect(deletePlaylist(playlistId, userId)).rejects.toThrow(
      "Delete playlist error"
    );

    expect(mockFrom).toHaveBeenCalledWith("playlist_songs");
    expect(mockFrom).toHaveBeenCalledWith("playlists");
    expect(mockDelete).toHaveBeenCalledTimes(2);
  });
});
